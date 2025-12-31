
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
        setLoading(true);
        try {
            // 1. Backend Order Creation
            const res = await fetch(getApiUrl('/api/orders/initiate'), {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount: cartTotal, items: cart })
            });
            const data = await res.json();

            // 2. Razorpay Configuration
            const options = {
                key: data.key,
                order_id: data.id, 
                name: siteSettings?.storeName || "Ladies Smart Choice",
                description: "Premium Wellness Purchase",
                // IMAGE: Aapka brand logo
                image: siteSettings?.logoUrl || "https://your-logo-url.com/logo.png",
                handler: async function (response: any) {
                    // 3. Backend Verification
                    const verifyRes = await fetch(getApiUrl('/api/orders/verify'), {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            ...response,
                            orderDetails: { items: cart, total: cartTotal }
                        })
                    });
                    const result = await verifyRes.json();
                    if (result.success) {
                        clearCart();
                        window.location.href = "/dashboard?status=success";
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || ""
                },
                notes: {
                    address: "Shipping Address is collected in the next step"
                },
                theme: { color: "#16423C" },
                // Modal settings for address
                modal: {
                    ondismiss: function() { setLoading(false); }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            alert("Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF9F1]">
            <Header user={user} logout={logout} />
            <main className="container mx-auto px-4 py-16 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Order Summary */}
                    <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                        <h2 className="text-3xl font-brand font-black text-gray-900 mb-8 italic tracking-tight">Review Your Order</h2>
                        <div className="space-y-6">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center font-bold text-gray-400 border">
                                            {item.quantity}x
                                        </div>
                                        <span className="text-gray-700 font-bold uppercase tracking-tight text-sm">{item.name}</span>
                                    </div>
                                    <span className="text-gray-900 font-black">₹{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-10 pt-10 border-t-2 border-dashed border-gray-100 space-y-4">
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>Subtotal</span>
                                <span>₹{cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-green-600 font-bold">
                                <span>Shipping</span>
                                <span>FREE</span>
                            </div>
                            <div className="flex justify-between text-3xl font-black text-[#16423C] pt-4">
                                <span>Total</span>
                                <span>₹{cartTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex flex-col justify-center h-full py-10">
                        <div className="mb-12">
                            <h1 className="text-4xl font-brand font-black text-gray-900 leading-none mb-4">Secure & Instant <br/><span className="text-rose-600">Magic Checkout</span></h1>
                            <p className="text-gray-500 font-medium leading-relaxed">Pay with UPI, Cards, or Netbanking. Your shipping address will be collected securely during the payment process.</p>
                        </div>
                        
                        <button 
                            onClick={handlePayment}
                            disabled={loading || cart.length === 0}
                            className="group relative w-full bg-[#16423C] text-white h-20 rounded-2xl font-black text-xl shadow-2xl hover:scale-[1.02] transition-all transform active:scale-95 disabled:opacity-50 overflow-hidden"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-4">
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" strokeWidth={2.5}/></svg>
                                        Proceed to Pay
                                    </>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>

                        <div className="mt-12">
                            <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Guaranteed Safe Checkout</p>
                            <div className="flex justify-center items-center gap-8 grayscale opacity-40">
                                <img src="https://cdn-icons-png.flaticon.com/512/349/349221.png" className="h-5" alt="Visa" />
                                <img src="https://cdn-icons-png.flaticon.com/512/349/349228.png" className="h-5" alt="Master" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" className="h-3" alt="UPI" />
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
