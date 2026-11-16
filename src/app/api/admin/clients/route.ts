import { requireAdmin, HttpError } from "@/lib/auth";
import { assertSameOrigin, failure, json, readJson } from "@/lib/http";
import { clientSchema, pageNumber } from "@/lib/validation";
export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin();
    const p = new URL(request.url).searchParams;
    const page = pageNumber(p.get("page"));
    const picker = p.get("picker") === "1";
    let q = client
      .from("clients")
      .select(
        picker ? "id,business_name" : "id,business_name,cards(count)",
        picker ? {} : { count: "exact" },
      );
    const term = (p.get("q") ?? "").trim();
    if (term.length > 160)
      throw new HttpError(400, "Búsqueda demasiado larga.");
    if (term)
      q = q.ilike("business_name", "%" + term.replace(/[%_\\]/g, " ") + "%");
    const { data, error, count } = await q
      .order("business_name")
      .order("id")
      .range((page - 1) * 25, page * 25 - 1);
    if (error) throw new HttpError(503, "No se pudieron cargar los clientes.");
    if (picker) return json({ clients: data });
    return json({
      clients: data,
      total: count ?? 0,
      page,
      pages: Math.max(1, Math.ceil((count ?? 0) / 25)),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { client } = await requireAdmin();
    const input = clientSchema.parse(await readJson(request));
    const { data, error } = await client
      .from("clients")
      .insert(input)
      .select("*")
      .single();
    if (error)
      throw new HttpError(
        400,
        "No se pudo crear el cliente. Revisa los datos.",
      );
    return json({ client: data }, 201);
  } catch (e) {
    return failure(e);
  }
}
