
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
    
    // Coupon State
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    const isMagicMode = siteSettings?.checkoutMode === 'magic';

    const [customerInfo, setCustomerInfo] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        postalCode: '',
    });

    // Recalculate Total after Discount
    const getDiscountValue = () => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.value_type === 'percentage') {
            return (cartTotal * (appliedCoupon.value / 10000)); // Value from promo API is often in basis points (10% = 1000)
        }
        return appliedCoupon.value / 100; // Assuming paise from backend
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

    // STANDARD CHECKOUT HANDLER
    const handleStandardPayment = async () => {
        if (!customerInfo.address || !customerInfo.city || !customerInfo.postalCode || !customerInfo.phone) {
            return alert("Please fill all shipping and contact details.");
        }
        
        setLoading(true);
        try {
            // 1. Create Order on Server
            const orderRes = await fetch(getApiUrl('/api/orders/create-standard-order'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    total: cartTotal, // Send original total, server will verify coupon
                    couponCode: appliedCoupon?.code
                })
            });
            
            if (!orderRes.ok) {
                const err = await orderRes.json();
                throw new Error(err.message || "Order creation failed.");
            }

            const rzpOrder = await orderRes.json();

            // 2. Fetch Razorpay Key
            const keyRes = await fetch(getApiUrl('/api/orders/key'));
            const { key } = await keyRes.json();

            const options = {
                key,
                amount: rzpOrder.amount,
                order_id: rzpOrder.id,
                name: siteSettings?.storeName || "Ayushree Ayurveda",
                prefill: { 
                    name: customerInfo.name, 
                    email: customerInfo.email, 
                    contact: customerInfo.phone 
                },
                theme: { color: siteSettings?.primaryColor || "#16423C" },
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
                    if ((await verifyRes.json()).success) {
                        clearCart();
                        window.location.href = "/dashboard?status=success";
                    } else {
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                    }
                }
            };
            
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
            
        } catch (e: any) { 
            console.error("PAYMENT INIT ERROR:", e);
            alert(e.message || "Payment initialization failed."); 
        }
        finally { setLoading(false); }
    };

    if (isMagicMode) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header user={user} logout={logout} />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h2 className="text-2xl font-brand font-black uppercase tracking-tighter">Magic Checkout Active</h2>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium">For security and speed, please initiate your order directly from the cart using express checkout.</p>
                    <button onClick={() => window.location.href = '/cart'} className="mt-8 bg-brand-primary text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95">Return to Cart</button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBF9F1]">
            <SEO title="Checkout" />
            <Header user={user} logout={logout} />
            
            <main className="container mx-auto px-4 py-12 lg:py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        
                        {/* LEFT COLUMN: SHIPPING INFO */}
                        <div className="lg:col-span-7 space-y-12">
                            <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
                                <span className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
                                <h1 className="text-3xl md:text-4xl font-brand font-black uppercase tracking-tighter italic">Shipping Information</h1>
                            </div>

                            <div className="space-y-10">
                                {/* Section: Contact */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Contact Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Email Address</label>
                                            <input 
                                                type="email" 
                                                placeholder="e.g. jane@example.com" 
                                                value={customerInfo.email} 
                                                onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} 
                                                className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Mobile Number</label>
                                            <input 
                                                type="tel" 
                                                placeholder="10-digit number" 
                                                value={customerInfo.phone} 
                                                onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} 
                                                className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Address */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Delivery Destination</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Recipient Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="Full name for delivery" 
                                                value={customerInfo.name} 
                                                onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} 
                                                className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Street Address</label>
                                            <textarea 
                                                placeholder="House/Flat No, Apartment, Street name" 
                                                value={customerInfo.address} 
                                                onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} 
                                                className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all resize-none" 
                                                rows={3} 
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">City</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="City" 
                                                    value={customerInfo.city} 
                                                    onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})} 
                                                    className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all" 
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Pincode</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="6-digit code" 
                                                    value={customerInfo.postalCode} 
                                                    onChange={e => setCustomerInfo({...customerInfo, postalCode: e.target.value})} 
                                                    className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-8 md:p-10 lg:sticky lg:top-24">
                                <h3 className="text-xl font-brand font-black uppercase tracking-tighter mb-8 italic">Order Summary</h3>
                                
                                {/* Item List with Quantity Controls */}
                                <div className="space-y-6 mb-10 max-h-[350px] overflow-y-auto pr-2 admin-scroll">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-4 items-center animate-fade-in group">
                                            <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 shrink-0 overflow-hidden shadow-inner">
                                                <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight">{item.name}</h4>
                                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                                                    {item.category}
                                                </p>
                                                
                                                {/* Quantity Control Panel */}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center border border-gray-100 bg-gray-50 rounded-lg p-0.5">
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                            className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md text-gray-400 hover:text-brand-primary transition-all active:scale-90"
                                                        >−</button>
                                                        <span className="w-8 text-center text-[10px] font-black text-gray-900">{item.quantity}</span>
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md text-gray-400 hover:text-brand-primary transition-all active:scale-90"
                                                        >+</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-gray-900 italic">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {cart.length === 0 && <p className="text-center text-gray-400 italic py-10 font-medium">Your cart is currently empty.</p>}
                                </div>

                                {/* Promo Code Engine */}
                                <div className="mb-10 pt-8 border-t border-gray-50">
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Apply Discount Code</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input 
                                                type="text" 
                                                value={couponInput}
                                                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                placeholder="ENTER CODE" 
                                                className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all ${appliedCoupon ? 'border-green-200 bg-green-50 text-green-700' : 'border-transparent focus:bg-white focus:border-gray-200'}`} 
                                                disabled={!!appliedCoupon}
                                            />
                                            {appliedCoupon && (
                                                <button onClick={() => {setAppliedCoupon(null); setCouponInput('');}} className="absolute right-3 top-3 text-green-600 hover:text-red-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></button>
                                            )}
                                        </div>
                                        {!appliedCoupon ? (
                                            <button 
                                                onClick={handleApplyCoupon}
                                                disabled={couponLoading || !couponInput.trim()}
                                                className="bg-brand-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                                            >
                                                {couponLoading ? '...' : 'Apply'}
                                            </button>
                                        ) : (
                                            <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl flex items-center justify-center">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    {appliedCoupon && <p className="text-[9px] font-black text-green-600 mt-2 uppercase tracking-widest animate-fade-in">✨ {appliedCoupon.description}</p>}
                                </div>

                                {/* Financial Breakdown */}
                                <div className="space-y-4 mb-10">
                                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                        <span className="uppercase tracking-widest">Subtotal</span>
                                        <span className="text-gray-900 font-bold italic">₹{cartTotal.toLocaleString()}</span>
                                    </div>
                                    
                                    {appliedCoupon && (
                                        <div className="flex justify-between items-center text-sm font-medium text-green-600 animate-fade-in">
                                            <span className="uppercase tracking-widest">Discount ({appliedCoupon.code})</span>
                                            <span className="font-bold italic">− ₹{getDiscountValue().toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                        <span className="uppercase tracking-widest">Shipping</span>
                                        <span className="text-brand-accent font-black uppercase tracking-widest">Free</span>
                                    </div>

                                    <div className="pt-6 border-t border-dashed border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-brand font-black uppercase tracking-tighter italic">Total Due</span>
                                            <div className="text-right">
                                                <p className="text-3xl font-brand font-black text-brand-primary italic leading-none transition-all duration-500">₹{discountedTotal.toLocaleString()}</p>
                                                <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Inclusive of all taxes</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Action */}
                                <button 
                                    onClick={handleStandardPayment}
                                    disabled={loading || cart.length === 0}
                                    className="group w-full bg-brand-primary text-white h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:shadow-brand-primary/30 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Complete Purchase
                                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                                
                                <div className="mt-6 flex items-center justify-center gap-2 opacity-40">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">SSL Encrypted Secure Payment</span>
                                </div>
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
