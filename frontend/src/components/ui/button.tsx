import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "cashout" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-br from-[#6DC532] to-[#00D46A] text-[#031A0C] shadow-[0_0_20px_rgba(109,197,50,0.4)]",
  cashout: "bg-gradient-to-br from-[#FFD700] to-[#FF8C00] text-[#1A0A00] shadow-[0_0_24px_rgba(255,215,0,0.45)]",
  ghost: "bg-white/[0.04] text-[#2A4030] border border-white/[0.06]",
};

export function Button({ variant = "primary", className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "w-full py-3.5 rounded font-black text-sm tracking-widest transition-all duration-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
        "flex items-center justify-center gap-2",
        VARIANT_STYLES[variant],
        className,
      )}
      style={{ fontFamily: "'Orbitron', monospace" }}
      {...props}
    >
      {children}
    </button>
  );
}
