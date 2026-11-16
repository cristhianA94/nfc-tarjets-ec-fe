import { serverClient } from "@/lib/supabase/server";
import { assertSameOrigin, failure, json } from "@/lib/http";
import { HttpError } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const client = await serverClient();
    const { error } = await client.auth.signOut();
    if (error)
      throw new HttpError(
        503,
        "No se pudo cerrar la sesión. Inténtalo de nuevo.",
      );
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
