import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Criar conta — PromoDetec" };
export default function CadastroPage() {
  return <AuthShell><Suspense><AuthForm modo="cadastro" /></Suspense></AuthShell>;
}
