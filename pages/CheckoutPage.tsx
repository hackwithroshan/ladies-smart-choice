
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useSiteData } from '../contexts/SiteDataContext';
import { getApiUrl } from '../utils/apiHelper';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CheckoutPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { cart, cartTotal, clearCart } = useCart();
    const { siteSettings } = useSiteData();
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (cart.length === 0) return alert("Your cart is empty.");
        if (!(window as any).Razorpay) return alert("Payment gateway not loaded. Please refresh.");

        setLoading(true);

        try {
            // 1. Create order on backend with Magic logic (Sending full cart items)
            const orderRes = await fetch(getApiUrl('/api/orders/create-rzp-order'), {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    items: cart.map(i => ({
                        productId: i.id || (i as any)._id,
                        name: i.name,
                        quantity: i.quantity,
                        price: i.price,
                        imageUrl: i.imageUrl
                    })),
                    total: cartTotal
                })
            });
            const rzpData = await orderRes.json();

            // 2. Fetch public key
            const keyRes = await fetch(getApiUrl('/api/orders/key'));
            const { key } = await keyRes.json();

            // 3. Razorpay Options with Magic parameters enabled
            const options = {
                key: key,
                order_id: rzpData.id, // Using Order ID created on backend
                name: siteSettings?.storeName || "Ayushree Ayurveda",
                description: "Purchase of Ayurvedic Herbs",
                image: siteSettings?.logoUrl || "",
                // MAGIC CHECKOUT FLAGS
                "config": {
                    "display": {
                        "blocks": {
                            "magic": {
                                "name": "Magic Checkout",
                                "instruments": [{ "method": "upi" }, { "method": "card" }]
                            }
                        },
                        "sequence": ["block.magic"],
                        "preferences": { "show_default_blocks": true }
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || ""
                },
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch(getApiUrl('/api/orders/verify'), {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                orderDetails: { 
                                    items: cart, 
                                    total: cartTotal
                                }
                            })
                        });
                        
                        const result = await verifyRes.json();
                        if (result.success) {
                            clearCart();
                            window.location.href = "/dashboard?status=success";
                        } else {
                            alert("Payment verification failed. Please contact support.");
                        }
                    } catch (e) {
                        alert("Verification error.");
                    }
                },
                theme: { color: siteSettings?.primaryColor || "#16423C" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Checkout crash:", error);
            alert("Checkout failed to start.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF9F1]">
            <Header user={user} logout={logout} />
            <main className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
                        <h1 className="text-3xl font-serif font-black text-gray-900 italic">Checkout</h1>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">SSL SECURE</span>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-6">In Your Bag</h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-50 border overflow-hidden shrink-0">
                                                <img src={item.imageUrl} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-bold text-gray-800 block leading-tight truncate">{item.name}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Qty: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <span className="font-black text-gray-900 shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-100">
                                <div className="flex justify-between items-center text-3xl font-serif font-black text-[#16423C]">
                                    <span>Total</span>
                                    <span>₹{cartTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
                            <div className="mb-8 text-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#6A9C89]">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 20.913a11.952 11.952 0 008.618-3.04 11.952 11.952 0 00-8.618-3.04m0 6.086L3.382 17.897" /></svg>
                                </div>
                                <p className="text-gray-600 text-sm font-medium leading-relaxed">Magic Checkout enabled. We will collect your shipping address and verify OTP in the next step.</p>
                            </div>
                            <button 
                                onClick={handlePayment}
                                disabled={loading || cart.length === 0}
                                className="w-full bg-[#16423C] text-white h-16 rounded-2xl font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Proceed to Order</span>
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
