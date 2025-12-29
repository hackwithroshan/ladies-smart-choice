
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
    HomePageSettings
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
    const [loading, setLoading] = useState(true);

    const fetchSiteData = useCallback(async () => {
        try {
            const response = await fetch(getApiUrl('/app-data'));
            if (!response.ok) throw new Error('Network response was not ok');
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

            if (data.siteSettings) {
                const root = document.documentElement;
                root.style.setProperty('--brand-primary', data.siteSettings.primaryColor || '#16423C');
                root.style.setProperty('--brand-accent', data.siteSettings.accentColor || '#6A9C89');
            }
        } catch (error) {
            console.error("Failed to fetch site data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSiteData();
    }, [fetchSiteData]);

    useEffect(() => {
        if (siteSettings?.fontFamily) {
            const fontName = siteSettings.fontFamily;
            const linkId = 'dynamic-font-link';
            const styleId = 'dynamic-font-style';

            document.getElementById(linkId)?.remove();
            document.getElementById(styleId)?.remove();

            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
            document.head.appendChild(link);

            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                body { font-family: 'Inter', sans-serif; }
                h1, h2, h3, h4, .font-brand { font-family: '${fontName}', serif !important; }
                .bg-brand-primary { background-color: var(--brand-primary) !important; }
                .text-brand-primary { color: var(--brand-primary) !important; }
                .bg-brand-accent { background-color: var(--brand-accent) !important; }
                .text-brand-accent { color: var(--brand-accent) !important; }
                .border-brand-accent { border-color: var(--brand-accent) !important; }
            `;
            document.head.appendChild(style);
        }
    }, [siteSettings?.fontFamily]);

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
            loading,
            refreshSiteData: fetchSiteData 
        }}>
            {children}
        </SiteDataContext.Provider>
    );
};

export const useSiteData = () => useContext(SiteDataContext);
