
import * as React from "react"
import { cn } from "../../utils/utils"
import { X } from "../Icons"

interface DrawerProps {
  children?: React.ReactNode
  isOpen: boolean
  onClose: () => void
  direction?: "right" | "bottom"
  title?: string
}

export const Drawer = ({ children, isOpen, onClose, direction = "right", title }: DrawerProps) => {
  if (!isOpen) return null

  const dirClasses = {
    right: "right-0 h-full w-full max-w-md border-l animate-in slide-in-from-right",
    bottom: "bottom-0 w-full h-[80vh] border-t animate-in slide-in-from-bottom"
  }

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("absolute bg-white shadow-2xl flex flex-col", dirClasses[direction])}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-black uppercase tracking-tighter italic">{title || "Details"}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto admin-scroll">
          {children}
        </div>
      </div>
    </div>
  )
}

// Added optional children and className to Drawer sub-component props
export const DrawerHeader = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <div className={cn("px-6 py-4 space-y-1", className)}>{children}</div>
)

// Added className support for DrawerTitle
export const DrawerTitle = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <h3 className={cn("text-xl font-black italic tracking-tighter text-zinc-900 uppercase", className)}>{children}</h3>
)

// Added className support for DrawerDescription
export const DrawerDescription = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <p className={cn("text-xs font-bold text-zinc-400 uppercase tracking-widest", className)}>{children}</p>
)

// Added className support for DrawerFooter to fix "Property 'className' does not exist" errors in usage
export const DrawerFooter = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <div className={cn("p-6 border-t bg-zinc-50/50 flex gap-3 justify-end", className)}>{children}</div>
)

// Added className support for DrawerContent
export const DrawerContent = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <div className={cn("p-6 space-y-6", className)}>{children}</div>
)
