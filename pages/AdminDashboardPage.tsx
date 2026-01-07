import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useLocation, useSearchParams, useNavigate } = ReactRouterDom as any;
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import DashboardOverview from '../components/admin/Dashboard';
import ProductList from '../components/admin/ProductList';
import ProductForm from '../components/admin/ProductForm';
import Inventory from '../components/admin/Inventory';
import OrderList from '../components/admin/OrderList';
import AbandonedLeads from '../components/admin/AbandonedLeads';
import Analytics from '../components/admin/Analytics';
import Customers from '../components/admin/Customers';
import TrackingSettings from '../components/admin/TrackingSettings';
import Discounts from '../components/admin/Discounts';
import CMSManagement from '../components/admin/CMSManagement';
import ContactSubmissions from '../components/admin/ContactSubmissions';
import AdminProfile from '../components/admin/AdminProfile';
import ShippingIntegrations from '../components/admin/ShippingIntegrations';
import GlobalSearch from '../components/admin/GlobalSearch';
import CreateOrder from '../components/admin/CreateOrder';
import CollectionSettings from '../components/admin/CollectionSettings';
import VideoSettings from '../components/admin/VideoSettings';
import MediaLibrary from '../components/admin/MediaLibrary';
import PDPBuilder from '../components/admin/PDPBuilder';
import HeaderSettingsComponent from '../components/admin/HeaderSettings';
import FooterSettingsComponent from '../components/admin/FooterSettings';
import AdminSettingsModal from '../components/admin/AdminSettingsModal';
import TestimonialSettings from '../components/admin/TestimonialSettings';
import HomePageSEOSettings from '../components/admin/HomePageSEOSettings';
import Reviews from '../components/admin/Reviews';
import { User, AdminView, Product } from '../types';
import { useSiteData } from '../contexts/SiteDataContext';
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
    
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productLoading, setProductLoading] = useState(false);
    
    const { products, refreshSiteData } = useSiteData();
    const token = localStorage.getItem('token');

    const activeProductId = searchParams.get('productId') || 'global';
    const editId = searchParams.get('id');

    // Master Route Watcher
    useEffect(() => {
        const path = location.pathname;

        if (path.includes('/settings')) {
            setIsSettingsOpen(true);
        } else if (path.includes('/products/new')) {
            setCurrentView('create-product');
            setEditingProduct(null);
        } else if (path.includes('/products/edit')) {
            setCurrentView('edit-product');
            if (editId) {
                const fetchProduct = async () => {
                    setProductLoading(true);
                    try {
                        const res = await fetch(getApiUrl(`/api/products/${editId}`), {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            setEditingProduct(await res.json());
                        } else {
                            setEditingProduct(null);
                        }
                    } catch (e) {
                        setEditingProduct(null);
                    } finally {
                        setProductLoading(false);
                    }
                };
                fetchProduct();
            }
        } else if (path.includes('/products/design')) setCurrentView('pdp-builder');
        else if (path.includes('/products')) {
            if (path.includes('/inventory')) {
                setCurrentView('inventory');
            } else {
                setCurrentView('products');
            }
        }
        else if (path.includes('/categories')) setCurrentView('categories');
        else if (path.includes('/orders')) setCurrentView('orders');
        else if (path.includes('/analytics')) setCurrentView('analytics');
        else if (path.includes('/customers')) setCurrentView('customers');
        else if (path.includes('/content/header')) setCurrentView('header-settings');
        else if (path.includes('/content/footer')) setCurrentView('footer');
        else if (path.includes('/content/media')) setCurrentView('media');
        else if (path.includes('/marketing')) setCurrentView('marketing');
        else if (path.includes('/inventory')) setCurrentView('inventory');
        else if (path.includes('/reviews')) setCurrentView('reviews');
        else setCurrentView('dashboard');
    }, [location.pathname, editId, token]);

    const handleProductSave = async (productData: any) => {
        const isNew = !productData._id && !productData.id;
        const method = isNew ? 'POST' : 'PUT';
        const url = isNew ? getApiUrl('/api/products') : getApiUrl(`/api/products/${productData._id || productData.id}`);

        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
            if (res.ok) {
                await refreshSiteData();
                navigate('/app/products');
            } else {
                const err = await res.json();
                alert(err.message || "Operation failed");
            }
        } catch (e) { alert("Network error"); }
    };

    const renderContent = () => {
        if (productLoading) {
            return (
                <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Accessing Master Record...</p>
                </div>
            );
        }

        switch (currentView) {
            case 'dashboard': return <DashboardOverview token={token} />;
            case 'analytics': return <Analytics token={token} />;
            case 'products': return <ProductList token={token} />;
            case 'inventory': return <Inventory token={token} />;
            case 'categories': return <CollectionSettings token={token} />;
            case 'create-product': return <ProductForm product={null} onSave={handleProductSave} onCancel={() => navigate('/app/products')} />;
            case 'edit-product': 
                return editingProduct 
                    ? <ProductForm product={editingProduct} onSave={handleProductSave} onCancel={() => navigate('/app/products')} />
                    : <div className="p-20 text-center font-bold text-zinc-300 italic">Record context missing. Return to catalog.</div>;
            case 'pdp-builder': return <PDPBuilder token={token} productId={activeProductId} />;
            case 'orders': return <OrderList token={token} />;
            case 'customers': return <Customers token={token} />;
            case 'marketing': return <TrackingSettings token={token} />;
            case 'header-settings': return <HeaderSettingsComponent token={token} />;
            case 'footer': return <FooterSettingsComponent token={token} />;
            case 'media': return <MediaLibrary token={token} />;
            case 'cms': return <CMSManagement token={token} initialTab="page-builder" />;
            case 'homepage-seo': return <HomePageSEOSettings token={token} />;
            case 'reviews': return <Reviews token={token} />;
            default: return <DashboardOverview token={token} />;
        }
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
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
                    />
                    <main className="flex-1 overflow-y-auto p-6 md:p-8 admin-scroll relative">
                        <div className="max-w-7xl mx-auto animate-fade-in-up">
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
                        const cleanPath = location.pathname.replace('/settings', '');
                        navigate(cleanPath || '/app/dashboard');
                    }} 
                    token={token} 
                />
            </div>
        </SidebarProvider>
    );
};

export default AdminDashboardPage;