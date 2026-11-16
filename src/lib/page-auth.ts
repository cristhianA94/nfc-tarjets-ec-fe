import "server-only";
import { redirect } from "next/navigation";
import { requireAdmin, HttpError } from "./auth";
import { configured, appUrl } from "./env";
export async function requirePageAdmin() {
  if (!configured()) return null;
  appUrl();
  try {
    return await requireAdmin();
  } catch (error) {
    if (
      error instanceof HttpError &&
      (error.status === 401 || error.status === 403)
    )
      redirect(
        "/admin/login" + (error.status === 403 ? "?reason=forbidden" : ""),
      );
    throw error;
  }
}
