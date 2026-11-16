import { publicClient } from "@/lib/supabase/public";
import { codeSchema, validDestinationUrl } from "@/lib/validation";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};
export async function GET(
  request: Request,
  context: { params: Promise<{ codigo: string }> },
) {
  const parsed = codeSchema.safeParse((await context.params).codigo);
  if (!parsed.success)
    return new Response("Tarjeta no encontrada", { status: 404, headers });
  try {
    const client = publicClient();
    const { data, error } = await client.rpc("resolve_card", {
      code: parsed.data,
    });
    if (error)
      return new Response("Servicio temporalmente no disponible", {
        status: 503,
        headers,
      });
    const card = data?.[0];
    if (!card)
      return new Response("Tarjeta no encontrada", { status: 404, headers });
    if (
      card.status === "ACTIVE" &&
      card.google_review_url &&
      validDestinationUrl(card.google_review_url)
    ) {
      return new Response(null, {
        status: 302,
        headers: { ...headers, Location: card.google_review_url },
      });
    }
    const path = card.status === "AVAILABLE" ? "/demo" : "/no-disponible";
    return new Response(null, {
      status: 302,
      headers: { ...headers, Location: new URL(path, request.url).toString() },
    });
  } catch {
    return new Response("Servicio temporalmente no disponible", {
      status: 503,
      headers,
    });
  }
}
