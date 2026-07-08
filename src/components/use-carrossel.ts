"use client";
import { useEffect, useRef } from "react";

/**
 * Carrossel auto-rolante COM arrasto livre (mouse + touch). Loop sem emenda
 * (trilha 2×); reverso anda no sentido oposto. Respeita prefers-reduced-motion.
 *
 * Drag de mouse: ouve mousemove/mouseup no DOCUMENT (funciona mesmo saindo do
 * elemento) sem setPointerCapture — que bloqueava clicks nos cards filhos.
 * Click nos links filhos é bloqueado somente se houve arrasto real (>5 px).
 * Touch usa rolagem nativa do overflow (mais fluida com momentum).
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
    let cooldownAte = 0;
    let startX = 0, startScroll = 0;
    let dragged = false; // houve arrasto real (>5 px) — bloqueia o click filho

    const norm = (v: number, meta: number) => (v >= meta ? v - meta : v < 0 ? v + meta : v);

    const passo = () => {
      const meta = el.scrollWidth / 2;
      if (meta > 0) {
        if (!iniciado) { pos = reverso ? meta : 0; el.scrollLeft = pos; iniciado = true; }
        const ativo = !reduzido && !hover && !arrastando && performance.now() >= cooldownAte;
        if (ativo) {
          pos = norm(pos + (reverso ? -velocidade : velocidade), meta);
          el.scrollLeft = pos;
        } else {
          pos = norm(el.scrollLeft, meta);
        }
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);

    // ——— drag MOUSE: eventos no document para não perder o ponteiro ———
    const onMouseMove = (e: MouseEvent) => {
      if (!arrastando) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) dragged = true;
      el.scrollLeft = startScroll - dx;
    };
    const onMouseUp = () => {
      if (!arrastando) return;
      arrastando = false;
      cooldownAte = performance.now() + 600;
      el.style.cursor = "grab";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      arrastando = true;
      dragged = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.style.cursor = "grabbing";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    // Bloqueia click nos links filhos apenas quando houve arrasto real
    const onClick = (e: MouseEvent) => {
      if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
    };

    // ——— touch: pausa o auto, rolagem nativa do overflow ———
    const onTouchStart = () => { arrastando = true; };
    const onTouchEnd   = () => { arrastando = false; cooldownAte = performance.now() + 900; };

    const enter = () => { hover = true; };
    const leave = () => { hover = false; };

    el.style.cursor = "grab";
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("click", onClick, true); // capture → antes dos links filhos
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd,   { passive: true });
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [direcao, velocidade]);

  return ref;
}
