
import * as React from "react"

/**
 * Local SVG definition for PanelLeft to remove external dependency
 */
const PanelLeft = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
)

/**
 * Optimized Slot implementation to reduce Radix dependency
 */
const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { asChild?: boolean }>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        // Fix: Cast children.props to any to avoid "Spread types may only be created from object types" error
        ...(children as any).props,
        ref: (children as any).ref || ref,
      } as any)
    }
    return null
  }
)
Slot.displayName = "Slot"

/**
 * Lightweight class merger utility
 */
function cn(...inputs: (string | boolean | undefined | null | {[key: string]: boolean})[]) {
  const classes: string[] = []
  inputs.forEach(input => {
    if (!input) return
    if (typeof input === 'string') classes.push(input)
    else if (typeof input === 'object') {
      Object.entries(input).forEach(([key, val]) => {
        if (val) classes.push(key)
      })
    }
  })
  return classes.join(' ')
}

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = React.useState(false)
    const [openMobile, setOpenMobile] = React.useState(false)

    React.useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768)
      checkMobile()
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((prev) => !prev)
        : setOpen((prev) => !prev)
    }, [isMobile, setOpen, setOpenMobile])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn("group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-background", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn("flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <div 
          className={cn("fixed inset-0 z-[100] flex", openMobile ? "visible" : "invisible", "lg:hidden")}
        >
          <div 
            className={cn("absolute inset-0 bg-black/50 transition-opacity duration-300", openMobile ? "opacity-100" : "opacity-0")}
            onClick={() => setOpenMobile(false)}
          />
          <div 
            className={cn("relative flex h-full w-[--sidebar-width-mobile] flex-col bg-white text-zinc-900 transition-transform duration-300", openMobile ? "translate-x-0" : "-translate-x-full")}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        <div
          className="duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-in-out group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[variant=floating]:w-[calc(var(--sidebar-width)+1rem)] group-data-[variant=inset]:w-[--sidebar-width]"
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-in-out md:flex group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[variant=floating]:m-2 group-data-[variant=floating]:h-[calc(100svh-1rem)] group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-zinc-200 group-data-[variant=floating]:shadow bg-white",
            side === "left" ? "left-0 group-data-[side=left]:border-r" : "right-0 group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-white group-data-[variant=floating]:rounded-lg"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="trigger"
      className={cn("h-9 w-9 rounded-md p-1 hover:bg-zinc-100 transition-colors flex items-center justify-center", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn("relative flex min-h-svh flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow", className)}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 h-px bg-zinc-200", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto admin-scroll", className)}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn("duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-zinc-500 outline-none transition-[margin,opacity] ease-linear group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:opacity-0", className)}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    variant?: "default" | "outline"
    size?: "default" | "sm" | "lg"
    tooltip?: string | React.ComponentProps<"div">
  }
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const sizeClasses = {
      default: "h-8",
      sm: "h-7 text-xs",
      lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0"
    }

    const variantClasses = {
      default: "hover:bg-zinc-100 hover:text-zinc-900",
      outline: "bg-white shadow-[0_0_0_1px_#e4e4e7] hover:bg-zinc-100 hover:text-zinc-900"
    }

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(
          "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] focus-visible:ring-2 active:bg-zinc-100 active:text-zinc-900 disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:bg-zinc-100 data-[active=true]:font-medium data-[active=true]:text-zinc-950 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span]:last:truncate [&>svg]:size-4 [&>svg]:shrink-0",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    return (
      <div className="relative group/tooltip">
        {button}
        {state === "collapsed" && !isMobile && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-[110]">
            {typeof tooltip === "string" ? tooltip : (tooltip as any).children}
          </div>
        )}
      </div>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
