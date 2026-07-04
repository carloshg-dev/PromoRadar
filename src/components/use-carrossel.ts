"use client";
import { useEffect, useRef } from "react";

/**
 * Carrossel auto-rolante COM arrasto livre (mouse + touch + caneta). O bug antigo:
 * o rAF forçava `scrollLeft = pos` todo frame → brigava com o dedo/mouse ("vibra
 * mas não desliza"), e no PC o arrasto nem existia (container overflow não arrasta
 * com mouse por padrão).
 *
 * Solução: o loop DIRIGE (scrollLeft = pos) só quando ninguém está interagindo;
 * durante hover/arrasto/cooldown ele SEGUE (pos = scrollLeft) sem brigar. O arrasto
 * de MOUSE é implementado à mão (delta do ponteiro → scrollLeft); o de TOUCH usa a
 * rolagem nativa do container (só pausamos o auto). Loop sem emenda (trilha 2×);
 * reverso anda no sentido oposto. Respeita prefers-reduced-motion.
 */
export function useCarrossel(direcao: "normal" | "reverso" = "normal", velocidade = 0.5) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reverso = direcao === "reverso";

    let raf = 0;
    let pos = 0;
    let iniciado = false;
    let hover = false;
    let arrastando = false;
    let cooldownAte = 0;        // pausa curta após soltar (deixa o momentum assentar)
    let startX = 0, startScroll = 0;

    const norm = (v: number, meta: number) => (v >= meta ? v - meta : v < 0 ? v + meta : v);

    const passo = () => {
      const meta = el.scrollWidth / 2; // metade = 1 cópia
      if (meta > 0) {
        if (!iniciado) { pos = reverso ? meta : 0; el.scrollLeft = pos; iniciado = true; }
        const ativo = !reduzido && !hover && !arrastando && performance.now() >= cooldownAte;
        if (ativo) {
          pos = norm(pos + (reverso ? -velocidade : velocidade), meta);
          el.scrollLeft = pos;
        } else {
          pos = norm(el.scrollLeft, meta); // segue o usuário/momentum, sem brigar
        }
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);

    // ——— arrasto (Pointer Events: cobre mouse, touch e caneta) ———
    const onDown = (e: PointerEvent) => {
      arrastando = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      // MOUSE: captura o ponteiro e move via delta (overflow não arrasta sozinho).
      // TOUCH: NÃO captura — deixa a rolagem nativa do container agir (com momentum).
      if (e.pointerType === "mouse") {
        try { el.setPointerCapture(e.pointerId); } catch { /* ok */ }
        el.style.cursor = "grabbing";
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!arrastando) return;
      if (e.pointerType === "mouse") {
        el.scrollLeft = startScroll - (e.clientX - startX);
      }
      // touch: scrollLeft já anda nativo; o loop sincroniza pos sozinho.
    };
    const fim = (e: PointerEvent) => {
      if (!arrastando) return;
      arrastando = false;
      cooldownAte = performance.now() + 900; // deixa o momentum do touch assentar
      if (e.pointerType === "mouse") {
        try { el.releasePointerCapture(e.pointerId); } catch { /* ok */ }
        el.style.cursor = "grab";
      }
    };
    const enter = () => { hover = true; };
    const leave = () => { hover = false; };

    el.style.cursor = "grab";
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", fim);
    el.addEventListener("pointercancel", fim);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", fim);
      el.removeEventListener("pointercancel", fim);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, [direcao, velocidade]);

  return ref;
}
