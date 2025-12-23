
import React, { useEffect, useRef } from 'react';

interface SafeCustomCodeProps {
    code: string;
    sectionId: string;
}

const SafeCustomCode: React.FC<SafeCustomCodeProps> = ({ code, sectionId }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Clear previous content
        containerRef.current.innerHTML = '';

        // 2. Parse HTML string
        const parser = new DOMParser();
        const doc = parser.parseFromString(code, 'text/html');
        
        // 3. Inject CSS Styles immediately
        const styles = Array.from(doc.querySelectorAll('link[rel="stylesheet"], style'));
        styles.forEach(style => {
            const head = document.head;
            if (style.tagName === 'LINK') {
                const href = style.getAttribute('href');
                if (href && !head.querySelector(`link[href="${href}"]`)) {
                    const newLink = document.createElement('link');
                    Array.from(style.attributes).forEach(attr => newLink.setAttribute(attr.name, attr.value));
                    head.appendChild(newLink);
                }
            } else {
                const newStyle = document.createElement('style');
                newStyle.textContent = style.textContent;
                head.appendChild(newStyle);
            }
        });

        // 4. Inject Clean HTML Content
        const contentClone = doc.body.cloneNode(true) as HTMLElement;
        contentClone.querySelectorAll('script, link, style').forEach(el => el.remove());
        containerRef.current.innerHTML = contentClone.innerHTML;

        // 5. Smart Script Runner
        const scripts = Array.from(doc.querySelectorAll('script'));
        
        const runScripts = async () => {
            for (const script of scripts) {
                if (script.src) {
                    // Load External JS (like Swiper)
                    await new Promise<void>((resolve, reject) => {
                        if (document.querySelector(`script[src="${script.src}"]`)) {
                            resolve(); return;
                        }
                        const newScript = document.createElement('script');
                        Array.from(script.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                        newScript.onload = () => resolve();
                        newScript.onerror = () => reject();
                        document.head.appendChild(newScript);
                    });
                } else {
                    // Execute Inline JS with "Wait-for-Library" logic
                    const executeWithRetry = (retryCount = 0) => {
                        const needsSwiper = script.innerHTML.includes('Swiper');
                        const swiperReady = (window as any).Swiper;

                        if (needsSwiper && !swiperReady && retryCount < 30) {
                            // Wait 100ms and try again
                            setTimeout(() => executeWithRetry(retryCount + 1), 100);
                            return;
                        }

                        // Ensure DOM is ready for dimension calculations
                        requestAnimationFrame(() => {
                            try {
                                const runner = new Function('sectionId', 'sectionElement', `
                                    try {
                                        ${script.innerHTML}
                                    } catch (e) {
                                        console.error("Custom JS error in section [" + sectionId + "]:", e);
                                    }
                                `);
                                runner(sectionId, document.getElementById(sectionId));
                            } catch (e) {
                                console.error("Script parsing error:", e);
                            }
                        });
                    };

                    executeWithRetry();
                }
            }
        };

        runScripts();

        return () => {
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, [code, sectionId]);

    return (
        <div 
            id={sectionId} 
            ref={containerRef} 
            className="custom-section-container w-full"
        />
    );
};

export default SafeCustomCode;
