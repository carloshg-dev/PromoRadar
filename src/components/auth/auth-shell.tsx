import { AuthAside } from "@/components/auth/auth-aside";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-60px)] max-w-6xl grid-cols-1 items-stretch gap-6 px-5 py-8 lg:grid-cols-2">
      <AuthAside />
      <div className="flex items-center justify-center py-8">
        {children}
      </div>
    </main>
  );
}