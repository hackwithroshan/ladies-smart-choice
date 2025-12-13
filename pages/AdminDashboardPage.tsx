
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import GlobalSearch from '../components/admin/GlobalSearch';
import Dashboard from '../components/admin/Dashboard';
import Analytics from '../components/admin/Analytics';
import ProductList from '../components/admin/ProductList';
import OrderList from '../components/admin/OrderList';
import CreateOrder from '../components/admin/CreateOrder';
import Customers from '../components/admin/Customers';
import Marketing from '../components/admin/Marketing';
import Discounts from '../components/admin/Discounts';
import Settings from '../components/admin/Settings';
import CMSManagement from '../components/admin/CMSManagement';
import MediaLibrary from '../components/admin/MediaLibrary';
import ContactSubmissions from '../components/admin/ContactSubmissions';
import AdminProfile from '../components/admin/AdminProfile';
import ShippingIntegrations from '../components/admin/ShippingIntegrations';
import { COLORS } from '../constants';
import ErrorBoundary from '../components/ErrorBoundary';
import { User, Product, Order } from '../types';
import { getApiUrl } from '../utils/apiHelper';

type AdminView = 'dashboard' | 'analytics' | 'products' | 'inventory' | 'categories' | 'orders' | 'create-order' | 'customers' | 'marketing' | 'discounts' | 'settings' | 'cms' | 'shop-videos' | 'slider' | 'media' | 'blogs' | 'pages' | 'contact-messages' | 'admin-profile' | 'shipping-integrations';

interface AdminDashboardPageProps {
  user: User;
  logout: () => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ user: initialUser, logout }) => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(initialUser);

  // Data for Global Search
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);

  // Fetch data for global search on component mount
  useEffect(() => {
    const fetchSearchData = async () => {
        try {
            const [productsRes, ordersRes, customersRes] = await Promise.all([
                fetch(getApiUrl('/api/products/all'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/orders'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/users'), { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (productsRes.ok) setProducts(await productsRes.json());
            if (ordersRes.ok) setOrders(await ordersRes.json());
            if (customersRes.ok) setCustomers(await customersRes.json());
        } catch (error) {
            console.error("Failed to fetch data for global search:", error);
        }
    };
    fetchSearchData();
  }, [token]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            setIsSearchOpen(true);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateUser = (updatedUser: User) => {
      setUser(updatedUser);
      // Also update localStorage so it persists on refresh
      localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard token={token} />;
      case 'analytics':
        return <Analytics token={token} />;
      case 'products':
      case 'inventory':
        return <ProductList token={token} />;
      case 'orders':
        return <OrderList token={token} />;
      case 'create-order':
        return <CreateOrder token={token} onOrderCreated={() => setCurrentView('orders')} />;
      case 'customers':
        return <Customers token={token} />;
      case 'marketing':
        return <Marketing token={token} />;
      case 'discounts':
        return <Discounts token={token} />;
      case 'settings':
        return <Settings token={token} />;
      case 'media':
        return <MediaLibrary token={token} />;
      case 'contact-messages':
        return <ContactSubmissions token={token} />;
      case 'admin-profile':
        return <AdminProfile user={user} token={token} onUpdateUser={handleUpdateUser} />;
      case 'shipping-integrations':
        return <ShippingIntegrations token={token} />;
      
      // CMS deep links
      case 'categories': 
        return <CMSManagement token={token} initialTab="collections" />;
      case 'shop-videos': 
        return <CMSManagement token={token} initialTab="videos" />;
      case 'slider': 
        return <CMSManagement token={token} initialTab="slider" />;
      case 'blogs': 
        return <CMSManagement token={token} initialTab="blogs" />;
      case 'pages': 
        return <CMSManagement token={token} initialTab="pages" />;
      case 'cms':
        return <CMSManagement token={token} />;
        
      default:
        return <Dashboard token={token} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <AdminSidebar 
        user={user}
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <AdminHeader 
            user={user}
            logout={logout}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            openGlobalSearch={() => setIsSearchOpen(true)}
            setCurrentView={setCurrentView}
        />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8 admin-scroll">
            <ErrorBoundary>
              {renderView()}
            </ErrorBoundary>
        </main>
      </div>

      <GlobalSearch 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        orders={orders}
        customers={customers}
        setCurrentView={setCurrentView}
      />
    </div>
  );
};
export default AdminDashboardPage;
