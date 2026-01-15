
import * as React from "react"
import { cn } from "../../utils/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  // Fixed: Explicitly marked optional and ensured alignment with React.FC attributes
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "premium";
  children?: React.ReactNode;
}

// Fixed: Explicitly typed as React.FC to inherit Attributes like 'key' correctly
const Badge: React.FC<BadgeProps> = ({ className, variant = "default", ...props }) => {
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    premium: "border-transparent bg-zinc-900 text-white font-black uppercase tracking-tighter italic",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClasses[variant || "default"],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
