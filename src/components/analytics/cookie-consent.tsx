"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { CONSENT_KEY, CONSENT_EVENT } from "./consent";

/**
 * Banner de consentimento de cookies (LGPD). Aparece na 1ª visita e guarda a
 * escolha em localStorage ("pd-consent" = accepted | rejected). Ao decidir,
 * dispara o evento `pd-consent-change` → o Clarity (analytics) só liga se o
 * usuário ACEITAR. Cookies técnicos/essenciais (login) seguem sempre.
 */
export { CONSENT_KEY } from "./consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem(CONSENT_KEY)) setShow(true); } catch { /* ignore */ }
    const open = () => setShow(true);
    window.addEventListener("pd-consent-open", open);
    return () => window.removeEventListener("pd-consent-open", open);
  }, []);

  const decidir = (valor: "accepted" | "rejected") => {
    try {
      const previous = localStorage.getItem(CONSENT_KEY);
      localStorage.setItem(CONSENT_KEY, valor);
      window.dispatchEvent(new Event(CONSENT_EVENT));
      // SDKs já carregados só são completamente interrompidos em um novo documento.
      if (previous === "accepted" && valor === "rejected") window.location.reload();
    } catch { /* ignore */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="glass mx-auto flex max-w-page flex-col gap-3 rounded-2xl border border-line p-4 shadow-2xl sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-2">
            <Cookie className="h-4 w-4" />
          </span>
          <p className="text-xs leading-snug text-muted">
            Podemos medir buscas, ofertas vistas e cliques para melhorar o PromoDetec?
            Google Analytics e Clarity só carregam se você aceitar. Sua escolha pode ser revista no rodapé. Veja a{" "}
            <Link href="/privacidade" className="text-brand-2 underline hover:text-ink">Política de Privacidade</Link>.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 sm:ml-auto">
          <button type="button" onClick={() => decidir("rejected")}
            className="min-h-11 flex-1 rounded-lg border border-line px-4 py-2 text-xs font-semibold text-muted transition-colors hover:bg-bg-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:flex-none">
            Rejeitar
          </button>
          <button type="button" onClick={() => decidir("accepted")}
            className="min-h-11 flex-1 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:flex-none">
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrivacySettings() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("pd-consent-open"))}
    className="min-h-11 py-2 text-left text-sm leading-6 text-white/75 underline decoration-white/35 underline-offset-4 transition-colors hover:text-white hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-4">
    Preferências de privacidade
  </button>;
}
