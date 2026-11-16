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
  client_id: string | null;
  label: string | null;
  business_name: string | null;
  google_review_url: string | null;
  status: CardStatus;
  notes: string | null;
  created_at: string;
  activated_at: string | null;
  updated_at: string;
};
export const cardColumns =
  "id,public_code,client_id,label,business_name,google_review_url,status,notes,created_at,activated_at,updated_at";
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

export type Client = {
  id: string;
  business_name: string;
  google_review_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const cardListColumns =
  "id,public_code,client_id,label,business_name,status,created_at,activated_at";
