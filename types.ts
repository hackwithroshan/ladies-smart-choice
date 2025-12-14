
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
  // Basic
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  
  // Organization
  category: string;
  subCategory?: string;
  tags?: string[];
  status: 'Active' | 'Draft' | 'Archived';
  
  // Pricing
  price: number; // Selling Price
  mrp?: number; // Market Retail Price
  costPrice?: number; // For profit calculation
  taxRate?: number; // Percentage
  
  // Inventory
  stock: number;
  lowStockThreshold?: number;
  allowBackorders?: boolean;
  
  // Media
  imageUrl: string; // Main Cover
  galleryImages?: string[]; // Additional images
  videoUrl?: string;
  
  // Shipping
  weight?: number; // kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];

  // Variants
  hasVariants?: boolean;
  variants?: ProductVariant[];

  // Reviews
  reviews?: Review[];
}

export interface ProductVariant {
  id?: string;
  name: string; // e.g., "Size" or "Color"
  options: {
    value: string; // e.g., "Red", "XL"
    price?: number; // Overrides base price
    stock?: number; // Specific stock
    image?: string; // Variant specific image
  }[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
    productId: string | Product; // Can be ID or populated object
    quantity: number;
    name: string;
    price: number;
    imageUrl?: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: {
      address: string;
      city: string;
      postalCode: string;
      country: string;
  };
  trackingInfo?: {
      carrier: string;
      trackingNumber: string;
      shippingLabelUrl?: string;
      estimatedDelivery?: string;
  };
  trackingHistory?: {
      date: string;
      status: string;
      location?: string;
      message: string;
  }[];
  date: string;
  total: number;
  status: 'Pending' | 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Returned' | 'Cancelled';
  items: OrderItem[];
  paymentInfo?: {
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
  };
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

// --- Navigation Types (Enhanced for Mega Menu) ---

export interface SubLink {
  text: string;
  url: string;
}

export interface MegaMenuColumn {
  id?: string;
  title: string; // Column Header
  links: SubLink[]; // Links inside this column
}

export interface HeaderLink {
  _id?: string;
  text: string;
  url: string;
  isSpecial?: boolean; // Highlight flag
  
  // Navigation Mode
  isMegaMenu?: boolean; 

  // Data Containers
  subLinks?: SubLink[]; // For Standard Dropdown
  megaColumns?: MegaMenuColumn[]; // For Mega Menu Layout
}

export interface HeaderSettings {
  _id?: string;
  logoText: string;
  logoUrl?: string;
  brandColor?: string;
  phoneNumber: string;
  
  // Announcement Bar
  announcementMessages?: string[]; 
  announcementMessage?: string; 
  announcementBgColor?: string;
  announcementTextColor?: string;

  topBarLinks: HeaderLink[]; 
  mainNavLinks: HeaderLink[];
}

// --- Footer Types ---
export interface FooterLink {
  text: string;
  url: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: 'Facebook' | 'Instagram' | 'Twitter' | 'LinkedIn' | 'YouTube';
  url: string;
}

export interface FooterSettings {
  _id?: string;
  logoUrl?: string;
  brandDescription: string;
  copyrightText: string;
  socialLinks: SocialLink[];
  columns: FooterColumn[];
  
  // Background Styling
  backgroundColor?: string;
  backgroundImage?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

export interface Slide {
  _id?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  title: string;
  subtitle: string;
  buttonText: string;
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
}

export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'Published' | 'Hidden';
  updatedAt: string;
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

export interface SiteSettings {
  currency: string;
  taxRate: number;
  shippingCharge: number;
  videoAutoplay?: boolean;
  
  // Typography
  fontFamily?: string;

  // Meta Pixel & CAPI Settings
  metaPixelId?: string;
  metaAccessToken?: string;
  metaCatalogId?: string;
  
  // Event Tracking Toggles
  trackPageView?: boolean;
  trackViewContent?: boolean;
  trackAddToCart?: boolean;
  trackInitiateCheckout?: boolean;
  trackPurchase?: boolean;
}

export interface HomePageSettings {
    seoTitle: string;
    seoDescription: string;
    seoKeywords?: string[];
}

export interface MediaItem {
  id: string;
  url: string;
  public_id: string;
  format: string;
  type: 'image' | 'video';
  createdAt: string;
}

export interface SyncLog {
  _id: string;
  service: string;
  timestamp: string;
  status: 'success' | 'failed' | 'in_progress';
  processedCount: number;
  error?: string;
}

export interface Collection {
    id: string;
    title: string;
    imageUrl: string;
    slug?: string;
    displayStyle?: 'Rectangle' | 'Square' | 'Circle' | 'ImageOnly';
    description?: string;
    isActive?: boolean;
    products?: (Product | string)[];
}

export interface ShoppableVideo {
    _id: string;
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
    price: string;
    productLink?: string;
}

export interface Testimonial {
    _id: string;
    name: string;
    role: string;
    comment: string;
    rating: number;
    imageUrl?: string;
}

export interface ShippingProvider {
    _id?: string;
    slug: string;
    name: string;
    logoUrl?: string;
    isEnabled: boolean;
    isTestMode: boolean;
    credentials: {
        apiKey?: string;
        apiSecret?: string;
        token?: string;
        merchantId?: string;
        username?: string;
        password?: string;
    };
    settings?: {
        autoShip?: boolean;
        defaultPickupLocation?: string;
    };
}
