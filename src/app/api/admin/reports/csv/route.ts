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
    let total: number | undefined;
    // Count once; advance by actual rows so a lower server row cap cannot skip data.
    for (let start = 0; ;) {
      const { data, error, count } = await activationQuery(
        client,
        period,
        start === 0,
      ).range(start, start + 499);
      if (error) throw new HttpError(503, "No se pudo exportar el reporte.");
      if (start === 0) {
        if (count === null || count === undefined)
          throw new HttpError(503, "No se pudo contar el reporte.");
        total = count;
        if (total > 100000)
          throw new HttpError(
            400,
            "Selecciona un periodo más corto para exportar.",
          );
      }
      cards.push(...((data ?? []) as Card[]));
      if (cards.length >= total!) break;
      if (!data?.length)
        throw new HttpError(
          503,
          "El reporte cambió durante la exportación. Vuelve a intentarlo.",
        );
      start += data.length;
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
