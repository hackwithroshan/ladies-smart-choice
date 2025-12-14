
import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { getApiUrl } from '../utils/apiHelper';

const SmartPopup: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(1); // 1: Input, 2: Success
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if already closed/submitted in this session
        const hasSeenPopup = sessionStorage.getItem('smartPopupSeen');
        if (hasSeenPopup) return;

        // Desktop: Exit Intent (Mouse leaves top of screen)
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY < 0) {
                setIsVisible(true);
            }
        };

        // Mobile: Timer based (Show after 15 seconds)
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 15000);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) return alert("Please enter a valid phone number");
        
        setLoading(true);
        try {
            // We use the contact API to save this lead
            await fetch(getApiUrl('/api/contact/send'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: 'Lead from Popup', 
                    email: 'lead@popup.com', // Placeholder
                    subject: 'Unlock Offer Request',
                    message: `Customer Phone: ${phone} wants an offer code.`
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

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <button onClick={handleClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="flex flex-col md:flex-row h-full">
                    <div className="w-full md:w-2/5 bg-rose-900 hidden md:flex items-center justify-center p-6 text-white text-center">
                        <div>
                            <p className="text-4xl font-bold mb-2">10%</p>
                            <p className="uppercase tracking-widest text-sm">OFF</p>
                            <div className="w-8 h-1 bg-white mx-auto my-4"></div>
                            <p className="text-xs opacity-80">On your first order</p>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-3/5 p-8 text-center md:text-left">
                        {step === 1 ? (
                            <>
                                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Wait! Don't Miss Out</h3>
                                <p className="text-sm text-gray-600 mb-6">Unlock a special 10% discount code instantly. Just verify your number.</p>
                                
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <input 
                                            type="tel" 
                                            placeholder="Your Mobile Number" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-gray-50 text-lg tracking-wide"
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-black text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all shadow-lg text-sm uppercase tracking-wider"
                                    >
                                        {loading ? 'Unlocking...' : 'Unlock My Discount'}
                                    </button>
                                </form>
                                <p className="text-[10px] text-gray-400 mt-4 text-center">
                                    We respect your privacy. No spam.
                                </p>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Here is your code!</h3>
                                <div className="bg-gray-100 border-dashed border-2 border-gray-300 p-3 mt-4 rounded-lg cursor-pointer" onClick={() => navigator.clipboard.writeText('WELCOME10')}>
                                    <span className="font-mono text-xl font-bold text-rose-600">WELCOME10</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Tap to copy code</p>
                                <button onClick={handleClose} className="mt-6 text-sm text-blue-600 underline">Continue Shopping</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartPopup;
