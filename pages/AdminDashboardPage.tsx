
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useLocation } = ReactRouterDom as any;
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import DashboardOverview from '../components/admin/Dashboard';
import ProductList from '../components/admin/ProductList';
import OrderList from '../components/admin/OrderList';
import AbandonedLeads from '../components/admin/AbandonedLeads';
import Analytics from '../components/admin/Analytics';
import Customers from '../components/admin/Customers';
import Marketing from '../components/admin/Marketing';
import Discounts from '../components/admin/Discounts';
import Settings from '../components/admin/Settings';
import CMSManagement from '../components/admin/CMSManagement';
import ContactSubmissions from '../components/admin/ContactSubmissions';
import AdminProfile from '../components/admin/AdminProfile';
import ShippingIntegrations from '../components/admin/ShippingIntegrations';
import GlobalSearch from '../components/admin/GlobalSearch';
import CreateOrder from '../components/admin/CreateOrder';
import CollectionSettings from '../components/admin/CollectionSettings';
import VideoSettings from '../components/admin/VideoSettings';
import MediaLibrary from '../components/admin/MediaLibrary';
import GeneralSettings from '../components/admin/GeneralSettings';
import { User } from '../types';
import { useSiteData } from '../contexts/SiteDataContext';

type AdminView = 'dashboard' | 'analytics' | 'products' | 'inventory' | 'categories' | 'orders' | 'abandoned-checkouts' | 'create-order' | 'customers' | 'marketing' | 'discounts' | 'settings' | 'cms' | 'shop-videos' | 'slider' | 'media' | 'blogs' | 'pages' | 'contact-messages' | 'admin-profile' | 'shipping-integrations' | 'magic-setup';

const AdminDashboardPage: React.FC<{ user: User; logout: () => void }> = ({ user: initialUser, logout }) => {
    const location = useLocation();
    const [currentView, setCurrentView] = useState<AdminView>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    const [user, setUser] = useState<User>(initialUser);
    const { products } = useSiteData();
    const token = localStorage.getItem('token');

    // Sync view with path on load
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/magic/settings/checkout-setup')) setCurrentView('magic-setup');
        else if (path.includes('/magic/abandoned')) setCurrentView('abandoned-checkouts');
        else if (path.includes('/products')) setCurrentView('products');
        else if (path.includes('/orders/new')) setCurrentView('create-order');
        else if (path.includes('/orders')) setCurrentView('orders');
        else if (path.includes('/analytics')) setCurrentView('analytics');
        else if (path.includes('/customers')) setCurrentView('customers');
        else if (path.includes('/shipping')) setCurrentView('shipping-integrations');
        else if (path.includes('/settings')) setCurrentView('settings');
        else if (path.includes('/content/banners')) setCurrentView('slider');
        else if (path.includes('/content/blogs')) setCurrentView('blogs');
        else if (path.includes('/content/pages')) setCurrentView('pages');
        else if (path.includes('/content/media')) setCurrentView('media');
        else setCurrentView('dashboard');
    }, [location.pathname]);

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardOverview token={token} />;
            case 'analytics': return <Analytics token={token} />;
            case 'products': return <ProductList token={token} />;
            case 'categories': return <CollectionSettings token={token} />;
            case 'shop-videos': return <VideoSettings token={token} />;
            case 'orders': return <OrderList token={token} />;
            case 'abandoned-checkouts': return <AbandonedLeads token={token} />;
            case 'magic-setup': return <GeneralSettings token={token} />; // Magic checkout setup lives here
            case 'create-order': return <CreateOrder token={token} onOrderCreated={() => setCurrentView('orders')} />;
            case 'customers': return <Customers token={token} />;
            case 'marketing': return <Marketing token={token} />;
            case 'discounts': return <Discounts token={token} />;
            case 'settings': return <Settings token={token} />;
            case 'cms': return <CMSManagement token={token} />;
            case 'slider': return <CMSManagement token={token} initialTab="slider" />;
            case 'blogs': return <CMSManagement token={token} initialTab="blogs" />;
            case 'pages': return <CMSManagement token={token} initialTab="pages" />;
            case 'media': return <MediaLibrary token={token} />;
            case 'contact-messages': return <ContactSubmissions token={token} />;
            case 'admin-profile': return <AdminProfile user={user} token={token} onUpdateUser={setUser} />;
            case 'shipping-integrations': return <ShippingIntegrations token={token} />;
            default: return <DashboardOverview token={token} />;
        }
    };

    return (
        <div className="flex h-screen bg-[#FBF9F1] overflow-hidden">
            <AdminSidebar 
                user={user}
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminHeader 
                    user={user} 
                    logout={logout} 
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                    openGlobalSearch={() => setIsGlobalSearchOpen(true)}
                    setCurrentView={setCurrentView}
                />
                <main className="flex-1 overflow-y-auto p-6 md:p-10 admin-scroll">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <span>Indoshopsee</span>
                            <span>/</span>
                            <span className="text-brand-accent">{currentView.replace('-', ' ')}</span>
                        </div>
                        {renderContent()}
                    </div>
                </main>
            </div>

            <GlobalSearch 
                isOpen={isGlobalSearchOpen} 
                onClose={() => setIsGlobalSearchOpen(false)}
                products={products}
                orders={[]} 
                customers={[]}
                setCurrentView={setCurrentView}
            />
        </div>
    );
};

export default AdminDashboardPage;
