import { requirePageAdmin } from "@/lib/page-auth";
import { AdminShell } from "@/components/admin-shell";
import { SetupNotice } from "@/components/setup-notice";
export const dynamic = "force-dynamic";
export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requirePageAdmin();
  if (!auth) return <SetupNotice />;
  return <AdminShell email={auth.user.email ?? ""}>{children}</AdminShell>;
}
