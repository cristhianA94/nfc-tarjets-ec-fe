import { z } from "zod";
import { serverClient } from "@/lib/supabase/server";
import { assertSameOrigin, failure, json, readJson } from "@/lib/http";
import { HttpError } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = z
      .object({
        email: z.email().max(254),
        password: z.string().min(1).max(1024),
      })
      .strict()
      .parse(await readJson(request));
    const client = await serverClient();
    const { data, error } = await client.auth.signInWithPassword(input);
    if (error || !data.user)
      throw new HttpError(401, "Correo o contraseña incorrectos.");
    const { data: admin, error: adminError } = await client
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (adminError || !admin) {
      await client.auth.signOut();
      throw new HttpError(
        adminError ? 503 : 403,
        adminError
          ? "No se pudo verificar el acceso."
          : "Esta cuenta no tiene acceso de administrador.",
      );
    }
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
