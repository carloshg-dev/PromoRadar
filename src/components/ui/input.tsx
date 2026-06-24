import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-line bg-bg-soft px-3.5 text-sm text-zinc-100 placeholder:text-muted",
        "outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
