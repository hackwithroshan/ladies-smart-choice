
import React, { useState, useEffect, useRef } from 'react';
// FIX: The `react-router-dom` module is not resolving named exports correctly in this environment.
// Switching to a namespace import (`import * as ...`) and then destructuring is a more robust way to access the exports.
import * as ReactRouterDom from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDom;
import MegaMenu from './MegaMenu';
import { TailGridsLogo, PhoneIcon, UserIcon, HeartIcon, CartIcon, SearchIcon, ChevronDownIcon, MenuIcon } from './Icons';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useSiteData } from '../contexts/SiteDataContext';
import { COLORS } from '../constants';
import { getApiUrl } from '../utils/apiHelper';

interface HeaderProps {
  user: any;
  logout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, logout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- Centralized Data from Context ---
  const { headerSettings, categories, loading: siteDataLoading } = useSiteData();

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null); // Ref for the entire search container
  const { cartCount } = useCart();
  const navigate = useNavigate();

  // Debounced search effect for API call
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const handler = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const query = new URLSearchParams({ q: searchTerm });
        if (selectedCategory) {
          query.set('category', selectedCategory);
        }
        
        const response = await fetch(getApiUrl(`/api/products/search?${query.toString()}`));
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
          setIsSearchOpen(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, selectedCategory]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    setIsSearchOpen(false);
    if (searchTerm.trim()) {
        const query = new URLSearchParams();
        query.set('search', searchTerm);
        if (selectedCategory) query.set('category', selectedCategory);
        navigate(`/?${query.toString()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSearch();
      }
  };

  const brandColor = headerSettings.brandColor || COLORS.primary;

  return (
    <header className="bg-white text-sm text-gray-600 relative z-50">
      {/* Top Bar - Hidden on mobile */}
      <div className="border-b hidden md:block">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-10">
          <div className="flex items-center space-x-6">
            {headerSettings.topBarLinks.map(link => (
                <a key={link._id || link.text} href={link.url} className="hover:text-pink-600 transition-colors">{link.text}</a>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="flex items-center hover:text-pink-600 transition-colors">
                English <ChevronDownIcon />
              </button>
            </div>
            <div className="relative">
              <button className="flex items-center hover:text-pink-600 transition-colors">
                INR <ChevronDownIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row justify-between items-center py-4 lg:py-0 lg:h-24 gap-4">
          
          {/* Logo & Mobile Icons Row */}
          <div className="flex justify-between items-center w-full lg:w-auto">
              <Link to="/" className="flex items-center space-x-2">
                {headerSettings.logoUrl ? (
                    <img src={headerSettings.logoUrl} alt={headerSettings.logoText} className="h-10 md:h-12 object-contain" />
                ) : (
                    <>
                        <TailGridsLogo />
                        <span className="text-2xl md:text-3xl font-bold" style={{color: brandColor}}>{siteDataLoading ? 'Loading...' : headerSettings.logoText}</span>
                    </>
                )}
              </Link>

              {/* Mobile Action Icons */}
              <div className="flex items-center space-x-4 lg:hidden">
                  <Link to="/cart" className="relative p-2">
                    <CartIcon />
                    {cartCount > 0 && <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 text-white text-[10px] rounded-full" style={{backgroundColor: COLORS.accent}}>{cartCount}</span>}
                  </Link>
                  <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                      <MenuIcon />
                  </button>
              </div>
          </div>

          {/* Search Bar - Full width on mobile */}
          <div className="flex-1 w-full lg:max-w-xl lg:mx-8 relative" ref={searchRef}>
            <div className="flex items-center border border-gray-200 rounded-md w-full relative">
              <div className="relative hidden sm:block h-full">
                 <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-4 pr-8 py-2.5 text-sm text-gray-600 bg-gray-50 rounded-l-md border-r border-gray-200 appearance-none focus:outline-none cursor-pointer hover:bg-gray-100 transition-colors h-full max-w-[150px] truncate"
                 >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <ChevronDownIcon className="h-4 w-4" />
                </div>
              </div>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for products..." 
                className="w-full px-4 py-2.5 text-sm focus:outline-none rounded-l-md sm:rounded-l-none" 
              />
              <button 
                onClick={handleSearch}
                className="text-white px-6 py-2.5 rounded-r-md transition-colors hover:opacity-90 flex items-center justify-center" 
                style={{backgroundColor: COLORS.accent}}
              >
                <SearchIcon />
              </button>
            </div>

            {/* --- Search Recommendations Dropdown --- */}
            {isSearchOpen && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden animate-fade-in-up">
                    {searchLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        <ul>
                            {searchResults.map(product => (
                                <li key={product.id}>
                                    <Link 
                                        to={`/product/${product.slug}`}
                                        onClick={() => {
                                            setIsSearchOpen(false);
                                            setSearchTerm(''); // Clear search on click
                                        }}
                                        className="flex items-center p-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-md mr-4"/>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                            <p className="text-sm font-bold text-rose-600">₹{product.price.toLocaleString('en-IN')}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                            <li className="border-t">
                                <button 
                                    onClick={handleSearch}
                                    className="w-full text-center p-3 text-sm font-medium text-blue-600 hover:bg-gray-50"
                                >
                                    View all results for "{searchTerm}"
                                </button>
                            </li>
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-sm text-gray-500">No products found for "{searchTerm}".</div>
                    )}
                </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <PhoneIcon />
              <div>
                <p className="text-xs">Need Help?</p>
                <p className="font-semibold text-gray-800">{siteDataLoading ? 'Loading...' : headerSettings.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative" ref={profileMenuRef}>
                    <button onClick={() => user ? setIsProfileMenuOpen(!isProfileMenuOpen) : navigate('/login')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <UserIcon />
                    </button>
                    {user && isProfileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                            <div className="px-4 py-3 border-b">
                                <p className="text-xs text-gray-500">Signed in as</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            </div>
                            {user.isAdmin ? (
                                <Link to="/admin" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Dashboard</Link>
                            ) : (
                               <Link to="/dashboard" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Account</Link>
                            )}
                            <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
                        </div>
                    )}
                </div>

                <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <HeartIcon />
                    <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 text-white text-xs rounded-full" style={{backgroundColor: COLORS.accent}}>0</span>
                </button>
                <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <CartIcon />
                    {cartCount > 0 && <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 text-white text-xs rounded-full" style={{backgroundColor: COLORS.accent}}>{cartCount}</span>}
                </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Desktop */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 hidden lg:flex justify-between items-center h-14">
        <div className="flex items-center space-x-8">
            <MegaMenu />
          <nav className="flex items-center space-x-6 font-semibold text-gray-800">
            {headerSettings.mainNavLinks.map(link => (
                <a key={link._id || link.text} href={link.url} className="hover:text-pink-600 transition-colors">{link.text}</a>
            ))}
          </nav>
        </div>
        <a href="#" className="font-semibold text-gray-800 hover:text-pink-600 transition-colors">Contact Us</a>
      </div>

      {/* Mobile Navigation Menu (Slide/Dropdown) */}
      {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 px-4 py-2 shadow-lg absolute w-full">
              <nav className="flex flex-col space-y-3 py-2">
                  {headerSettings.mainNavLinks.map(link => (
                      <a key={link._id || link.text} href={link.url} className="block text-gray-800 font-medium hover:text-pink-600 py-2 border-b border-gray-100">{link.text}</a>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">My Account</p>
                      {user ? (
                          <>
                            <p className="font-medium text-gray-800 mb-2">{user.name}</p>
                            <Link to={user.isAdmin ? "/admin" : "/dashboard"} className="block text-pink-600 py-1">Dashboard</Link>
                            <button onClick={logout} className="block text-red-600 py-1">Logout</button>
                          </>
                      ) : (
                          <Link to="/login" className="block text-pink-600 font-bold py-2">Login / Register</Link>
                      )}
                  </div>
              </nav>
          </div>
      )}
    </header>
  );
};

export default Header;
