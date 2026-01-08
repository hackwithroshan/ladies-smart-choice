
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
    HeaderSettings, 
    FooterSettings, 
    Category,
    Product,
    Slide,
    Collection,
    ShoppableVideo,
    Testimonial,
    SiteSettings,
    HomePageSettings,
    HomepageLayout
} from '../types';
import { getApiUrl } from '../utils/apiHelper';

interface SiteDataContextType {
    headerSettings: HeaderSettings;
    footerSettings: FooterSettings;
    categories: Category[];
    products: Product[];
    slides: Slide[];
    collections: Collection[];
    videos: ShoppableVideo[];
    testimonials: Testimonial[];
    siteSettings: SiteSettings | null;
    homePageSettings: HomePageSettings | null;
    homepageLayout: HomepageLayout | null;
    loading: boolean;
    refreshSiteData: () => Promise<void>;
}

const initialHeaderSettings: HeaderSettings = {
    logoText: 'Ayushree Ayurveda',
    logoUrl: '',
    brandColor: '#16423C',
    phoneNumber: '',
    topBarLinks: [],
    mainNavLinks: [],
};

const initialFooterSettings: FooterSettings = {
    brandDescription: '',
    copyrightText: '',
    socialLinks: [],
    columns: [],
    backgroundColor: '#16423C',
    textColor: '#D1D5DB',
    headingColor: '#6A9C89',
    linkColor: '#9CA3AF',
    showNewsletter: true,
    newsletterPlacement: 'Top'
};

const SiteDataContext = createContext<SiteDataContextType>({
    headerSettings: initialHeaderSettings,
    footerSettings: initialFooterSettings,
    categories: [],
    products: [],
    slides: [],
    collections: [],
    videos: [],
    testimonials: [],
    siteSettings: null,
    homePageSettings: null,
    homepageLayout: null,
    loading: true,
    refreshSiteData: async () => {},
});

export const SiteDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(initialHeaderSettings);
    const [footerSettings, setFooterSettings] = useState<FooterSettings>(initialFooterSettings);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [videos, setVideos] = useState<ShoppableVideo[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [homePageSettings, setHomePageSettings] = useState<HomePageSettings | null>(null);
    const [homepageLayout, setHomepageLayout] = useState<HomepageLayout | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSiteData = useCallback(async () => {
        try {
            const response = await fetch(getApiUrl('app-data'));
            if (!response.ok) throw new Error('Store data fetch failed');
            const data = await response.json();

            setHeaderSettings(data.headerSettings || initialHeaderSettings);
            setFooterSettings(data.footerSettings || initialFooterSettings);
            setCategories(data.categories || []);
            setProducts(data.products || []);
            setSlides(data.slides || []);
            setCollections(data.collections || []);
            setVideos(data.videos || []);
            setTestimonials(data.testimonials || []);
            setSiteSettings(data.siteSettings || null);
            setHomePageSettings(data.homePageSettings || null);
            
            // CRITICAL: Extract layout from app-data
            if (data.homepageLayout) {
                setHomepageLayout(data.homepageLayout);
            } else {
                setHomepageLayout({ sections: [] });
            }

            if (data.siteSettings) {
                const root = document.documentElement;
                root.style.setProperty('--brand-primary', data.siteSettings.primaryColor || '#16423C');
                root.style.setProperty('--brand-accent', data.siteSettings.accentColor || '#6A9C89');
            }
        } catch (error) {
            console.error("Critical: Failed to sync with database:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSiteData();
    }, [fetchSiteData]);

    return (
        <SiteDataContext.Provider value={{ 
            headerSettings, 
            footerSettings, 
            categories, 
            products, 
            slides, 
            collections, 
            videos, 
            testimonials, 
            siteSettings, 
            homePageSettings, 
            homepageLayout,
            loading,
            refreshSiteData: fetchSiteData 
        }}>
            {children}
        </SiteDataContext.Provider>
    );
};

export const useSiteData = () => useContext(SiteDataContext);
