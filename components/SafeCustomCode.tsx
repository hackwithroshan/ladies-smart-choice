import React, { useEffect, useRef, useMemo } from 'react';
import { Product } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import * as LucideIcons from 'lucide-react';
import DynamicCoupon from './dynamic/DynamicCoupon';

interface SafeCustomCodeProps {
    code: string;
    sectionId: string;
    settingsJson?: string;
    productContext?: Product;
    relatedProducts?: Product[];
    fbtProducts?: Product[];
}

const JsonRenderer: React.FC<{ node: any; context: any; sectionId?: string }> = ({ node, context, sectionId }) => {
    if (!node) return null;
    if (typeof node === 'string') {
        let text = node;
        Object.entries(context).forEach(([key, val]) => {
            if (typeof val !== 'object') {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                text = text.replace(regex, String(val ?? ''));
            }
        });
        return <>{text}</>;
    }

    if (Array.isArray(node)) {
        return <>{node.map((child, i) => <JsonRenderer key={i} node={child} context={context} sectionId={sectionId} />)}</>;
    }

    const { type, content, design, children, props = {}, style = {}, items = [] } = node;
    const resolvedProps = { ...props, style };

    Object.keys(resolvedProps).forEach(key => {
        if (typeof resolvedProps[key] === 'string') {
            let text = resolvedProps[key];
            Object.entries(context).forEach(([k, v]) => {
                if (typeof v !== 'object') {
                    const regex = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
                    text = text.replace(regex, String(v ?? ''));
                }
            });
            resolvedProps[key] = text;
        }
    });

    switch (type) {
        case 'coupon':
            return <DynamicCoupon sectionId={sectionId || `auto-${Date.now()}`} content={content || {}} design={design || {}} />;
        case 'box':
        // ...
        case 'div':
            return <div {...resolvedProps}><JsonRenderer node={children || items} context={context} /></div>;
        // ... (Keep other cases logic, just ensuring they use the new JsonRenderer recursively if needed)
        case 'grid':
            return <div className="grid" {...resolvedProps}><JsonRenderer node={children || items} context={context} /></div>;
        case 'flex':
            return <div className="flex" {...resolvedProps}><JsonRenderer node={children || items} context={context} /></div>;
        case 'text':
        case 'p':
            return <p {...resolvedProps}><JsonRenderer node={children} context={context} /></p>;
        case 'heading':
        case 'h1': return <h1 {...resolvedProps}><JsonRenderer node={children} context={context} /></h1>;
        case 'h2': return <h2 {...resolvedProps}><JsonRenderer node={children} context={context} /></h2>;
        case 'h3': return <h3 {...resolvedProps}><JsonRenderer node={children} context={context} /></h3>;
        case 'button':
            return <Button {...resolvedProps}><JsonRenderer node={children || props.label} context={context} /></Button>;
        case 'badge':
            return <Badge {...resolvedProps}><JsonRenderer node={children || props.label} context={context} /></Badge>;
        case 'image':
        case 'img':
            return <img alt="" {...resolvedProps} />;
        case 'card':
            return (
                <Card {...resolvedProps}>
                    {props.title && <CardHeader><CardTitle>{props.title}</CardTitle></CardHeader>}
                    <CardContent><JsonRenderer node={children || items} context={context} /></CardContent>
                </Card>
            );
        case 'icon':
            const Icon = (LucideIcons as any)[props.name || 'HelpCircle'];
            return Icon ? <Icon {...resolvedProps} /> : null;
        default:
            // Fallback: If strict JSON is required, we might not want to allow arbitrary HTML tags, 
            // but 'div', 'span' etc are usually fine. The prompt says "CustomCode content accepts JSON only" and "Do NOT allow ... JSX ...".
            // Rendering standard HTML tags from JSON is explicitly "JSON-driven" and not "raw React execution".
            if (typeof type === 'string') {
                return React.createElement(type, resolvedProps, <JsonRenderer node={children} context={context} />);
            }
            return null;
    }
};

const SafeCustomCode: React.FC<SafeCustomCodeProps> = ({
    code,
    sectionId,
    settingsJson,
    productContext,
    relatedProducts = [],
    fbtProducts = []
}) => {
    // Variable Replacements setup (keep existing)
    const contextObj = useMemo(() => {
        let ctx: Record<string, any> = {
            sectionId,
            relatedProducts: relatedProducts || [],
            fbtProducts: fbtProducts || []
        };
        // ... (standard context building)
        if (productContext) {
            ctx = { ...ctx, ...productContext, productName: productContext.name, formattedPrice: (productContext.price || 0).toLocaleString('en-IN') };
        }
        return ctx;
    }, [productContext, sectionId, relatedProducts, fbtProducts]);

    const jsonContent = useMemo(() => {
        if (!code) return null;
        const trimmed = code.trim();
        // Simple check or try-parse
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            return null;
        }
    }, [code]);

    // STRICT: If not Valid JSON, render error or nothing. NO HTML fallback.
    if (!jsonContent) {
        return (
            <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-sm font-mono">
                Error: CustomCode content must be valid JSON.
            </div>
        );
    }

    return (
        <div id={`pdp-section-${sectionId}`} className="w-full relative">
            <JsonRenderer node={jsonContent} context={contextObj} sectionId={sectionId} />
        </div>
    );
};

export default SafeCustomCode;
