
import * as React from "react"
import { X } from "../Icons"
import { cn } from "../../utils/utils"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  description?: string
}

const Dialog = ({ isOpen, onClose, children, title, description }: DialogProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="space-y-1">
            {title && <h2 className="text-lg font-bold text-zinc-900">{title}</h2>}
            {description && <p className="text-xs text-zinc-500">{description}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X className="size-4 text-zinc-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t",
      className
    )}
    {...props}
  />
)

export { Dialog, DialogFooter }
