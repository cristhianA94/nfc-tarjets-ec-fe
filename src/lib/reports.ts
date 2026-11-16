import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Report } from "./types";
import { nextDay } from "./validation";
import { HttpError } from "./auth";
export type Period = { from?: string; to?: string };
export function activationQuery(
  client: SupabaseClient,
  period: Period,
  includeCount = false,
) {
  let q = client
    .from("cards")
    .select(
      "public_code,business_name,label,activated_at,status",
      includeCount ? { count: "exact" } : {},
    )
    .not("activated_at", "is", null);
  if (period.from) q = q.gte("activated_at", period.from + "T00:00:00.000Z");
  if (period.to) q = q.lt("activated_at", nextDay(period.to));
  return q.order("activated_at", { ascending: false }).order("public_code");
}
export async function getReport(
  client: SupabaseClient,
  period: Period,
  page = 1,
): Promise<Report> {
  const { data, error } = await client.rpc("get_card_report", {
    p_from: period.from ?? null,
    p_to: period.to ?? null,
    p_page: page,
  });
  if (error || !data)
    throw new HttpError(503, "No se pudieron cargar los reportes.");
  return data as Report;
}
