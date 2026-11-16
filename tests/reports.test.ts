import { describe, it, expect, vi } from "vitest";
import { getReport, activationQuery } from "@/lib/reports";
import type { SupabaseClient } from "@supabase/supabase-js";
describe("reports", () => {
  it("fetches totals and filtered activations in exactly one data request", async () => {
    const data = {
      total: 12,
      available: 5,
      active: 6,
      suspended: 1,
      activations: 2,
      cards: [{ public_code: "ABCDEF" }],
      page: 2,
      pages: 3,
    };
    const rpc = vi.fn().mockResolvedValue({ data, error: null });
    expect(
      await getReport(
        { rpc } as unknown as SupabaseClient,
        { from: "2026-11-01", to: "2026-11-15" },
        2,
      ),
    ).toEqual(data);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("get_card_report", {
      p_from: "2026-11-01",
      p_to: "2026-11-15",
      p_page: 2,
    });
  });
  it("does not hide database errors as zero totals", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "offline" } });
    await expect(
      getReport({ rpc } as unknown as SupabaseClient, {}),
    ).rejects.toMatchObject({ status: 503 });
  });
  it("exports only needed columns, counting only when requested and using UTC boundaries", () => {
    const q = {
      select: vi.fn(),
      not: vi.fn(),
      gte: vi.fn(),
      lt: vi.fn(),
      order: vi.fn(),
    };
    Object.values(q).forEach((fn) => fn.mockReturnValue(q));
    const c = { from: () => q } as unknown as SupabaseClient;
    activationQuery(c, { from: "2026-11-01", to: "2026-11-15" }, true);
    expect(q.select).toHaveBeenLastCalledWith(
      "public_code,business_name,label,activated_at,status",
      { count: "exact" },
    );
    expect(q.gte).toHaveBeenCalledWith(
      "activated_at",
      "2026-11-01T00:00:00.000Z",
    );
    expect(q.lt).toHaveBeenCalledWith(
      "activated_at",
      "2026-11-16T00:00:00.000Z",
    );
    activationQuery(c, {});
    expect(q.select).toHaveBeenLastCalledWith(
      "public_code,business_name,label,activated_at,status",
      {},
    );
  });
});
