import { describe, it, expect, vi } from "vitest";
import { getReport, activationQuery } from "@/lib/reports";
import type { SupabaseClient } from "@supabase/supabase-js";
describe("reports", () => {
  it("returns global status totals and filtered activation count independently", async () => {
    const counts = [12, 5, 6, 1];
    const from = vi.fn().mockImplementation(() => {
      const count = counts.shift();
      const result = {
        count: count ?? 2,
        data: count === undefined ? [{ public_code: "ABCDEF" }] : null,
        error: null,
      };
      const q = {
        select: () => q,
        eq: () => Promise.resolve(result),
        not: () => q,
        gte: () => q,
        lt: () => q,
        order: () => q,
        range: () => Promise.resolve(result),
        then: (resolve: (r: typeof result) => void) =>
          Promise.resolve(result).then(resolve),
      };
      return q;
    });
    const report = await getReport({ from } as unknown as SupabaseClient, {
      from: "2026-11-01",
      to: "2026-11-15",
    });
    expect(report).toMatchObject({
      total: 12,
      available: 5,
      active: 6,
      suspended: 1,
      activations: 2,
      pages: 1,
    });
    expect(report.cards).toHaveLength(1);
  });
  it("uses UTC date boundaries and excludes unactivated cards", () => {
    const q = {
      select: vi.fn(),
      not: vi.fn(),
      gte: vi.fn(),
      lt: vi.fn(),
      order: vi.fn(),
    };
    Object.values(q).forEach((fn) => fn.mockReturnValue(q));
    activationQuery({ from: () => q } as unknown as SupabaseClient, {
      from: "2026-11-01",
      to: "2026-11-15",
    });
    expect(q.not).toHaveBeenCalledWith("activated_at", "is", null);
    expect(q.gte).toHaveBeenCalledWith(
      "activated_at",
      "2026-11-01T00:00:00.000Z",
    );
    expect(q.lt).toHaveBeenCalledWith(
      "activated_at",
      "2026-11-16T00:00:00.000Z",
    );
  });
});
