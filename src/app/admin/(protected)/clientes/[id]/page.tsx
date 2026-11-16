import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePageAdmin } from "@/lib/page-auth";
import { SetupNotice } from "@/components/setup-notice";
import { ClientForm } from "@/components/client-form";
import { CardList } from "@/components/card-list";
import type { Client } from "@/lib/types";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requirePageAdmin();
  if (!auth) return <SetupNotice />;
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const { data, error } = await auth.client
    .from("clients")
    .select("*")
    .eq("id", id.data)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el cliente.");
  if (!data) notFound();
  return (
    <>
      <ClientForm initial={data as Client} />
      <CardList key={data.updated_at} clientId={data.id} />
    </>
  );
}
