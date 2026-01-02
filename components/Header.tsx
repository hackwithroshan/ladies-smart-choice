
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { Link, useNavigate, useLocation } = ReactRouterDom as any;
import { 
    TailGridsLogo, UserIcon, HeartIcon, CartIcon, SearchIcon, 
    MenuIcon, NavArrowIcon, InstagramIcon, FacebookIcon, 
    YoutubeIcon, XIcon 
} from './Icons';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useSiteData } from '../contexts/SiteDataContext';
import { getApiUrl } from '../utils/apiHelper';
import { Product } from '../types';

interface HeaderProps {
  user: any;
  logout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, logout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { headerSettings, siteSettings, collections } = useSiteData();
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsSearchFocused(false);
  }, [location]);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(getApiUrl(`/api/products/search?q=${encodeURIComponent(searchTerm)}`));
          if (res.ok) {
            const data = await res.json();
            setRecommendations(data);
          }
        } catch (e) {
          console.error("Search failed", e);
        } finally {
          setIsSearching(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setRecommendations([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const messages = headerSettings?.announcementMessages || [headerSettings?.announcementMessage || 'Welcome to our store'];
    if (messages.length > 1) {
        const interval = setInterval(() => {
            setCurrentAnnouncementIndex(prev => (prev + 1) % messages.length);
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [headerSettings?.announcementMessages]);

  const announcementBg = headerSettings?.announcementBgColor || 'var(--brand-primary)';
  const announcementText = headerSettings?.announcementTextColor || '#FFFFFF';
  const BrandBrandName = siteSettings?.storeName || "Ayushree Ayurveda";
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
        navigate(`/collections/all?search=${encodeURIComponent(searchTerm)}`);
        setIsMobileSearchOpen(false);
        setIsSearchFocused(false);
    }
  };

  const handleRecommendationClick = (slug: string) => {
    navigate(`/product/${slug}`);
    setSearchTerm('');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
  };

  return (
    <header className="relative z-50">
      {isSearchFocused && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[35] animate-fade-in hidden lg:block"></div>
      )}

      <div style={{ backgroundColor: announcementBg, color: announcementText }} className="py-2 text-center px-4 overflow-hidden relative shadow-sm z-50">
          <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase animate-fade-in">
              {(headerSettings?.announcementMessages?.length ? headerSettings.announcementMessages : ['Authentic Ayurvedic Wellness'])[currentAnnouncementIndex]}
          </p>
      </div>

      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-2 md:gap-4">
            
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-gray-700 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <MenuIcon />
            </button>

            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                {siteSettings?.logoUrl ? (
                    <img src={siteSettings.logoUrl} alt={BrandBrandName} className="h-7 md:h-10 w-auto object-contain" />
                ) : (
                    <div className="flex items-center gap-2">
                        <TailGridsLogo />
                        <span className="text-base md:text-xl font-brand font-extrabold text-brand-primary tracking-tighter uppercase whitespace-nowrap">
                            {BrandBrandName}
                        </span>
                    </div>
                )}
            </Link>

            <div className="flex-1 max-w-xl hidden lg:block px-4 relative" ref={searchContainerRef}>
                <form onSubmit={handleSearchSubmit} className="relative z-50">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        placeholder="Search for pure wellness..." 
                        className={`w-full h-11 border rounded-full pl-11 pr-4 text-sm transition-all outline-none ${isSearchFocused ? 'border-brand-primary ring-4 ring-brand-primary/10 bg-white' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'}`}
                    />
                    <div className="absolute left-4 top-3 text-gray-400">
                        {isSearching ? <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div> : <SearchIcon />}
                    </div>
                </form>

                {isSearchFocused && (
                    <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up z-50">
                        <div className="flex flex-col">
                            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 italic">{searchTerm.length < 2 ? 'Popular Collections' : `Results for "${searchTerm}"`}</span>
                                {searchTerm.length >= 2 && <button onClick={handleSearchSubmit} className="text-xs font-black text-brand-primary uppercase hover:underline">View All</button>}
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {searchTerm.length < 2 ? (
                                    <div className="grid grid-cols-2 gap-2 p-3">
                                        {(collections || []).slice(0, 4).map(col => (
                                            <Link key={col.id} to={`/collections/${col.slug || col.id}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100"><img src={col.imageUrl} className="w-full h-full object-cover" /></div>
                                                <span className="text-xs font-bold text-gray-700">{col.title}</span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : recommendations.length > 0 ? recommendations.map(prod => (
                                    <div key={prod.id} onClick={() => handleRecommendationClick(prod.slug || '')} className="flex items-center gap-4 p-4 hover:bg-brand-accent/5 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                                        <img src={prod.imageUrl} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border" />
                                        <div className="flex-1 min-w-0"><h5 className="text-sm font-bold text-gray-900 truncate">{prod.name}</h5><p className="text-xs text-brand-primary font-black">₹{prod.price.toLocaleString()}</p></div>
                                    </div>
                                )) : <div className="p-10 text-center text-gray-400 italic text-sm">No products found.</div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1 md:gap-4">
                <button onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className="lg:hidden text-gray-700 p-2 hover:bg-gray-100 rounded-full"><SearchIcon /></button>
                <Link to="/wishlist" className="relative group text-gray-700 hover:text-brand-primary transition-colors p-2 rounded-full hover:bg-gray-100">
                    <HeartIcon />{wishlistCount > 0 && <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">{wishlistCount}</span>}
                </Link>
                <Link to="/cart" className="relative group text-gray-700 hover:text-brand-primary transition-colors p-2 rounded-full hover:bg-gray-100">
                    <CartIcon />{cartCount > 0 && <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">{cartCount}</span>}
                </Link>
                <div className="relative hidden md:block" ref={profileMenuRef}>
                    <button onClick={() => user ? setIsProfileMenuOpen(!isProfileMenuOpen) : navigate('/login')} className="text-gray-700 hover:text-brand-primary transition-colors p-2 rounded-full hover:bg-gray-100"><UserIcon /></button>
                    {user && isProfileMenuOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fade-in-up">
                            <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl"><p className="text-[10px] text-gray-500 uppercase tracking-widest">Account</p><p className="text-sm font-bold text-brand-primary truncate">{user.name}</p></div>
                            <Link to={user.isAdmin ? '/admin' : '/dashboard'} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-accent/10 font-medium">Dashboard</Link>
                            <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Mobile Search Overlay */}
        {isMobileSearchOpen && (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in">
                <div className="p-4 flex items-center gap-3 border-b">
                    <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 text-gray-400"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    <form onSubmit={handleSearchSubmit} className="flex-1"><input type="text" autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Find products..." className="w-full h-12 border-0 bg-transparent text-lg focus:ring-0 outline-none font-medium" /></form>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50/30">
                    {searchTerm.length > 1 ? (
                        <div className="bg-white">
                             {isSearching ? <div className="p-10 flex flex-col items-center gap-4 text-gray-400"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div> : recommendations.map(prod => (
                                <div key={prod.id} onClick={() => handleRecommendationClick(prod.slug || '')} className="flex items-center gap-4 p-4 border-b border-gray-50 active:bg-gray-50"><img src={prod.imageUrl} className="w-16 h-16 rounded-xl object-cover border" /><div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{prod.name}</p><p className="text-xs text-brand-primary font-black mt-1">₹{prod.price.toLocaleString()}</p></div></div>
                             ))}
                        </div>
                    ) : (
                        <div className="p-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Collections</h4>
                            <div className="space-y-4">
                                {(collections || []).slice(0, 5).map(col => (
                                    <Link key={col.id} to={`/collections/${col.slug || col.id}`} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full overflow-hidden border shadow-sm"><img src={col.imageUrl} className="w-full h-full object-cover" /></div><span className="text-sm font-bold text-gray-800">{col.title}</span></div>
                                        <NavArrowIcon className="text-gray-300 w-3 h-3" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      <div className="bg-white hidden lg:block border-b border-gray-100 shadow-sm">
          <div className="container mx-auto px-4"><nav className="flex items-center justify-center space-x-10 h-12">
                  {(headerSettings?.mainNavLinks || []).map((link, idx) => (<Link key={idx} to={link.url} className={`text-[11px] font-bold uppercase tracking-[0.2em] hover:text-brand-accent transition-all py-4 ${link.isSpecial ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-600'}`}>{link.text}</Link>))}
                  <Link to="/track-order" className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600 hover:text-brand-accent">Track Order</Link>
          </nav></div>
      </div>

      {isMobileMenuOpen && (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-[70] shadow-2xl animate-slide-in-left flex flex-col">
                
                <div className="p-6 border-b flex justify-between items-center bg-brand-primary text-white">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1"><TailGridsLogo /></div>
                         <div><span className="text-lg font-brand font-black tracking-tight uppercase italic leading-none block">Ayushree</span><span className="text-[8px] font-black uppercase tracking-widest opacity-70">Boutique</span></div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/60 hover:text-white p-2"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                <div className="flex-1 overflow-y-auto py-6">
                    <nav className="space-y-0.5 px-4 mb-8">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 ml-2">Navigation</h4>
                        <Link to="/" className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-gray-50 group border-b border-transparent">
                            <span className="text-sm font-bold text-gray-800">Home</span>
                            <NavArrowIcon className="text-gray-300 w-3 h-3 group-hover:text-brand-primary" />
                        </Link>
                        {(headerSettings?.mainNavLinks || []).map((link, idx) => (
                            <Link key={idx} to={link.url} className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-gray-50 group border-b border-transparent">
                                <span className="text-sm font-bold text-gray-800">{link.text}</span>
                                <NavArrowIcon className="text-gray-300 w-3 h-3 group-hover:text-brand-primary" />
                            </Link>
                        ))}
                    </nav>

                    <div className="px-6 mb-8">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Account & Tools</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <Link to="/track-order" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-brand-accent/20 transition-all">
                                <svg className="w-5 h-5 text-brand-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="text-[9px] font-black uppercase tracking-wider text-gray-700">Track Order</span>
                            </Link>
                            <Link to={user ? (user.isAdmin ? '/admin' : '/dashboard') : '/login'} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-brand-accent/20 transition-all">
                                <svg className="w-5 h-5 text-brand-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-[9px] font-black uppercase tracking-wider text-gray-700">{user ? 'My Profile' : 'Sign In'}</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t bg-gray-50 text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Connect with us</p>
                    <div className="flex justify-center gap-3">
                        <a href="#" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-primary transition-all border border-gray-100"><InstagramIcon className="w-4.5 h-4.5"/></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-primary transition-all border border-gray-100"><FacebookIcon className="w-4.5 h-4.5"/></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-primary transition-all border border-gray-100"><YoutubeIcon className="w-4.5 h-4.5"/></a>
                    </div>
                    {user && <button onClick={logout} className="mt-6 text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Sign Out</button>}
                </div>
            </div>
        </>
      )}
    </header>
  );
};

export default Header;
