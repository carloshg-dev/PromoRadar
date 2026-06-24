import { cn } from "@/lib/utils";

export function Tooltip({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-bg-card px-2.5 py-1.5 text-xs text-zinc-200 opacity-0 shadow-xl transition-opacity group-hover/tt:opacity-100">
        {label}
      </span>
    </span>
  );
}
