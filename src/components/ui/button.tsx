import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[.98] whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-2 shadow-[0_0_0_1px_rgba(99,102,241,.4),0_8px_24px_-8px_rgba(99,102,241,.5)]",
        ghost: "text-zinc-200 hover:bg-bg-soft",
        outline: "border border-line text-zinc-200 hover:bg-bg-soft hover:border-brand/40",
        subtle: "bg-bg-soft text-zinc-200 hover:bg-line",
        danger: "bg-danger/90 text-white hover:bg-danger",
      },
      size: { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base", icon: "h-9 w-9" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
