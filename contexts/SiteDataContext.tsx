

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
import { COLORS } from '../constants';

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
}

// Define initial empty states for settings to prevent errors on first render
const initialHeaderSettings: HeaderSettings = {
    logoText: 'Ladies Smart Choice',
    logoUrl: '',
    brandColor: COLORS.primary,
    phoneNumber: '... ...',
    topBarLinks: [],
    mainNavLinks: [],
};

const initialFooterSettings: FooterSettings = {
    brandDescription: '',
    copyrightText: '',
    socialLinks: [],
    columns: [],
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

    useEffect(() => {
        const fetchSiteData = async () => {
            try {
                // Use a single, efficient endpoint to fetch all initial data
                const response = await fetch(getApiUrl('/app-data'));
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();

                // Populate all state from the aggregated response
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

            } catch (error) {
                console.error("Failed to fetch site data:", error);
                // In case of API error, app can still run with initial empty data
            } finally {
                setLoading(false);
            }
        };

        fetchSiteData();
    }, []);

    const value = { 
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
        loading 
    };

    return (
        <SiteDataContext.Provider value={value}>
            {children}
        </SiteDataContext.Provider>
    );
};

export const useSiteData = () => {
    const context = useContext(SiteDataContext);
    if (context === undefined) {
        throw new Error('useSiteData must be used within a SiteDataProvider');
    }
    return context;
};