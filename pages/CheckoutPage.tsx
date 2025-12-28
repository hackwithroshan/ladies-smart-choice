
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate, useSearchParams } = ReactRouterDom as any;
import { useCart } from '../contexts/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { masterTracker } from '../utils/tracking';
import { handleApiError, getFriendlyErrorMessage } from '../utils/errorHandler';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/apiHelper';
import { useSiteData } from '../contexts/SiteDataContext';

const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
};

interface CheckoutPageProps {
  user: any;
  logout: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ user, logout }) => {
  const { cart, cartTotal, cartCount, clearCart } = useCart();
  const { siteSettings } = useSiteData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMagicCheckout = searchParams.get('magic') === 'true';

  const BrandName = siteSettings?.storeName || "Ayushree Ayurveda";
  
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India',
  });

  // --- AUTO TRIGGER RAZORPAY FOR MAGIC CHECKOUT ---
  useEffect(() => {
      if (isMagicCheckout && cart.length > 0 && !loading) {
          // If Magic checkout is requested, trigger Razorpay immediately
          // We use dummy/stored data for prefill if available
          handleRazorpayPayment(null as any);
      }
  }, [isMagicCheckout, cart.length]);

  useEffect(() => {
      if (cart.length > 0) {
          const eventPayload = {
            contents: cart.map(item => ({ id: item.sku || item.id, quantity: item.quantity, item_price: item.price })),
            content_type: 'product',
            value: cartTotal,
            currency: 'INR',
            num_items: cartCount
        };
        masterTracker('InitiateCheckout', eventPayload, eventPayload);
      }
  }, []); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRazorpayPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return;
    
    setLoading(true);
    setError(null);

    try {
        const orderResponse = await fetch(getApiUrl('/api/orders/razorpay-order'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: cartTotal, currency: 'INR' })
        });

        if (!orderResponse.ok) throw orderResponse;

        const { order_id, amount, currency, key_id } = await orderResponse.json();

        const options = {
            key: key_id, 
            amount: amount,
            currency: currency,
            name: BrandName,
            description: `Checkout at ${BrandName}`,
            image: siteSettings?.logoUrl || "https://cdn-icons-png.flaticon.com/512/4440/4440935.png", 
            order_id: order_id,
            // MAGIC CHECKOUT CONFIG
            "checkout": {
                "method": "netbanking", // Suggest RMC to open specific flow
                "magic": true // Internal RMC flag
            },
            handler: async function (response: any) {
                const eventId = `purchase_${order_id}`;
                await verifyAndPlaceOrder({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                }, eventId, order_id); 
            },
            prefill: { 
                name: `${formData.firstName} ${formData.lastName}`.trim(), 
                email: formData.email, 
                contact: formData.phone 
            },
            theme: { color: document.documentElement.style.getPropertyValue('--brand-primary') || '#16423C' },
            modal: {
                ondismiss: function() {
                    setLoading(false);
                    // If they dismiss magic checkout, stay on page but stop loading
                    if (isMagicCheckout) {
                        navigate('/cart'); // Go back to cart if magic failed/dismissed
                    }
                }
            }
        };

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();

    } catch (err: any) {
        const apiError = await handleApiError(err);
        setError(getFriendlyErrorMessage(apiError));
        setLoading(false);
    }
  };

  const verifyAndPlaceOrder = async (paymentInfo: any, eventId: string, orderId: string) => {
      // For Magic Checkout, RMC returns the shipping address in the response usually, 
      // but standard integration assumes we use what we have or RMC dashboard handles it.
      const orderData = {
        userId: user?.id,
        customerName: `${formData.firstName} ${formData.lastName}` || 'Magic Customer',
        customerEmail: formData.email || 'magic@customer.com',
        customerPhone: formData.phone,
        shippingAddress: { 
            address: formData.address || 'Address Managed by Razorpay Magic', 
            city: formData.city || 'Managed', 
            postalCode: formData.postalCode || '000000', 
            country: formData.country 
        },
        items: cart,
        total: cartTotal,
        paymentInfo,
        eventId,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
      };

      try {
        const response = await fetch(getApiUrl('/api/orders'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });
        if (!response.ok) throw response;
        clearCart();
        navigate('/');
        alert("Order Successful! We are preparing your rituals.");
      } catch (err: any) {
          const apiError = await handleApiError(err);
          setError(getFriendlyErrorMessage(apiError));
      } finally { setLoading(false); }
  };

  if (isMagicCheckout) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-white p-8 text-center">
              <div className="max-w-md space-y-6">
                  <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h1 className="text-2xl font-black text-gray-900 italic uppercase tracking-tight">Initiating Magic Checkout...</h1>
                  <p className="text-gray-500 font-medium">Securely connecting to Razorpay. Do not refresh this page.</p>
                  {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={user} logout={logout} />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-serif font-black text-gray-900 mb-10 text-center uppercase tracking-tighter italic">Finalize Your Order</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <form onSubmit={handleRazorpayPayment} className="bg-white p-10 rounded-3xl shadow-xl space-y-8 border border-gray-100">
              <div className="flex justify-between items-center border-b border-gray-100 pb-5">
                  <h2 className="text-xl font-bold text-gray-800">Delivery Details</h2>
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">Secure</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">First Name</label>
                    <input type="text" name="firstName" placeholder="Jane" value={formData.firstName} onChange={handleInputChange} required className="w-full border-gray-200 rounded-2xl p-3 focus:ring-rose-500 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Last Name</label>
                    <input type="text" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} required className="w-full border-gray-200 rounded-2xl p-3 focus:ring-rose-500 outline-none transition-all" />
                </div>
              </div>
              <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required className="w-full border-gray-200 rounded-2xl p-3 focus:ring-rose-500 outline-none transition-all" />
              <input type="tel" name="phone" placeholder="Mobile Number (Prefilled for Magic)" value={formData.phone} onChange={handleInputChange} required className="w-full border-gray-200 rounded-2xl p-3 focus:ring-rose-500 outline-none transition-all" />
              <input type="text" name="address" placeholder="Shipping Address" value={formData.address} onChange={handleInputChange} required className="w-full border-gray-200 rounded-2xl p-3 focus:ring-rose-500 outline-none transition-all" />
              <div className="grid grid-cols-2 gap-6">
                <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleInputChange} required className="border-gray-200 rounded-2xl p-3 focus:ring-rose-500 outline-none transition-all" />
                <input type="text" name="postalCode" placeholder="Pincode" value={formData.postalCode} onChange={handleInputChange} required className="border-gray-200 rounded-2xl p-3 focus:ring-rose-500 outline-none transition-all" />
              </div>
              
              <ErrorMessage message={error} onClose={() => setError(null)} />
              
              <button type="submit" disabled={loading || cart.length === 0} className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-rose-700 disabled:opacity-50 transition-all transform active:scale-95">
                {loading ? 'Initiating Checkout...' : `Complete Purchase • ₹${cartTotal.toLocaleString()}`}
              </button>
          </form>
          
          <div className="bg-white p-10 rounded-3xl shadow-xl h-fit border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-5 mb-6">Order Summary</h2>
            <div className="space-y-6">
                {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover"/>
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Qty: {item.quantity}</p>
                        </div>
                    </div>
                    <p className="font-black text-sm text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
                ))}
            </div>
            <div className="pt-8 border-t border-gray-100 mt-8 space-y-4">
              <div className="flex justify-between text-sm text-gray-500 font-medium"><span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm text-green-600 font-bold"><span>Shipping</span><span>Free</span></div>
              <div className="flex justify-between font-black text-xl text-brand-primary pt-2 border-t border-dashed"><span>Grand Total</span><span>₹{cartTotal.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
