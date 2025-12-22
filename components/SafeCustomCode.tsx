
import React, { useEffect, useRef } from 'react';

interface SafeCustomCodeProps {
    code: string;
    sectionId: string;
}

const SafeCustomCode: React.FC<SafeCustomCodeProps> = ({ code, sectionId }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Clear previous content to avoid duplicate scripts/styles on re-render
        containerRef.current.innerHTML = '';

        // 2. Parse the code
        const parser = new DOMParser();
        const doc = parser.parseFromString(code, 'text/html');
        
        // 3. Extract Styles (Link & Style tags)
        const styles = Array.from(doc.querySelectorAll('link[rel="stylesheet"], style'));
        styles.forEach(style => {
            const head = document.head;
            // Avoid duplicating identical links
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

        // 4. Inject Body Content
        // Filter out scripts and styles we already handled from the HTML body injection
        const contentClone = doc.body.cloneNode(true) as HTMLElement;
        const inlineScriptsAndStyles = contentClone.querySelectorAll('script, link, style');
        inlineScriptsAndStyles.forEach(el => el.remove());
        containerRef.current.innerHTML = contentClone.innerHTML;

        // 5. Process Scripts SEQUENTIALLY
        // This is critical: Dependencies (like Swiper.js) must load BEFORE the init script
        const scripts = Array.from(doc.querySelectorAll('script'));

        const executeScripts = async () => {
            for (const oldScript of scripts) {
                if (oldScript.src) {
                    // Load external script
                    await new Promise<void>((resolve, reject) => {
                        // Check if already loaded
                        if (document.querySelector(`script[src="${oldScript.src}"]`)) {
                            resolve();
                            return;
                        }
                        const newScript = document.createElement('script');
                        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                        newScript.onload = () => resolve();
                        newScript.onerror = () => reject(new Error(`Failed to load script: ${oldScript.src}`));
                        document.head.appendChild(newScript);
                    });
                } else {
                    // Wait for a frame to ensure CSS has applied and DOM is painted
                    // Swiper needs to know the width/height of elements to work correctly
                    await new Promise(resolve => requestAnimationFrame(resolve));

                    // Execute inline script
                    const newScript = document.createElement('script');
                    newScript.text = `
                        (function(sectionId, sectionElement) {
                            try {
                                ${oldScript.innerHTML}
                            } catch (err) {
                                console.error("Error in Section JS [" + sectionId + "]:", err);
                            }
                        })("${sectionId}", document.getElementById("${sectionId}"));
                    `;
                    document.body.appendChild(newScript);
                    document.body.removeChild(newScript);
                }
            }
        };

        executeScripts();

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [code, sectionId]);

    return (
        <div 
            id={sectionId} 
            ref={containerRef} 
            className="custom-section-wrapper"
        />
    );
};

export default SafeCustomCode;
