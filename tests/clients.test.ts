import { beforeEach, it, expect, vi } from "vitest";
const m = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  range: vi.fn(),
}));
vi.mock("@/lib/auth", async (original) => ({
  ...(await original<typeof import("@/lib/auth")>()),
  requireAdmin: m.requireAdmin,
}));
import { HttpError } from "@/lib/auth";
import { GET, POST } from "@/app/api/admin/clients/route";
import { PATCH, DELETE } from "@/app/api/admin/clients/[id]/route";
const id = "11111111-1111-4111-8111-111111111111";
const ctx = { params: Promise.resolve({ id }) };
const req = (method: string, body?: unknown, origin = "https://nfc.example") =>
  new Request("https://nfc.example/api/admin/clients", {
    method,
    headers: { Origin: origin, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://nfc.example";
  Object.values(m).forEach((fn) => fn.mockReset());
  const q = {
    select: m.select,
    eq: () => q,
    order: () => q,
    ilike: () => q,
    range: m.range,
    insert: m.insert,
    update: m.update,
    delete: m.remove,
    single: m.single,
    maybeSingle: m.maybeSingle,
  };
  m.select.mockReturnValue(q);
  m.from.mockReturnValue(q);
  m.insert.mockReturnValue(q);
  m.update.mockReturnValue(q);
  m.remove.mockReturnValue(q);
  m.requireAdmin.mockResolvedValue({ client: { from: m.from } });
});
it("denies every client operation without an admin session", async () => {
  m.requireAdmin.mockRejectedValue(new HttpError(401, "Sesión requerida"));
  expect((await GET(req("GET"))).status).toBe(401);
  expect((await POST(req("POST", {}))).status).toBe(401);
  expect((await PATCH(req("PATCH", {}), ctx)).status).toBe(401);
  expect((await DELETE(req("DELETE"), ctx)).status).toBe(401);
  expect(m.from).not.toHaveBeenCalled();
});
it("creates a client with the shared business link", async () => {
  m.single.mockResolvedValue({ data: { id } });
  expect(
    (
      await POST(
        req("POST", {
          business_name: "Restaurante",
          google_review_url: "https://g.page/r/a/review",
        }),
      )
    ).status,
  ).toBe(201);
  expect(m.insert).toHaveBeenCalledWith({
    business_name: "Restaurante",
    google_review_url: "https://g.page/r/a/review",
    notes: null,
  });
});
it("rejects external origins and non-web destinations", async () => {
  expect((await POST(req("POST", {}, "https://evil.com"))).status).toBe(403);
  expect(
    (
      await POST(
        req("POST", {
          business_name: "Restaurante",
          google_review_url: "javascript:alert(1)",
        }),
      )
    ).status,
  ).toBe(400);
  expect(m.insert).not.toHaveBeenCalled();
});
it("updates the client rather than editing individual card links", async () => {
  m.maybeSingle.mockResolvedValue({ data: { id } });
  expect(
    (
      await PATCH(
        req("PATCH", {
          business_name: "Restaurante",
          google_review_url: "https://g.page/r/Nuevo/review",
        }),
        ctx,
      )
    ).status,
  ).toBe(200);
  expect(m.from).toHaveBeenCalledWith("clients");
  expect(m.update).toHaveBeenCalledWith({
    business_name: "Restaurante",
    google_review_url: "https://g.page/r/Nuevo/review",
    notes: null,
  });
});
it("returns conflict when deleting a client with assigned cards", async () => {
  m.maybeSingle.mockResolvedValue({ error: { code: "23503" } });
  expect((await DELETE(req("DELETE"), ctx)).status).toBe(409);
});
it("lists clients with card counts and handles missing clients", async () => {
  m.range.mockResolvedValue({
    data: [{ id, cards: [{ count: 3 }] }],
    count: 1,
  });
  const res = await GET(req("GET"));
  expect((await res.json()).clients[0].cards[0].count).toBe(3);
  m.maybeSingle.mockResolvedValue({ data: null });
  expect(
    (await PATCH(req("PATCH", { business_name: "Nombre" }), ctx)).status,
  ).toBe(404);
});

it("client picker reads only ids and names without card counts or exact totals", async () => {
  m.range.mockResolvedValue({
    data: [{ id, business_name: "Local" }],
    count: null,
  });
  const response = await GET(
    new Request("https://nfc.example/api/admin/clients?picker=1"),
  );
  expect(m.select).toHaveBeenCalledWith("id,business_name", {});
  expect(await response.json()).toEqual({
    clients: [{ id, business_name: "Local" }],
  });
});
