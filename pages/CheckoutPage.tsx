
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { getApiUrl } from '../utils/apiHelper';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CheckoutPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { cart, cartTotal, clearCart } = useCart();
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Backend se order generate karwana (With Amount)
            const res = await fetch(getApiUrl('/api/orders/initiate'), {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount: cartTotal, items: cart })
            });
            const data = await res.json();

            // 2. Razorpay Options (FIX: NO amount or currency here)
            const options = {
                key: data.key,
                order_id: data.id, 
                name: "Ladies Smart Choice",
                description: "Premium Fashion Purchase",
                image: "https://your-logo-url.com/logo.png",
                handler: async function (response: any) {
                    // 3. Signature Verification
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
                    name: user?.name,
                    email: user?.email,
                },
                theme: { color: "#16423C" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            alert("Payment failed to initialize");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} logout={logout} />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Order Summary</h2>
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                                <span className="text-gray-600 font-medium">{item.name} x {item.quantity}</span>
                                <span className="text-gray-900 font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="flex justify-between mt-6 pt-6 border-t-2 border-dashed border-gray-200">
                            <span className="text-xl font-bold text-gray-900">Total</span>
                            <span className="text-2xl font-black text-rose-600">₹{cartTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-serif font-black text-gray-900 mb-2">Secure Checkout</h1>
                            <p className="text-gray-500">Choose your preferred payment method</p>
                        </div>
                        
                        <button 
                            onClick={handlePayment}
                            disabled={loading || cart.length === 0}
                            className="w-full bg-[#16423C] text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Initializing Gateway..." : "Pay Securely with Razorpay"}
                        </button>

                        <div className="mt-8 flex justify-center items-center gap-4 opacity-40 grayscale">
                            <img src="https://cdn-icons-png.flaticon.com/512/349/349221.png" className="h-6" alt="Visa" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" className="h-4" alt="UPI" />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
