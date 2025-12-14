
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrl } from '../utils/seoHelper';

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
    const canonicalUrl = getCanonicalUrl(location);
    const siteName = "Ladies Smart Choice";
    const defaultImage = "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop"; // Fallback
    const metaImage = image || defaultImage;
    const metaDesc = description ? description.substring(0, 160) : "Shop the latest women's fashion, clothing, and accessories at Ladies Smart Choice.";

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{title} | {siteName}</title>
            <meta name="description" content={metaDesc} />
            {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
            <link rel="canonical" href={canonicalUrl} />
            
            {/* Robots */}
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={metaDesc} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
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
