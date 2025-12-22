
import React, { useState, useEffect, useRef } from 'react';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors
import * as ReactRouterDom from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDom as any;
import { TailGridsLogo, UserIcon, HeartIcon, CartIcon, SearchIcon, MenuIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useSiteData } from '../contexts/SiteDataContext';

interface HeaderProps {
  user: any;
  logout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, logout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { headerSettings, siteSettings, loading: siteDataLoading } = useSiteData();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    const messages = headerSettings.announcementMessages || [headerSettings.announcementMessage || 'Welcome to our store'];
    if (messages.length > 1) {
        const interval = setInterval(() => {
            setCurrentAnnouncementIndex(prev => (prev + 1) % messages.length);
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [headerSettings.announcementMessages]);

  const announcementBg = headerSettings.announcementBgColor || 'var(--brand-primary)';
  const announcementText = headerSettings.announcementTextColor || '#FFFFFF';
  const messages = headerSettings.announcementMessages && headerSettings.announcementMessages.length > 0 ? headerSettings.announcementMessages : ['Authentic Ayurvedic Wellness'];
  const currentMessage = messages[currentAnnouncementIndex];

  // Logic to handle Logo: Uploaded Image > Dynamic Text > Fallback
  const BrandBrandName = siteSettings?.storeName || "Ayushree Ayurveda";

  return (
    <header className="relative z-50">
      <div style={{ backgroundColor: announcementBg, color: announcementText }} className="py-2 text-center px-4 overflow-hidden relative shadow-sm border-b border-white/10">
          <p className="text-[10px] sm:text-xs md:text-sm font-bold tracking-widest uppercase">
              {currentMessage}
          </p>
      </div>

      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
            
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 md:gap-3">
                {siteSettings?.logoUrl ? (
                    <img src={siteSettings.logoUrl} alt={BrandBrandName} className="h-8 md:h-12 w-auto object-contain" />
                ) : (
                    <>
                        <TailGridsLogo />
                        <span className="text-lg sm:text-xl md:text-2xl font-brand font-extrabold text-brand-primary tracking-tight hidden sm:block uppercase">
                            {BrandBrandName}
                        </span>
                    </>
                )}
            </Link>

            <div className="flex-1 max-w-xl hidden md:block relative px-4" ref={searchRef}>
                <div className="relative group">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search our catalog..." 
                        className="w-full h-10 border border-gray-200 rounded-full pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-gray-50/50"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                        <SearchIcon />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
                <Link to="/wishlist" className="relative group text-gray-700 hover:text-brand-primary transition-colors p-1">
                    <HeartIcon />
                    {wishlistCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">{wishlistCount}</span>}
                </Link>

                <Link to="/cart" className="relative group text-gray-700 hover:text-brand-primary transition-colors p-1">
                    <CartIcon /> 
                    {cartCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">{cartCount}</span>}
                </Link>

                <div className="relative hidden md:block" ref={profileMenuRef}>
                    <button onClick={() => user ? setIsProfileMenuOpen(!isProfileMenuOpen) : navigate('/login')} className="text-gray-700 hover:text-brand-primary transition-colors">
                        <UserIcon />
                    </button>
                    {user && isProfileMenuOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fade-in-up">
                            <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                                <p className="text-xs text-gray-500">Namaste,</p>
                                <p className="text-sm font-bold text-brand-primary truncate">{user.name}</p>
                            </div>
                            <Link to={user.isAdmin ? '/admin' : '/dashboard'} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-accent/10">Dashboard</Link>
                            <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                        </div>
                    )}
                </div>

                <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-gray-700">
                    <MenuIcon />
                </button>
            </div>
        </div>
      </div>

      <div className="bg-white hidden lg:block border-b border-gray-100 shadow-sm">
          <div className="container mx-auto px-4">
              <nav className="flex items-center justify-center space-x-12 h-12">
                  {headerSettings.mainNavLinks.map((link, idx) => (
                      <Link 
                        key={idx} 
                        to={link.url} 
                        className={`text-xs font-bold uppercase tracking-[0.15em] hover:text-brand-accent transition-all py-4 ${link.isSpecial ? 'text-brand-primary' : 'text-gray-600'}`}
                      >
                          {link.text}
                          {link.isSpecial && <span className="ml-1 text-[8px] bg-brand-accent text-white px-1.5 py-0.5 rounded-sm">Featured</span>}
                      </Link>
                  ))}
                  <Link to="/track-order" className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600 hover:text-brand-accent">Track Order</Link>
              </nav>
          </div>
      </div>
    </header>
  );
};

export default Header;
