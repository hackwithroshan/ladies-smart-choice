
import React, { useState, useEffect } from 'react';
import { Icons, COLORS } from '../../constants';
import { User } from '../../types';

type AdminView = 'dashboard' | 'analytics' | 'products' | 'inventory' | 'categories' | 'orders' | 'create-order' | 'customers' | 'marketing' | 'discounts' | 'settings' | 'cms' | 'shop-videos' | 'slider' | 'media' | 'blogs' | 'pages' | 'contact-messages' | 'admin-profile' | 'shipping-integrations';

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
  children?: MenuItem[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, currentView, setCurrentView, isOpen, setIsOpen }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['catalog', 'content', 'sales']);

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleItemClick = (view?: AdminView) => {
    if (view) {
      setCurrentView(view);
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    }
  };

  const menuStructure: MenuItem[] = [
    { id: 'dashboard', label: 'Overview', icon: Icons.dashboard, view: 'dashboard' },
    { id: 'analytics', label: 'Analytics', icon: Icons.marketing, view: 'analytics' },
    {
      id: 'catalog',
      label: 'Products & Herbs',
      icon: Icons.products,
      children: [
        { id: 'products-list', label: 'Product Inventory', view: 'products' },
        { id: 'categories', label: 'Categories', view: 'categories' },
        { id: 'shop-videos', label: 'Shop-by-Videos', view: 'shop-videos' },
      ]
    },
    {
      id: 'sales',
      label: 'Sales & Orders',
      icon: Icons.orders,
      children: [
        { id: 'orders-list', label: 'All Orders', view: 'orders' },
        { id: 'create-order', label: 'New Manual Order', view: 'create-order' },
        { id: 'customers', label: 'Customer Database', view: 'customers' },
        { id: 'discounts', label: 'Coupons', view: 'discounts' },
        { id: 'shipping', label: 'Shipping Partners', view: 'shipping-integrations' },
      ]
    },
    {
      id: 'cms',
      label: 'Store Content',
      icon: Icons.content,
      children: [
        { id: 'slider', label: 'Hero Banners', view: 'slider' },
        { id: 'blogs', label: 'Wellness Blog', view: 'blogs' },
        { id: 'pages', label: 'Legal & Info Pages', view: 'pages' },
        { id: 'media', label: 'Media Library', view: 'media' },
      ]
    },
    { id: 'settings', label: 'Store Settings', icon: Icons.settings, view: 'settings' }
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 z-20 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => setIsOpen(false)}
      />

      <div 
        className={`
          fixed inset-y-0 left-0 z-30 w-72 bg-[#16423C] text-gray-300 
          transition-transform duration-300 ease-in-out transform 
          lg:static lg:translate-x-0 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          flex flex-col border-r border-gray-800 shadow-2xl
        `}
      >
        
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#2D5A27] bg-[#16423C] flex-shrink-0">
            <div className="flex flex-col">
                 <span className="text-white text-xl font-serif font-extrabold tracking-tight">
                    Ayushree<span className="text-[#6A9C89]">Ayurveda</span>
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-[0.3em] mt-1 font-bold">Wellness Portal</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
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
                        <span className={`transition-colors ${isActive ? 'text-[#6A9C89]' : 'text-gray-500'}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#6A9C89]' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                      <div className="bg-[#0b211e]/40 py-1 space-y-0.5">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleItemClick(child.view)}
                            className={`w-full flex items-center pl-12 pr-4 py-2.5 text-sm transition-colors border-l-2 ${
                              currentView === child.view
                                ? 'border-[#6A9C89] text-[#6A9C89] bg-[#6A9C89]/5 font-bold'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleItemClick(item.view)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#6A9C89] text-white shadow-lg'
                        : 'text-gray-400 hover:bg-[#2D5A27]/20 hover:text-white'
                    }`}
                  >
                    <span className={`flex-shrink-0 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
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
