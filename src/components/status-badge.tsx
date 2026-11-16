import { type CardStatus, statusLabels } from "@/lib/types";
export function StatusBadge({ status }: { status: CardStatus }) {
  return (
    <span className={"badge badge-" + status.toLowerCase()}>
      <span />
      {statusLabels[status]}
    </span>
  );
}
