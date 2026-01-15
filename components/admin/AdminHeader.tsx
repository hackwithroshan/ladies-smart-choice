
import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/apiHelper';
import { User, AdminView } from '../../types';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { SidebarTrigger } from '../ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from "../ui/dropdown-menu";
import { SearchIcon, UserIcon, Bell } from '../Icons';
import { cn } from '../../utils/utils';

interface AdminHeaderProps {
    user: User;
    logout: () => void;
    openGlobalSearch: () => void;
    currentView: AdminView;
    setCurrentView: (view: any) => void;
    token: string | null;
}

interface Notification {
    _id: string;
    message: string;
    read: boolean;
    createdAt: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ user, logout, openGlobalSearch, currentView, setCurrentView, token }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    useEffect(() => {
        if (!token) return;
        const fetchNotifications = async () => {
            setLoadingNotifications(true);
            try {
                const res = await fetch(getApiUrl('/api/notifications'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                    setUnreadCount(data.filter((n: any) => !n.read).length);
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            } finally {
                setLoadingNotifications(false);
            }
        };

        fetchNotifications();
        // Refresh every minute to keep updated
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [token]);

    const markAllRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!token) return;
        try {
            const res = await fetch(getApiUrl('/api/notifications/mark-read'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark notifications read', error);
        }
    };
    // Format current view to a readable title
    const getPageTitle = (view: AdminView) => {
        const titles: Record<string, string> = {
            'dashboard': 'Control Panel',
            'analytics': 'Market Intelligence',
            'products': 'Product Catalog',
            'pdp-builder': 'Visual Designer',
            'orders': 'Order Manifests',
            'customers': 'Customer Directory',
            'marketing': 'Growth Campaigns',
            'settings': 'System Settings',
            'shipping-integrations': 'Logistics Hub',
            'cms': 'Content Builder',
            'blogs': 'Blog Editor'
        };
        return titles[view] || view.charAt(0).toUpperCase() + view.slice(1).replace('-', ' ');
    };

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 px-4 md:px-6">
            <div className="flex w-full items-center gap-2">
                <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground hover:bg-muted/50" />

                <Separator
                    orientation="vertical"
                    className="mx-2 h-4 sm:h-5 sm:mx-4"
                />

                <div className="flex flex-col gap-0.5">
                    {/* <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none hidden sm:block">Admin</span> */}
                    {/* <h1 className="text-sm sm:text-lg font-black uppercase tracking-tighter italic text-foreground truncate leading-none">
                        {getPageTitle(currentView)}
                    </h1> */}
                </div>

                <div className="ml-auto flex items-center gap-2 sm:gap-4">
                    {/* Global Command Search */}
                    <button
                        onClick={openGlobalSearch}
                        className="hidden md:flex items-center gap-3 h-9 px-4 rounded-full border border-input bg-background hover:bg-accent/50 hover:text-accent-foreground transition-all shadow-sm group w-64"
                    >
                        <SearchIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Search platform...</span>
                        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </button>
                    <button onClick={openGlobalSearch} className="md:hidden p-2 rounded-full hover:bg-muted text-muted-foreground">
                        <SearchIcon className="h-5 w-5" />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger className="h-9 w-9 rounded-full relative inline-flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && <span className="absolute top-2 right-2.5 h-2 w-2 bg-rose-500 rounded-full animate-pulse"></span>}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex justify-between items-center">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground">
                                        Mark all read
                                    </Button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto">
                                {loadingNotifications ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div key={notification._id} className={cn("flex flex-col items-start p-3 gap-1 border-b last:border-0 hover:bg-muted/50 transition-colors", !notification.read && "bg-muted/30")}>
                                            <p className={cn("text-sm leading-none", !notification.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground")}>
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="h-8 w-px bg-border hidden sm:block mx-1"></div>

                    {/* Profile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="relative h-9 w-9 rounded-full border border-input bg-background p-0 hover:bg-accent hover:text-accent-foreground flex items-center justify-center focus-visible:outline-none transition-colors">
                            <span className="text-xs font-black italic">{user.name?.[0]}</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1">
                            <div className="flex items-center justify-start gap-2 p-2">
                                <div className="flex flex-col space-y-0.5 leading-none">
                                    <p className="font-bold text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setCurrentView('admin-profile')} className="cursor-pointer font-medium">
                                Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCurrentView('settings')} className="cursor-pointer font-medium">
                                System Preferences
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-bold">
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
