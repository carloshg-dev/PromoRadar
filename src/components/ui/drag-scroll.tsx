"use client";
import { useRef, useState, type ReactNode } from "react";

/**
 * DragScroll — wrapper client que habilita arrastar com o mouse (desktop)
 * em qualquer container com overflow-x-auto. No mobile o scroll por toque
 * já funciona nativamente; aqui só adicionamos o drag do mouse.
 */
export function DragScroll({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  return (
    <div
      ref={ref}
      className={className}
      style={{ cursor: dragging ? "grabbing" : "grab", userSelect: "none" }}
      onMouseDown={(e) => {
        if (!ref.current) return;
        setDragging(true);
        startX.current = e.pageX - ref.current.offsetLeft;
        scrollLeft.current = ref.current.scrollLeft;
      }}
      onMouseMove={(e) => {
        if (!dragging || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        ref.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.2;
      }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
    >
      {children}
    </div>
  );
}
