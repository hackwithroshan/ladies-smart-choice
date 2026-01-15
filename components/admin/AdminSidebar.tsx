
import React, { useState } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import {
    LayoutDashboard, Activity, ShoppingCart, Package, Users,
    LayoutTemplate, Settings, Video, Image, FileText,
    Truck, CreditCard, BadgePercent, ChevronDown, ChevronRight,
    StarIcon, SearchIcon, Megaphone, Smartphone, Wand2
} from '../Icons';
import { User, AdminView } from '../../types';
import {
    Sidebar, SidebarContent, SidebarHeader, SidebarMenu,
    SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel
} from '../ui/sidebar';
import { cn } from '../../utils/utils';

interface AdminSidebarProps {
    user: User;
    currentView: AdminView;
    setCurrentView: (view: AdminView) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, setCurrentView, user }) => {
    const navigate = useNavigate();
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
        'products': true,
        'orders': true,
        'content': false,
        'store-builder': true
    });

    const toggleSubmenu = (key: string) => {
        setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const NavItem = ({ icon: Icon, label, view, path, isSubItem = false }: any) => {
        const isActive = currentView === view;
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => {
                        if (path === '/app/products/design') {
                            window.open(path, '_blank');
                            return;
                        }
                        setCurrentView(view);
                        navigate(path);
                    }}
                    className={cn(
                        "relative overflow-hidden font-semibold text-[13px] tracking-tight transition-all rounded-lg",
                        isActive
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-100 shadow-sm"
                            : "text-muted-foreground hover:bg-muted/70",
                        isSubItem ? "pl-9 h-8 text-[12px]" : "h-9"
                    )}
                >
                    {!isSubItem && <Icon className="size-4" />}
                    <span>{label}</span>
                    {isActive && <span className="absolute inset-y-1 left-1 w-1 rounded-full bg-emerald-500" />}
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    };

    const SubMenuTrigger = ({ icon: Icon, label, subKey, view, path }: any) => {
        const isOpen = openSubmenus[subKey];
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    isActive={currentView === view}
                    onClick={() => {
                        toggleSubmenu(subKey);
                        if (path && view) {
                            setCurrentView(view);
                            navigate(path);
                        }
                    }}
                    className={cn(
                        "font-semibold text-[13px] tracking-tight h-9 rounded-lg",
                        isOpen ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:bg-muted/70",
                        currentView === view && "bg-emerald-50 text-emerald-900 border border-emerald-100"
                    )}
                >
                    <Icon className="size-4" />
                    <span className="flex-1">{label}</span>
                    <ChevronDown className={cn("size-3 transition-transform", !isOpen && "-rotate-90")} />
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    };

    return (
        <Sidebar className="border-r border-border/70 bg-white/90 backdrop-blur shadow-sm">
            <SidebarHeader className="h-16 border-b border-border/60 px-6 flex flex-row items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-black italic text-xs shadow-sm">
                    A
                </div>
                <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase tracking-tight text-foreground leading-none">
                        Admin Dashboard
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 border border-emerald-100">
                        Live
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="admin-scroll py-4">
                <SidebarGroup className="px-3 space-y-3">
                    <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground px-2">
                        Main
                    </SidebarGroupLabel>
                    <SidebarMenu className="space-y-0.5">
                        <NavItem icon={LayoutDashboard} label="Dashboard" view="dashboard" path="/app/dashboard" />
                        <NavItem icon={Activity} label="Analytics" view="analytics" path="/app/analytics" />
                        <SubMenuTrigger icon={ShoppingCart} label="Orders" subKey="orders" view="orders" path="/app/orders" />
                        {openSubmenus['orders'] && (
                            <div className="space-y-0.5 mb-2">
                                <NavItem label="Orders" view="orders" path="/app/orders" isSubItem />
                                <NavItem label="Drafts" view="drafts" path="/app/orders/drafts" isSubItem />
                                <NavItem label="Abandoned checkouts" view="abandoned-checkouts" path="/app/orders/abandoned-checkouts" isSubItem />
                            </div>
                        )}

                        {/* PRODUCTS SUBMENU */}
                        <SubMenuTrigger icon={Package} label="Products" subKey="products" view="products" path="/app/products" />
                        {openSubmenus['products'] && (
                            <div className="space-y-0.5 mb-2">
                                <NavItem label="All Products" view="products" path="/app/products" isSubItem />
                                <NavItem label="Collections" view="categories" path="/app/categories" isSubItem />
                                <NavItem label="Inventory" view="inventory" path="/app/products/inventory" isSubItem />
                                <NavItem label="Discounts" view="discounts" path="/app/discounts" isSubItem />
                                <NavItem label="Reviews" view="reviews" path="/app/reviews" isSubItem />
                            </div>
                        )}

                        <NavItem icon={Users} label="Customers" view="customers" path="/app/customers" />

                        {/* CONTENT SUBMENU */}
                        <SubMenuTrigger icon={LayoutTemplate} label="Content" subKey="content" view="header-settings" path="/app/content/header" />
                        {openSubmenus['content'] && (
                            <div className="space-y-0.5 mb-2">
                                <NavItem label="Header / Menu" view="header-settings" path="/app/content/header" isSubItem />
                                <NavItem label="Footer" view="footer" path="/app/content/footer" isSubItem />
                                <NavItem label="Popup / Modal" view="popup-settings" path="/app/content/popup" isSubItem />
                                <NavItem label="Media Library" view="media" path="/app/content/media" isSubItem />
                            </div>
                        )}

                        {/* STORE BUILDER SUBMENU */}
                        <SubMenuTrigger icon={Wand2} label="Store Builder" subKey="store-builder" view="cms" path="/app/content/builder" />
                        {openSubmenus['store-builder'] && (
                            <div className="space-y-0.5 mb-2">
                                <NavItem label="Home Page Builder" view="cms" path="/app/content/builder" isSubItem />
                                {/* Level 3 Nested Visual Simulation */}
                                <NavItem label="• Home Page SEO" view="homepage-seo" path="/app/content/homepage-seo" isSubItem />
                                <NavItem label="• Shop Videos" view="shop-videos" path="/app/content/videos" isSubItem />

                                <NavItem label="Product Designer" view="pdp-builder" path="/app/products/design" isSubItem />
                            </div>
                        )}

                        <NavItem icon={Megaphone} label="Facebook & Instagram" view="marketing" path="/app/marketing" />
                        <NavItem icon={SearchIcon} label="Google Ads" view="marketing" path="/app/marketing" />
                        <NavItem icon={Settings} label="Settings" view="settings" path="/app/settings" />
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <div className="mt-auto p-4 border-t border-border/60 bg-muted/40">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center text-[11px] font-black uppercase">
                        {user.name.substring(0, 1)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">{user.name}</span>
                        <span className="text-[10px] font-medium text-muted-foreground truncate">{user.role}</span>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
};

export default AdminSidebar;
