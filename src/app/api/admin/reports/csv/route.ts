import { requireAdmin, HttpError } from "@/lib/auth";
import { failure, noStore } from "@/lib/http";
import { activationQuery } from "@/lib/reports";
import { periodFromParams } from "@/lib/validation";
import { activationCsv } from "@/lib/csv";
import type { Card } from "@/lib/types";
export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin();
    const period = periodFromParams(new URL(request.url).searchParams);
    const cards: Card[] = [];
    // Page explicitly so Supabase's per-request row limit does not truncate exports.
    for (let start = 0; ; start += 500) {
      const { data, error, count } = await activationQuery(
        client,
        period,
      ).range(start, start + 499);
      if (error) throw new HttpError(503, "No se pudo exportar el reporte.");
      cards.push(...((data ?? []) as Card[]));
      if (cards.length >= (count ?? 0) || !data?.length) break;
      if (cards.length > 100000)
        throw new HttpError(
          400,
          "Selecciona un periodo más corto para exportar.",
        );
    }
    return new Response(activationCsv(cards), {
      headers: {
        ...noStore,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="activaciones-nfc.csv"',
      },
    });
  } catch (error) {
    return failure(error);
  }
}
