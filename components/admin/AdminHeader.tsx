
import React, { useState, useRef, useEffect } from 'react';
import { User, AdminView } from '../../types';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { SidebarTrigger } from '../ui/sidebar';
import { SearchIcon, UserIcon, Bell } from '../Icons';
import { cn } from '../../utils/utils';

interface AdminHeaderProps {
  user: User;
  logout: () => void;
  openGlobalSearch: () => void;
  currentView: AdminView;
  setCurrentView: (view: any) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ user, logout, openGlobalSearch, currentView, setCurrentView }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white transition-[width,height] ease-linear sticky top-0 z-30 px-4 md:px-6">
            <div className="flex w-full items-center gap-2">
                <SidebarTrigger className="-ml-1 text-zinc-500 hover:bg-zinc-100" />
                
                <Separator
                    orientation="vertical"
                    className="mx-2 h-4 bg-zinc-200"
                />
                
                <h1 className="text-sm font-black uppercase tracking-tighter italic text-zinc-900 truncate max-w-[120px] md:max-w-none">
                    {getPageTitle(currentView)}
                </h1>

                <div className="ml-auto flex items-center gap-2">
                    {/* Command Search Button - Shadcn Style */}
                    <button 
                        onClick={openGlobalSearch}
                        className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-all group"
                    >
                        <SearchIcon className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Search...</span>
                        <kbd className="pointer-events-none hidden h-4 select-none items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 font-mono text-[9px] font-medium opacity-100 sm:flex">
                            <span className="text-[10px]">⌘</span>K
                        </kbd>
                    </button>

                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500">
                        <Bell className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="mx-1 h-4" />

                    <div className="relative" ref={profileRef}>
                        <button 
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="h-8 w-8 rounded-full border border-zinc-200 bg-zinc-100 flex items-center justify-center text-[11px] font-black text-zinc-600 hover:border-zinc-400 transition-all uppercase italic"
                        >
                            {user.name.substring(0, 1)}
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-3 w-56 rounded-xl border border-zinc-200 bg-white shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                                <div className="px-3 py-2 border-b border-zinc-50 mb-1">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Signed in as</p>
                                    <p className="text-xs font-black text-zinc-900 truncate italic">{user.name}</p>
                                </div>
                                <button className="w-full text-left px-3 py-2 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 rounded-lg" onClick={() => { setCurrentView('admin-profile'); setIsProfileOpen(false); }}>Profile Settings</button>
                                <button className="w-full text-left px-3 py-2 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 rounded-lg" onClick={() => { setCurrentView('settings'); setIsProfileOpen(false); }}>System Config</button>
                                <div className="h-px bg-zinc-100 my-1" />
                                <button className="w-full text-left px-3 py-2 text-[11px] font-black text-rose-600 hover:bg-rose-50 rounded-lg" onClick={logout}>Sign Out</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
