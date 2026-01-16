import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Copy } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface DesignTokens {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    shadow?: 'none' | 'sm' | 'md' | 'lg';
    padding?: number;
}

interface CouponProps {
    sectionId: string;
    content: {
        code: string;
        discount: string;
        description?: string;
        expiry?: string;
    };
    design?: {
        desktop?: DesignTokens;
        tablet?: DesignTokens;
        mobile?: DesignTokens;
    };
}

const DynamicCoupon: React.FC<CouponProps> = ({ sectionId, content, design = {} }) => {
    const { showToast } = useToast();
    const uniqueClass = `coupon-${sectionId}`;

    const handleCopy = () => {
        if (content.code) {
            navigator.clipboard.writeText(content.code);
            showToast('Coupon code copied to clipboard!', 'success');
        }
    };

    // Helper to generate CSS for a breakpoint
    const getCss = (tokens: DesignTokens = {}): string => {
        const rules = [];
        if (tokens.backgroundColor) rules.push(`background-color: ${tokens.backgroundColor} !important;`);
        if (tokens.textColor) {
            rules.push(`color: ${tokens.textColor} !important;`);
            rules.push(`--text-color: ${tokens.textColor};`);
        }
        if (tokens.borderColor) rules.push(`border-color: ${tokens.borderColor} !important;`);
        if (tokens.radius) {
            const rMap: any = { 'none': '0px', 'sm': '0.125rem', 'md': '0.375rem', 'lg': '0.5rem', 'full': '2rem' };
            rules.push(`border-radius: ${rMap[tokens.radius] || '0.375rem'} !important;`);
        }
        if (tokens.shadow) {
            const sMap: any = { 'none': 'none', 'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)', 'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)', 'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)' };
            rules.push(`box-shadow: ${sMap[tokens.shadow] || '0 4px 6px -1px rgb(0 0 0 / 0.1)'} !important;`);
        }
        if (tokens.padding) rules.push(`padding: ${tokens.padding}px !important;`);

        return rules.join(' ');
    };

    const desktopCss = getCss(design.desktop);
    const tabletCss = getCss(design.tablet);
    const mobileCss = getCss(design.mobile);

    return (
        <div className={`w-full ${uniqueClass}`}>
            <style>{`
                .${uniqueClass} .coupon-card {
                    ${desktopCss}
                }
                .${uniqueClass} .coupon-text {
                    color: var(--text-color, inherit) !important;
                }
                @media (max-width: 1024px) {
                    .${uniqueClass} .coupon-card {
                        ${tabletCss}
                    }
                }
                @media (max-width: 768px) {
                    .${uniqueClass} .coupon-card {
                        ${mobileCss}
                    }
                }
            `}</style>

            <Card className="coupon-card w-full max-w-md mx-auto border-2 overflow-hidden transition-all duration-300">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="coupon-text text-2xl font-black uppercase tracking-tight">
                        {content.discount || 'Special Offer'}
                    </CardTitle>
                    {content.description && (
                        <CardDescription className="coupon-text font-medium opacity-90">
                            {content.description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 py-4">
                    <div className="flex items-center gap-2 p-2 bg-black/5 rounded-md border border-black/10 w-full justify-center border-dashed">
                        <code className="coupon-text text-lg font-mono font-bold tracking-wider select-all">
                            {content.code}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-black/10"
                            onClick={handleCopy}
                        >
                            <Copy className="h-4 w-4 coupon-text" />
                        </Button>
                    </div>
                </CardContent>
                {content.expiry && (
                    <CardFooter className="justify-center pt-0 pb-4">
                        <p className="coupon-text text-xs font-medium opacity-60">
                            Valid until {content.expiry}
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
};

export default DynamicCoupon;
