export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("El servidor no respondió. Inténtalo de nuevo.");
  }
  if (!response.ok) {
    if (response.status === 401 && !url.endsWith("/login"))
      window.dispatchEvent(new Event("nfc:session-expired"));
    throw new Error(data.error || "No se pudo completar la operación.");
  }
  return data;
}
export function dateLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Sin activar";
}
