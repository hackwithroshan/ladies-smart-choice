import * as React from "react"
import { cn } from "../../utils/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | null
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
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