import { notFound } from "next/navigation";
import { requirePageAdmin } from "@/lib/page-auth";
import { appUrl } from "@/lib/env";
import { cardColumns, type Card } from "@/lib/types";
import { codeSchema } from "@/lib/validation";
import { CardForm } from "@/components/card-form";
import { SetupNotice } from "@/components/setup-notice";
export default async function EditCardPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const auth = await requirePageAdmin();
  if (!auth) return <SetupNotice />;
  const code = codeSchema.safeParse((await params).codigo);
  if (!code.success) notFound();
  const { data, error } = await auth.client
    .from("cards")
    .select(cardColumns)
    .eq("public_code", code.data)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar la tarjeta.");
  if (!data) notFound();
  return (
    <CardForm
      key={data.public_code}
      initial={data as Card}
      baseUrl={appUrl()}
    />
  );
}
