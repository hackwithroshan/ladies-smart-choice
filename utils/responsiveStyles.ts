import { PDPSectionStyle } from '../types';

export const generateSectionCss = (sectionId: string, style?: PDPSectionStyle): string => {
    if (!style) return '';

    const rootId = `#sec-${sectionId}`;
    const css: string[] = [];

    // --- Helper to generate CSS rule string from an object ---
    const generateRule = (selector: string, props: { [key: string]: string | number | undefined }) => {
        const rules = Object.entries(props)
            .filter(([_, value]) => value !== undefined && value !== '')
            .map(([prop, value]) => `${prop}: ${value} !important;`)
            .join(' ');

        if (!rules) return '';
        return `${selector} { ${rules} }`;
    };

    // --- Property Mappers ---
    const mapContainerProps = (s: Partial<PDPSectionStyle>) => ({
        'padding-top': s.paddingTop ? `${s.paddingTop}px` : undefined,
        'padding-bottom': s.paddingBottom ? `${s.paddingBottom}px` : undefined,
        'padding-left': s.paddingLeft ? `${s.paddingLeft}px` : undefined,
        'padding-right': s.paddingRight ? `${s.paddingRight}px` : undefined,
        'margin-top': s.marginTop ? `${s.marginTop}px` : undefined,
        'margin-bottom': s.marginBottom ? `${s.marginBottom}px` : undefined,
        'background-color': s.backgroundColor,
        'color': s.textColor,
        'text-align': s.textAlign
    });

    const mapInnerContainerProps = (s: Partial<PDPSectionStyle>) => ({
        'max-width': s.containerMaxWidth,
        'width': '100%'
    });

    const mapImageProps = (s: Partial<PDPSectionStyle>) => ({
        'width': s.imageWidth,
        'height': s.imageHeight,
        'border-radius': s.imageBorderRadius ? `${s.imageBorderRadius}px` : undefined
    });

    const mapTextProps = (s: Partial<PDPSectionStyle>) => ({
        '--title-size': s.titleFontSize ? `${s.titleFontSize}px` : undefined,
        '--price-size': s.priceFontSize ? `${s.priceFontSize}px` : undefined,
        '--desc-size': s.shortDescFontSize ? `${s.shortDescFontSize}px` : undefined
    });

    // --- Alignment Classes ---
    const getAlignmentRules = (selector: string, align?: string) => {
        if (!align) return '';
        if (align === 'center') return `${selector} { margin-left: auto; margin-right: auto; text-align: center; }`;
        if (align === 'left') return `${selector} { margin-right: auto; margin-left: 0; text-align: left; }`;
        if (align === 'right') return `${selector} { margin-left: auto; margin-right: 0; text-align: right; }`;
        return '';
    };

    // --- 1. Base Styles (Desktop) ---
    css.push(generateRule(rootId, mapContainerProps(style)));
    css.push(generateRule(`${rootId} .dynamic-container`, mapInnerContainerProps(style)));
    css.push(generateRule(`${rootId} .dynamic-img`, mapImageProps(style)));
    css.push(getAlignmentRules(`${rootId} .img-wrapper`, style.imageAlign));

    // Text sizes using CSS vars for easier reuse or direct class application if we prefer
    // Actually, let's target specific classes for fonts based on the implementation in ProductDetailsPage
    // We determined we will add classes like .dynamic-title, .dynamic-price.
    if (style.titleFontSize) css.push(`${rootId} .dynamic-title { font-size: ${style.titleFontSize}px !important; }`);
    if (style.priceFontSize) css.push(`${rootId} .dynamic-price { font-size: ${style.priceFontSize}px !important; }`);
    if (style.shortDescFontSize) css.push(`${rootId} .dynamic-desc { font-size: ${style.shortDescFontSize}px !important; }`);

    // --- 2. Laptop Overrides (max-width: 1024px) ---
    if (style.laptop) {
        const l = style.laptop;
        const rules: string[] = [];
        rules.push(generateRule(rootId, mapContainerProps(l)));
        rules.push(generateRule(`${rootId} .dynamic-container`, mapInnerContainerProps(l)));
        rules.push(generateRule(`${rootId} .dynamic-img`, mapImageProps(l)));
        rules.push(getAlignmentRules(`${rootId} .img-wrapper`, l.imageAlign));

        if (l.titleFontSize) rules.push(`${rootId} .dynamic-title { font-size: ${l.titleFontSize}px !important; }`);
        if (l.priceFontSize) rules.push(`${rootId} .dynamic-price { font-size: ${l.priceFontSize}px !important; }`);
        if (l.shortDescFontSize) rules.push(`${rootId} .dynamic-desc { font-size: ${l.shortDescFontSize}px !important; }`);

        if (rules.length > 0) {
            css.push(`@media (max-width: 1024px) { ${rules.join(' ')} }`);
        }
    }

    // --- 3. Mobile Overrides (max-width: 768px) ---
    if (style.mobile) {
        const m = style.mobile;
        const rules: string[] = [];
        rules.push(generateRule(rootId, mapContainerProps(m)));
        rules.push(generateRule(`${rootId} .dynamic-container`, mapInnerContainerProps(m)));
        rules.push(generateRule(`${rootId} .dynamic-img`, mapImageProps(m)));
        rules.push(getAlignmentRules(`${rootId} .img-wrapper`, m.imageAlign));

        if (m.titleFontSize) rules.push(`${rootId} .dynamic-title { font-size: ${m.titleFontSize}px !important; }`);
        if (m.priceFontSize) rules.push(`${rootId} .dynamic-price { font-size: ${m.priceFontSize}px !important; }`);
        if (m.shortDescFontSize) rules.push(`${rootId} .dynamic-desc { font-size: ${m.shortDescFontSize}px !important; }`);

        if (rules.length > 0) {
            css.push(`@media (max-width: 768px) { ${rules.join(' ')} }`);
        }
    }

    return css.join('\n');
};
