import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  maybeSingle: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  serverClient: async () => ({
    auth: {
      getClaims: mocks.getClaims,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
    },
    from: mocks.from,
  }),
}));
import { requireAdmin } from "@/lib/auth";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as logout } from "@/app/api/admin/logout/route";
const request = (body: unknown, origin = "https://nfc.example") =>
  new Request("https://nfc.example/api/admin/login", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://nfc.example";
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.from.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
  });
  mocks.signOut.mockResolvedValue({ error: null });
});
describe("server authorization", () => {
  it("rejects missing or invalid identity", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: null }, error: null });
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("rejects a valid user who is not explicitly an administrator", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user" } } });
    mocks.maybeSingle.mockResolvedValue({ data: null });
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });
  it("accepts a verified administrator", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "admin" } } });
    mocks.maybeSingle.mockResolvedValue({ data: { user_id: "admin" } });
    expect((await requireAdmin()).user.id).toBe("admin");
  });
});
describe("login and logout handlers", () => {
  it("accepts valid login and explicit administrator membership", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: "admin" } },
    });
    mocks.maybeSingle.mockResolvedValue({ data: { user_id: "admin" } });
    expect(
      (
        await login(
          request({ email: "admin@example.com", password: "valid-password" }),
        )
      ).status,
    ).toBe(200);
  });
  it("rejects invalid credentials", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid credentials" },
    });
    const res = await login(
      request({ email: "admin@example.com", password: "wrong" }),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Correo o contraseña incorrectos.");
  });
  it("clears the session for authenticated non-admin users", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: "outsider" } },
    });
    mocks.maybeSingle.mockResolvedValue({ data: null });
    expect(
      (
        await login(
          request({ email: "outsider@example.com", password: "valid" }),
        )
      ).status,
    ).toBe(403);
    expect(mocks.signOut).toHaveBeenCalled();
  });
  it("rejects cross-origin writes and malformed login fields", async () => {
    expect(
      (
        await login(
          request(
            { email: "admin@example.com", password: "valid" },
            "https://evil.com",
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (await login(request({ email: "not-email", password: "" }))).status,
    ).toBe(400);
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });
  it("logs out through Supabase", async () => {
    expect((await logout(request({}))).status).toBe(200);
    expect(mocks.signOut).toHaveBeenCalled();
  });
});
