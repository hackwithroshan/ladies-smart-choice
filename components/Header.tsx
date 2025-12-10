
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

// --- Skeleton Loader Components for Search ---
const SearchResultSkeleton: React.FC = () => (
    <li className="flex items-center p-3">
        <div className="w-12 h-12 rounded-md bg-gray-200 mr-4"></div>
        <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
    </li>
);

const FeaturedProductSkeleton: React.FC = () => (
    <div className="flex items-center gap-3 p-2">
        <div className="w-12 h-12 rounded bg-gray-200"></div>
        <div className="space-y-1.5 flex-1">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
    </div>
);


const Header: React.FC<HeaderProps> = ({ user, logout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileCategory, setOpenMobileCategory] = useState<string | null>(null);
  
  // --- Centralized Data from Context ---
  const { headerSettings, categories, loading: siteDataLoading } = useSiteData();

  // --- Enhanced Search State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { cartCount } = useCart();
  const navigate = useNavigate();

  // --- Click outside handler for search panel & profile menu ---
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
  
  // --- Fetch initial featured products OR search results ---
  useEffect(() => {
    if (!isSearchPanelOpen) {
      setSearchResults([]);
      return;
    }
    
    // Show featured products on focus with empty input
    if (searchTerm.length < 2) {
      setSearchResults([]); 
      if (featuredProducts.length === 0) {
        const fetchFeatured = async () => {
          setIsInitialLoading(true);
          try {
            const response = await fetch(getApiUrl(`/products/featured`));
            if (response.ok) setFeaturedProducts(await response.json());
          } catch (error) { console.error('Featured products fetch failed:', error); } 
          finally { setIsInitialLoading(false); }
        };
        fetchFeatured();
      }
      return;
    }

    // Debounce and search when user types
    const handler = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const query = new URLSearchParams({ q: searchTerm });
        const response = await fetch(getApiUrl(`/products/search?${query.toString()}`));
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
  }, [isSearchPanelOpen, searchTerm, featuredProducts.length]);

  const handleSearchNavigate = () => {
    if (searchTerm.trim()) {
      setIsSearchPanelOpen(false);
      // This is a placeholder for a future search results page.
      // For now, it will just close the panel.
      console.log(`Navigating to search page for: "${searchTerm.trim()}"`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSearchNavigate();
      }
  };

  const brandColor = headerSettings.brandColor || COLORS.primary;
  const trendingSearches = ['Summer Dress', 'Handbag', 'Red Heels', 'Necklace'];

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

          {/* Search Bar */}
          <div className="flex-1 w-full lg:max-w-xl lg:mx-8 relative" ref={searchRef}>
            <div className="flex items-center border-2 border-gray-200 rounded-lg w-full relative transition-colors focus-within:border-rose-500">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchPanelOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search for dresses, handbags..." 
                className="w-full pl-4 pr-12 py-3 text-base focus:outline-none rounded-lg" 
              />
              <button 
                onClick={handleSearchNavigate}
                className="absolute right-0 text-white h-full px-5 rounded-r-md transition-colors hover:opacity-90 flex items-center justify-center" 
                style={{backgroundColor: COLORS.accent}}
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            </div>

            {/* --- Enhanced Search Panel --- */}
            {isSearchPanelOpen && (
                <div className="absolute top-full mt-2 w-full lg:w-[600px] lg:-translate-x-12 bg-white rounded-xl shadow-2xl border border-gray-200 z-10 overflow-hidden animate-fade-in-up">
                    {searchLoading ? (
                        <ul className="animate-pulse">
                            <SearchResultSkeleton />
                            <SearchResultSkeleton />
                            <SearchResultSkeleton />
                        </ul>
                    ) : searchTerm.length < 2 ? (
                        // --- Initial Recommendations View ---
                        <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-1/3 p-4 border-b md:border-b-0 md:border-r">
                                <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Trending</h3>
                                <div className="space-y-2">
                                    {trendingSearches.map(term => (
                                        <button key={term} onClick={() => setSearchTerm(term)} className="block text-sm text-gray-700 hover:text-rose-600">{term}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 p-4">
                                <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Featured Products</h3>
                                {isInitialLoading ? (
                                    <div className="grid grid-cols-2 gap-4 animate-pulse">
                                        <FeaturedProductSkeleton />
                                        <FeaturedProductSkeleton />
                                        <FeaturedProductSkeleton />
                                        <FeaturedProductSkeleton />
                                    </div>
                                ) : featuredProducts.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {featuredProducts.map(product => (
                                            <Link key={product.id} to={`/product/${product.slug}`} onClick={() => setIsSearchPanelOpen(false)} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-md">
                                                <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded"/>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-800 line-clamp-2">{product.name}</p>
                                                    <p className="text-xs font-bold text-rose-600">₹{product.price.toLocaleString()}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-gray-400">No featured products.</p>}
                            </div>
                        </div>
                    ) : (
                        // --- Active Search Results View ---
                        <div>
                            {searchResults.length > 0 ? (
                                <ul>
                                    {searchResults.map(product => (
                                        <li key={product.id}>
                                            <Link to={`/product/${product.slug}`} onClick={() => setIsSearchPanelOpen(false)} className="flex items-center p-3 hover:bg-gray-50 transition-colors border-b last:border-0">
                                                <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md mr-4"/>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                                    <p className="text-sm font-bold text-rose-600">₹{product.price.toLocaleString()}</p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-sm text-gray-500">No products found for "{searchTerm}".</div>
                            )}
                        </div>
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
        <Link to="/contact" className="font-semibold text-gray-800 hover:text-pink-600 transition-colors">Contact Us</Link>
      </div>

      {/* --- Full-Screen Mobile Navigation Menu --- */}
      {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black/60 animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>
              <div className="relative w-4/5 max-w-sm bg-white h-full flex flex-col animate-slide-in-left">
                  <div className="p-4 border-b flex justify-between items-center">
                      <span className="font-bold text-lg">Menu</span>
                      <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-4 space-y-4">
                      <div>
                          <p className="text-xs font-bold uppercase text-gray-400 px-2 mb-2">Shop by Category</p>
                          <div className="space-y-1">
                              {categories.map(category => (
                                  <div key={category.id}>
                                      <button onClick={() => setOpenMobileCategory(openMobileCategory === category.id ? null : category.id)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-100 font-medium">
                                          <span>{category.name}</span>
                                          <ChevronDownIcon className={`transition-transform ${openMobileCategory === category.id ? 'rotate-180' : ''}`} />
                                      </button>
                                      {openMobileCategory === category.id && (
                                          <div className="pl-4 mt-1 space-y-1 border-l-2 ml-2">
                                              {category.subcategories.map(sub => (
                                                  <Link key={sub.id} to="/" className="block p-2 text-gray-600 hover:text-black rounded-md text-sm">{sub.name}</Link>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="border-t pt-4">
                           <p className="text-xs font-bold uppercase text-gray-400 px-2 mb-2">More</p>
                           {headerSettings.mainNavLinks.map(link => (
                               <a key={link._id || link.text} href={link.url} className="block font-medium p-2 rounded-md hover:bg-gray-100">{link.text}</a>
                           ))}
                      </div>
                  </nav>
                  <div className="p-4 border-t">
                      {user ? (
                          <div className="space-y-2">
                            <p className="text-sm">Signed in as <span className="font-bold">{user.name}</span></p>
                            <Link to={user.isAdmin ? "/admin" : "/dashboard"} className="block text-center w-full py-2 bg-gray-800 text-white font-medium rounded-md">Dashboard</Link>
                            <button onClick={logout} className="block text-center w-full py-2 text-red-600 font-medium rounded-md hover:bg-red-50">Logout</button>
                          </div>
                      ) : (
                          <Link to="/login" className="block text-center w-full py-3 bg-rose-600 text-white font-bold rounded-md shadow-sm">Login / Register</Link>
                      )}
                  </div>
              </div>
          </div>
      )}
    </header>
  );
};

export default Header;
