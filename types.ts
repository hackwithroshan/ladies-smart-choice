export interface SiteSettings {
    storeName: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    checkoutMode: 'standard' | 'magic';
    showSmartPopup?: boolean;
    popupDelay?: number;
    currency: string;
    taxRate: number;
    shippingCharge: number;
    videoAutoplay: boolean;
    whatsappNumber?: string;
    whatsappMessage?: string;
    metaPixelId?: string;
    metaAccessToken?: string;
    metaCatalogId?: string;
    trackPageView?: boolean;
    trackViewContent?: boolean;
    trackAddToCart?: boolean;
    trackInitiateCheckout?: boolean;
    trackPurchase?: boolean;
    isMaintenanceMode?: boolean;
}

export type AdminView = 
    | 'dashboard' 
    | 'analytics' 
    | 'products' 
    | 'categories' 
    | 'inventory' 
    | 'orders' 
    | 'customers' 
    | 'discounts' 
    | 'marketing' 
    | 'settings' 
    | 'header-settings' 
    | 'footer' 
    | 'media' 
    | 'cms' 
    | 'slider' 
    | 'shop-videos' 
    | 'reviews' 
    | 'admin-profile' 
    | 'create-product' 
    | 'edit-product' 
    | 'pdp-builder' 
    | 'homepage-seo';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    joinDate: string;
    avatarUrl?: string;
    totalSpent?: number;
    totalOrders?: number;
    segment?: string;
}

export interface Product {
    id: string;
    _id?: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    category: string;
    price: number;
    mrp?: number;
    stock: number;
    imageUrl: string;
    galleryImages?: string[];
    sku?: string;
    barcode?: string;
    status?: 'Active' | 'Draft' | 'Archived';
    hasVariants?: boolean;
    variants?: ProductVariant[];
    reviews?: Review[];
    lowStockThreshold?: number;
    dimensions?: { length: number; width: number; height: number };
    brand?: string;
}

export interface ProductVariant {
    name: string;
    options: {
        value: string;
        price: number;
        stock: number;
        image?: string;
    }[];
}

export interface Review {
    id: string;
    _id?: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Order {
    id: string;
    orderNumber?: number;
    date: string;
    status: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    total: number;
    items: {
        name: string;
        quantity: number;
        price: number;
        imageUrl?: string;
    }[];
    shippingAddress: {
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
    checkoutType?: 'standard' | 'magic';
    // Fix: Added missing properties used in admin order view
    trackingInfo?: {
        carrier?: string;
        trackingNumber?: string;
        estimatedDelivery?: string;
    };
    notes?: string;
}

export interface HomeSection {
    id: string;
    type: 'Hero' | 'Collections' | 'NewArrivals' | 'BestSellers' | 'Videos' | 'Newsletter' | 'CustomCode';
    isActive: boolean;
    title?: string;
    code?: string;
    settingsJson?: string;
    settings?: {
        subtitle?: string;
        limit?: number;
        isSlider?: boolean;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        marginTop?: number;
        marginBottom?: number;
        backgroundColor?: string;
        textColor?: string;
        titleSize?: number;
        titleWeight?: number;
        titleItalic?: boolean;
        subtitleSize?: number;
        subtitleWeight?: number;
        subtitleItalic?: boolean;
        alignment?: 'left' | 'center' | 'right';
        itemStyle?: 'Default' | 'ImageOnly';
        itemBgColor?: string;
        itemBorder?: boolean;
        itemBorderColor?: string;
        itemBorderRadius?: number;
        itemPadding?: number;
        itemShadow?: boolean;
        itemHeight?: string;
        showBadge?: boolean;
        badgeText?: string;
        showWishlist?: boolean;
        wishlistPosition?: string;
        itemTitleSize?: number;
        itemTitleColor?: string;
        itemPriceSize?: number;
        itemPriceColor?: string;
        showVariants?: boolean;
        desktopWidth?: string;
    };
}

export interface HomepageLayout {
    sections: HomeSection[];
}

export interface Category {
    id: string;
    name: string;
    subcategories: { id: string; name: string }[];
}

export interface Slide {
    _id?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    title: string;
    subtitle: string;
    buttonText?: string;
    imageFit?: 'cover' | 'contain' | 'fill';
    desktopHeight?: string;
    mobileHeight?: string;
    desktopWidth?: string;
    mobileWidth?: string;
}

export interface Collection {
    id: string;
    _id?: string;
    title: string;
    slug: string;
    imageUrl?: string;
    products?: Product[];
    isActive?: boolean;
    displayStyle?: 'Rectangle' | 'Square' | 'Circle' | 'ImageOnly';
}

export interface ShoppableVideo {
    id: string;
    _id?: string;
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
    price?: string;
    productLink?: string;
    targets?: { type: string; id: string; name: string }[];
    sortOrder?: number;
}

export interface Testimonial {
    id: string;
    name: string;
    comment: string;
    rating: number;
}

export interface HeaderSettings {
    logoText: string;
    logoUrl?: string;
    brandColor?: string;
    phoneNumber?: string;
    announcementMessage?: string;
    announcementMessages?: string[];
    announcementBgColor?: string;
    announcementTextColor?: string;
    topBarLinks: HeaderLink[];
    mainNavLinks: HeaderLink[];
}

export interface HeaderLink {
    text: string;
    url: string;
    isSpecial?: boolean;
    isMegaMenu?: boolean;
    subLinks?: SubLink[];
    megaColumns?: MegaMenuColumn[];
}

export interface SubLink {
    text: string;
    url: string;
}

export interface MegaMenuColumn {
    title: string;
    links: SubLink[];
}

export interface FooterSettings {
    logoUrl?: string;
    brandDescription?: string;
    copyrightText?: string;
    socialLinks: SocialLink[];
    columns: FooterColumn[];
    backgroundColor?: string;
    backgroundImage?: string;
    overlayColor?: string;
    overlayOpacity?: number;
    textColor?: string;
    headingColor?: string;
    linkColor?: string;
    showNewsletter?: boolean;
    newsletterTitle?: string;
    newsletterSubtitle?: string;
    newsletterPlacement?: 'Top' | 'InColumn';
}

export interface FooterColumn {
    title: string;
    links: FooterLink[];
}

export interface FooterLink {
    text: string;
    url: string;
}

export interface SocialLink {
    platform: string;
    url: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    imageUrl?: string;
    createdAt: string;
    status: 'Published' | 'Draft';
}

export interface ContentPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    updatedAt: string;
    status: 'Published' | 'Hidden';
}

export interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    public_id?: string;
    format?: string;
}

export interface Campaign {
    id: string;
    name: string;
    type: string;
    status: string;
    openRate?: number;
    clickRate?: number;
}

export interface Discount {
    id: string;
    code: string;
    type: 'Percentage' | 'Flat';
    value: number;
    scope: 'Cart' | 'Product' | 'Category';
    scopeIds?: string[];
    usageCount: number;
    maxUsage?: number;
    isActive: boolean;
    endDate?: string;
    startDate?: string;
    minOrderValue?: number;
    usageLimitPerUser?: number;
}

export interface SyncLog {
    service: string;
    timestamp: string;
    status: string;
}

export type PDPSectionType = 'Hero' | 'A+Content' | 'FAQ' | 'Reviews' | 'RelatedProducts' | 'CustomCode';

export interface PDPSection {
    id: string;
    type: PDPSectionType;
    isActive: boolean;
    content?: any;
    code?: string;
    style?: any;
    settingsJson?: string;
}

export interface ProductPageLayout {
    productId: string;
    isGlobal?: boolean;
    sections: PDPSection[];
    stickyAtcEnabled?: boolean;
}

export interface HomePageSettings {
    seoTitle: string;
    seoDescription?: string;
    seoKeywords?: string[];
}

export interface ShippingProvider {
    slug: string;
    name: string;
    isEnabled: boolean;
    credentials?: any;
    settings?: any;
    isTestMode?: boolean;
}