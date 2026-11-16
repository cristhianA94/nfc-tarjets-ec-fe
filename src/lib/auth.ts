import "server-only";
import { serverClient } from "./supabase/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireAdmin() {
  const client = await serverClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user)
    throw new HttpError(401, "Tu sesión ha caducado. Inicia sesión de nuevo.");
  const { data: admin, error: adminError } = await client
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminError)
    throw new HttpError(
      503,
      "No se pudo verificar el acceso. Inténtalo de nuevo.",
    );
  if (!admin)
    throw new HttpError(403, "Esta cuenta no tiene acceso de administrador.");
  return { client, user };
}
