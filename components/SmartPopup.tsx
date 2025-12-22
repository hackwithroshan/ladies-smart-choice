
import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiHelper';
import { useSiteData } from '../contexts/SiteDataContext';

const SmartPopup: React.FC = () => {
    const { siteSettings } = useSiteData();
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(1); 
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const hasSeenPopup = sessionStorage.getItem('smartPopupSeen');
        if (hasSeenPopup) return;

        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY < 0) setIsVisible(true);
        };

        const timer = setTimeout(() => setIsVisible(true), 15000);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
            clearTimeout(timer);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem('smartPopupSeen', 'true');
    };

    const BrandName = siteSettings?.storeName || "Ayushree Ayurveda";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) return;
        setLoading(true);
        try {
            await fetch(getApiUrl('/api/contact/send'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: 'Lead from Popup', 
                    email: 'lead@popup.com',
                    subject: 'Unlock Offer Request',
                    message: `Customer Phone: ${phone} wants an offer code at ${BrandName}.`
                }),
            });
            setStep(2);
            sessionStorage.setItem('smartPopupSeen', 'true');
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <button onClick={handleClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10">×</button>
                <div className="flex flex-col md:flex-row h-full">
                    <div className="w-full md:w-2/5 bg-brand-primary hidden md:flex items-center justify-center p-6 text-white text-center">
                        <div>
                            <p className="text-4xl font-bold mb-2">10%</p>
                            <p className="uppercase tracking-widest text-sm">OFF</p>
                            <div className="w-8 h-1 bg-white mx-auto my-4"></div>
                            <p className="text-xs opacity-80">First Order</p>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-3/5 p-8 text-center md:text-left">
                        {step === 1 ? (
                            <>
                                <h3 className="text-2xl font-brand font-bold text-gray-900 mb-2">Join the {BrandName} Family</h3>
                                <p className="text-sm text-gray-600 mb-6">Unlock an exclusive discount code instantly.</p>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <input type="tel" placeholder="Mobile Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-lg px-4 py-3 outline-none" required />
                                    <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg uppercase tracking-wider text-xs shadow-lg">
                                        {loading ? 'Unlocking...' : 'Get My Code'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <h3 className="text-xl font-bold text-gray-900">Your Welcome Gift!</h3>
                                <div className="bg-gray-100 border-dashed border-2 border-brand-accent p-3 mt-4 rounded-lg cursor-pointer" onClick={() => navigator.clipboard.writeText('PURE10')}>
                                    <span className="font-mono text-xl font-bold text-brand-primary">PURE10</span>
                                </div>
                                <button onClick={handleClose} className="mt-6 text-sm text-brand-accent underline">Shop Now</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartPopup;
