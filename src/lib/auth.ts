import "server-only";
import { cache } from "react";
import { serverClient } from "./supabase/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const requireAdmin = cache(async () => {
  const client = await serverClient();
  const { data, error } = await client.auth.getClaims();
  const claims = data?.claims;
  if (error || typeof claims?.sub !== "string")
    throw new HttpError(401, "Tu sesión ha caducado. Inicia sesión de nuevo.");
  const user = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
  };
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
});
