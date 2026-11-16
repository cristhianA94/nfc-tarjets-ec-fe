import {test,before,after} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
let db;
const admin="11111111-1111-4111-8111-111111111111";
const outsider="22222222-2222-4222-8222-222222222222";
before(async()=>{
 db=new PGlite();
 await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 insert into auth.users values ('${admin}'),('${outsider}');`);
 await db.exec(await readFile(new URL("../supabase/migrations/202611150001_nfc.sql",import.meta.url),"utf8"));
 await db.query("insert into public.admin_users(user_id) values ($1)",[admin]);
});
after(async()=>{await db?.close()});
async function asUser(role,user,run){
 await db.exec("begin");
 try{
 await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user??""]);
 await db.exec("set local role "+role);
 const result=await run();await db.exec("commit");return result;
 }catch(e){await db.exec("rollback");throw e}
}
test("anonymous cannot list cards or admins",async()=>{
 for(const table of ["cards","admin_users"])
 await assert.rejects(()=>asUser("anon",null,()=>db.query("select * from public."+table)),/permission denied/i);
});
test("non-admin cannot read, write or grant themselves access",async()=>{
 await asUser("authenticated",outsider,async()=>{
 assert.equal((await db.query("select * from public.cards")).rows.length,0);
 assert.equal((await db.query("update public.cards set notes='x' returning id")).rows.length,0);
 assert.equal((await db.query("delete from public.cards returning id")).rows.length,0);
 });
 await assert.rejects(()=>asUser("authenticated",outsider,()=>db.query("insert into public.cards(notes) values ('x')")),/row-level security/i);
 await assert.rejects(()=>asUser("authenticated",outsider,()=>db.query("insert into public.admin_users(user_id) values ($1)",[outsider])),/permission denied/i);
});
test("full card lifecycle, permanent code and public resolution",async()=>{
 const card=(await asUser("authenticated",admin,()=>db.query("insert into public.cards(notes) values ('Prueba') returning *"))).rows[0];
 assert.equal(card.status,"AVAILABLE");assert.equal(card.activated_at,null);
 const resolve=()=>asUser("anon",null,()=>db.query("select * from public.resolve_card($1)",[card.public_code]));
 assert.deepEqual((await resolve()).rows,[{status:"AVAILABLE",google_review_url:null}]);
 await assert.rejects(()=>asUser("authenticated",admin,()=>db.query("update public.cards set status='ACTIVE' where id=$1",[card.id])),/cards_active_data/);
 const active=(await asUser("authenticated",admin,()=>db.query("update public.cards set business_name='Negocio',google_review_url='https://g.page/r/Local/review',status='ACTIVE' where id=$1 returning *",[card.id]))).rows[0];
 assert.ok(active.activated_at);
 assert.equal((await resolve()).rows[0].google_review_url,"https://g.page/r/Local/review");
 const edited=(await asUser("authenticated",admin,()=>db.query("update public.cards set google_review_url='https://g.page/r/Otro/review' where id=$1 returning *",[card.id]))).rows[0];
 assert.equal(edited.public_code,card.public_code);
 assert.equal(edited.activated_at.toISOString(),active.activated_at.toISOString());
 await asUser("authenticated",admin,()=>db.query("update public.cards set status='SUSPENDED' where id=$1",[card.id]));
 assert.deepEqual((await resolve()).rows,[{status:"SUSPENDED",google_review_url:null}]);
 await asUser("authenticated",admin,()=>db.query("update public.cards set status='ACTIVE' where id=$1",[card.id]));
 assert.equal((await resolve()).rows[0].status,"ACTIVE");
 await assert.rejects(()=>asUser("authenticated",admin,()=>db.query("update public.cards set public_code='ABCDEF' where id=$1",[card.id])),/permission denied/i);
 await assert.rejects(()=>db.query("update public.cards set public_code='ABCDEF' where id=$1",[card.id]),/inmutable/);
 await asUser("authenticated",admin,()=>db.query("delete from public.cards where id=$1",[card.id]));
 assert.equal((await resolve()).rows.length,0);
});
test("500 unique codes, initial state and SQL URL allowlist",async()=>{
 const result=await asUser("authenticated",admin,()=>db.query("insert into public.cards(notes) select 'Prueba' from generate_series(1,500) returning public_code"));
 assert.equal(new Set(result.rows.map(r=>r.public_code)).size,500);
 await assert.rejects(()=>asUser("authenticated",admin,()=>db.query("insert into public.cards(status) values ('ACTIVE')")),/disponibles/);
 for(const url of ["http://g.page/r/a/review","https://g.page.evil.com/r/a/review","https://www.google.com/url?q=evil","https://g.page/r/a/review#bad"])
 await assert.rejects(()=>asUser("authenticated",admin,()=>db.query("insert into public.cards(google_review_url) values ($1)",[url])),/cards_review_url/);
 for(const url of ["https://g.page/r/a/review","https://search.google.com/local/writereview?placeid=ChIJabc","https://maps.app.goo.gl/abc?g_st=ic"])
 await asUser("authenticated",admin,()=>db.query("insert into public.cards(google_review_url) values ($1)",[url]));
 assert.equal((await asUser("anon",null,()=>db.query("select * from public.resolve_card('ZZZZZZ')"))).rows.length,0);
});
test("unique constraint and protected timestamps",async()=>{
 const card=(await db.query("insert into public.cards default values returning *")).rows[0];
 await assert.rejects(()=>db.query("insert into public.cards(public_code) values ($1)",[card.public_code]),/duplicate key/);
 await db.query("update public.cards set business_name='Local',google_review_url='https://g.page/r/a/review',status='ACTIVE' where id=$1",[card.id]);
 const first=(await db.query("select * from public.cards where id=$1",[card.id])).rows[0];
 await db.query("update public.cards set activated_at='2000-01-01',created_at='2000-01-01' where id=$1",[card.id]);
 const last=(await db.query("select * from public.cards where id=$1",[card.id])).rows[0];
 assert.equal(last.activated_at.toISOString(),first.activated_at.toISOString());
 assert.equal(last.created_at.toISOString(),first.created_at.toISOString());
});
