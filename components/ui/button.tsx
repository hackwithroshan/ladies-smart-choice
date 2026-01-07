import * as React from "react"
import { cn } from "../../utils/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null
  size?: "default" | "sm" | "lg" | "icon" | null
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-[#16423C] text-white hover:bg-[#16423C]/90 shadow",
      destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
      outline: "border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-sm",
      ghost: "hover:bg-zinc-100 text-zinc-900",
      link: "text-[#16423C] underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }

    const variantClass = variants[variant || "default"]
    const sizeClass = sizes[size || "default"]

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50",
          variantClass,
          sizeClass,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }