
import React, { useState } from 'react';
// FIX: The `react-router-dom` module is not resolving named exports correctly in this environment.
// Switching to a namespace import (`import * as ...`) and then destructuring is a more robust way to access the exports.
import * as ReactRouterDom from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import Dashboard from '../components/admin/Dashboard';
import Analytics from '../components/admin/Analytics';
import ProductList from '../components/admin/ProductList';
import OrderList from '../components/admin/OrderList';
import Customers from '../components/admin/Customers';
import Marketing from '../components/admin/Marketing';
import Discounts from '../components/admin/Discounts';
import Settings from '../components/admin/Settings';
import CMSManagement from '../components/admin/CMSManagement';
import MediaLibrary from '../components/admin/MediaLibrary';
import { COLORS } from '../constants';
import ErrorBoundary from '../components/ErrorBoundary';
import { User } from '../types';

// Expanded view types to match Sidebar IDs
type AdminView = 'dashboard' | 'analytics' | 'products' | 'inventory' | 'categories' | 'orders' | 'customers' | 'marketing' | 'discounts' | 'settings' | 'cms' | 'shop-videos' | 'slider' | 'media' | 'blogs' | 'pages';

interface AdminDashboardPageProps {
  user: User;
  logout: () => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ user, logout }) => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  // Initialize sidebar closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const token = localStorage.getItem('token');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard token={token} />;
      case 'analytics':
        return <Analytics token={token} />;
      case 'products':
      case 'inventory': // Reusing ProductList for now, can handle inventory specific logic inside if needed
        return <ProductList token={token} />;
      case 'orders':
        return <OrderList token={token} />;
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
      
      // Deep links into CMS Management
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

  const getTitle = () => {
      const titles: Record<string, string> = {
          'dashboard': 'Dashboard Overview',
          'analytics': 'Marketing Analytics',
          'products': 'Product Management',
          'inventory': 'Inventory Control',
          'categories': 'Category & Collections',
          'shop-videos': 'Shoppable Videos',
          'orders': 'Order Management',
          'customers': 'Customer Overview',
          'marketing': 'Marketing Campaigns',
          'discounts': 'Coupons & Discounts',
          'settings': 'Store Settings',
          'cms': 'Content Management',
          'media': 'Media Library',
          'blogs': 'Blog Posts',
          'pages': 'Static Pages',
          'slider': 'Homepage Sliders'
      };
      return titles[currentView] || currentView.replace('-', ' ');
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
        {/* Main Content Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10 border-b flex-shrink-0">
            <div className="flex items-center">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-gray-500 mr-4">
                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <h1 className="text-xl font-bold text-gray-800 capitalize">{getTitle()}</h1>
            </div>
            <div className="flex items-center space-x-4">
                <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                    View Store
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
            </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 admin-scroll">
            <ErrorBoundary>
              {renderView()}
            </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
export default AdminDashboardPage;