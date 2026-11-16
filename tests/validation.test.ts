import { describe, it, expect } from "vitest";
import {
  clientSchema,
  codeSchema,
  createCardSchema,
  updateCardSchema,
  validDestinationUrl,
  periodSchema,
  nextDay,
  pageNumber,
} from "@/lib/validation";
import { activationCsv, csvCell } from "@/lib/csv";
import type { Card } from "@/lib/types";

describe("web destinations without a domain allowlist", () => {
  it.each([
    "https://example.com/menu?name=a%20b#section",
    "http://example.org:8080/path",
    "https://wa.me/123",
    "https://g.page/r/a/review",
    "http://localhost:3000/",
    "http://[::1]:8080/menu",
    "https://user:pass@example.com/path",
  ])("accepts %s", (url) => expect(validDestinationUrl(url)).toBe(true));
  it.each([
    "",
    "not a url",
    "//example.com",
    "https://",
    "https://example.com:99999/",
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///tmp/test",
    "mailto:user@example.com",
    "https://example.com/\r\nLocation:bad",
  ])("rejects %s", (url) => expect(validDestinationUrl(url)).toBe(false));
  it("preserves query encoding, repeated parameters and fragments", () => {
    const url = "https://example.com/menu?name=a%20b&tag=x&tag=y#section";
    expect(
      clientSchema.parse({ business_name: "Local", google_review_url: url })
        .google_review_url,
    ).toBe(url);
  });
});

describe("card invariants", () => {
  it("accepts optional fields on creation, rejects caller-controlled codes or status", () => {
    expect(createCardSchema.parse({})).toEqual({
      client_id: null,
      label: null,
      notes: null,
    });
    expect(createCardSchema.safeParse({ public_code: "ABCDEF" }).success).toBe(
      false,
    );
    expect(createCardSchema.safeParse({ status: "ACTIVE" }).success).toBe(
      false,
    );
  });
  it("requires a client for activation and keeps shared fields out of cards", () => {
    expect(updateCardSchema.safeParse({ status: "ACTIVE" }).success).toBe(
      false,
    );
    expect(
      updateCardSchema.parse({
        status: "ACTIVE",
        client_id: "11111111-1111-4111-8111-111111111111",
      }).client_id,
    ).toBeTruthy();
    expect(createCardSchema.safeParse({ client_id: "invalid" }).success).toBe(
      false,
    );
    expect(createCardSchema.safeParse({ label: "x".repeat(81) }).success).toBe(
      false,
    );
    expect(
      clientSchema.parse({
        business_name: " Café ",
        google_review_url: "https://g.page/r/a/review",
      }).business_name,
    ).toBe("Café");
    expect(
      clientSchema.safeParse({
        business_name: "Café",
        google_review_url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
  it("validates links even on available and suspended cards", () => {
    expect(
      updateCardSchema.safeParse({
        status: "SUSPENDED",
        google_review_url: "javascript:alert(1)",
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
