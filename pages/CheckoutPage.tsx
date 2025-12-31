
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { useCart } from '../contexts/CartContext';
import { getApiUrl } from '../utils/apiHelper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSiteData } from '../contexts/SiteDataContext';
import { masterTracker } from '../utils/tracking';
import SEO from '../components/SEO';

const CheckoutPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { cart, cartTotal, clearCart, cartCount } = useCart();
    const { siteSettings } = useSiteData();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const navigate = useNavigate();
    const scriptLoaded = useRef(false);

    useEffect(() => {
        if (cart.length === 0 && !verifying) {
            navigate('/cart');
            return;
        }

        // Load Magic Checkout Script
        if (!scriptLoaded.current) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/magic-checkout.js';
            script.async = true;
            script.onload = () => { scriptLoaded.current = true; };
            document.body.appendChild(script);
        }
    }, [cart, navigate, verifying]);

    const handleMagicCheckout = async () => {
        if (loading || verifying) return;
        setLoading(true);
        setErrorMsg(null);

        try {
            // 1. Server-side Order Initialization
            const res = await fetch(getApiUrl('/api/orders/create-magic-order'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cart, totalAmount: cartTotal })
            });
            const orderData = await res.json();
            if (!res.ok) throw new Error(orderData.message || "Checkout could not be initialized.");

            // 2. Open Razorpay Magic UI
            const options = {
                key: orderData.key,
                one_click_checkout: true,
                name: siteSettings?.storeName || "Ayushree Ayurveda",
                description: "Order Processing",
                image: siteSettings?.logoUrl || "https://res.cloudinary.com/djbv48acj/image/upload/v1710000000/logo_placeholder.png",
                order_id: orderData.id,
                show_coupons: true,
                
                // --- SUCCESS CALLBACK ---
                handler: async function (response: any) {
                    setVerifying(true);
                    setLoading(false);
                    try {
                        const verifyRes = await fetch(getApiUrl('/api/orders/verify-magic-payment'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                userId: user?.id,
                                local_items: cart.map(i => ({
                                    productId: i.id,
                                    name: i.name,
                                    quantity: i.quantity,
                                    price: i.price,
                                    imageUrl: i.imageUrl
                                }))
                            })
                        });

                        const verifyResult = await verifyRes.json();
                        if (verifyRes.ok) {
                            clearCart();
                            masterTracker('Purchase', { 
                                value: cartTotal, 
                                currency: 'INR', 
                                content_ids: cart.map(i => i.id) 
                            });
                            navigate(`/dashboard?status=success&orderId=${verifyResult.orderId}`);
                        } else {
                            setErrorMsg(verifyResult.message || "Verification failed.");
                            setVerifying(false);
                        }
                    } catch (vErr) {
                        setErrorMsg("Network error during finalization.");
                        setVerifying(false);
                    }
                },
                
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone ? (user.phone.startsWith('+91') ? user.phone : `+91${user.phone}`) : ""
                },
                theme: { color: "#16423C" },
                modal: { ondismiss: () => setLoading(false) }
            };

            const rzp = new (window as any).Razorpay(options);

            // --- ERROR CALLBACK ---
            rzp.on('payment.failed', function (response: any) {
                setErrorMsg(`Error: ${response.error.description}`);
                setLoading(false);
            });

            rzp.open();
        } catch (error: any) {
            setErrorMsg(error.message || "System error.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF9F1] flex flex-col font-sans">
            <SEO title="Secure Checkout" noindex />
            <Header user={user} logout={logout} />
            
            <main className="flex-grow flex items-center justify-center p-6 md:p-12">
                <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    
                    {/* Visual & Summary */}
                    <div className="space-y-8 order-2 lg:order-1">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                             <h2 className="text-2xl font-brand font-black uppercase tracking-tight mb-6">Your Selection</h2>
                             <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2 scrollbar-hide">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden border shrink-0">
                                            <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-800 truncate uppercase">{item.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-black">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>

                             <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                                 <div className="flex justify-between items-center text-gray-900 font-brand font-black text-2xl uppercase">
                                     <span>Grand Total</span>
                                     <span className="text-[#16423C]">₹{cartTotal.toLocaleString()}</span>
                                 </div>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">Free Express Shipping Included</p>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 opacity-60 grayscale scale-95">
                             <div className="bg-white/50 p-4 rounded-2xl text-center border border-white"><span className="text-xl block mb-1">🔒</span><span className="text-[9px] font-black uppercase text-gray-500">256-bit SSL</span></div>
                             <div className="bg-white/50 p-4 rounded-2xl text-center border border-white"><span className="text-xl block mb-1">✨</span><span className="text-[9px] font-black uppercase text-gray-500">Magic Checkout</span></div>
                        </div>
                    </div>

                    {/* Interaction Panel */}
                    <div className="order-1 lg:order-2">
                         <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 text-center">
                            <div className="mb-10">
                                <img src="https://razorpay.com/assets/magic-checkout-logo.svg" alt="Razorpay Magic" className="h-10 mx-auto mb-6" />
                                <h1 className="text-3xl font-brand font-black uppercase tracking-tighter mb-2">Checkout</h1>
                                <p className="text-gray-500 text-sm">Experience the speed of 1-Click Payments.</p>
                            </div>

                            {errorMsg && (
                                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-shake">
                                    {errorMsg}
                                </div>
                            )}

                            {verifying ? (
                                <div className="space-y-4 py-10">
                                    <div className="w-12 h-12 border-4 border-[#16423C]/20 border-t-[#16423C] rounded-full animate-spin mx-auto"></div>
                                    <p className="text-sm font-bold text-[#16423C] animate-pulse uppercase tracking-widest">Confirming Order Details...</p>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleMagicCheckout} 
                                    disabled={loading} 
                                    className="w-full bg-[#16423C] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:opacity-95 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>Secure Pay ₹{cartTotal.toLocaleString()}</span>
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </>
                                    )}
                                </button>
                            )}

                            <div className="mt-10 pt-8 border-t border-gray-50 flex flex-wrap justify-center gap-6 grayscale opacity-40">
                                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" className="h-3" alt="UPI" />
                                 <img src="https://razorpay.com/assets/razorpay-logo.svg" className="h-4" alt="Razorpay" />
                            </div>
                         </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default CheckoutPage;
