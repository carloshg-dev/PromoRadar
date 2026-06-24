import { cn } from "@/lib/utils";
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn("inline-flex h-5 min-w-[20px] items-center justify-center rounded-md border border-line bg-bg-soft px-1.5 font-sans text-[10px] font-medium text-muted", className)}>
      {children}
    </kbd>
  );
}
