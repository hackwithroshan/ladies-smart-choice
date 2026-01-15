
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useLocation, useSearchParams } = ReactRouterDom as any;
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import DashboardOverview from '../components/admin/Dashboard';
import ProductList from '../components/admin/ProductList';
import OrderList from '../components/admin/OrderList';
import AbandonedLeads from '../components/admin/AbandonedLeads';
import Analytics from '../components/admin/Analytics';
import Customers from '../components/admin/Customers';
import TrackingSettings from '../components/admin/TrackingSettings';
import Discounts from '../components/admin/Discounts';
import Inventory from '../components/admin/Inventory';
import CMSManagement from '../components/admin/CMSManagement';
import ContactSubmissions from '../components/admin/ContactSubmissions';
import AdminProfile from '../components/admin/AdminProfile';
import ShippingIntegrations from '../components/admin/ShippingIntegrations';
import GlobalSearch from '../components/admin/GlobalSearch';
import CreateOrder from '../components/admin/CreateOrder';
import CategoryEditor from '../components/admin/CategoryEditor';
import CollectionSettings from '../components/admin/CollectionSettings';
import VideoSettings from '../components/admin/VideoSettings';
import MediaLibrary from '../components/admin/MediaLibrary';
import Drafts from '../components/admin/Drafts';
import PDPBuilder from '../components/admin/PDPBuilder';
import HeaderSettingsComponent from '../components/admin/HeaderSettings';
import FooterSettingsComponent from '../components/admin/FooterSettings';
import PopupSettings from '../components/admin/PopupSettings';
import AdminSettingsModal from '../components/admin/AdminSettingsModal';
import CustomerDetails from '../components/admin/CustomerDetails';
import TestimonialSettings from '../components/admin/TestimonialSettings';
import HomePageSEOSettings from '../components/admin/HomePageSEOSettings';
import ProductEditor from '../components/admin/ProductEditor';
import { User, AdminView } from '../types';
import { useSiteData } from '../contexts/SiteDataContext';
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar';

const AdminDashboardPage: React.FC<{ user: User; logout: () => void }> = ({ user: initialUser, logout }) => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [currentView, setCurrentView] = useState<AdminView>('dashboard');
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [user, setUser] = useState<User>(initialUser);
    const [currentProductId, setCurrentProductId] = useState<string | null>(null);
    const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
    const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
    const { products } = useSiteData();
    const token = localStorage.getItem('token');

    const activeProductId = searchParams.get('productId') || 'global';

    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/settings')) {
            setIsSettingsOpen(true);
        } else if (path.includes('/magic/settings/checkout-setup')) setCurrentView('magic-setup');
        else if (path.includes('/magic/abandoned')) setCurrentView('abandoned-checkouts');
        else if (path.includes('/products/design')) setCurrentView('pdp-builder');
        else if (path.includes('/products/inventory')) setCurrentView('inventory');
        else if (path.includes('/products/edit/')) {
            const id = path.split('/products/edit/')[1];
            setCurrentProductId(id);
            setCurrentView('product-edit');
        } else if (path.includes('/products/new')) {
            setCurrentProductId('new');
            setCurrentView('product-edit');
        } else if (path.includes('/products')) setCurrentView('products');
        else if (path.includes('/content/pdp')) setCurrentView('pdp-builder');
        else if (path.includes('/content/header')) setCurrentView('header-settings');
        else if (path.includes('/content/homepage-seo')) setCurrentView('homepage-seo');
        else if (path.includes('/content/footer')) setCurrentView('footer');
        else if (path.includes('/content/popup')) setCurrentView('popup-settings');
        else if (path.includes('/orders/abandoned-checkouts')) setCurrentView('abandoned-checkouts');
        else if (path.includes('/orders/new')) setCurrentView('create-order');
        else if (path.includes('/orders/drafts')) setCurrentView('drafts');
        else if (path.includes('/orders')) setCurrentView('orders');
        else if (path.includes('/analytics')) setCurrentView('analytics');
        else if (path.includes('/customers/')) {
            const id = path.split('/customers/')[1];
            setCurrentCustomerId(id);
            setCurrentView('customer-details');
        } else if (path.includes('/customers')) setCurrentView('customers');
        else if (path.includes('/discounts')) setCurrentView('discounts');
        else if (path.includes('/reviews')) setCurrentView('reviews');
        else if (path.includes('/categories/edit/')) {
            const id = path.split('/categories/edit/')[1];
            setCurrentCategoryId(id);
            setCurrentView('category-edit');
        } else if (path.includes('/categories/new')) {
            setCurrentCategoryId('new');
            setCurrentView('category-edit');
        } else if (path.includes('/categories')) setCurrentView('categories');
        else if (path.includes('/shipping')) setCurrentView('shipping-integrations');
        else if (path.includes('/marketing')) setCurrentView('marketing');
        else if (path.includes('/content/banners')) setCurrentView('slider');
        else if (path.includes('/content/blogs')) setCurrentView('blogs');
        else if (path.includes('/content/pages')) setCurrentView('pages');
        else if (path.includes('/content/media')) setCurrentView('media');
        else if (path.includes('/content/builder')) setCurrentView('cms');
        else if (path.includes('/content/videos')) setCurrentView('shop-videos');
        else setCurrentView('dashboard');
    }, [location.pathname]);

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardOverview token={token} />;
            case 'analytics': return <Analytics token={token} />;
            case 'products': return <ProductList token={token} />;
            case 'product-edit': return <ProductEditor token={token} productId={currentProductId} />;
            case 'inventory': return <Inventory token={token} />;
            case 'reviews': return <TestimonialSettings token={token} />;
            case 'pdp-builder': return <PDPBuilder token={token} productId={activeProductId} />;
            case 'category-edit': return <CategoryEditor token={token} categoryId={currentCategoryId} />;
            case 'categories': return <CollectionSettings token={token} />;
            case 'shop-videos': return <VideoSettings token={token} />;
            case 'orders': return <OrderList token={token} />;
            case 'abandoned-checkouts': return <AbandonedLeads token={token} />;
            case 'drafts': return <Drafts />;
            case 'create-order': return <CreateOrder token={token} onOrderCreated={() => setCurrentView('orders')} />;
            case 'customers': return <Customers token={token} />;
            case 'customer-details': return <CustomerDetails token={token} customerId={currentCustomerId} />;
            case 'marketing': return <TrackingSettings token={token} />;
            case 'discounts': return <Discounts token={token} />;
            case 'header-settings': return <HeaderSettingsComponent token={token} />;
            case 'footer': return <FooterSettingsComponent token={token} />;
            case 'popup-settings': return <PopupSettings token={token} />;
            case 'cms': return <CMSManagement token={token} initialTab="page-builder" />;
            case 'homepage-seo': return <HomePageSEOSettings token={token} />;
            case 'slider': return <CMSManagement token={token} initialTab="slider" />;
            case 'blogs': return <CMSManagement token={token} initialTab="blogs" />;
            case 'pages': return <CMSManagement token={token} initialTab="pages" />;
            case 'media': return <MediaLibrary token={token} />;
            case 'contact-messages': return <ContactSubmissions token={token} />;
            case 'admin-profile': return <AdminProfile user={user} token={token} onUpdateUser={setUser} />;
            case 'shipping-integrations': return <ShippingIntegrations token={token} />;
            case 'settings': return <DashboardOverview token={token} />; // Handled by modal
            default: return <DashboardOverview token={token} />;
        }
    };

    if (currentView === 'pdp-builder') {
        return <PDPBuilder token={token} productId={activeProductId} />;
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
                <AdminSidebar
                    user={user}
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                />
                <SidebarInset className="flex flex-col min-w-0 overflow-hidden bg-transparent">
                    <AdminHeader
                        user={user}
                        logout={logout}
                        openGlobalSearch={() => setIsGlobalSearchOpen(true)}
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        token={token}
                    />
                    <main className="flex-1 overflow-y-auto p-6 md:p-8 admin-scroll relative">
                        <div className="w-full mx-auto animate-fade-in-up h-full flex flex-col">
                            {renderContent()}
                        </div>
                    </main>
                </SidebarInset>

                <GlobalSearch
                    isOpen={isGlobalSearchOpen}
                    onClose={() => setIsGlobalSearchOpen(false)}
                    products={products}
                    orders={[]}
                    customers={[]}
                    setCurrentView={setCurrentView}
                />

                <AdminSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => {
                        setIsSettingsOpen(false);
                        window.history.pushState({}, '', '/app/dashboard');
                    }}
                    token={token}
                />
            </div>
        </SidebarProvider>
    );
};

export default AdminDashboardPage;
