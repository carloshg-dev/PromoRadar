import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Entrar — PromoDetec" };
export default function LoginPage() {
  return <AuthShell><Suspense><AuthForm modo="login" /></Suspense></AuthShell>;
}
