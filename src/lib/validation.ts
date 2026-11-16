import { z } from "zod";
import { statuses } from "./types";

// Exact hosts and paths, shared by writes and the public redirect handler.
export function validReviewUrl(value: string): boolean {
  try {
    if (value.length > 2048) return false;
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password || u.port || u.hash)
      return false;
    if (u.hostname === "g.page")
      return /^\/r\/[A-Za-z0-9_-]+\/review\/?$/.test(u.pathname) && !u.search;
    if (u.hostname === "search.google.com") {
      return (
        u.pathname === "/local/writereview" &&
        /^[A-Za-z0-9_-]+$/.test(u.searchParams.get("placeid") ?? "") &&
        [...u.searchParams.keys()].length === 1
      );
    }
    if (u.hostname === "maps.app.goo.gl")
      return (
        /^\/[A-Za-z0-9_-]+\/?$/.test(u.pathname) &&
        (!u.search || /^\?g_st=[A-Za-z0-9_-]+$/.test(u.search))
      );
    return false;
  } catch {
    return false;
  }
}

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => v || null);
export const codeSchema = z
  .string()
  .regex(/^[A-Z0-9]{6,16}$/, "Código de tarjeta inválido.");
const fields = {
  business_name: nullableText(160),
  google_review_url: nullableText(2048)
    .refine(
      (v) => v === null || validReviewUrl(v),
      "Utiliza un enlace HTTPS de reseñas admitido: g.page/r/…/review, search.google.com/local/writereview?placeid=… o maps.app.goo.gl/…",
    )
    .transform((v) => {
      if (!v) return null;
      const u = new URL(v);
      if (u.search) u.search = u.searchParams.toString();
      return u.href;
    }),
  notes: nullableText(2000),
};
export const createCardSchema = z.object(fields).strict();
export const updateCardSchema = z
  .object({ ...fields, status: z.enum(statuses) })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.status === "ACTIVE" &&
      (!data.business_name || !data.google_review_url)
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Para activar, introduce el nombre del negocio y su enlace de Google Reviews.",
      });
    }
  });
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00.000Z`);
    return (
      Number(v.slice(0, 4)) > 0 &&
      !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === v
    );
  }, "Fecha inválida.");
export const periodSchema = z
  .object({ from: date.optional(), to: date.optional() })
  .refine(
    (v) => !v.from || !v.to || v.from <= v.to,
    "La fecha inicial debe ser anterior o igual a la final.",
  );
export function periodFromParams(params: URLSearchParams) {
  return periodSchema.parse({
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
  });
}
export function nextDay(date: string) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}
export function pageNumber(value: string | null): number {
  const n = Number(value ?? 1);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 1000000) : 1;
}
