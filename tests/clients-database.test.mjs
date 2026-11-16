import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
let db, previous;
const admin = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222";
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
 insert into auth.users values ('${admin}'),('${other}');`);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/202611150001_nfc.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.query("insert into public.admin_users(user_id) values ($1)", [
    admin,
  ]);
  await db.exec(`insert into public.cards(public_code,business_name,google_review_url) values
 ('TABLE001','Restaurante','https://g.page/r/Local/review'),
 ('TABLE002','Restaurante','https://g.page/r/Local/review'),
 ('TABLE003','Restaurante','https://g.page/r/Sucursal/review'),
 ('FREE0001',null,null);
 update public.cards set status='ACTIVE' where public_code in ('TABLE001','TABLE002');`);
  previous = (
    await db.query(
      "select public_code,status,created_at,activated_at from public.cards order by public_code",
    )
  ).rows;
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202611150002_clients.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202611150003_any_web_url.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202611150004_efficiency.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
});
after(async () => {
  await db?.close();
});
async function run(role, user, sql, args = []) {
  await db.exec("begin");
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
      user ?? "",
    ]);
    await db.exec("set local role " + role);
    const r = await db.query(sql, args);
    await db.exec("commit");
    return r;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
test("migration groups exact pairs and preserves permanent codes, states and activation dates", async () => {
  const rows = (
    await db.query(
      "select public_code,status,created_at,activated_at from public.cards order by public_code",
    )
  ).rows;
  assert.deepEqual(rows, previous);
  const cards = (
    await db.query(
      "select public_code,client_id from public.cards order by public_code",
    )
  ).rows;
  const get = (code) => cards.find((c) => c.public_code === code).client_id;
  assert.equal(get("TABLE001"), get("TABLE002"));
  assert.notEqual(get("TABLE001"), get("TABLE003"));
  assert.equal(get("FREE0001"), null);
  assert.equal((await db.query("select * from public.clients")).rows.length, 2);
});
test("clients are private and non-admins cannot modify or create them", async () => {
  await assert.rejects(
    () => run("anon", null, "select * from public.clients"),
    /permission denied/i,
  );
  assert.equal(
    (await run("authenticated", other, "select * from public.clients")).rows
      .length,
    0,
  );
  await assert.rejects(
    () =>
      run(
        "authenticated",
        other,
        "insert into public.clients(business_name) values ('No')",
      ),
    /row-level security/i,
  );
});
test("changing the shared link updates all cards and preserves independent suspension", async () => {
  const id = (
    await db.query(
      "select client_id from public.cards where public_code='TABLE001'",
    )
  ).rows[0].client_id;
  await run(
    "authenticated",
    admin,
    "update public.cards set status='SUSPENDED',label='Mesa 1' where public_code='TABLE001'",
  );
  await run(
    "authenticated",
    admin,
    "update public.clients set business_name='Restaurante nuevo',google_review_url='https://g.page/r/Nuevo/review' where id=$1",
    [id],
  );
  const active = (
    await run("anon", null, "select * from public.resolve_card('TABLE002')")
  ).rows[0];
  const suspended = (
    await run("anon", null, "select * from public.resolve_card('TABLE001')")
  ).rows[0];
  assert.equal(active.google_review_url, "https://g.page/r/Nuevo/review");
  assert.equal(active.status, "ACTIVE");
  assert.deepEqual(suspended, { status: "SUSPENDED", google_review_url: null });
  assert.equal(
    (
      await db.query(
        "select business_name from public.cards where public_code='TABLE002'",
      )
    ).rows[0].business_name,
    "Restaurante nuevo",
  );
  await assert.rejects(
    () =>
      run(
        "authenticated",
        admin,
        "update public.clients set google_review_url=null where id=$1",
        [id],
      ),
    /cards_active_data/,
  );
  assert.equal(
    (await run("anon", null, "select * from public.resolve_card('TABLE002')"))
      .rows[0].google_review_url,
    "https://g.page/r/Nuevo/review",
  );
});
test("admin can create, assign, label and activate several cards for one client", async () => {
  const client = (
    await run(
      "authenticated",
      admin,
      "insert into public.clients(business_name,google_review_url) values ('Terraza','https://g.page/r/Terraza/review') returning *",
    )
  ).rows[0];
  const card = (
    await run(
      "authenticated",
      admin,
      "insert into public.cards(client_id,label) values ($1,'Mesa 8') returning *",
      [client.id],
    )
  ).rows[0];
  await run(
    "authenticated",
    admin,
    "update public.cards set status='ACTIVE' where id=$1",
    [card.id],
  );
  assert.equal(
    (
      await run("anon", null, "select * from public.resolve_card($1)", [
        card.public_code,
      ])
    ).rows[0].google_review_url,
    client.google_review_url,
  );
  await assert.rejects(
    () =>
      run("authenticated", admin, "delete from public.clients where id=$1", [
        client.id,
      ]),
    /foreign key/i,
  );
  await assert.rejects(
    () =>
      run(
        "authenticated",
        admin,
        "update public.cards set client_id=null where id=$1",
        [card.id],
      ),
    /requiere un cliente/,
  );
  await run(
    "authenticated",
    admin,
    "update public.cards set status='AVAILABLE',client_id=null where id=$1",
    [card.id],
  );
  await run("authenticated", admin, "delete from public.clients where id=$1", [
    client.id,
  ]);
});
test("rejects invalid destinations, orphan clients and activation without a shared link", async () => {
  await assert.rejects(
    () =>
      run(
        "authenticated",
        admin,
        "insert into public.clients(business_name,google_review_url) values ('No','javascript:alert(1)')",
      ),
    /check constraint/i,
  );
  await assert.rejects(
    () =>
      run(
        "authenticated",
        admin,
        "insert into public.cards(client_id) values ('33333333-3333-4333-8333-333333333333')",
      ),
    /Cliente inexistente/i,
  );
  const c = (
    await run(
      "authenticated",
      admin,
      "insert into public.clients(business_name) values ('Sin enlace') returning id",
    )
  ).rows[0];
  const card = (
    await run(
      "authenticated",
      admin,
      "insert into public.cards(client_id) values ($1) returning id",
      [c.id],
    )
  ).rows[0];
  await assert.rejects(
    () =>
      run(
        "authenticated",
        admin,
        "update public.cards set status='ACTIVE' where id=$1",
        [card.id],
      ),
    /cards_active_data/,
  );
  await assert.rejects(
    () =>
      run(
        "authenticated",
        admin,
        "update public.cards set google_review_url='https://g.page/r/No/review' where id=$1",
        [card.id],
      ),
    /permission denied/i,
  );
});

test("SQL accepts any HTTP/HTTPS domain and the shared redirect resolves it", async () => {
  const c = (
    await run(
      "authenticated",
      admin,
      "insert into public.clients(business_name,google_review_url) values ('Menú','http://example.org:8080/menu?name=a%20b#table') returning *",
    )
  ).rows[0];
  const card = (
    await run(
      "authenticated",
      admin,
      "insert into public.cards(client_id) values ($1) returning *",
      [c.id],
    )
  ).rows[0];
  await run(
    "authenticated",
    admin,
    "update public.cards set status='ACTIVE' where id=$1",
    [card.id],
  );
  assert.equal(
    (
      await run("anon", null, "select * from public.resolve_card($1)", [
        card.public_code,
      ])
    ).rows[0].google_review_url,
    c.google_review_url,
  );
  await run(
    "authenticated",
    admin,
    "update public.clients set google_review_url='https://another.example/shop?x=1&x=2#item' where id=$1",
    [c.id],
  );
  assert.equal(
    (
      await run("anon", null, "select * from public.resolve_card($1)", [
        card.public_code,
      ])
    ).rows[0].google_review_url,
    "https://another.example/shop?x=1&x=2#item",
  );
  for (const url of [
    "javascript:alert(1)",
    "data:text/plain,test",
    "file:///tmp/test",
    "https://",
    "https://example.com/\nheader",
  ]) {
    await assert.rejects(
      () =>
        run(
          "authenticated",
          admin,
          "update public.clients set google_review_url=$1 where id=$2",
          [url, c.id],
        ),
      /check constraint/i,
    );
  }
});

test("one-call reports preserve global totals, date filtering and pagination with RLS", async () => {
  const c = (
    await run(
      "authenticated",
      admin,
      "insert into public.clients(business_name,google_review_url) values ('Reportes','https://example.com') returning id",
    )
  ).rows[0];
  await run(
    "authenticated",
    admin,
    "insert into public.cards(client_id,notes) select $1,'report-fixture' from generate_series(1,31)",
    [c.id],
  );
  await run(
    "authenticated",
    admin,
    "update public.cards set status='ACTIVE' where notes='report-fixture'",
  );
  const expected = (
    await db.query(
      "select count(*)::int as total,count(*) filter(where status='ACTIVE')::int as active,count(*) filter(where activated_at is not null)::int as activations from public.cards",
    )
  ).rows[0];
  const report = (
    await run(
      "authenticated",
      admin,
      "select public.get_card_report(null,null,1) as r",
    )
  ).rows[0].r;
  assert.equal(report.total, expected.total);
  assert.equal(report.active, expected.active);
  assert.equal(report.activations, expected.activations);
  assert.equal(report.cards.length, 25);
  const second = (
    await run(
      "authenticated",
      admin,
      "select public.get_card_report(null,null,2) as r",
    )
  ).rows[0].r;
  assert.equal(
    new Set([...report.cards, ...second.cards].map((c) => c.public_code)).size,
    report.cards.length + second.cards.length,
  );
  const empty = (
    await run(
      "authenticated",
      admin,
      "select public.get_card_report('9999-01-01','9999-01-01',1) as r",
    )
  ).rows[0].r;
  assert.equal(empty.activations, 0);
  assert.equal(empty.total, expected.total);
  await assert.rejects(
    () => run("authenticated", other, "select public.get_card_report()"),
    /Acceso no autorizado/,
  );
  await assert.rejects(
    () => run("anon", null, "select public.get_card_report()"),
    /permission denied/i,
  );
  await assert.rejects(
    () =>
      run(
        "authenticated",
        admin,
        "select public.get_card_report('2026-11-16','2026-11-15',1)",
      ),
    /invalida/,
  );
});
test("editing client notes or resubmitting identical shared fields does not rewrite cards", async () => {
  const id = (
    await db.query(
      "select client_id from public.cards where public_code='TABLE002'",
    )
  ).rows[0].client_id;
  const before = (
    await db.query(
      "select updated_at from public.cards where client_id=$1 order by id",
      [id],
    )
  ).rows;
  await run(
    "authenticated",
    admin,
    "update public.clients set notes='Nota nueva' where id=$1",
    [id],
  );
  await run(
    "authenticated",
    admin,
    "update public.clients set business_name=business_name,google_review_url=google_review_url where id=$1",
    [id],
  );
  assert.deepEqual(
    (
      await db.query(
        "select updated_at from public.cards where client_id=$1 order by id",
        [id],
      )
    ).rows,
    before,
  );
});
