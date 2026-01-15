
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useSiteData } from '../contexts/SiteDataContext';
import { cn } from '../utils/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "./ui/command";
import {
    Search,
    ShoppingCart,
    Heart,
    User as UserIcon,
    Menu as MenuIcon,
    Phone,
    ChevronDown,
    MapPin,
    HelpCircle,
    X
} from 'lucide-react';

const Header: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { headerSettings, siteSettings, products, collections } = useSiteData();
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchTerm, setSearchTerm] = useState('');
    const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
    const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile search toggle

    // Dynamic Colors
    const brandColor = siteSettings?.primaryColor || '#16423C';
    const accentColor = siteSettings?.accentColor || '#6A9C89';

    // Announcement Rotation
    useEffect(() => {
        const messages = headerSettings?.announcementMessages || [];
        if (messages.length > 1) {
            const interval = setInterval(() => {
                setCurrentAnnouncementIndex(prev => (prev + 1) % messages.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [headerSettings?.announcementMessages]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/collections/all?search=${encodeURIComponent(searchTerm)}`);
            setIsSearchOpen(false);
        }
    };

    return (
        <header className="w-full flex flex-col z-50 relative font-sans">

            {/* 1. TOP HEADER: Compact & Clean */}
            <div style={{ backgroundColor: brandColor }} className="text-white py-1.5 text-[11px] font-medium transition-colors duration-300">
                <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">

                    {/* Left: Contact / Info */}
                    <div className="hidden md:flex items-center gap-4 opacity-90">
                        {headerSettings?.phoneNumber && (
                            <a href={`tel:${headerSettings.phoneNumber}`} className="flex items-center gap-1.5 hover:opacity-100 transition-opacity">
                                <Phone size={12} fill="currentColor" />
                                <span>{headerSettings.phoneNumber}</span>
                            </a>
                        )}
                        <span className="hidden lg:inline-flex items-center gap-1.5">
                            <MapPin size={12} />
                            <span>Store Locator</span>
                        </span>
                    </div>

                    {/* Center: Announcement Carousel */}
                    <div className="flex-1 text-center truncate px-4">
                        <p className="tracking-wide animate-in fade-in slide-in-from-top-1 duration-500">
                            {(headerSettings?.announcementMessages?.length ? headerSettings.announcementMessages : ['Welcome to our store!'])[currentAnnouncementIndex]}
                        </p>
                    </div>

                    {/* Right: Top Links */}
                    <div className="hidden md:flex items-center gap-4 opacity-90 justify-end">
                        {(headerSettings?.topBarLinks || []).slice(0, 3).map((link, idx) => (
                            <Link key={idx} to={link.url} className="hover:opacity-100 hover:underline transition-all">
                                {link.text}
                            </Link>
                        ))}
                        <Link to="/contact" className="flex items-center gap-1.5 hover:opacity-100">
                            <HelpCircle size={12} />
                            <span>Help</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* 2. MIDDLE HEADER: Compact Logo & Actions */}
            <div className="bg-white border-b border-zinc-100 py-3 lg:py-4">
                <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between gap-4 lg:gap-8">

                    {/* Mobile Menu Trigger */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9">
                                    <MenuIcon className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px]">
                                <SheetHeader className="text-left border-b pb-4 mb-4">
                                    <SheetTitle className="font-bold text-xl text-left" style={{ color: brandColor }}>
                                        {siteSettings?.storeName || "Store"}
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-1">
                                    {(headerSettings?.mainNavLinks || []).map((link, idx) => (
                                        <Link
                                            key={idx}
                                            to={link.url}
                                            className="px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 rounded-md transition-colors flex justify-between items-center group"
                                        >
                                            {link.text}
                                            <ChevronDown size={14} className="opacity-0 -rotate-90 group-hover:opacity-50 transition-all" />
                                        </Link>
                                    ))}
                                </div>
                                <div className="mt-auto border-t pt-4">
                                    {user ? (
                                        <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={logout}>
                                            Log Out
                                        </Button>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" size="sm" asChild><Link to="/login">Login</Link></Button>
                                            <Button size="sm" style={{ backgroundColor: brandColor }} asChild><Link to="/register">Sign Up</Link></Button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                        {siteSettings?.logoUrl ? (
                            <img src={siteSettings.logoUrl} alt={siteSettings.storeName} className="h-8 lg:h-9 w-auto object-contain" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 text-white rounded-md flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105" style={{ backgroundColor: brandColor }}>
                                    {siteSettings?.storeName?.[0] || 'A'}
                                </div>
                                <span className="text-lg lg:text-xl font-bold tracking-tight leading-none block" style={{ color: brandColor }}>
                                    {siteSettings?.storeName || "Brand"}
                                </span>
                            </div>
                        )}
                    </Link>

                    {/* Search Bar - Desktop (Dynamic & Real Data) */}
                    <div className="hidden lg:flex flex-1 max-w-xl mx-auto z-50">
                        <Command
                            shouldFilter={true}
                            className="rounded-full border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all duration-300 overflow-visible relative [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:px-6"
                        >
                            <CommandInput
                                placeholder="Search for pure wellness..."
                                className="h-12 border-none focus:ring-0 text-base font-medium text-gray-700 placeholder:text-gray-400"
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                                onFocus={() => setIsSearchOpen(true)}
                                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                            />
                            {isSearchOpen && (
                                <div
                                    className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-top-2 overflow-hidden z-[100]"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    <CommandList className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                                        <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                                            No results found.
                                        </CommandEmpty>

                                        {/* Default View: Recommendations */}
                                        {!searchTerm && (
                                            <>
                                                <CommandGroup heading="New Arrivals">
                                                    {products.slice(0, 3).map((product: any) => (
                                                        <CommandItem
                                                            key={product.id || product._id}
                                                            value={product.name}
                                                            onSelect={() => {
                                                                setIsSearchOpen(false);
                                                                navigate(`/product/${product.slug || product._id || product.id}`);
                                                            }}
                                                            className="p-0 rounded-lg cursor-pointer aria-selected:bg-transparent hover:bg-gray-100 transition-colors my-1 data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                                        >
                                                            <Link
                                                                to={`/product/${product.slug || product._id || product.id}`}
                                                                className="flex items-center gap-3 p-2 w-full relative z-50"
                                                                onClick={() => setIsSearchOpen(false)}
                                                            >
                                                                <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                                                                    <img
                                                                        src={product.imageUrl || product.images?.[0] || 'https://via.placeholder.com/100'}
                                                                        alt={product.name}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-medium text-sm text-gray-900 truncate">{product.name}</span>
                                                                    <span className="text-xs text-brand-primary font-bold">
                                                                        {siteSettings?.currency}{product.price}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                                <CommandSeparator className="my-2" />
                                                <CommandGroup heading="Trending Collections">
                                                    {(collections || []).slice(0, 4).map((col: any) => (
                                                        <CommandItem
                                                            key={col.id}
                                                            value={col.title}
                                                            onSelect={() => {
                                                                setIsSearchOpen(false);
                                                                navigate(`/collections/${col.slug || col.id}`);
                                                            }}
                                                            className="p-0 cursor-pointer rounded-lg aria-selected:bg-transparent hover:bg-gray-100 my-0.5 data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                                        >
                                                            <Link
                                                                to={`/collections/${col.slug || col.id}`}
                                                                className="flex items-center gap-3 p-2 w-full relative z-50"
                                                                onClick={() => setIsSearchOpen(false)}
                                                            >
                                                                <div className="h-8 w-8 rounded-md overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                                                                    {col.imageUrl ? (
                                                                        <img src={col.imageUrl} alt={col.title} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <Search className="h-4 w-4 opacity-40" />
                                                                    )}
                                                                </div>
                                                                <span className="font-medium text-sm">{col.title}</span>
                                                            </Link>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </>
                                        )}

                                        {/* Search Results: Real Filtering */}
                                        {searchTerm && (
                                            <>
                                                {/* Collections Matches */}
                                                <CommandGroup heading="Collections">
                                                    {(collections || []).map((col: any) => (
                                                        <CommandItem
                                                            key={col.id}
                                                            value={col.title}
                                                            onSelect={() => {
                                                                setIsSearchOpen(false);
                                                                navigate(`/collections/${col.slug || col.id}`);
                                                            }}
                                                            className="p-0 cursor-pointer rounded-lg aria-selected:bg-transparent hover:bg-gray-100 my-0.5 data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                                        >
                                                            <Link
                                                                to={`/collections/${col.slug || col.id}`}
                                                                className="flex items-center gap-3 p-2 w-full relative z-50"
                                                                onClick={() => setIsSearchOpen(false)}
                                                            >
                                                                <div className="h-8 w-8 rounded-md overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                                                                    {col.imageUrl ? (
                                                                        <img src={col.imageUrl} alt={col.title} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <Search className="h-4 w-4 opacity-40" />
                                                                    )}
                                                                </div>
                                                                <span className="font-medium text-sm">{col.title}</span>
                                                            </Link>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>

                                                {/* Product Matches */}
                                                <CommandGroup heading="Products">
                                                    {products.map((product: any) => (
                                                        <CommandItem
                                                            key={product.id || product._id}
                                                            value={product.name}
                                                            onSelect={() => {
                                                                setIsSearchOpen(false);
                                                                navigate(`/product/${product.slug || product._id || product.id}`);
                                                            }}
                                                            className="p-0 cursor-pointer aria-selected:bg-transparent hover:bg-gray-100 rounded-lg transition-colors my-1 data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                                        >
                                                            <Link
                                                                to={`/product/${product.slug || product._id || product.id}`}
                                                                className="flex items-center gap-3 p-2 w-full relative z-50"
                                                                onClick={() => setIsSearchOpen(false)}
                                                            >
                                                                <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                                                                    <img
                                                                        src={product.imageUrl || product.images?.[0] || 'https://via.placeholder.com/100'}
                                                                        alt={product.name}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-medium text-sm text-gray-900 block truncate">{product.name}</span>
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-primary/10 text-brand-primary font-bold w-fit mt-0.5">
                                                                        {siteSettings?.currency}{product.price}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </>
                                        )}
                                    </CommandList>
                                </div>
                            )}
                        </Command>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:gap-3">
                        <TooltipProvider delayDuration={0}>

                            {/* Mobile Search Toggle */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="lg:hidden rounded-full border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-white hover:text-primary hover:scale-105 transition-all duration-300 shadow-sm"
                                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                                    >
                                        {isSearchOpen ? <X size={20} className="stroke-[2.5px]" /> : <Search size={20} className="stroke-[2.5px]" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>Search</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full relative border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-white hover:text-rose-600 hover:border-rose-200 hover:scale-110 hover:shadow-md transition-all duration-300 shadow-sm hidden sm:flex group"
                                        asChild
                                    >
                                        <Link to="/wishlist">
                                            <Heart className="h-5 w-5 stroke-[2px] group-hover:fill-current transition-all" />
                                            {wishlistCount > 0 && (
                                                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-[10px] text-white shadow-sm ring-2 ring-white animate-in zoom-in" style={{ backgroundColor: accentColor }}>
                                                    {wishlistCount}
                                                </span>
                                            )}
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>Wishlist</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full relative border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-white hover:scale-110 hover:shadow-md transition-all duration-300 shadow-sm group"
                                        style={{ '--hover-color': brandColor } as any}
                                        asChild
                                    >
                                        <Link to="/cart">
                                            <ShoppingCart className="h-5 w-5 stroke-[2px] group-hover:text-[var(--hover-color)] transition-colors" />
                                            {cartCount > 0 && (
                                                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] text-white shadow-sm ring-2 ring-white animate-in zoom-in" style={{ backgroundColor: brandColor }}>
                                                    {cartCount}
                                                </Badge>
                                            )}
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>Cart</p>
                                </TooltipContent>
                            </Tooltip>

                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="inline-flex">
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="rounded-full border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-white hover:scale-110 hover:shadow-md transition-all duration-300 shadow-sm focus:ring-2 focus:ring-zinc-200 focus:ring-offset-2"
                                                >
                                                    {user ? (
                                                        <div className="h-full w-full rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm" style={{ backgroundColor: accentColor }}>
                                                            {user.name?.[0]?.toUpperCase()}
                                                        </div>
                                                    ) : (
                                                        <UserIcon className="h-5 w-5 stroke-[2px] hover:text-black transition-colors" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Account</p>
                                    </TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end" className="w-56 mt-1">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {user ? (
                                        <>
                                            <div className="px-2 py-1.5 text-xs text-muted-foreground break-words font-medium bg-zinc-50 mb-1 rounded">
                                                {user.email}
                                            </div>
                                            {user.isAdmin && (
                                                <DropdownMenuItem onClick={() => navigate('/app/dashboard')}>
                                                    Admin Dashboard
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                                                User Dashboard
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                                                Log Out
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <>
                                            <DropdownMenuItem onClick={() => navigate('/login')}>Login</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate('/register')}>Create Account</DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Mobile Search Expandable Area */}
                {
                    isSearchOpen && (
                        <div className="lg:hidden px-4 pb-3 animate-in slide-in-from-top-2">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <Input
                                    placeholder="Search products..."
                                    className="w-full h-9 text-sm pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            </form>
                        </div>
                    )
                }
            </div >

            {/* 3. BOTTOM HEADER: Compact Navigation */}
            < div className="hidden lg:block border-b border-zinc-200/60 bg-white sticky top-0 z-40 shadow-sm" >
                <div className="container mx-auto px-8">
                    <div className="flex items-center justify-center h-11">
                        <nav className="flex items-center gap-8">
                            {(headerSettings?.mainNavLinks || []).map((link, idx) => {
                                const isActive = location.pathname === link.url;
                                return (
                                    <Link
                                        key={idx}
                                        to={link.url}
                                        className={cn(
                                            "text-sm font-medium transition-colors h-11 flex items-center border-b-2 px-1 hover:text-black",
                                            isActive
                                                ? "border-black text-black"
                                                : "border-transparent text-zinc-500"
                                        )}
                                        style={isActive ? { borderColor: brandColor, color: brandColor } : {}}
                                    >
                                        {link.text}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div >
        </header >
    );
};

export default Header;
