import { requireAdmin, HttpError } from "@/lib/auth";
import { assertSameOrigin, failure, json, readJson } from "@/lib/http";
import { codeSchema, updateCardSchema } from "@/lib/validation";
import { cardColumns } from "@/lib/types";
type Context = { params: Promise<{ codigo: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const { client } = await requireAdmin();
    const code = codeSchema.parse((await context.params).codigo);
    const { data, error } = await client
      .from("cards")
      .select(cardColumns)
      .eq("public_code", code)
      .maybeSingle();
    if (error) throw new HttpError(503, "No se pudo consultar la tarjeta.");
    if (!data)
      throw new HttpError(404, "No existe una tarjeta con ese código.");
    return json({ card: data });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { client } = await requireAdmin();
    const code = codeSchema.parse((await context.params).codigo);
    const input = updateCardSchema.parse(await readJson(request));
    const { data, error } = await client
      .from("cards")
      .update(input)
      .eq("public_code", code)
      .select(cardColumns)
      .maybeSingle();
    if (error)
      throw new HttpError(
        error.code === "23503" || error.code === "23514" ? 400 : 503,
        "No se pudo guardar. Para activar, el cliente debe tener un enlace de destino válido.",
      );
    if (!data)
      throw new HttpError(404, "No existe una tarjeta con ese código.");
    return json({ card: data });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { client } = await requireAdmin();
    const code = codeSchema.parse((await context.params).codigo);
    const { data, error } = await client
      .from("cards")
      .delete()
      .eq("public_code", code)
      .select("id")
      .maybeSingle();
    if (error) throw new HttpError(503, "No se pudo eliminar la tarjeta.");
    if (!data) throw new HttpError(404, "La tarjeta ya no existe.");
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
