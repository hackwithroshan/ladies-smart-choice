
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
        if (cart.length === 0) return alert("Cart empty");
        if (!(window as any).Razorpay) return alert("Razorpay SDK not loaded");

        setLoading(true);

        try {
            // 1. Get Public Key from Backend
            const keyRes = await fetch(getApiUrl('/api/orders/key'));
            const { key } = await keyRes.json();

            // 2. Prepare Razorpay Options
            const options = {
                key: key,
                amount: cartTotal * 100, 
                currency: "INR",
                name: siteSettings?.storeName || "Ladies Smart Choice",
                description: "Order Purchase",
                image: siteSettings?.logoUrl || "",
                // Magic Checkout needs notes to identify the order items
                notes: {
                    merchant_order_id: `ORD_${Date.now()}`,
                    cart_items: JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity })))
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
                                orderDetails: { 
                                    items: cart.map(i => ({
                                        productId: i.id,
                                        name: i.name,
                                        quantity: i.quantity,
                                        price: i.price,
                                        imageUrl: i.imageUrl
                                    })), 
                                    total: cartTotal,
                                    customerEmail: user?.email || "guest@example.com"
                                }
                            })
                        });
                        
                        const result = await verifyRes.json();
                        if (result.success) {
                            clearCart();
                            // Redirect to success page or dashboard
                            window.location.href = "/dashboard?status=success";
                        } else {
                            alert("Backend Error: " + result.message);
                        }
                    } catch (e) {
                        alert("Verification Failed");
                    }
                },
                theme: { color: "#16423C" },
                // Disable direct method selection to force Magic Login flow if enabled
                "options": {
                    "checkout": {
                        "method": {
                            "netbanking": "1",
                            "card": "1",
                            "upi": "1",
                            "wallet": "1"
                        }
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Checkout fail:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF9F1]">
            <Header user={user} logout={logout} />
            <main className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-8 border-b bg-gray-50">
                        <h1 className="text-3xl font-serif font-black text-gray-900 italic">Secure Checkout</h1>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-6">Order Summary</h3>
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-gray-700">{item.name} x {item.quantity}</span>
                                        <span className="font-black text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t-2 border-dashed flex justify-between items-center text-2xl font-serif font-black text-[#16423C]">
                                    <span>Total</span>
                                    <span>₹{cartTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center text-center">
                            <p className="text-gray-500 text-sm mb-8">We use Razorpay Magic for a faster checkout. You will be able to select your address in the popup.</p>
                            <button 
                                onClick={handlePayment}
                                disabled={loading || cart.length === 0}
                                className="w-full bg-[#16423C] text-white h-16 rounded-2xl font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? "Processing..." : "Pay Securely Now"}
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
