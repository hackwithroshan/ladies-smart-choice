
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
        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }
        
        if (!(window as any).Razorpay) {
            alert("Payment gateway is not ready. Please refresh.");
            return;
        }

        setLoading(true);

        try {
            // 1. Get Key from Backend
            const keyRes = await fetch(getApiUrl('/api/orders/key'));
            const { key } = await keyRes.json();

            // 2. Open Razorpay (Pure Magic Mode)
            // ❌ No amount
            // ❌ No order_id
            // Razorpay will pick details from the Dashboard / Cart context
            const options = {
                key: key,
                name: siteSettings?.storeName || "Ayushree Ayurveda",
                description: "Holistic Wellness Order",
                image: siteSettings?.logoUrl || "",
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || ""
                },
                handler: async function (response: any) {
                    setLoading(true);
                    try {
                        // Send payment info + cart details to save in DB
                        const verifyRes = await fetch(getApiUrl('/api/orders/verify'), {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                ...response,
                                orderDetails: { 
                                    items: cart.map(i => ({
                                        productId: i.id,
                                        name: i.name,
                                        quantity: i.quantity,
                                        price: i.price
                                    })), 
                                    total: cartTotal 
                                }
                            })
                        });
                        const result = await verifyRes.json();
                        if (result.success) {
                            clearCart();
                            window.location.href = user ? "/dashboard?status=success" : "/track-order?id=" + result.orderId;
                        } else {
                            alert("Order could not be saved. Please contact support with Payment ID: " + response.razorpay_payment_id);
                        }
                    } catch (e) {
                        alert("Network error during verification.");
                    } finally {
                        setLoading(false);
                    }
                },
                theme: { color: "#16423C" },
                modal: { ondismiss: () => setLoading(false) }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Could not initialize checkout.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF9F1]">
            <Header user={user} logout={logout} />
            <main className="container mx-auto px-4 py-16 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                        <h2 className="text-3xl font-serif font-black text-gray-900 mb-8 italic">Order Summary</h2>
                        <div className="space-y-6">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black bg-gray-100 px-2 py-1 rounded">{item.quantity}x</span>
                                        <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-100">
                            <div className="flex justify-between text-3xl font-serif font-black text-[#16423C]">
                                <span>Total</span>
                                <span className="italic">₹{cartTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center h-full">
                        <div className="text-center lg:text-left mb-8">
                             <h1 className="text-5xl font-serif font-black text-gray-900 mb-4 leading-tight">
                                {user ? `Almost there, ${user.name.split(' ')[0]}!` : "Secure Checkout"}
                             </h1>
                             <p className="text-gray-500 font-medium">
                                 {user ? "Proceed to pay and finalize your order." : "Pay securely as a guest. You can track your order using the link sent to your email."}
                             </p>
                        </div>
                        <button 
                            onClick={handlePayment}
                            disabled={loading || cart.length === 0}
                            className="group relative bg-[#16423C] text-white h-20 rounded-2xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            <span className="flex items-center justify-center gap-4">
                                {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : "Pay Securely Now"}
                            </span>
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
