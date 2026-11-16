import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  eq: vi.fn(),
}));
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, requireAdmin: m.requireAdmin };
});
import { POST as create } from "@/app/api/admin/cards/route";
import { GET, PATCH, DELETE } from "@/app/api/admin/cards/[codigo]/route";
import { HttpError } from "@/lib/auth";
const code = "K7P4X9";
const ctx = { params: Promise.resolve({ codigo: code }) };
const request = (method: string, body?: unknown) =>
  new Request("https://nfc.example/api/admin/cards/" + code, {
    method,
    headers: {
      Origin: "https://nfc.example",
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://nfc.example";
  Object.values(m).forEach((fn) => fn.mockReset());
  const chain = {
    select: () => chain,
    eq: m.eq,
    single: m.single,
    maybeSingle: m.maybeSingle,
    insert: m.insert,
    update: m.update,
    delete: m.remove,
  };
  m.eq.mockReturnValue(chain);
  m.insert.mockReturnValue(chain);
  m.update.mockReturnValue(chain);
  m.remove.mockReturnValue(chain);
  m.from.mockReturnValue(chain);
  m.requireAdmin.mockResolvedValue({ client: { from: m.from } });
});
describe("administrative card handlers", () => {
  it("creates available cards, leaving code generation to the database", async () => {
    m.single.mockResolvedValue({
      data: { public_code: code, status: "AVAILABLE" },
    });
    const res = await create(request("POST", { notes: "Nueva" }));
    expect(res.status).toBe(201);
    expect(m.insert).toHaveBeenCalledWith({
      client_id: null,
      label: null,
      notes: "Nueva",
      status: "AVAILABLE",
    });
    expect((await res.json()).card.public_code).toBe(code);
  });
  it("retries a unique code collision", async () => {
    m.single
      .mockResolvedValueOnce({ error: { code: "23505" } })
      .mockResolvedValueOnce({ data: { public_code: code } });
    expect((await create(request("POST", {}))).status).toBe(201);
    expect(m.insert).toHaveBeenCalledTimes(2);
  });
  it("edits and activates without updating the permanent public code", async () => {
    m.maybeSingle.mockResolvedValue({
      data: { public_code: code, status: "ACTIVE" },
    });
    const input = {
      client_id: "11111111-1111-4111-8111-111111111111",
      status: "ACTIVE",
    };
    expect((await PATCH(request("PATCH", input), ctx)).status).toBe(200);
    expect(m.update).toHaveBeenCalledWith({
      ...input,
      label: null,
      notes: null,
    });
    expect(m.eq).toHaveBeenCalledWith("public_code", code);
  });
  it("validates activation and immutable fields before reaching the database", async () => {
    expect(
      (await PATCH(request("PATCH", { status: "ACTIVE" }), ctx)).status,
    ).toBe(400);
    expect(
      (
        await PATCH(
          request("PATCH", { status: "AVAILABLE", public_code: "ZZZZZZ" }),
          ctx,
        )
      ).status,
    ).toBe(400);
    expect(m.update).not.toHaveBeenCalled();
  });
  it("suspends, deletes and reports missing cards", async () => {
    m.maybeSingle.mockResolvedValue({
      data: { public_code: code, status: "SUSPENDED" },
    });
    expect(
      (await PATCH(request("PATCH", { status: "SUSPENDED" }), ctx)).status,
    ).toBe(200);
    expect((await DELETE(request("DELETE"), ctx)).status).toBe(200);
    m.maybeSingle.mockResolvedValue({ data: null });
    expect((await GET(request("GET"), ctx)).status).toBe(404);
    expect((await DELETE(request("DELETE"), ctx)).status).toBe(404);
  });
  it("denies all private operations to unauthenticated callers", async () => {
    m.requireAdmin.mockRejectedValue(new HttpError(401, "Sesión requerida"));
    expect((await create(request("POST", {}))).status).toBe(401);
    expect((await GET(request("GET"), ctx)).status).toBe(401);
    expect(
      (await PATCH(request("PATCH", { status: "AVAILABLE" }), ctx)).status,
    ).toBe(401);
    expect((await DELETE(request("DELETE"), ctx)).status).toBe(401);
    expect(m.from).not.toHaveBeenCalled();
  });
});
