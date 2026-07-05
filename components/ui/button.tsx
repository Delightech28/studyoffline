import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<string, string> = {
  default:     "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",
  ghost:       "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  outline:     "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<string, string> = {
  sm:   "text-xs px-3 py-1.5 h-8",
  md:   "text-sm px-4 py-2 h-9",
  lg:   "text-base px-6 py-3 h-11",
  icon: "h-9 w-9",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className = "", children, ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";
