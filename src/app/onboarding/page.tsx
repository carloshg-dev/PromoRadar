import { OnboardingClient } from "@/components/auth/onboarding-client";
export const metadata = { title: "Personalize — PromoDetec" };
export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-60px)] max-w-2xl flex-col items-center justify-center px-5 py-10">
      <OnboardingClient />
    </main>
  );
}
