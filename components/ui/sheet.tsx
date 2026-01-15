
import * as React from "react"
import { cn } from "../../utils/utils"
import { X } from "../Icons"

const SheetContext = React.createContext<{ open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> } | undefined>(undefined)

const useSheet = () => {
    const context = React.useContext(SheetContext)
    if (!context) throw new Error("useSheet must be used within a Sheet")
    return context
}

const Sheet = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false)
    return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>
}

const SheetTrigger = ({ children, className, asChild }: { children: React.ReactNode; className?: string; asChild?: boolean }) => {
    const { setOpen } = useSheet()

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                const childProps = (children as React.ReactElement<any>).props;
                childProps.onClick?.(e);
                setOpen(true);
            },
            className: cn("cursor-pointer", className, (children as React.ReactElement<any>).props.className)
        });
    }

    return <div onClick={() => setOpen(true)} className={cn("cursor-pointer", className)}>{children}</div>
}

const SheetContent = ({ children, side = "right", className }: { children: React.ReactNode; side?: "left" | "right" | "top" | "bottom"; className?: string }) => {
    const { open, setOpen } = useSheet()

    if (!open) return null

    const sideClasses = {
        right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=open]:slide-in-from-right sm:max-w-sm",
        left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=open]:slide-in-from-left sm:max-w-sm",
        top: "inset-x-0 top-0 border-b data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=open]:slide-in-from-bottom",
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-all duration-100 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" onClick={() => setOpen(false)} />
            <div className={cn("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out duration-300", sideClasses[side], className)}>
                <button
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
                {children}
            </div>
        </div>
    )
}

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
SheetDescription.displayName = "SheetDescription"

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription }
