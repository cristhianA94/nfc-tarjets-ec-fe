import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cardColumns, type Card, type Report } from "./types";
import { nextDay } from "./validation";
import { HttpError } from "./auth";
export type Period = { from?: string; to?: string };
export function activationQuery(client: SupabaseClient, period: Period) {
  let q = client
    .from("cards")
    .select(cardColumns, { count: "exact" })
    .not("activated_at", "is", null);
  if (period.from) q = q.gte("activated_at", `${period.from}T00:00:00.000Z`);
  if (period.to) q = q.lt("activated_at", nextDay(period.to));
  return q.order("activated_at", { ascending: false }).order("public_code");
}
export async function getReport(
  client: SupabaseClient,
  period: Period,
  page = 1,
): Promise<Report> {
  const results = await Promise.all([
    client.from("cards").select("id", { count: "exact", head: true }),
    ...["AVAILABLE", "ACTIVE", "SUSPENDED"].map((status) =>
      client
        .from("cards")
        .select("id", { count: "exact", head: true })
        .eq("status", status),
    ),
    activationQuery(client, period).range((page - 1) * 25, page * 25 - 1),
  ]);
  if (results.some((r) => r.error))
    throw new HttpError(503, "No se pudieron cargar los reportes.");
  return {
    total: results[0].count ?? 0,
    available: results[1].count ?? 0,
    active: results[2].count ?? 0,
    suspended: results[3].count ?? 0,
    activations: results[4].count ?? 0,
    cards: (results[4].data ?? []) as Card[],
    page,
    pages: Math.max(1, Math.ceil((results[4].count ?? 0) / 25)),
  };
}
