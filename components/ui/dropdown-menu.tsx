
import * as React from "react"
import { cn } from "../../utils/utils"

interface DropdownMenuProps {
  trigger: React.ReactNode
  // Fix: Made children optional to prevent "missing children" errors in JSX usage
  children?: React.ReactNode
  align?: "left" | "right"
}

export const DropdownMenu = ({ trigger, children, align = "right" }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div 
          className={cn(
            "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-md animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0"
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// Added optional className to fix potential recognition errors in parent components
export const DropdownMenuItem = ({ 
  children, 
  onClick, 
  variant = "default",
  className
}: { 
  children?: React.ReactNode, 
  onClick?: () => void,
  variant?: "default" | "destructive",
  className?: string
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs font-medium outline-none transition-colors",
      variant === "default" 
        ? "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900" 
        : "text-rose-600 hover:bg-rose-50 hover:text-rose-700",
      className
    )}
  >
    {children}
  </button>
)

// Added optional className to fix potential recognition errors in parent components
export const DropdownMenuLabel = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <div className={cn("px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400", className)}>
    {children}
  </div>
)

export const DropdownMenuSeparator = () => (
  <div className="-mx-1 my-1 h-px bg-zinc-100" />
)
