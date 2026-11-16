import { configured } from "@/lib/env";
import { LoginForm } from "@/components/login-form";
import { SetupNotice } from "@/components/setup-notice";
export const dynamic = "force-dynamic";
export default function LoginPage() {
  return configured() ? <LoginForm /> : <SetupNotice />;
}
