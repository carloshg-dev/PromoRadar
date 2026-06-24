import { cn } from "@/lib/utils";

export function EmptyState({ icon, title, hint, action, className }:
  { icon: React.ReactNode; title: string; hint?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card-grad flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-14 text-center", className)}>
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-bg-soft text-2xl">{icon}</div>
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-xs text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
