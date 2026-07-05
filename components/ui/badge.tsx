import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

const variants: Record<string, string> = {
  default:     "bg-blue-100 text-blue-700 border-blue-200",
  secondary:   "bg-slate-100 text-slate-600 border-slate-200",
  success:     "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning:     "bg-amber-100 text-amber-700 border-amber-200",
  destructive: "bg-red-100 text-red-600 border-red-200",
  outline:     "bg-transparent text-slate-600 border-slate-300",
};

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
