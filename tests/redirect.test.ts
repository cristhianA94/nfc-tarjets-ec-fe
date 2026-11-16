import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/public", () => ({ publicClient: () => ({ rpc }) }));
import { GET } from "@/app/r/[codigo]/route";
const run = (code = "K7P4X9") =>
  GET(new Request("https://nfc.example/r/" + code), {
    params: Promise.resolve({ codigo: code }),
  });
beforeEach(() => {
  rpc.mockReset();
});
describe("public NFC handler", () => {
  it("redirects an active card directly with HTTP 302 and no cache", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          status: "ACTIVE",
          google_review_url: "https://g.page/r/Local/review",
        },
      ],
      error: null,
    });
    const res = await run();
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://g.page/r/Local/review");
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.headers.get("vercel-cdn-cache-control")).toBe("no-store");
    expect(await res.text()).toBe("");
    expect(rpc).toHaveBeenCalledWith("resolve_card", { code: "K7P4X9" });
  });
  it("uses the new destination on the same permanent URL", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        { status: "ACTIVE", google_review_url: "https://g.page/r/Old/review" },
      ],
    });
    rpc.mockResolvedValueOnce({
      data: [
        { status: "ACTIVE", google_review_url: "https://g.page/r/New/review" },
      ],
    });
    expect((await run()).headers.get("location")).toContain("/Old/");
    expect((await run()).headers.get("location")).toContain("/New/");
  });
  it.each([
    ["AVAILABLE", "/demo"],
    ["SUSPENDED", "/no-disponible"],
  ])("handles %s", async (status, target) => {
    rpc.mockResolvedValue({ data: [{ status, google_review_url: null }] });
    const res = await run();
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://nfc.example" + target);
  });
  it("returns 404 for an unknown code", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect((await run()).status).toBe(404);
  });
  it("returns 404 without querying for malformed codes", async () => {
    expect((await run("bad")).status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("blocks a corrupted or unsafe active target", async () => {
    rpc.mockResolvedValue({
      data: [{ status: "ACTIVE", google_review_url: "javascript:alert(1)" }],
    });
    expect((await run()).headers.get("location")).toBe(
      "https://nfc.example/no-disponible",
    );
  });
  it("returns 503 on a database failure instead of pretending the card is missing", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db unavailable" } });
    expect((await run()).status).toBe(503);
    rpc.mockRejectedValue(new Error("offline"));
    expect((await run()).status).toBe(503);
  });
});

it.each([
  "https://example.com/menu?name=a%20b#section",
  "http://example.org:8080/path",
])("redirects an active card to any web domain: %s", async (url) => {
  rpc.mockResolvedValue({
    data: [{ status: "ACTIVE", google_review_url: url }],
  });
  const res = await run();
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toBe(url);
  expect(res.headers.get("cache-control")).toContain("no-store");
});
