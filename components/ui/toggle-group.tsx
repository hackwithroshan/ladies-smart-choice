
import * as React from "react"
import { cn } from "../../utils/utils"

const ToggleGroupContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

// Added optional children to ToggleGroup props to satisfy compiler during JSX processing
export const ToggleGroup = ({ 
  children, 
  value, 
  onValueChange, 
  className 
}: { 
  children?: React.ReactNode, 
  value: string, 
  onValueChange: (v: string) => void,
  className?: string,
  type?: "single",
  variant?: "outline" | "default"
}) => {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("flex items-center gap-1", className)}>
        {children}
      </div>
    </ToggleGroupContext.Provider>
  )
}

// Added optional children to ToggleGroupItem props
export const ToggleGroupItem = ({ 
  value, 
  children, 
  className 
}: { 
  value: string, 
  children?: React.ReactNode,
  className?: string
}) => {
  const context = React.useContext(ToggleGroupContext)
  if (!context) return null

  const isActive = context.value === value

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-bold transition-all",
        isActive 
          ? "bg-zinc-800 text-white shadow-sm border border-zinc-700" 
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent",
        className
      )}
    >
      {children}
    </button>
  )
}
