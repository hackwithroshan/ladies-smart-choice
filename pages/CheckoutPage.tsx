


import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { getApiUrl } from '../utils/apiHelper';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Fix: Add props interface to handle user authentication state and logout functionality
interface CheckoutPageProps {
    user: any;
    logout: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ user, logout }) => {
    const { cart, cartTotal, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Load Magic Checkout Script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/magic-checkout.js';
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    const handleMagicCheckout = async () => {
        if (!scriptLoaded) return;
        setLoading(true);

        try {
            // 1. Create Order on Backend
            const res = await fetch(getApiUrl('/api/orders/create-magic-order'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    totalAmount: cartTotal
                })
            });

            const orderData = await res.json();

            // 2. Configure Magic Checkout Options
            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: "INR",
                name: "Ladies Smart Choice",
                description: "Premium Fashion Order",
                order_id: orderData.id,
                
                // MANDATORY FLAG FOR MAGIC CHECKOUT
                one_click_checkout: true,
                
                // Magic Checkout Configuration
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
                    // Magic Checkout returns contact and address in the response
                    // along with standard payment IDs
                    const verificationRes = await fetch(getApiUrl('/api/orders/verify-magic-payment'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...response,
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
                        alert("Payment verification failed.");
                    }
                },
                modal: {
                    ondismiss: function () { setLoading(false); }
                },
                theme: { color: "#16423C" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Magic Checkout Init Failed:", error);
            alert("Could not initialize payment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fix: Pass user and logout from props to the Header component */}
            <Header user={user} logout={logout} />
            <main className="container mx-auto px-4 py-20 text-center">
                <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 italic uppercase tracking-tighter">Ready to Order?</h1>
                        <p className="text-gray-500 mt-2">Experience 1-Click checkout with Razorpay Magic.</p>
                    </div>

                    <div className="space-y-4 mb-10">
                        <div className="flex justify-between font-bold text-lg border-b pb-4">
                            <span>Order Total</span>
                            <span className="text-rose-600">₹{cartTotal.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-400 text-left">
                            * We will automatically fetch your saved addresses and contact details in the next step.
                        </p>
                    </div>

                    <button
                        onClick={handleMagicCheckout}
                        disabled={loading || cart.length === 0}
                        className="w-full bg-[#16423C] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:opacity-90 transition-all transform active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Preparing Magic Checkout...' : 'Pay with Magic Checkout'}
                    </button>
                    
                    <div className="mt-6 flex items-center justify-center gap-4 grayscale opacity-40">
                        <img src="https://cdn-icons-png.flaticon.com/512/349/349221.png" className="h-4" alt="Visa" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" className="h-3" alt="UPI" />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;