import { z } from "zod";
import { requireAdmin, HttpError } from "@/lib/auth";
import { assertSameOrigin, failure, json, readJson } from "@/lib/http";
import { clientSchema } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, ctx: Context) {
  try {
    assertSameOrigin(request);
    const { client } = await requireAdmin();
    const id = z.uuid().parse((await ctx.params).id);
    const input = clientSchema.parse(await readJson(request));
    const { data, error } = await client
      .from("clients")
      .update(input)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error)
      throw new HttpError(
        400,
        "No se pudo guardar. Un cliente con tarjetas activas debe conservar un enlace válido.",
      );
    if (!data) throw new HttpError(404, "Cliente no encontrado.");
    return json({ client: data });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request, ctx: Context) {
  try {
    assertSameOrigin(request);
    const { client } = await requireAdmin();
    const id = z.uuid().parse((await ctx.params).id);
    const { data, error } = await client
      .from("clients")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error?.code === "23503")
      throw new HttpError(
        409,
        "Este cliente tiene tarjetas. Reasígnalas o desvincúlalas antes de eliminarlo.",
      );
    if (error) throw new HttpError(503, "No se pudo eliminar el cliente.");
    if (!data) throw new HttpError(404, "Cliente no encontrado.");
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
