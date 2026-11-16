import { describe, it, expect } from "vitest";
import {
  codeSchema,
  createCardSchema,
  updateCardSchema,
  validReviewUrl,
  periodSchema,
  nextDay,
  pageNumber,
} from "@/lib/validation";
import { activationCsv, csvCell } from "@/lib/csv";
import type { Card } from "@/lib/types";

describe("Google Reviews allowlist", () => {
  it.each([
    "https://g.page/r/ABC_-12/review",
    "https://g.page/r/ABC/review/",
    "https://search.google.com/local/writereview?placeid=ChIJ123",
    "https://maps.app.goo.gl/ABC123",
    "https://maps.app.goo.gl/ABC?g_st=ic",
  ])("accepts %s", (url) => expect(validReviewUrl(url)).toBe(true));
  it.each([
    "",
    "notaurl",
    "http://g.page/r/a/review",
    "javascript:alert(1)",
    "//g.page/r/a/review",
    "https://evil.com",
    "https://g.page.evil.com/r/a/review",
    "https://evilg.page/r/a/review",
    "https://g.page@evil.com/r/a/review",
    "https://evil.com@g.page/r/a/review",
    "https://g.page:444/r/a/review",
    "https://g.page/r/a/review#x",
    "https://g.page/r/a/review?url=https://evil.com",
    "https://www.google.com/url?q=https://evil.com",
    "https://search.google.com/local/writereview",
    "https://search.google.com/local/writereview?placeid=x&placeid=y",
    "https://search.google.com/local/writereview?placeid=x&next=evil",
    "https://maps.app.goo.gl/",
    "https://maps.app.goo.gl/a/b",
    "https://maps.app.goo.gl/a?link=evil",
  ])("rejects %s", (url) => expect(validReviewUrl(url)).toBe(false));
});
describe("card invariants", () => {
  it("accepts optional fields on creation, rejects caller-controlled codes or status", () => {
    expect(createCardSchema.parse({})).toEqual({
      business_name: null,
      google_review_url: null,
      notes: null,
    });
    expect(createCardSchema.safeParse({ public_code: "ABCDEF" }).success).toBe(
      false,
    );
    expect(createCardSchema.safeParse({ status: "ACTIVE" }).success).toBe(
      false,
    );
  });
  it("requires both business and valid review link for activation", () => {
    expect(updateCardSchema.safeParse({ status: "ACTIVE" }).success).toBe(
      false,
    );
    expect(
      updateCardSchema.safeParse({
        status: "ACTIVE",
        business_name: "  ",
        google_review_url: "https://g.page/r/a/review",
      }).success,
    ).toBe(false);
    expect(
      updateCardSchema.parse({
        status: "ACTIVE",
        business_name: " Café ",
        google_review_url: "https://g.page/r/a/review",
      }).business_name,
    ).toBe("Café");
    expect(
      updateCardSchema.safeParse({
        status: "ACTIVE",
        business_name: "Café",
        google_review_url: "https://evil.com",
      }).success,
    ).toBe(false);
  });
  it("validates links even on available and suspended cards", () => {
    expect(
      updateCardSchema.safeParse({
        status: "SUSPENDED",
        google_review_url: "https://evil.com",
      }).success,
    ).toBe(false);
    expect(
      createCardSchema.safeParse({ google_review_url: "https://evil.com" })
        .success,
    ).toBe(false);
  });
  it("rejects changing public codes, oversized notes, invalid codes and status", () => {
    expect(
      updateCardSchema.safeParse({ status: "AVAILABLE", public_code: "ABCDEF" })
        .success,
    ).toBe(false);
    expect(
      createCardSchema.safeParse({ notes: "x".repeat(2001) }).success,
    ).toBe(false);
    expect(codeSchema.safeParse("../path").success).toBe(false);
    expect(codeSchema.safeParse("K7P4X9").success).toBe(true);
    expect(updateCardSchema.safeParse({ status: "DELETED" }).success).toBe(
      false,
    );
  });
});
describe("report dates and CSV", () => {
  it("uses inclusive dates and a UTC exclusive next-day boundary", () => {
    expect(nextDay("2026-11-30")).toBe("2026-12-01T00:00:00.000Z");
    expect(periodSchema.safeParse({ from: "2026-02-30" }).success).toBe(false);
    expect(
      periodSchema.safeParse({ from: "2026-11-15", to: "2026-11-14" }).success,
    ).toBe(false);
    expect(
      periodSchema.safeParse({ from: "2026-11-15", to: "2026-11-15" }).success,
    ).toBe(true);
    expect(pageNumber("-1")).toBe(1);
    expect(pageNumber("2")).toBe(2);
  });
  it("escapes CSV cells, quotes and formula prefixes", () => {
    expect(csvCell('Café "Centro"')).toBe('"Café ""Centro"""');
    for (const value of ["=1+1", "+cmd", "-1", "@SUM()", " \t=1+1"])
      expect(csvCell(value)).toBe('"' + "'" + value + '"');
    const csv = activationCsv([
      {
        public_code: "ABCDEF",
        business_name: "=1+1",
        activated_at: "2026-11-15T12:00:00Z",
        status: "ACTIVE",
      } as Card,
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Fecha de activación (UTC)");
    expect(csv).toContain('"Activa"');
    expect(csv).toContain('"\'=1+1"');
    expect(activationCsv([])).toContain("Código");
  });
});
