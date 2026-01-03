
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { User } from '../../types';

type AdminView = 'dashboard' | 'analytics' | 'products' | 'inventory' | 'categories' | 'orders' | 'abandoned-checkouts' | 'create-order' | 'customers' | 'marketing' | 'discounts' | 'settings' | 'cms' | 'shop-videos' | 'slider' | 'media' | 'blogs' | 'pages' | 'contact-messages' | 'admin-profile' | 'shipping-integrations' | 'magic-setup';

interface AdminSidebarProps {
  user: User;
  currentView: AdminView;
  setCurrentView: (view: AdminView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  view?: AdminView;
  path?: string; 
  children?: MenuItem[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, currentView, setCurrentView, isOpen, setIsOpen }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['catalog', 'sales', 'magic']);

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.view) {
      setCurrentView(item.view);
      const newPath = item.path || `/app/${item.view}`;
      window.history.pushState({}, '', newPath);
      
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    }
  };

  const menuStructure: MenuItem[] = [
    { id: 'dashboard', label: 'Overview', icon: Icons.dashboard, view: 'dashboard', path: '/app/dashboard' },
    { id: 'analytics', label: 'Analytics', icon: Icons.marketing, view: 'analytics', path: '/app/analytics' },
    {
      id: 'magic',
      label: 'Magic Checkout',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2}/></svg>,
      children: [
        { id: 'magic-settings', label: 'Checkout Setup', view: 'magic-setup', path: '/app/magic/settings/checkout-setup' },
        { id: 'abandoned-leads', label: 'Abandoned Leads', view: 'abandoned-checkouts', path: '/app/magic/abandoned' },
      ]
    },
    {
      id: 'catalog',
      label: 'Products & Inventory',
      icon: Icons.products,
      children: [
        { id: 'products-list', label: 'Product List', view: 'products', path: '/app/products' },
        { id: 'categories', label: 'Categories', view: 'categories', path: '/app/categories' },
        { id: 'shop-videos', label: 'Shop-by-Videos', view: 'shop-videos', path: '/app/shop-videos' },
      ]
    },
    {
      id: 'sales',
      label: 'Sales & Orders',
      icon: Icons.orders,
      children: [
        { id: 'orders-list', label: 'All Orders', view: 'orders', path: '/app/orders' },
        { id: 'create-order', label: 'Manual Order', view: 'create-order', path: '/app/orders/new' },
        { id: 'customers', label: 'Customers', view: 'customers', path: '/app/customers' },
        { id: 'discounts', label: 'Coupons', view: 'discounts', path: '/app/discounts' },
        { id: 'shipping', label: 'Logistics Integrations', view: 'shipping-integrations', path: '/app/shipping' },
      ]
    },
    {
      id: 'cms',
      label: 'Store Content',
      icon: Icons.content,
      children: [
        { id: 'slider', label: 'Hero Banners', view: 'slider', path: '/app/content/banners' },
        { id: 'blogs', label: 'Wellness Blog', view: 'blogs', path: '/app/content/blogs' },
        { id: 'pages', label: 'Legal Pages', view: 'pages', path: '/app/content/pages' },
        { id: 'media', label: 'Media Library', view: 'media', path: '/app/content/media' },
      ]
    },
    { id: 'settings', label: 'System Settings', icon: Icons.settings, view: 'settings', path: '/app/settings/general' }
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 z-20 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => setIsOpen(false)}
      />

      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-[#16423C] text-gray-300 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r border-gray-800 shadow-2xl transition-transform duration-300`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#2D5A27] bg-[#16423C] flex-shrink-0">
            <div className="flex flex-col">
                 <span className="text-white text-xl font-serif font-extrabold tracking-tight italic">Indoshopsee</span>
                 <span className="text-[8px] text-brand-accent uppercase tracking-[0.2em] mt-1 font-black">Admin Panel</span>
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 admin-scroll">
          {menuStructure.map((item) => {
            const isChildActive = item.children?.some(child => child.view === currentView);
            const isActive = item.view === currentView || isChildActive;
            const isExpanded = expandedMenus.includes(item.id);

            return (
              <div key={item.id} className="mb-1">
                {item.children ? (
                  <div className="rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all ${
                        isActive || isExpanded ? 'bg-[#2D5A27]/30 text-white' : 'text-gray-400 hover:bg-[#2D5A27]/20 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`transition-colors ${isActive ? 'text-[#6A9C89]' : 'text-gray-500'}`}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#6A9C89]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                      <div className="bg-[#0b211e]/40 py-1 space-y-0.5">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleItemClick(child)}
                            className={`w-full flex items-center pl-12 pr-4 py-2.5 text-sm transition-colors border-l-2 ${
                              currentView === child.view ? 'border-[#6A9C89] text-[#6A9C89] bg-[#6A9C89]/5 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => handleItemClick(item)} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive ? 'bg-[#6A9C89] text-white shadow-lg' : 'text-gray-400 hover:bg-[#2D5A27]/20 hover:text-white'}`}>
                    <span className={`flex-shrink-0 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`}>{item.icon}</span>
                    {item.label}
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar;
