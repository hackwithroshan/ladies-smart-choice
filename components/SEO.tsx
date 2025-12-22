
import React from 'react';
import { Helmet } from 'react-helmet-async';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors
import * as ReactRouterDom from 'react-router-dom';
const { useLocation } = ReactRouterDom as any;
import { getCanonicalUrl } from '../utils/seoHelper';
import { useSiteData } from '../contexts/SiteDataContext';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    type?: 'website' | 'product' | 'article';
    schema?: object | object[]; // JSON-LD Structured Data
    noindex?: boolean;
    keywords?: string[];
}

const SEO: React.FC<SEOProps> = ({ 
    title, 
    description, 
    image, 
    type = 'website', 
    schema, 
    noindex = false,
    keywords = [] 
}) => {
    const location = useLocation();
    const { siteSettings } = useSiteData();
    const canonicalUrl = getCanonicalUrl(location);
    
    // Dynamic brand name
    const siteName = siteSettings?.storeName || "Ayushree Ayurveda";
    
    const defaultImage = siteSettings?.logoUrl || "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop"; 
    const metaImage = image || defaultImage;
    const metaDesc = description ? description.substring(0, 160) : `Discover the best products at ${siteName}.`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{title} | {siteName}</title>
            <meta name="description" content={metaDesc} />
            {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
            <link rel="canonical" href={canonicalUrl} />
            <link rel="icon" type="image/png" href={siteSettings?.faviconUrl || "/favicon.png"} />
            
            {/* Robots */}
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={`${title} | ${siteName}`} />
            <meta property="og:description" content={metaDesc} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`${title} | ${siteName}`} />
            <meta name="twitter:description" content={metaDesc} />
            <meta name="twitter:image" content={metaImage} />

            {/* Structured Data (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
