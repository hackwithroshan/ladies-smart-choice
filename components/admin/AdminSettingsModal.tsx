
import React, { useState } from 'react';
import { 
    Search, X, CreditCard, Truck, 
    Palette, Bell, Smartphone, UserIcon as User, Store
} from '../Icons';
import BrandingSettings from './BrandingSettings';
import GeneralSettings from './GeneralSettings';
import ShippingSettings from './ShippingSettings';
import TaxSettings from './TaxSettings';
import { useSiteData } from '../../contexts/SiteDataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../utils/utils';

interface AdminSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string | null;
}

type SettingTab = 'rebranding' | 'payments' | 'shipping-taxes' | 'users' | 'checkout' | 'notifications';

const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ isOpen, onClose, token }) => {
    const [activeTab, setActiveTab] = useState<SettingTab>('rebranding');
    const [searchQuery, setSearchQuery] = useState('');
    const { siteSettings } = useSiteData();

    if (!isOpen) return null;

    const navItems = [
        { id: 'rebranding', label: 'Rebranding', icon: Palette },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'shipping-taxes', label: 'Shipping and Taxes', icon: Truck },
        { id: 'checkout', label: 'Checkout', icon: Smartphone },
        { id: 'users', label: 'Users and Permissions', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    const filteredNav = navItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const NavButton = ({ item }: { item: typeof navItems[0] }) => (
        <button
            onClick={() => setActiveTab(item.id as SettingTab)}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === item.id 
                ? "bg-zinc-100 text-zinc-900 shadow-sm" 
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            )}
        >
            <item.icon className={cn("size-4", activeTab === item.id ? "text-zinc-900" : "text-zinc-400")} />
            {item.label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-zinc-900 rounded flex items-center justify-center text-[10px] font-bold text-white italic">A</div>
                    <span className="text-sm font-bold text-zinc-900">Settings</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-100">
                    <X className="size-5 text-zinc-500" />
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-72 border-r bg-[#fbfbfb] flex flex-col shrink-0">
                    <div className="p-4 space-y-4">
                        {/* Store Info Mini Card */}
                        <div className="flex items-center gap-3 px-2 py-1">
                            <div className="h-10 w-10 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shrink-0 uppercase">
                                {siteSettings?.storeName?.substring(0, 2) || 'HS'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-zinc-900 truncate leading-none">
                                    {siteSettings?.storeName || 'House of Archana Sankar'}
                                </p>
                                <p className="text-[11px] text-zinc-500 mt-1 truncate">
                                    {window.location.hostname}
                                </p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                            <Input 
                                placeholder="Search settings" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 bg-white border-zinc-200 focus-visible:ring-zinc-900"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1 admin-scroll">
                        {filteredNav.map(item => (
                            // Fix: Wrapped in Fragment to handle key prop correctly on local component
                            <React.Fragment key={item.id}>
                                <NavButton item={item} />
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-[#f1f1f1] overflow-y-auto admin-scroll">
                    <div className="max-w-4xl mx-auto py-10 px-6">
                        <div className="flex items-center gap-3 mb-8">
                            {(() => {
                                const active = navItems.find(i => i.id === activeTab);
                                if (!active) return null;
                                return (
                                    <>
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-200">
                                            <active.icon className="size-5 text-zinc-900" />
                                        </div>
                                        <h1 className="text-2xl font-bold text-zinc-900">{active.label}</h1>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {activeTab === 'rebranding' && <BrandingSettings token={token} />}
                            {activeTab === 'payments' && <GeneralSettings token={token} />} 
                            {activeTab === 'shipping-taxes' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <h3 className="text-lg font-bold mb-4">Shipping Rates</h3>
                                        <ShippingSettings token={token} />
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <h3 className="text-lg font-bold mb-4">Tax Configuration</h3>
                                        <TaxSettings token={token} />
                                    </div>
                                </div>
                            )}
                            {['checkout', 'users', 'notifications'].includes(activeTab) && (
                                <div className="bg-white rounded-xl shadow-sm border p-20 text-center">
                                    <div className="mx-auto w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mb-4 border-2 border-dashed">
                                        <Store className="size-6" />
                                    </div>
                                    <p className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Section Coming Soon</p>
                                    <p className="text-xs text-zinc-400 mt-2">We are migrating this module to the new settings engine.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsModal;
