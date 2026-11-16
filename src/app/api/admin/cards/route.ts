import { requireAdmin, HttpError } from "@/lib/auth";
import { assertSameOrigin, failure, json, readJson } from "@/lib/http";
import { createCardSchema, pageNumber } from "@/lib/validation";
import { cardColumns, statuses, type CardStatus } from "@/lib/types";
export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin();
    const p = new URL(request.url).searchParams;
    const page = pageNumber(p.get("page"));
    const search = (p.get("q") ?? "").trim();
    if (search.length > 160)
      throw new HttpError(400, "La búsqueda es demasiado larga.");
    let query = client.from("cards").select(cardColumns, { count: "exact" });
    if (search) {
      // Strip PostgREST filter punctuation; wildcard characters are literal search input.
      const safe = search.replace(/[,().%_*\\\"]/g, " ").trim();
      if (safe)
        query = query.or(
          `public_code.ilike.%${safe}%,business_name.ilike.%${safe}%`,
        );
    }
    const status = p.get("status");
    if (status) {
      if (!statuses.includes(status as CardStatus))
        throw new HttpError(400, "Estado inválido.");
      query = query.eq("status", status);
    }
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 20, page * 20 - 1);
    if (error) throw new HttpError(503, "No se pudieron cargar las tarjetas.");
    return json({
      cards: data,
      total: count ?? 0,
      page,
      pages: Math.max(1, Math.ceil((count ?? 0) / 20)),
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { client } = await requireAdmin();
    const input = createCardSchema.parse(await readJson(request));
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await client
        .from("cards")
        .insert({ ...input, status: "AVAILABLE" })
        .select(cardColumns)
        .single();
      if (!error) return json({ card: data }, 201);
      if (error.code !== "23505")
        throw new HttpError(503, "No se pudo crear la tarjeta.");
    }
    throw new HttpError(
      503,
      "No se pudo generar un código único. Inténtalo de nuevo.",
    );
  } catch (error) {
    return failure(error);
  }
}
