
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TailGridsLogo, UserIcon, HeartIcon, CartIcon, SearchIcon, MenuIcon, ChevronDownIcon } from './Icons';
import { Product, HeaderLink } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useSiteData } from '../contexts/SiteDataContext';
import { getApiUrl } from '../utils/apiHelper';

interface HeaderProps {
  user: any;
  logout: () => void;
}

// --- Skeleton Loader Components for Search (Horizontal) ---
const SearchResultSkeleton: React.FC = () => (
    <div className="min-w-[140px] w-[140px] p-2 border border-gray-100 rounded-lg animate-pulse">
        <div className="w-full h-32 bg-gray-200 rounded-md mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
);

const Header: React.FC<HeaderProps> = ({ user, logout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileItem, setExpandedMobileItem] = useState<number | null>(null);
  
  // --- Centralized Data from Context ---
  const { headerSettings, loading: siteDataLoading } = useSiteData();

  // --- Enhanced Search State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Announcement Rotation State
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  
  const trendingSearches = ["Sneakers", "Summer Dress", "Running Shoes", "Watches", "Handbags"];

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  // --- Click outside handler ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchPanelOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // --- Search Logic ---
  useEffect(() => {
    if (!isSearchPanelOpen || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const query = new URLSearchParams({ q: searchTerm });
        const response = await fetch(getApiUrl(`/api/products/search?${query.toString()}`));
        if (response.ok) setSearchResults(await response.json());
        else setSearchResults([]);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [isSearchPanelOpen, searchTerm]);

  // --- Announcement Rotation ---
  useEffect(() => {
      const messages = headerSettings.announcementMessages || [headerSettings.announcementMessage || 'Welcome'];
      if (messages.length > 1) {
          const interval = setInterval(() => {
              setCurrentAnnouncementIndex(prev => (prev + 1) % messages.length);
          }, 4000);
          return () => clearInterval(interval);
      }
  }, [headerSettings.announcementMessages]);

  const handleSearchNavigate = (term?: string) => {
    const query = term || searchTerm;
    if (query.trim()) {
      setIsSearchPanelOpen(false);
      setSearchTerm(query);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSearchNavigate();
      }
  };

  // Dynamic Styles
  const announcementBg = headerSettings.announcementBgColor || '#E1B346';
  const announcementText = headerSettings.announcementTextColor || '#FFFFFF';
  
  const messages = headerSettings.announcementMessages && headerSettings.announcementMessages.length > 0 
      ? headerSettings.announcementMessages 
      : [headerSettings.announcementMessage || 'Largest selection of sneakers, boots and athleisure.'];
  
  const currentMessage = messages[currentAnnouncementIndex];

  return (
    <header className="font-manrope relative z-50">
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div style={{ backgroundColor: announcementBg, color: announcementText }} className="py-2 text-center px-4 overflow-hidden relative transition-colors duration-500 shadow-sm">
          <p className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-wide transition-all duration-500 ease-in-out transform truncate">
              {siteDataLoading ? 'Welcome to our store' : currentMessage}
          </p>
      </div>

      {/* 2. MAIN HEADER ROW (Logo | Search | Icons) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
            
            {/* LOGO */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 md:gap-3">
                {headerSettings.logoUrl && (
                    <img src={headerSettings.logoUrl} alt={headerSettings.logoText} className="h-8 sm:h-10 md:h-12 object-contain" />
                )}
                {headerSettings.logoText && (
                    <span className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-800 tracking-tight uppercase hidden sm:block">
                        {headerSettings.logoText}
                    </span>
                )}
                {!headerSettings.logoUrl && !headerSettings.logoText && (
                    <>
                        <TailGridsLogo />
                        <span className="text-xl sm:text-2xl font-extrabold text-gray-800 tracking-tight uppercase hidden sm:block">STORE</span>
                    </>
                )}
            </Link>

            {/* SEARCH BAR (Tablet & Desktop) - Hidden on Mobile */}
            <div className="flex-1 max-w-2xl hidden md:block relative px-4 lg:px-8" ref={searchRef}>
                <div className="relative flex w-full group">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearchPanelOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search For Items..." 
                        className="w-full h-10 md:h-11 pl-4 pr-12 border border-gray-300 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-gray-50 focus:bg-white"
                    />
                    <button 
                        onClick={() => handleSearchNavigate()}
                        className="absolute right-0 top-0 h-10 md:h-11 w-12 flex items-center justify-center rounded-r-full text-gray-500 hover:text-black transition-colors"
                    >
                        <SearchIcon /> 
                    </button>
                </div>

                {/* Search Results Dropdown */}
                {isSearchPanelOpen && (
                    <div className="absolute top-full left-4 right-4 lg:left-8 lg:right-8 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up z-[60]">
                        {/* (Search Results Content - Same as before) */}
                        {searchTerm.length < 2 && searchResults.length === 0 ? (
                            <div className="p-5">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trending Searches</h4>
                                <div className="flex flex-wrap gap-2">
                                    {trendingSearches.map((term, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleSearchNavigate(term)}
                                            className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-full hover:bg-gray-100 transition-colors border border-gray-100 flex items-center gap-2"
                                        >
                                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : searchLoading ? (
                            <div className="p-5">
                                <div className="flex gap-4 overflow-x-hidden">
                                    <SearchResultSkeleton />
                                    <SearchResultSkeleton />
                                </div>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div>
                                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Suggestions</p>
                                    <div className="space-y-1">
                                        <button onClick={() => handleSearchNavigate(searchTerm)} className="block text-sm text-gray-700 hover:text-rose-600 w-full text-left">
                                            Search for "{searchTerm}"
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Products</h4>
                                    <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x">
                                        {searchResults.map(product => (
                                            <Link 
                                                key={product.id} 
                                                to={`/product/${product.slug}`} 
                                                onClick={() => setIsSearchPanelOpen(false)} 
                                                className="min-w-[120px] w-[120px] group snap-start bg-white rounded-lg border border-gray-100 hover:border-gray-300 transition-all p-2 flex flex-col"
                                            >
                                                <div className="w-full h-28 overflow-hidden rounded-md mb-2 bg-gray-50 relative">
                                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-1">{product.name}</p>
                                                    <p className="text-xs font-bold text-rose-600">RS {product.price.toLocaleString()}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="mt-3 text-center border-t border-gray-100 pt-2">
                                        <button onClick={() => handleSearchNavigate()} className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider">
                                            View All Results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-sm text-gray-500">
                                <p>No products found for "{searchTerm}".</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ICONS (Right) */}
            <div className="flex items-center gap-3 sm:gap-5">
                
                {/* Search Icon (Mobile Only) */}
                <button className="md:hidden text-gray-800 p-1" onClick={() => setIsSearchPanelOpen(true)}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>

                {/* Wishlist */}
                <button 
                    onClick={() => navigate('/dashboard')} // Or specific wishlist page if you have one
                    className="relative group text-gray-800 hover:text-black transition-colors p-1"
                >
                    <HeartIcon />
                    {wishlistCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                            {wishlistCount}
                        </span>
                    )}
                </button>

                {/* Cart */}
                <Link to="/cart" className="relative group text-gray-800 hover:text-black transition-colors p-1">
                    <div className="relative">
                       <CartIcon /> 
                       {cartCount > 0 && (
                           <span className="absolute -top-1 -right-1 h-4 w-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                {cartCount}
                            </span>
                       )}
                    </div>
                </Link>

                {/* User Profile (Desktop/Tablet) */}
                <div className="relative hidden md:block" ref={profileMenuRef}>
                    <button onClick={() => user ? setIsProfileMenuOpen(!isProfileMenuOpen) : navigate('/login')} className="relative group text-gray-800 hover:text-black transition-colors p-1">
                        <UserIcon />
                    </button>
                    {user && isProfileMenuOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden animate-fade-in-up">
                            <div className="px-4 py-3 border-b bg-gray-50">
                                <p className="text-xs text-gray-500">Hello,</p>
                                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            </div>
                            {user.isAdmin ? (
                                <Link to="/admin" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Admin Dashboard</Link>
                            ) : (
                               <Link to="/dashboard" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Orders</Link>
                            )}
                            <Link to="/track-order" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Track Order</Link>
                            <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Logout</button>
                        </div>
                    )}
                </div>

                {/* Hamburger Menu (Mobile & Tablet < lg) */}
                {/* We use lg:hidden because on medium screens (tablets), we might run out of space for text links */}
                <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-gray-800 p-1">
                    <MenuIcon />
                </button>
            </div>
        </div>
      </div>

      {/* 3. NAVIGATION ROW (Laptop/Desktop only) */}
      {/* Changed hidden md:block to hidden lg:block to hide on tablets */}
      <div className="bg-white hidden lg:block border-b border-gray-100 shadow-sm relative">
          <div className="container mx-auto px-4 text-center">
              <nav className="flex items-center justify-center space-x-8 h-12 relative">
                  
                  {/* Dynamic Main Nav Links from Admin */}
                  {headerSettings.mainNavLinks.map((link, idx) => {
                      const isMega = link.isMegaMenu;
                      const hasSubMenu = link.subLinks && link.subLinks.length > 0;
                      
                      const wrapperClass = isMega ? 'group static h-full flex items-center' : 'group relative h-full flex items-center';

                      if (isMega) {
                          return (
                              <div key={`main-${idx}`} className={wrapperClass}>
                                  <Link 
                                    to={link.url} 
                                    className={`text-sm font-bold uppercase tracking-wide hover:text-rose-600 transition-all flex items-center gap-1 cursor-pointer py-4 ${link.isSpecial ? 'text-rose-600' : 'text-gray-800'}`}
                                  >
                                      {link.text}
                                      {link.isSpecial && <span className="ml-1 text-[9px] align-top bg-rose-100 text-rose-600 px-1 rounded">NEW</span>}
                                      <ChevronDownIcon className="w-3 h-3 transition-transform group-hover:rotate-180" />
                                  </Link>
                                  
                                  {/* Mega Menu Dropdown */}
                                  <div className="absolute left-0 top-full w-full bg-white shadow-xl border-t border-gray-100 hidden group-hover:block z-50 animate-fade-in-up mt-px rounded-b-lg">
                                      <div className="p-8">
                                          <div className={`grid gap-8 ${link.megaColumns && link.megaColumns.length > 0 ? `grid-cols-${Math.min(link.megaColumns.length, 5)}` : 'grid-cols-1'}`}>
                                              {link.megaColumns && link.megaColumns.map((col, colIdx) => (
                                                  <div key={colIdx} className="text-left">
                                                      <h4 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider border-b pb-2">{col.title}</h4>
                                                      <ul className="space-y-2">
                                                          {col.links.map((subLink, subIdx) => (
                                                              <li key={subIdx}>
                                                                  <Link to={subLink.url} className="text-sm text-gray-600 hover:text-rose-600 hover:translate-x-1 transition-all block">
                                                                      {subLink.text}
                                                                  </Link>
                                                              </li>
                                                          ))}
                                                      </ul>
                                                  </div>
                                              ))}
                                              {(!link.megaColumns || link.megaColumns.length === 0) && (
                                                  <p className="text-gray-400 text-sm text-center py-4">No categories configured for this menu.</p>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )
                      }

                      // Standard Dropdown Menu
                      if (hasSubMenu) {
                          return (
                              <div key={`main-${idx}`} className={wrapperClass}>
                                  <Link 
                                    to={link.url} 
                                    className={`text-sm font-bold uppercase tracking-wide hover:text-rose-600 transition-all flex items-center gap-1 cursor-pointer py-4 ${link.isSpecial ? 'text-rose-600' : 'text-gray-800'}`}
                                  >
                                      {link.text}
                                      {link.isSpecial && <span className="ml-1 text-[9px] align-top bg-rose-100 text-rose-600 px-1 rounded">NEW</span>}
                                      <ChevronDownIcon className="w-3 h-3 transition-transform group-hover:rotate-180" />
                                  </Link>
                                  
                                  {/* Standard Dropdown */}
                                  <div className="absolute left-0 top-full w-56 bg-white shadow-xl border border-gray-100 hidden group-hover:block z-50 animate-fade-in-up mt-px rounded-b-md rounded-tr-md text-left">
                                      <ul className="py-2">
                                          {link.subLinks?.map((subLink, subIdx) => (
                                              <li key={subIdx}>
                                                  <Link to={subLink.url} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600">
                                                      {subLink.text}
                                                  </Link>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              </div>
                          )
                      }

                      // Simple Link
                      return (
                        <Link 
                            key={`main-${idx}`} 
                            to={link.url} 
                            className={`text-sm font-bold uppercase tracking-wide hover:text-rose-600 transition-all py-4 ${link.isSpecial ? 'text-rose-600' : 'text-gray-800'}`}
                        >
                            {link.text}
                            {link.isSpecial && <span className="ml-1 text-[9px] align-top bg-rose-100 text-rose-600 px-1 rounded">NEW</span>}
                        </Link>
                      );
                  })}

                  {/* Secondary Links */}
                  {headerSettings.topBarLinks.map((link, idx) => (
                      <Link 
                        key={`top-${idx}`} 
                        to={link.url} 
                        className="text-sm font-bold uppercase text-gray-800 hover:text-rose-600 transition-colors"
                      >
                          {link.text}
                      </Link>
                  ))}
                  
                  <Link to="/track-order" className="text-sm font-bold uppercase text-gray-800 hover:text-rose-600 transition-colors">Track Order</Link>
              </nav>
          </div>
      </div>

      {/* --- Mobile Search Overlay --- */}
      {isSearchPanelOpen && (
          <div className="fixed inset-0 z-[60] bg-white lg:hidden flex flex-col p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 relative">
                      <input 
                          type="text" 
                          autoFocus
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search items..." 
                          className="w-full h-12 border border-gray-300 rounded-full px-5 focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-gray-50"
                      />
                      <div className="absolute right-4 top-3 text-gray-400">
                          <SearchIcon />
                      </div>
                  </div>
                  <button onClick={() => setIsSearchPanelOpen(false)} className="p-2 text-gray-500 font-bold text-sm">Cancel</button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                  {/* Mobile Trending Recommendations */}
                  {searchTerm.length < 2 && searchResults.length === 0 ? (
                      <div className="mt-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trending</h4>
                          <div className="flex flex-wrap gap-2">
                              {trendingSearches.map((term, idx) => (
                                  <button 
                                      key={idx}
                                      onClick={() => handleSearchNavigate(term)}
                                      className="px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-full active:bg-gray-200"
                                  >
                                      {term}
                                  </button>
                              ))}
                          </div>
                      </div>
                  ) : (
                      // Search Results (Mobile List)
                      <div className="space-y-4 mt-2">
                          {searchResults.map(product => (
                              <Link key={product.id} to={`/product/${product.slug}`} onClick={() => setIsSearchPanelOpen(false)} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                                  <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md bg-gray-100"/>
                                  <div className="flex-1">
                                      <p className="font-semibold text-gray-900 text-sm leading-snug mb-1">{product.name}</p>
                                      <p className="font-bold text-rose-600 text-sm">RS {product.price}</p>
                                  </div>
                              </Link>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- Mobile Menu Drawer (Side Menu) --- */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] flex lg:hidden">
              <div className="fixed inset-0 bg-black/60 animate-fade-in backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
              <div className="relative w-[85%] max-w-sm bg-white h-full flex flex-col animate-slide-in-left shadow-2xl">
                  {/* Drawer Header */}
                  <div className="p-5 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                      <span className="font-bold text-xl text-gray-900 uppercase tracking-wider">Menu</span>
                      <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-900 p-1 bg-gray-100 rounded-full">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  
                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto bg-white">
                      <nav className="flex flex-col">
                          {/* Main Nav Items with Mega Menu Accordion */}
                          {headerSettings.mainNavLinks.map((link, idx) => {
                              const isMega = link.isMegaMenu;
                              const hasSubMenu = link.subLinks && link.subLinks.length > 0;
                              const hasChildren = isMega || hasSubMenu;

                              return (
                                  <div key={idx} className="border-b border-gray-100">
                                      {hasChildren ? (
                                          <>
                                              <button 
                                                  onClick={() => setExpandedMobileItem(expandedMobileItem === idx ? null : idx)}
                                                  className="flex justify-between items-center w-full py-4 px-6 text-left font-bold text-gray-800 active:bg-gray-50 transition-colors"
                                              >
                                                  <span className={link.isSpecial ? 'text-rose-600' : ''}>{link.text}</span>
                                                  <ChevronDownIcon className={`transform transition-transform duration-200 ${expandedMobileItem === idx ? 'rotate-180' : ''}`} />
                                              </button>
                                              
                                              {/* Mobile Children Content */}
                                              {expandedMobileItem === idx && (
                                                  <div className="bg-gray-50 px-6 pb-4 space-y-4 animate-fade-in border-t border-gray-100 shadow-inner">
                                                      {isMega ? (
                                                          // Mega Menu Columns
                                                          link.megaColumns?.map((col, colIdx) => (
                                                              <div key={colIdx} className="mb-4 last:mb-0">
                                                                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{col.title}</h5>
                                                                  <ul className="space-y-2 border-l-2 border-gray-200 pl-3">
                                                                      {col.links.map((sub, subIdx) => (
                                                                          <li key={subIdx}>
                                                                              <Link 
                                                                                to={sub.url} 
                                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                                                className="text-sm text-gray-600 block py-1 hover:text-rose-600 transition-colors"
                                                                              >
                                                                                  {sub.text}
                                                                              </Link>
                                                                          </li>
                                                                      ))}
                                                                  </ul>
                                                              </div>
                                                          ))
                                                      ) : (
                                                          // Standard Sublinks
                                                          <ul className="space-y-1">
                                                              {link.subLinks?.map((sub, subIdx) => (
                                                                  <li key={subIdx}>
                                                                      <Link 
                                                                        to={sub.url} 
                                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                                        className="text-sm text-gray-600 block py-2 hover:text-rose-600 border-b border-gray-100 last:border-0"
                                                                      >
                                                                          {sub.text}
                                                                      </Link>
                                                                  </li>
                                                              ))}
                                                          </ul>
                                                      )}
                                                  </div>
                                              )}
                                          </>
                                      ) : (
                                          <Link 
                                            to={link.url} 
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`block py-4 px-6 font-bold hover:bg-gray-50 transition-colors ${link.isSpecial ? 'text-rose-600' : 'text-gray-800'}`}
                                          >
                                              {link.text}
                                          </Link>
                                      )}
                                  </div>
                              );
                          })}

                          {/* Secondary Links */}
                          <div className="bg-gray-50 mt-4 py-2">
                            {headerSettings.topBarLinks.map((link, idx) => (
                                <Link 
                                    key={`m-top-${idx}`} 
                                    to={link.url} 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block py-3 px-6 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                                >
                                    {link.text}
                                </Link>
                            ))}
                            <Link to="/track-order" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 px-6 text-sm font-medium text-gray-600 hover:text-black transition-colors">Track Order</Link>
                          </div>
                      </nav>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-5 border-t border-gray-200 bg-gray-100 sticky bottom-0">
                      {user ? (
                          <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                                  {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-xs text-red-600 hover:underline font-medium">Sign Out</button>
                              </div>
                          </div>
                      ) : (
                          <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-3 bg-gray-900 text-white text-center font-bold rounded-lg shadow-md hover:bg-black transition-colors mb-4">
                              Sign In / Register
                          </Link>
                      )}
                      <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
                          Ladies Smart Choice
                      </div>
                  </div>
              </div>
          </div>
      )}
    </header>
  );
};

export default Header;
