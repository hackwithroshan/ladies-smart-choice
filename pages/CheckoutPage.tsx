
import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { useSiteData } from '../contexts/SiteDataContext';
import { useToast } from '../contexts/ToastContext';
import { getApiUrl } from '../utils/apiHelper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { masterTracker } from '../utils/tracking';

const CheckoutPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { cart, cartTotal, cartCount, clearCart } = useCart();
    const { siteSettings } = useSiteData();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const hasTracked = useRef(false);

    useEffect(() => {
        if (cart.length > 0 && !hasTracked.current) {
            masterTracker('InitiateCheckout', {
                content_name: 'Checkout Start',
                content_category: 'Ecommerce',
                content_ids: cart.map(i => String(i.sku || i.id)),
                value: cartTotal,
                num_items: cartCount,
                currency: 'INR',
            });
            hasTracked.current = true;
        }
    }, [cart, cartTotal, cartCount]);

    const handleStandardPayment = async () => {
        showToast("Standard checkout logic triggered", "info");
    };

    return (
        <div className="min-h-screen bg-zinc-50/50">
            <SEO title="Checkout" />
            <Header user={user} logout={logout} />
            <main className="container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
                <div className="text-center py-20 bg-white rounded-3xl border shadow-sm">
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter">Secure Checkout</h1>
                    <p className="text-zinc-500 mt-4">Order Summary: ₹{cartTotal.toLocaleString()}</p>
                    <button onClick={handleStandardPayment} className="mt-8 bg-zinc-900 text-white px-10 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest">Complete Purchase</button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
