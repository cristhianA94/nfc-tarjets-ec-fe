import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getReport: vi.fn(),
  activationQuery: vi.fn(),
  range: vi.fn(),
}));
vi.mock("@/lib/auth", async (original) => ({
  ...(await original<typeof import("@/lib/auth")>()),
  requireAdmin: m.requireAdmin,
}));
vi.mock("@/lib/reports", () => ({
  getReport: m.getReport,
  activationQuery: m.activationQuery,
}));
import { GET as report } from "@/app/api/admin/reports/route";
import { GET as csv } from "@/app/api/admin/reports/csv/route";
import { HttpError } from "@/lib/auth";
const request = (query = "") =>
  new Request("https://nfc.example/api/admin/reports" + query);
beforeEach(() => {
  Object.values(m).forEach((fn) => fn.mockReset());
  m.requireAdmin.mockResolvedValue({ client: {} });
  m.activationQuery.mockReturnValue({ range: m.range });
});
it("denies unauthorized access to reports and exports", async () => {
  m.requireAdmin.mockRejectedValue(new HttpError(401, "Sesión requerida"));
  expect((await report(request())).status).toBe(401);
  expect((await csv(request())).status).toBe(401);
  expect(m.activationQuery).not.toHaveBeenCalled();
});
it("rejects invalid date ranges before querying", async () => {
  expect((await report(request("?from=2026-11-16&to=2026-11-15"))).status).toBe(
    400,
  );
  expect((await csv(request("?from=2026-02-30"))).status).toBe(400);
  expect(m.getReport).not.toHaveBeenCalled();
});
it("applies the requested period and pagination", async () => {
  m.getReport.mockResolvedValue({ total: 3, activations: 2 });
  const response = await report(
    request("?from=2026-11-01&to=2026-11-15&page=2"),
  );
  expect(await response.json()).toEqual({ total: 3, activations: 2 });
  expect(m.getReport).toHaveBeenCalledWith(
    {},
    { from: "2026-11-01", to: "2026-11-15" },
    2,
  );
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("exports all pages rather than silently truncating at the Supabase row limit", async () => {
  const card = (n: number) => ({
    public_code: "TEST" + n,
    business_name: "Negocio " + n,
    activated_at: "2026-11-15T10:00:00Z",
    status: "ACTIVE",
  });
  m.range
    .mockResolvedValueOnce({
      data: Array.from({ length: 500 }, (_, i) => card(i)),
      count: 501,
    })
    .mockResolvedValueOnce({ data: [card(500)], count: 501 });
  const response = await csv(request("?from=2026-11-01"));
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/csv");
  expect(response.headers.get("content-disposition")).toContain(
    "activaciones-nfc.csv",
  );
  const text = await response.text();
  expect(text.split("\r\n")).toHaveLength(502);
  expect(text).toContain("TEST500");
  expect(m.range).toHaveBeenNthCalledWith(1, 0, 499);
  expect(m.range).toHaveBeenNthCalledWith(2, 500, 999);
});
it("returns an error rather than exporting a partial dataset", async () => {
  m.range.mockResolvedValue({ error: { message: "offline" } });
  expect((await csv(request())).status).toBe(503);
});
