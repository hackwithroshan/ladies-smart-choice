
import React, { useEffect, useRef } from 'react';

interface SafeCustomCodeProps {
    code: string;
    sectionId: string;
}

const SafeCustomCode: React.FC<SafeCustomCodeProps> = ({ code, sectionId }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Inject the HTML first
        containerRef.current.innerHTML = code;

        // 2. Find and execute scripts
        const scripts = containerRef.current.querySelectorAll('script');
        scripts.forEach((oldScript) => {
            const newScript = document.createElement('script');
            
            // Copy attributes (src, type, etc.)
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });

            // Handle inline scripts
            if (oldScript.innerHTML) {
                // Wrap in an IIFE to provide local scope and reference to the section
                newScript.innerHTML = `
                    (function(sectionId, sectionElement) {
                        try {
                            ${oldScript.innerHTML}
                        } catch (err) {
                            console.error("Error in Custom Section JS [" + sectionId + "]:", err);
                        }
                    })("${sectionId}", document.getElementById("${sectionId}"));
                `;
            }

            // Replace the old script with the new executable one
            oldScript.parentNode?.replaceChild(newScript, oldScript);
        });

        // Cleanup function to prevent memory leaks or duplicate event listeners if necessary
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
            className="custom-section-wrapper overflow-hidden"
        />
    );
};

export default SafeCustomCode;
