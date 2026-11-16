import { type Card, statusLabels } from "./types";
export function csvCell(value: string | null) {
  let text = value ?? "";
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function activationCsv(cards: Card[]) {
  return (
    "\uFEFF" +
    [
      [
        "Código",
        "Cliente",
        "Identificación",
        "Fecha de activación (UTC)",
        "Estado",
      ],
      ...cards.map((c) => [
        c.public_code,
        c.business_name,
        c.label ?? null,
        c.activated_at,
        statusLabels[c.status],
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
