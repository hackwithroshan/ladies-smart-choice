
import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useSiteData } from '../contexts/SiteDataContext';
import { useToast } from '../contexts/ToastContext';
import { getApiUrl } from '../utils/apiHelper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const CheckoutPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { cart, cartTotal, updateQuantity, clearCart } = useCart();
    const { siteSettings } = useSiteData();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    const [customerInfo, setCustomerInfo] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        postalCode: '',
    });

    const getDiscountValue = () => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.value_type === 'percentage') {
            return (cartTotal * (appliedCoupon.value / 10000));
        }
        return appliedCoupon.value / 100;
    };

    const discountedTotal = Math.max(0, cartTotal - getDiscountValue());

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/discounts/apply-promo'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code: couponInput,
                    email: customerInfo.email,
                    contact: customerInfo.phone
                })
            });
            const data = await res.json();
            if (res.ok && data.promotion) {
                setAppliedCoupon(data.promotion);
                showToast("Coupon applied successfully!", "success");
            } else {
                showToast(data.error?.description || "Invalid coupon code", "error");
                setAppliedCoupon(null);
            }
        } catch (e) {
            showToast("Failed to validate coupon", "error");
        } finally {
            setCouponLoading(false);
        }
    };

    const handleStandardPayment = async () => {
        if (!customerInfo.address || !customerInfo.city || !customerInfo.postalCode || !customerInfo.phone || !customerInfo.name || !customerInfo.email) {
            return showToast("Please fill all required shipping and contact details.", "error");
        }
        
        setLoading(true);
        try {
            const orderRes = await fetch(getApiUrl('/api/orders/create-standard-order'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    total: cartTotal,
                    couponCode: appliedCoupon?.code
                })
            });
            
            if (!orderRes.ok) {
                const err = await orderRes.json();
                throw new Error(err.message || "Order initialization failed.");
            }

            const rzpOrder = await orderRes.json();
            const keyRes = await fetch(getApiUrl('/api/orders/key'));
            const { key } = await keyRes.json();

            const options = {
                key,
                amount: rzpOrder.amount,
                order_id: rzpOrder.id,
                name: siteSettings?.storeName || "Ayushree Ayurveda",
                prefill: { name: customerInfo.name, email: customerInfo.email, contact: customerInfo.phone },
                theme: { color: siteSettings?.primaryColor || "#09090b" },
                handler: async (response: any) => {
                    const verifyRes = await fetch(getApiUrl('/api/orders/verify-standard'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            orderDetails: {
                                items: cart,
                                total: discountedTotal,
                                customerInfo: {
                                    ...customerInfo,
                                    shippingAddress: {
                                        address: customerInfo.address,
                                        city: customerInfo.city,
                                        postalCode: customerInfo.postalCode,
                                        country: 'India'
                                    }
                                }
                            }
                        })
                    });
                    if (verifyRes.ok) {
                        clearCart();
                        window.location.href = "/dashboard?status=success";
                    } else {
                        showToast("Payment verification failed. Please contact support.", "error");
                    }
                },
                modal: { ondismiss: () => setLoading(false) }
            };
            
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
            
        } catch (e: any) { 
            showToast(e.message || "Payment initialization failed.", "error"); 
        } finally { setLoading(false); }
    };

    if (siteSettings?.checkoutMode === 'magic') {
        return (
            <div className="min-h-screen bg-zinc-50">
                <Header user={user} logout={logout} />
                <div className="container mx-auto px-4 py-24 text-center">
                    <div className="w-20 h-20 bg-zinc-900 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Magic Checkout Active</h2>
                    <p className="text-zinc-500 mt-4 max-w-sm mx-auto font-medium">To proceed securely, please use the express checkout button directly from your bag.</p>
                    <button onClick={() => window.location.href = '/cart'} className="mt-10 bg-zinc-900 text-white px-10 py-4 rounded-md font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-zinc-800 transition-all active:scale-95">Return to Bag</button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50/50">
            <SEO title="Checkout" />
            <Header user={user} logout={logout} />
            <main className="container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-7 space-y-12 animate-in slide-in-from-left-4">
                        <div className="flex items-center gap-4 border-b border-zinc-200 pb-6">
                            <span className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Delivery Details</h1>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Full Name</label><input type="text" placeholder="Recipient name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:ring-1 focus:ring-zinc-950 outline-none shadow-sm" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Mobile Number</label><input type="tel" placeholder="10-digit number" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:ring-1 focus:ring-zinc-950 outline-none shadow-sm" /></div>
                        </div>
                        <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Email Address</label><input type="email" placeholder="name@example.com" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:ring-1 focus:ring-zinc-950 outline-none shadow-sm" /></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Street Address</label><textarea placeholder="Apt, Suite, Street name" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:ring-1 focus:ring-zinc-950 outline-none shadow-sm resize-none" rows={3} /></div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">City</label><input type="text" placeholder="City" value={customerInfo.city} onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})} className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:ring-1 focus:ring-zinc-950 outline-none shadow-sm" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Pincode</label><input type="text" placeholder="6-digit code" value={customerInfo.postalCode} onChange={e => setCustomerInfo({...customerInfo, postalCode: e.target.value})} className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:ring-1 focus:ring-zinc-950 outline-none shadow-sm" /></div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 lg:sticky lg:top-24 animate-in slide-in-from-right-4">
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 space-y-8">
                            <h3 className="text-xl font-bold tracking-tight text-zinc-900 border-b border-zinc-100 pb-4">Summary</h3>
                            <div className="space-y-6 max-h-48 overflow-y-auto pr-2 admin-scroll">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-zinc-50 rounded border border-zinc-100 overflow-hidden"><img src={item.imageUrl} className="w-full h-full object-cover" /></div>
                                            <div><p className="font-bold text-zinc-900 line-clamp-1">{item.name}</p><p className="text-xs text-zinc-400">Qty: {item.quantity}</p></div>
                                        </div>
                                        <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 pt-6 border-t border-zinc-100">
                                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest">Promotion Code</label>
                                <div className="flex gap-2">
                                    <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} placeholder="COUPON" className="flex-1 bg-zinc-50 border border-zinc-200 rounded-md px-4 py-2.5 text-sm font-bold outline-none focus:bg-white focus:ring-1 focus:ring-zinc-950 transition-all" />
                                    <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()} className="bg-zinc-900 text-zinc-50 px-6 rounded-md text-xs font-bold uppercase transition-all hover:bg-zinc-800 disabled:opacity-50">{couponLoading ? '...' : 'Apply'}</button>
                                </div>
                                {appliedCoupon && <p className="text-[10px] font-bold text-green-600 animate-pulse uppercase tracking-wider">✨ {appliedCoupon.description}</p>}
                            </div>
                            <div className="space-y-3 pt-6 border-t border-dashed border-zinc-200">
                                <div className="flex justify-between text-sm font-medium text-zinc-500"><span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
                                {appliedCoupon && <div className="flex justify-between text-sm font-bold text-green-600"><span>Discount</span><span>-₹{getDiscountValue().toLocaleString()}</span></div>}
                                <div className="flex justify-between text-sm font-medium text-zinc-500"><span>Shipping</span><span className="text-green-600">FREE</span></div>
                                <div className="flex justify-between text-xl font-black text-zinc-900 pt-2"><span>Total Due</span><span>₹{discountedTotal.toLocaleString()}</span></div>
                            </div>
                            <button onClick={handleStandardPayment} disabled={loading || cart.length === 0} className="w-full bg-zinc-900 text-white h-14 rounded-md font-bold text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50">
                                {loading ? 'Processing...' : 'Complete Payment'}
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
