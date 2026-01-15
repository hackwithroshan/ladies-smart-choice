
import * as React from "react"
import { cn } from "../../utils/utils"
import { ChevronDown } from "../Icons"

interface SelectContextType {
  value: string
  onValueChange: (v: string) => void
  open: boolean
  setOpen: (v: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

// Added optional children to Select props
export const Select = ({ value, onValueChange, children }: { value: string, onValueChange: (v: string) => void, children?: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  )
}

// Added optional children to SelectTrigger props
export const SelectTrigger = ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
  const context = React.useContext(SelectContext)
  return (
    <button
      onClick={() => context?.setOpen(!context.open)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const context = React.useContext(SelectContext)
  return <span>{context?.value || placeholder}</span>
}

// Added optional children to SelectContent props
export const SelectContent = ({ className, children }: { className?: string, children?: React.ReactNode }) => {
  const context = React.useContext(SelectContext)
  if (!context?.open) return null

  return <div className={cn("mt-1 absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-zinc-950 shadow-md animate-in fade-in zoom-in-95", className)}>{children}</div>
}

// Added optional children to SelectItem props
export const SelectItem = ({ value, children, className }: { value: string, children?: React.ReactNode, className?: string }) => {
  const context = React.useContext(SelectContext)
  return (
    <button
      onClick={() => {
        context?.onValueChange(value)
        context?.setOpen(false)
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      {children}
    </button>
  )
}
