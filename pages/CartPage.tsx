
import React, { useState } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDom as any;
import { useCart } from '../contexts/CartContext';
import { useSiteData } from '../contexts/SiteDataContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { masterTracker } from '../utils/tracking';
import { getApiUrl } from '../utils/apiHelper';

const CartPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();
  const { siteSettings } = useSiteData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleMagicCheckout = async () => {
    setLoading(true);
    try {
        const orderRes = await fetch(getApiUrl('/api/orders/create-standard-order'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total: cartTotal })
        });
        const rzpOrder = await orderRes.json();
        const keyRes = await fetch(getApiUrl('/api/orders/key'));
        const { key } = await keyRes.json();

        const options = {
            key,
            amount: rzpOrder.amount,
            order_id: rzpOrder.id,
            name: siteSettings?.storeName || "Ayushree Ayurveda",
            prefill: { contact: user?.phone || '', email: user?.email || '' },
            theme: { color: siteSettings?.primaryColor || "#09090b" },
            handler: async (response: any) => {
                const verifyRes = await fetch(getApiUrl('/api/orders/verify-magic'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        orderDetails: { items: cart, total: cartTotal }
                    })
                });
                if (verifyRes.ok) {
                    clearCart();
                    window.location.href = "/dashboard?status=success";
                }
            },
            modal: { ondismiss: () => setLoading(false) }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    } catch (e) { console.error(e); setLoading(false); }
  };

  const handleProceed = () => {
    const payload = {
        contents: cart.map(i => ({ id: i.sku || i.id, quantity: i.quantity, price: i.price })),
        value: cartTotal,
        currency: 'INR',
    };
    masterTracker('InitiateCheckout', payload, payload);
    
    if (siteSettings?.checkoutMode === 'magic') {
        handleMagicCheckout();
    } else {
        navigate('/checkout');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <Header user={user} logout={logout} />
      <main className="flex-grow container mx-auto px-4 py-12 lg:py-20 max-w-[1200px]">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-10">Your Bag</h1>
        {cart.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-zinc-200 shadow-sm space-y-6">
                <p className="text-zinc-500 font-medium italic">Your bag is currently empty.</p>
                <Link to="/" className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-8 text-sm font-bold text-zinc-50 shadow">Shop Wellness</Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-4">
                    {cart.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex gap-6 animate-in slide-in-from-bottom-1">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border border-zinc-100 overflow-hidden flex-shrink-0"><img src={item.imageUrl} className="w-full h-full object-cover mix-blend-multiply" /></div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div className="flex justify-between items-start gap-4">
                                    <div><h3 className="text-base font-bold text-zinc-900 mb-1">{item.name}</h3><p className="text-xs font-bold uppercase text-zinc-400">{item.category}</p></div>
                                    <p className="text-base font-black italic">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                                        <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-zinc-900 font-bold">−</button>
                                        <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-zinc-900 font-bold">+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-xs font-bold text-rose-600 hover:underline uppercase">Remove</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-4 lg:sticky lg:top-24">
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 space-y-6">
                        <h3 className="text-xl font-bold tracking-tight border-b border-zinc-100 pb-4">Order Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-medium text-zinc-500"><span>Subtotal</span><span className="text-zinc-900">₹{cartTotal.toLocaleString()}</span></div>
                            <div className="flex justify-between text-sm font-medium text-zinc-500"><span>Shipping</span><span className="text-green-600 font-bold">FREE</span></div>
                        </div>
                        <div className="pt-6 border-t border-dashed border-zinc-200 flex justify-between items-center"><span className="text-lg font-bold">Total</span><span className="text-2xl font-black italic">₹{cartTotal.toLocaleString()}</span></div>
                        <button onClick={handleProceed} disabled={loading} className={`w-full h-14 rounded-md font-bold text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] ${siteSettings?.checkoutMode === 'magic' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                            {loading ? 'Opening Razorpay...' : siteSettings?.checkoutMode === 'magic' ? '✨ Magic Checkout' : 'Proceed to Checkout'}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
