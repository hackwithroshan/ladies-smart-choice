
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useLocation, useSearchParams, useNavigate } = ReactRouterDom as any;
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import DashboardOverview from '../components/admin/Dashboard';
import ProductList from '../components/admin/ProductList';
import ProductForm from '../components/admin/ProductForm';
import CategoryList from '../components/admin/CategoryList';
import Inventory from '../components/admin/Inventory';
import OrderList from '../components/admin/OrderList';
import Analytics from '../components/admin/Analytics';
import Customers from '../components/admin/Customers';
import Discounts from '../components/admin/Discounts';
import TrackingSettings from '../components/admin/TrackingSettings';
import MediaLibrary from '../components/admin/MediaLibrary';
import PDPBuilder from '../components/admin/PDPBuilder';
import HeaderSettingsComponent from '../components/admin/HeaderSettings';
import FooterSettingsComponent from '../components/admin/FooterSettings';
import AdminSettingsModal from '../components/admin/AdminSettingsModal';
import Reviews from '../components/admin/Reviews';
import CollectionSettings from '../components/admin/CollectionSettings';
import SliderSettings from '../components/admin/SliderSettings';

// NEW IMPORTS
import HomepageEditor from '../components/admin/HomepageEditor';
import VideoSettings from '../components/admin/VideoSettings';
import AdminProfile from '../components/admin/AdminProfile';
import SettingsHub from '../components/admin/Settings';
import HomePageSEOSettings from '../components/admin/HomePageSEOSettings';

import { User, AdminView, Product } from '../types';
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar';
import { getApiUrl } from '../utils/apiHelper';

const AdminDashboardPage: React.FC<{ user: User; logout: () => void }> = ({ user: initialUser, logout }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentView, setCurrentView] = useState<AdminView>('dashboard');
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [user, setUser] = useState<User>(initialUser);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const path = location.pathname;
        if (path.endsWith('/dashboard')) setCurrentView('dashboard');
        else if (path.includes('/analytics')) setCurrentView('analytics');
        else if (path.includes('/products/new')) setCurrentView('create-product');
        else if (path.includes('/products/edit')) setCurrentView('edit-product');
        else if (path.includes('/products/design')) setCurrentView('pdp-builder');
        else if (path.includes('/products')) setCurrentView('products');
        else if (path.includes('/categories')) setCurrentView('categories'); 
        else if (path.includes('/inventory')) setCurrentView('inventory');
        else if (path.includes('/orders')) setCurrentView('orders');
        else if (path.includes('/customers')) setCurrentView('customers');
        else if (path.includes('/discounts')) setCurrentView('discounts');
        else if (path.includes('/marketing')) setCurrentView('marketing');
        else if (path.includes('/settings')) setCurrentView('settings');
        else if (path.includes('/content/header')) setCurrentView('header-settings');
        else if (path.includes('/content/footer')) setCurrentView('footer');
        else if (path.includes('/content/media')) setCurrentView('media');
        else if (path.includes('/content/builder')) setCurrentView('cms');
        else if (path.includes('/content/slider')) setCurrentView('slider');
        else if (path.includes('/content/videos')) setCurrentView('shop-videos');
        else if (path.includes('/reviews')) setCurrentView('reviews');
        else if (path.includes('/profile')) setCurrentView('admin-profile');
    }, [location.pathname]);

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardOverview token={token} />;
            case 'analytics': return <Analytics token={token} />;
            case 'products': return <ProductList token={token} />;
            case 'categories': return <CollectionSettings token={token} />; // Real DB Collections
            case 'inventory': return <Inventory token={token} />;
            case 'orders': return <OrderList token={token} />;
            case 'customers': return <Customers token={token} />;
            case 'discounts': return <Discounts token={token} />;
            case 'cms': return <HomepageEditor token={token} />;
            case 'slider': return <SliderSettings token={token} />;
            case 'shop-videos': return <VideoSettings token={token} />;
            case 'admin-profile': return <AdminProfile user={user} token={token} onUpdateUser={setUser} />;
            case 'create-product': return (
                <ProductForm 
                    product={null} 
                    onSave={async (data) => {
                        try {
                            const res = await fetch(getApiUrl('products'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify(data)
                            });
                            if (res.ok) navigate('/app/products');
                        } catch (e) { alert("Save failed"); }
                    }} 
                    onCancel={() => navigate('/app/products')} 
                />
            );
            case 'edit-product': {
                const id = searchParams.get('id');
                return <ProductEditWrapper id={id} token={token} onComplete={() => navigate('/app/products')} />;
            }
            case 'pdp-builder': {
                const id = searchParams.get('productId') || 'global';
                return <PDPBuilder token={token} productId={id} />;
            }
            case 'marketing': return <TrackingSettings token={token} />;
            case 'header-settings': return <HeaderSettingsComponent token={token} />;
            case 'footer': return <FooterSettingsComponent token={token} />;
            case 'media': return <MediaLibrary token={token} />;
            case 'reviews': return <Reviews token={token} />;
            case 'settings': return <SettingsHub token={token} />; 
            case 'homepage-seo': return <HomePageSEOSettings token={token} />;
            default: return <DashboardOverview token={token} />;
        }
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden w-full bg-zinc-50">
                <AdminSidebar user={user} currentView={currentView} setCurrentView={setCurrentView} />
                <SidebarInset className="flex flex-col flex-1 overflow-hidden">
                    <AdminHeader 
                        user={user} 
                        logout={logout} 
                        openGlobalSearch={() => setIsGlobalSearchOpen(true)} 
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                    />
                    <main className="flex-1 overflow-y-auto p-6 md:p-8 admin-scroll">
                        <div className="max-w-[1600px] mx-auto">
                            {renderContent()}
                        </div>
                    </main>
                </SidebarInset>
            </div>
            <AdminSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} token={token} />
        </SidebarProvider>
    );
};

const ProductEditWrapper: React.FC<{ id: string | null; token: string | null; onComplete: () => void }> = ({ id, token, onComplete }) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const res = await fetch(getApiUrl(`products/${id}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setProduct(await res.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, token]);

    const handleSave = async (data: any) => {
        try {
            const res = await fetch(getApiUrl(`products/${id}`), {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(data)
            });
            if (res.ok) onComplete();
        } catch (e) {
            alert('Save failed');
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-zinc-400 tracking-[0.4em]">Retrieving Record...</div>;
    return <ProductForm product={product} onSave={handleSave} onCancel={onComplete} />;
};

export default AdminDashboardPage;
