
export type AdminView =
    | 'dashboard'
    | 'analytics'
    | 'products'
    | 'pdp-builder'
    | 'inventory'
    | 'categories'
    | 'orders'
    | 'abandoned-checkouts'
    | 'drafts'
    | 'create-order'
    | 'customers'
    | 'marketing'
    | 'discounts'
    | 'settings'
    | 'cms'
    | 'shop-videos'
    | 'slider'
    | 'media'
    | 'blogs'
    | 'pages'
    | 'contact-messages'
    | 'admin-profile'
    | 'shipping-integrations'
    | 'magic-setup'
    | 'header-settings'
    | 'footer'
    | 'reviews'
    | 'create-category'
    | 'homepage-seo'
    | 'product-edit'
    | 'category-edit'
    | 'customer-details'
    | 'popup-settings';

export type HomeSectionType =
    | 'Hero'
    | 'Collections'
    | 'NewArrivals'
    | 'BestSellers'
    | 'Videos'
    | 'Testimonials'
    | 'Newsletter'
    | 'CustomCode';

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'Super Admin' | 'Manager' | 'Editor' | 'Staff' | 'User';
    joinDate: string;
    avatarUrl?: string;
    isAdmin?: boolean;
    segment?: string;
    totalOrders?: number;
    totalSpent?: number;
}

export interface Review {
    id?: string;
    userId?: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
}

export interface ProductVariantOption {
    value: string;
    price: number;
    stock: number;
    image?: string;
}

export interface ProductVariant {
    name: string;
    options: ProductVariantOption[];
}

export interface Product {
    id: string;
    _id?: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    brand?: string;
    sku?: string;
    barcode?: string;
    category: string;
    subCategory?: string;
    tags?: string[];
    status: 'Active' | 'Draft' | 'Archived';
    price: number;
    mrp?: number;
    costPrice?: number;
    taxRate?: number;
    stock: number;
    lowStockThreshold?: number;
    allowBackorders?: boolean;
    imageUrl: string;
    galleryImages?: string[];
    videoUrl?: string;
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    hasVariants?: boolean;
    variants?: ProductVariant[];
    reviews?: Review[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Category {
    id: string;
    name: string;
    subcategories: { id: string; name: string }[];
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Order {
    id: string;
    _id?: string;
    orderNumber?: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    // Added checkoutType to match component usage
    checkoutType?: string;
    items: CartItem[];
    total: number;
    status: string;
    date: string;
    paymentId?: string;
    shippingAddress: {
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
    trackingInfo?: {
        carrier: string;
        trackingNumber: string;
        estimatedDelivery?: string;
    };
    trackingHistory?: {
        date: string;
        status: string;
        location?: string;
        message?: string;
    }[];
    notes?: string;
}

export interface HomeSection {
    id: string;
    type: HomeSectionType;
    title?: string;
    isActive: boolean;
    settings?: {
        limit?: number;
        collectionId?: string;
        isSlider?: boolean;
        alignment?: 'left' | 'center' | 'right';
        subtitle?: string;
        backgroundColor?: string;
        textColor?: string;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        marginTop?: number;
        marginBottom?: number;
        desktopWidth?: string;
        mobileWidth?: string;
        tagline?: string;
        buttonText?: string;
        desktopHeight?: string;
        height?: string;
        mobileHeight?: string;
        itemsPerRow?: number;
        titleSize?: number;
        titleWeight?: number;
        titleItalic?: boolean;
        subtitleSize?: number;
        subtitleWeight?: number;
        subtitleItalic?: boolean;
        imageAspectRatio?: string;
    };
    code?: string;
    settingsJson?: string;
}

export interface HomepageLayout {
    sections: HomeSection[];
}

export interface Slide {
    id?: string;
    _id?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    title?: string;
    subtitle?: string;
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
    description?: string;
    imageUrl?: string;
    products?: (string | Product)[];
    isActive: boolean;
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
    targets?: {
        type: 'product' | 'category' | 'custom';
        id: string;
        name: string;
    }[];
}

export interface Testimonial {
    id?: string;
    _id?: string;
    name: string;
    comment: string;
    rating: number;
    imageUrl?: string;
    role?: string;
}

export interface SiteSettings {
    storeName: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    checkoutMode: 'standard' | 'magic';
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
    popupSettings?: {
        isEnabled: boolean;
        image?: string;
        link?: string;
        mode: 'standard' | 'image_only';
    };
}

export interface StoreDetails {
    storeName?: string;
    logoUrl?: string;
    faviconUrl?: string;
    shortDescription?: string;
    longDescription?: string;
    businessType?: 'Individual' | 'Company';
    ownerName?: string;
    legalName?: string;
    companyEmail?: string;
    companyPhone?: string;
    websiteUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    gstin?: string;
    currency?: string;
    timezone?: string;
    language?: string;
}

export interface HomePageSettings {
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
}

export interface SubLink {
    text: string;
    url: string;
}

export interface MegaMenuColumn {
    title: string;
    links: SubLink[];
}

export interface HeaderLink {
    text: string;
    url: string;
    isSpecial?: boolean;
    isMegaMenu?: boolean;
    subLinks?: SubLink[];
    megaColumns?: MegaMenuColumn[];
}

export interface HeaderSettings {
    logoText: string;
    logoUrl: string;
    brandColor: string;
    phoneNumber?: string;
    announcementMessage?: string;
    announcementMessages?: string[];
    announcementBgColor?: string;
    announcementTextColor?: string;
    topBarLinks: HeaderLink[];
    mainNavLinks: HeaderLink[];
}

export interface FooterLink {
    text: string;
    url: string;
}

export interface FooterColumn {
    title: string;
    links: FooterLink[];
}

export interface SocialLink {
    platform: string;
    url: string;
}

export interface FooterSettings {
    logoUrl?: string;
    brandDescription: string;
    copyrightText: string;
    socialLinks: SocialLink[];
    columns: FooterColumn[];
    backgroundColor: string;
    backgroundImage?: string;
    overlayColor?: string;
    overlayOpacity?: number;
    textColor: string;
    headingColor: string;
    linkColor: string;
    showNewsletter: boolean;
    newsletterTitle?: string;
    newsletterSubtitle?: string;
    newsletterPlacement: 'Top' | 'InColumn';
}

export type PDPSectionType = 'Hero' | 'A+Content' | 'FAQ' | 'Reviews' | 'RelatedProducts' | 'CustomCode' | 'ProductDetails';

export interface PDPSection {
    id: string;
    type: PDPSectionType;
    isActive: boolean;
    content?: any;
    settings?: any;
    style?: {
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
        backgroundColor?: string;
        textColor?: string;
        titleFontSize?: number;
        priceFontSize?: number;
        shortDescFontSize?: number;
        imageWidth?: string;
        imageHeight?: string;
        imageAlign?: string;
        containerMaxWidth?: string;
        textAlign?: string;
        imageBorderRadius?: number;
        customClasses?: string;
    };
    code?: string;
    children?: PDPSection[];
}

export interface ProductPageLayout {
    productId: string;
    isGlobal?: boolean;
    sections: PDPSection[];
    stickyAtcEnabled?: boolean;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    imageUrl?: string;
    author?: string;
    status: 'Published' | 'Draft';
    createdAt: string;
    updatedAt: string;
}

export interface ContentPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: 'Published' | 'Hidden';
    createdAt: string;
    updatedAt: string;
}

export interface MediaItem {
    id: string;
    url: string;
    public_id: string;
    format?: string;
    type: 'image' | 'video';
}

export interface Campaign {
    id: string;
    name: string;
    type: 'Email' | 'SMS' | 'WhatsApp' | 'Push';
    status: 'Draft' | 'Scheduled' | 'Sent';
    sentCount: number;
    openRate: number;
    clickRate: number;
}

export interface Discount {
    id: string;
    code: string;
    type: 'Percentage' | 'Flat' | 'Free Shipping';
    value: number;
    usageCount: number;
    maxUsage: number;
    expiry: string;
}

export interface ShippingProvider {
    slug: string;
    name: string;
    logoUrl?: string;
    isEnabled: boolean;
    isTestMode?: boolean;
    credentials: Record<string, string>;
    settings?: {
        autoShip?: boolean;
        defaultPickupLocation?: string;
    };
}

export interface SyncLog {
    id: string;
    service: string;
    status: 'success' | 'failed' | 'in_progress';
    processedCount: number;
    error?: string;
    timestamp: string;
}
