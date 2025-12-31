
import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { getApiUrl } from '../utils/apiHelper';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface CheckoutPageProps {
    user: any;
    logout: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ user, logout }) => {
    const { cart, cartTotal, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const hasAutoTriggered = useRef(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);
        return () => { 
            if(document.body.contains(script)) document.body.removeChild(script); 
        };
    }, []);

    // --- AUTO TRIGGER LOGIC ---
    // This effect ensures that as soon as the page is visited, 
    // the Razorpay Magic Checkout starts automatically.
    useEffect(() => {
        if (scriptLoaded && cart.length > 0 && !hasAutoTriggered.current && !loading) {
            hasAutoTriggered.current = true;
            handleMagicCheckout();
        }
    }, [scriptLoaded, cart]);

    const handleMagicCheckout = async () => {
        if (!scriptLoaded) return;
        setLoading(true);
        setErrorMsg(null);

        try {
            const res = await fetch(getApiUrl('/api/orders/create-magic-order'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    totalAmount: cartTotal
                })
            });

            const orderData = await res.json();

            if (!res.ok || !orderData.key) {
                throw new Error(orderData.message || "Failed to initialize payment gateway.");
            }

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: "INR",
                name: "Ayushree Ayurveda",
                description: "Authentic Herbal Wellness Order",
                order_id: orderData.id,
                one_click_checkout: true, // This enables Magic Checkout
                config: {
                    display: {
                        blocks: {
                            utms: { name: "Offers", instruments: [{ method: "upi" }] }
                        },
                        sequence: ["block.utms"],
                        preferences: { show_default_blocks: true }
                    }
                },
                handler: async function (response: any) {
                    const verificationRes = await fetch(getApiUrl('/api/orders/verify-magic-payment'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...response,
                            totalAmount: cartTotal,
                            local_items: cart.map(i => ({
                                productId: i.id,
                                name: i.name,
                                quantity: i.quantity,
                                price: i.price,
                                imageUrl: i.imageUrl
                            }))
                        })
                    });

                    if (verificationRes.ok) {
                        clearCart();
                        window.location.href = '/dashboard?status=success';
                    } else {
                        alert("Payment verification failed at server. Please contact support.");
                        setLoading(false);
                        hasAutoTriggered.current = false;
                    }
                },
                modal: {
                    ondismiss: function () { 
                        setLoading(false); 
                        hasAutoTriggered.current = false; // Allow retry if user closes modal
                    }
                },
                theme: { color: "#16423C" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error: any) {
            console.error("Magic Checkout Init Failed:", error);
            setErrorMsg(error.message || "Could not initialize payment.");
            setLoading(false);
            hasAutoTriggered.current = false;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header user={user} logout={logout} />
            
            <main className="flex-grow container mx-auto px-4 py-20 flex items-center justify-center">
                <div className="max-w-xl w-full bg-white p-12 rounded-[2rem] shadow-2xl border border-gray-100 text-center relative overflow-hidden">
                    
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-brand-primary/5 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                        {loading ? (
                            <div className="space-y-6 animate-pulse">
                                <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Securing Your Order...</h1>
                                <p className="text-gray-500">Redirecting you to Razorpay Magic Checkout.</p>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                
                                <h1 className="text-3xl font-black text-gray-900 italic uppercase tracking-tighter mb-2">Checkout</h1>
                                <p className="text-gray-500 mb-8">Securely finalizing your herbal wellness selection.</p>

                                {errorMsg && (
                                    <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold animate-shake">
                                        ⚠️ {errorMsg}
                                        <button onClick={handleMagicCheckout} className="block mx-auto mt-2 underline uppercase tracking-widest text-[10px]">Retry Payment</button>
                                    </div>
                                )}

                                <div className="space-y-4 mb-10 bg-gray-50 p-6 rounded-2xl">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span className="text-gray-600">Total Payable</span>
                                        <span className="text-brand-primary">₹{cartTotal.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest leading-relaxed">
                                        Safe & Secure 256-bit SSL encrypted payment processing
                                    </p>
                                </div>

                                <button
                                    onClick={handleMagicCheckout}
                                    disabled={loading || cart.length === 0}
                                    className="w-full bg-[#16423C] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:opacity-90 transition-all transform active:scale-95 disabled:opacity-50"
                                >
                                    Proceed to Payment
                                </button>
                            </div>
                        )}
                        
                        <div className="mt-8 flex items-center justify-center gap-4 grayscale opacity-30">
                            <img src="https://cdn-icons-png.flaticon.com/512/349/349221.png" className="h-4" alt="Visa" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" className="h-3" alt="UPI" />
                            <img src="https://cdn-icons-png.flaticon.com/512/349/349228.png" className="h-4" alt="Mastercard" />
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default CheckoutPage;
