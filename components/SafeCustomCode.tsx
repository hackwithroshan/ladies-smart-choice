
import React, { useEffect, useRef } from 'react';
import { Product } from '../types';

interface SafeCustomCodeProps {
    code: string;
    sectionId: string;
    settingsJson?: string;
    productContext?: Product; 
    relatedProducts?: Product[];
    fbtProducts?: Product[];
}

const SafeCustomCode: React.FC<SafeCustomCodeProps> = ({ 
    code, 
    sectionId, 
    settingsJson, 
    productContext,
    relatedProducts = [],
    fbtProducts = []
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !code) return;

        // 1. Build context object (Merging JSON settings + Product Data)
        let contextObj: Record<string, any> = {
            sectionId,
            relatedProducts: relatedProducts || [],
            fbtProducts: fbtProducts || []
        };
        
        // Parse the section-specific JSON (Liquid-style Settings)
        try {
            if (settingsJson && settingsJson.trim()) {
                const customVars = JSON.parse(settingsJson);
                contextObj = { ...contextObj, ...customVars };
            }
        } catch (e) { 
            console.warn(`[Designer] JSON Syntax Error in ${sectionId}`); 
        }

        // Add Product Global Variables
        if (productContext) {
            contextObj = {
                ...contextObj,
                id: productContext.id || (productContext as any)._id,
                productName: productContext.name,
                price: productContext.price,
                formattedPrice: (productContext.price || 0).toLocaleString('en-IN'),
                mrp: productContext.mrp || 0,
                formattedMrp: (productContext.mrp || 0).toLocaleString('en-IN'),
                productImage: productContext.imageUrl,
                gallery: productContext.galleryImages || [],
                category: productContext.category || 'General',
                brandName: productContext.brand || 'Ayushree',
                shortDescription: productContext.shortDescription || '',
                description: productContext.description || '',
                slug: productContext.slug,
                reviews: productContext.reviews || []
            };
        }

        // 2. Perform string replacement (The Liquid Engine)
        let processedCode = code;
        Object.entries(contextObj).forEach(([key, val]) => {
            if (typeof val !== 'object') {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                processedCode = processedCode.replace(regex, String(val ?? ''));
            }
        });

        // 3. Inject and Execute
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(processedCode, 'text/html');
            
            containerRef.current.innerHTML = '';

            // Handle Styles
            doc.querySelectorAll('style').forEach(s => {
                const styleEl = document.createElement('style');
                styleEl.textContent = s.textContent;
                containerRef.current?.appendChild(styleEl);
            });

            // Handle Body
            const wrapper = document.createElement('div');
            wrapper.id = `wrapper-${sectionId}`;
            const tempBody = doc.body.cloneNode(true) as HTMLElement;
            tempBody.querySelectorAll('script, style').forEach(el => el.remove());
            wrapper.innerHTML = tempBody.innerHTML;
            containerRef.current.appendChild(wrapper);

            // Execute Scripts with context access
            doc.querySelectorAll('script').forEach(s => {
                try {
                    // Create function scope with 'sectionContext' available
                    const runner = new Function('sectionContext', s.innerHTML);
                    runner(contextObj);
                } catch (scriptErr) { 
                    console.error(`[Designer JS Error] ${sectionId}:`, scriptErr); 
                }
            });

        } catch (err) {
            console.error(`[Designer Render Error]`, err);
        }

        return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
    }, [code, settingsJson, productContext, sectionId, relatedProducts, fbtProducts]);

    return (
        <div id={`pdp-section-${sectionId}`} ref={containerRef} className="w-full relative overflow-visible" />
    );
};

export default SafeCustomCode;
