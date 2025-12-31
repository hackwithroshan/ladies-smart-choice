export interface HomeSection {
    _id?: string;
    id: string;
    type: 'Hero' | 'Collections' | 'NewArrivals' | 'BestSellers' | 'Videos' | 'Testimonials' | 'Newsletter' | 'CustomCode';
    title?: string;
    isActive: boolean;
    settings?: {
        subtitle?: string;
        alignment?: 'left' | 'center' | 'right';
        titleSize?: number;
        subtitleSize?: number;
        titleWeight?: number;
        subtitleWeight?: number;
        titleItalic?: boolean;
        subtitleItalic?: boolean;
        backgroundColor?: string;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
        desktopHeight?: string;
        mobileHeight?: string;
        desktopWidth?: string;
        mobileWidth?: string;
        customStyles?: string;
        collectionId?: string; 
        limit?: number;        
        desktopColumns?: number; 
        mobileColumns?: number;  
        isSlider?: boolean;
        
        // --- PRODUCT CARD / ITEM DESIGN CONTROLS ---
        itemStyle?: 'Standard' | 'ImageOnly'; 
        itemWidth?: string;       
        itemHeight?: string;      
        itemGap?: number;         
        itemBorderRadius?: number; 
        itemShadow?: boolean;     
        itemBorder?: boolean;     
        itemBorderColor?: string; 
        itemBgColor?: string;     
        itemPadding?: number;     
        
        // Typography & UI Toggles
        itemTitleSize?: number;
        itemPriceSize?: number;
        itemTitleColor?: string;
        itemPriceColor?: string;
        showVariants?: boolean;
        itemVariantStyle?: 'Chips' | 'TextList'; // TextList matches the screenshot style
        showWishlist?: boolean;
        wishlistPosition?: 'top-right' | 'bottom-right-overlay'; // Matching screenshot
        showBuyButton?: boolean;
        showBadge?: boolean;
        badgeText?: string;
        imageFit?: 'cover' | 'contain' | 'fill';
        
        // Title & Overlay Controls
        showItemTitle?: boolean;
        itemTitlePlacement?: 'overlay' | 'below';
        itemTitleWeight?: number;
        showItemOverlay?: boolean;
        itemOverlayColor?: string;
        itemOverlayOpacity?: number;
        itemOverlayGradient?: boolean;
        itemTitleAlignment?: 'start' | 'center' | 'end';
    };
    code?: string;
}

export interface HomepageLayout {
    sections: HomeSection[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}
export interface Review {
  _id?: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  imageUrl?: string;
  userId?: string;
}
export interface Product {
  id: string;
  name: string;
  slug?: string;
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
  dimensions?: { length: number; width: number; height: number; };
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  hasVariants?: boolean;
  variants?: ProductVariant[];
  reviews?: Review[];
  createdAt?: string;
  updatedAt?: string;
}
export interface ProductVariant {
  id?: string;
  name: string;
  options: { value: string; price?: number; stock?: number; image?: string; }[];
}
export interface CartItem extends Product {
  quantity: number;
}
export interface OrderItem {
    productId: string | Product;
    quantity: number;
    name: string;
    price: number;
    imageUrl?: string;
}
export interface Order {
  id: string;
  orderNumber?: number;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: { address: string; city: string; postalCode: string; country: string; };
  trackingInfo?: { carrier: string; trackingNumber: string; shippingLabelUrl?: string; estimatedDelivery?: string; };
  trackingHistory?: { date: string; status: string; location?: string; message: string; }[];
  date: string;
  total: number;
  status: 'Pending' | 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Returned' | 'Cancelled';
  items: OrderItem[];
  paymentInfo?: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string; };
  lastTrackingSync?: string;
}
export type UserRole = 'Super Admin' | 'Manager' | 'Editor' | 'Staff' | 'User';
export interface User {
  id:string;
  name: string;
  email: string;
  joinDate: string;
  totalOrders?: number;
  avatarUrl?: string;
  role: UserRole;
  isAdmin?: boolean; 
  segment?: 'VIP' | 'New' | 'Returning' | 'High-Value'; 
}
export interface SubLink { text: string; url: string; }
export interface MegaMenuColumn { id?: string; title: string; links: SubLink[]; }
export interface HeaderLink { _id?: string; text: string; url: string; isSpecial?: boolean; isMegaMenu?: boolean; subLinks?: SubLink[]; megaColumns?: MegaMenuColumn[]; }
export interface HeaderSettings { _id?: string; logoText: string; logoUrl?: string; brandColor?: string; phoneNumber: string; announcementMessages?: string[]; announcementMessage?: string; announcementBgColor?: string; announcementTextColor?: string; topBarLinks: HeaderLink[]; mainNavLinks: HeaderLink[]; }

export interface SocialLink { platform: string; url: string; }
export interface FooterLink { text: string; url: string; }
export interface FooterColumn { title: string; links: FooterLink[]; }

export interface FooterSettings { 
    _id?: string; 
    logoUrl?: string; 
    brandDescription: string; 
    copyrightText: string; 
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
export interface Slide { 
  _id?: string; 
  imageUrl: string; 
  mobileImageUrl?: string; 
  title: string; 
  subtitle: string; 
  buttonText: string; 
  imageFit?: 'cover' | 'contain' | 'fill';
  desktopHeight?: string;
  mobileHeight?: string;
  desktopWidth?: string;
  mobileWidth?: string;
}
export interface BlogPost { id: string; title: string; slug: string; content: string; excerpt?: string; imageUrl?: string; author?: string; status: 'Published' | 'Draft'; createdAt: string; }
export interface ContentPage { id: string; title: string; slug: string; content: string; status: 'Published' | 'Hidden'; updatedAt: string; }
export interface Campaign { id: string; name: string; type: 'Email' | 'SMS' | 'WhatsApp' | 'Push'; status: 'Draft' | 'Scheduled' | 'Sent'; sentCount: number; openRate: number; clickRate: number; }
export interface Discount { id: string; code: string; type: 'Percentage' | 'Flat' | 'Free Shipping'; value: number; usageCount: number; maxUsage: number; expiry: string; }

// --- SITE SETTINGS ---
export interface SiteSettings { 
    currency: string; 
    taxRate: number; 
    shippingCharge: number; 
    videoAutoplay?: boolean; 
    isMaintenanceMode?: boolean; 
    isMagicCheckoutEnabled?: boolean;
    isCodEnabled?: boolean;
    whatsappNumber?: string; 
    whatsappMessage?: string; 
    fontFamily?: string; 
    metaPixelId?: string; 
    metaAccessToken?: string; 
    metaCatalogId?: string; 
    trackPageView?: boolean; 
    trackViewContent?: boolean; 
    trackAddToCart?: boolean; 
    trackInitiateCheckout?: boolean; 
    trackPurchase?: boolean; 
    storeName?: string; 
    logoUrl?: string; 
    faviconUrl?: string; 
    primaryColor?: string; 
    accentColor?: string; 
}

export interface HomePageSettings { seoTitle: string; seoDescription: string; seoKeywords?: string[]; }
export interface MediaItem { id: string; url: string; public_id: string; format: string; type: 'image' | 'video'; createdAt: string; }
export interface SyncLog { _id: string; service: string; timestamp: string; status: 'success' | 'failed' | 'in_progress'; processedCount: number; error?: string; }
export interface Collection { id: string; title: string; imageUrl: string; slug?: string; displayStyle?: 'Rectangle' | 'Square' | 'Circle' | 'ImageOnly'; description?: string; isActive?: boolean; products?: (Product | string)[]; }
export interface ShoppableVideo { _id: string; title: string; videoUrl: string; thumbnailUrl?: string; price: string; productLink?: string; }
export interface Testimonial { _id: string; name: string; role: string; comment: string; rating: number; imageUrl?: string; }
export interface ShippingProvider { _id?: string; slug: string; name: string; logoUrl?: string; isEnabled: boolean; isTestMode: boolean; credentials: { apiKey?: string; apiSecret?: string; token?: string; merchantId?: string; username?: string; password?: string; }; settings?: { autoShip?: boolean; defaultPickupLocation?: string; }; }