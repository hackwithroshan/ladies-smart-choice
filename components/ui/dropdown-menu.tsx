
import * as React from "react"
import { cn } from "../../utils/utils"

interface DropdownMenuContextType {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined)

const useDropdownMenu = () => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) {
        throw new Error("useDropdownMenu must be used within a DropdownMenu")
    }
    return context
}

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block text-left" ref={ref}>
                {children}
            </div>
        </DropdownMenuContext.Provider>
    )
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
    ({ className, children, asChild, ...props }, ref) => {
        const { open, setOpen } = useDropdownMenu()

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            props.onClick?.(e);
            if (!e.defaultPrevented) {
                setOpen(!open);
            }
        }

        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children as React.ReactElement<any>, {
                ref: (children as any).ref || ref,
                onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                    const childProps = (children as React.ReactElement<any>).props;
                    childProps.onClick?.(e);
                    handleClick(e);
                },
                className: cn("outline-none", className, (children as React.ReactElement<any>).props.className),
                ...props
            })
        }

        return (
            <button
                ref={ref}
                onClick={handleClick}
                className={cn("outline-none", className)}
                {...props}
            >
                {children}
            </button>
        )
    }
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: "start" | "end" | "center"
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
    ({ className, children, align = "end", ...props }, ref) => {
        const { open } = useDropdownMenu()

        if (!open) return null

        return (
            <div
                ref={ref}
                className={cn(
                    "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    align === "end" ? "right-0" : "left-0",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("px-2 py-1.5 text-sm font-semibold", className)}
            {...props}
        />
    )
)
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("-mx-1 my-1 h-px bg-muted", className)}
            {...props}
        />
    )
)
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
}
