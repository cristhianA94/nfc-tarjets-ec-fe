export const statuses = ["AVAILABLE", "ACTIVE", "SUSPENDED"] as const;
export type CardStatus = (typeof statuses)[number];
export const statusLabels: Record<CardStatus, string> = {
  AVAILABLE: "Disponible",
  ACTIVE: "Activa",
  SUSPENDED: "Suspendida",
};
export type Card = {
  id: string;
  public_code: string;
  business_name: string | null;
  google_review_url: string | null;
  status: CardStatus;
  notes: string | null;
  created_at: string;
  activated_at: string | null;
  updated_at: string;
};
export const cardColumns =
  "id,public_code,business_name,google_review_url,status,notes,created_at,activated_at,updated_at";
export type Report = {
  total: number;
  available: number;
  active: number;
  suspended: number;
  activations: number;
  cards: Card[];
  page: number;
  pages: number;
};
