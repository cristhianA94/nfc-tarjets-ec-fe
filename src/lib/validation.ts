import { z } from "zod";
import { statuses } from "./types";

// Shared URL syntax validation; destinations are not restricted by domain.
export function validDestinationUrl(value: string): boolean {
  try {
    if (
      value.length > 2048 ||
      Array.from(value).some(
        (c) => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127,
      )
    )
      return false;
    const u = new URL(value);
    return (
      (u.protocol === "http:" || u.protocol === "https:") && Boolean(u.hostname)
    );
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
export const clientSchema = z
  .object({
    business_name: z
      .string()
      .trim()
      .min(1, "Introduce el nombre del negocio.")
      .max(160),
    google_review_url: nullableText(2048)
      .refine(
        (v) => v === null || validDestinationUrl(v),
        "Introduce una URL completa HTTP o HTTPS válida.",
      )
      .transform((v) => {
        if (!v) return null;
        const u = new URL(v);
        return u.href;
      }),
    notes: nullableText(2000),
  })
  .strict();
const fields = {
  client_id: z
    .uuid("Cliente inválido.")
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  label: nullableText(80),
  notes: nullableText(2000),
};
export const createCardSchema = z.object(fields).strict();
export const updateCardSchema = z
  .object({ ...fields, status: z.enum(statuses) })
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === "ACTIVE" && !data.client_id)
      ctx.addIssue({
        code: "custom",
        message:
          "Selecciona un cliente con enlace de destino para activar la tarjeta.",
      });
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
