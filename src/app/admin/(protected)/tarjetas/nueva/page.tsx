import { CardForm } from "@/components/card-form";
import { SetupNotice } from "@/components/setup-notice";
import { appUrl } from "@/lib/env";
import { requirePageAdmin } from "@/lib/page-auth";
import { z } from "zod";
export default async function NewCardPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  if (!(await requirePageAdmin())) return <SetupNotice />;
  const id = z.uuid().safeParse((await searchParams).client_id);
  return (
    <CardForm
      baseUrl={appUrl()}
      initialClientId={id.success ? id.data : undefined}
    />
  );
}
