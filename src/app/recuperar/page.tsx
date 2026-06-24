import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Recuperar senha — PromoDetec" };
export default function RecuperarPage() {
  return <AuthShell><Suspense><AuthForm modo="recuperar" /></Suspense></AuthShell>;
}
