import "server-only";
import { ZodError } from "zod";
import { HttpError } from "./auth";
import { appUrl } from "./env";
export const noStore = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: noStore });
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  if (error instanceof ZodError)
    return json(
      { error: error.issues[0]?.message ?? "Revisa los datos." },
      400,
    );
  if (error instanceof SyntaxError)
    return json({ error: "El cuerpo de la solicitud no es válido." }, 400);
  return json(
    {
      error:
        "No se pudo completar la operación. Revisa la configuración e inténtalo de nuevo.",
    },
    503,
  );
}
export function assertSameOrigin(request: Request) {
  if (request.headers.get("origin") !== appUrl())
    throw new HttpError(403, "Origen de solicitud no permitido.");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Se requiere JSON.");
  const raw = await request.text();
  if (raw.length > 16000)
    throw new HttpError(413, "Solicitud demasiado grande.");
  return JSON.parse(raw);
}
