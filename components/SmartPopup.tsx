
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
        // Exit early if the admin has explicitly disabled the popup
        if (siteSettings?.showSmartPopup === false) {
            setIsVisible(false);
            return;
        }

        const hasSeenPopup = sessionStorage.getItem('smartPopupSeen');
        if (hasSeenPopup) return;

        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY < 0) setIsVisible(true);
        };

        // Use custom delay from settings, default to 15s
        const popupDelayMs = (siteSettings?.popupDelay || 15) * 1000;
        const timer = setTimeout(() => {
            if (siteSettings?.showSmartPopup !== false) {
                setIsVisible(true);
            }
        }, popupDelayMs);

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
            clearTimeout(timer);
        };
    }, [siteSettings?.showSmartPopup, siteSettings?.popupDelay]);

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
            await fetch(getApiUrl('/contact/send'), {
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
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    };

    // Double-check visibility state
    if (!isVisible || siteSettings?.showSmartPopup === false) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-white/20">
                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg>
                </button>
                <div className="flex flex-col md:flex-row h-full">
                    <div className="w-full md:w-2/5 bg-[#16423C] hidden md:flex items-center justify-center p-6 text-white text-center">
                        <div>
                            <p className="text-5xl font-black italic tracking-tighter mb-2">10%</p>
                            <p className="uppercase tracking-[0.3em] text-[10px] font-black opacity-60">OFFER CODE</p>
                            <div className="w-8 h-0.5 bg-white mx-auto my-6 opacity-30"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest">LIFETIME ACCESS</p>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-3/5 p-10 text-center md:text-left">
                        {step === 1 ? (
                            <>
                                <h3 className="text-2xl font-black italic tracking-tighter text-gray-900 mb-2 uppercase leading-tight">Join the {BrandName} Family</h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">Unlock an exclusive discount code instantly.</p>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative">
                                        <input 
                                            type="tel" 
                                            placeholder="MOBILE NUMBER" 
                                            value={phone} 
                                            onChange={(e) => setPhone(e.target.value)} 
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-zinc-900 transition-all font-black text-sm tracking-widest placeholder:text-gray-300" 
                                            required 
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-xl hover:brightness-110 active:scale-95 transition-all">
                                        {loading ? 'SYNCING...' : 'Get My Code'}
                                    </button>
                                </form>
                                <p className="text-[9px] text-zinc-400 mt-6 uppercase text-center md:text-left font-medium">By joining you agree to receive transactional updates.</p>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={3}/></svg>
                                </div>
                                <h3 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase">Verification Sent</h3>
                                <div className="bg-zinc-900 p-6 mt-8 rounded-3xl cursor-pointer group shadow-2xl" onClick={() => {
                                    navigator.clipboard.writeText('FAMILY10');
                                    alert('Copied to clipboard!');
                                }}>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">YOUR SECURE CODE</p>
                                    <span className="font-mono text-3xl font-black text-white tracking-widest group-hover:text-emerald-400 transition-colors">FAMILY10</span>
                                </div>
                                <button onClick={handleClose} className="mt-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-colors">Return to Boutique</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartPopup;
