import * as React from "react"
import { cn } from "../../utils/utils"

interface TabsContextProps {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextProps | undefined>(undefined)

export const Tabs = ({ value, onValueChange, children, className }: any) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabsList = ({ className, children }: any) => {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 p-1 text-zinc-500", className)}>
      {children}
    </div>
  )
}

export const TabsTrigger = ({ value, className, children }: any) => {
  const context = React.useContext(TabsContext)
  const isActive = context?.value === value

  return (
    <button
      onClick={() => context?.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-white text-zinc-950 shadow-sm" : "hover:text-zinc-700",
        className
      )}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ value, className, children }: any) => {
  const context = React.useContext(TabsContext)
  if (context?.value !== value) return null

  return (
    <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950", className)}>
      {children}
    </div>
  )
}