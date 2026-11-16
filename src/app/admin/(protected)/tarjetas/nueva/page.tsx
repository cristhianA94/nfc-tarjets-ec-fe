import { CardForm } from "@/components/card-form";
import { SetupNotice } from "@/components/setup-notice";
import { appUrl } from "@/lib/env";
import { requirePageAdmin } from "@/lib/page-auth";
export default async function NewCardPage() {
  if (!(await requirePageAdmin())) return <SetupNotice />;
  return <CardForm baseUrl={appUrl()} />;
}
