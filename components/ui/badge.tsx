
import * as React from "react"
import { cn } from "../../utils/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  // Explicitly add className to resolve TypeScript errors where it is reported missing from BadgeProps
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | null
}

// Fixed: Changed from a plain function to React.FC to properly support standard props like 'key' and 'className'
// and to ensure the TypeScript compiler correctly identifies it as a functional component.
const Badge: React.FC<BadgeProps> = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "border-transparent bg-[#16423C] text-white hover:bg-[#16423C]/80",
    secondary: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
    outline: "text-zinc-950 border border-zinc-200",
  }

  const variantClass = variants[variant || "default"]

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2",
        variantClass,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
