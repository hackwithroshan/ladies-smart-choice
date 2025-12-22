
import React, { useState, useEffect } from 'react';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
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

  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
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
            description: `Payment for Order at ${BrandName}`,
            image: siteSettings?.logoUrl || "https://cdn-icons-png.flaticon.com/512/4440/4440935.png", 
            order_id: order_id,
            handler: async function (response: any) {
                const eventId = `purchase_${order_id}`;
                await verifyAndPlaceOrder({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                }, eventId, order_id); 
            },
            prefill: { name: `${formData.firstName} ${formData.lastName}`, email: formData.email, contact: formData.phone },
            theme: { color: document.documentElement.style.getPropertyValue('--brand-primary') || '#16423C' }
        };

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.on('payment.failed', (response: any) => {
            setError(`Payment Failed: ${response.error.description}`);
            setLoading(false);
        });
        rzp1.open();

    } catch (err: any) {
        const apiError = await handleApiError(err);
        setError(getFriendlyErrorMessage(apiError));
        setLoading(false);
    }
  };

  const verifyAndPlaceOrder = async (paymentInfo: any, eventId: string, orderId: string) => {
      const orderData = {
        userId: user?.id,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: { address: formData.address, city: formData.city, postalCode: formData.postalCode, country: formData.country },
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
        alert("Order placed successfully! Check your email for invoice.");
      } catch (err: any) {
          const apiError = await handleApiError(err);
          setError(getFriendlyErrorMessage(apiError));
      } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={user} logout={logout} />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Finalize Purchase</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <form onSubmit={handleRazorpayPayment} className="bg-white p-8 rounded-lg shadow-md space-y-6">
              <h2 className="text-xl font-brand font-semibold border-b pb-4">Shipping Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} required className="border rounded p-3" />
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} required className="border rounded p-3" />
              </div>
              <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required className="w-full border rounded p-3" />
              <input type="tel" name="phone" placeholder="Mobile Number" value={formData.phone} onChange={handleInputChange} required className="w-full border rounded p-3" />
              <input type="text" name="address" placeholder="Flat, Street, Area" value={formData.address} onChange={handleInputChange} required className="w-full border rounded p-3" />
              <div className="grid grid-cols-3 gap-6">
                <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleInputChange} required className="border rounded p-3" />
                <input type="text" name="postalCode" placeholder="Pincode" value={formData.postalCode} onChange={handleInputChange} required className="border rounded p-3" />
                <input type="text" name="country" value={formData.country} disabled className="border rounded p-3 bg-gray-100" />
              </div>
              <ErrorMessage message={error} onClose={() => setError(null)} />
              <button type="submit" disabled={loading || cart.length === 0} className="w-full bg-brand-primary text-white py-4 rounded-lg font-bold hover:opacity-90 disabled:opacity-50">
                {loading ? 'Processing...' : `Secure Checkout • ₹${cartTotal.toFixed(2)}`}
              </button>
          </form>
          {/* Order Summary */}
          <div className="bg-white p-8 rounded-lg shadow-md h-fit">
            <h2 className="text-xl font-brand font-semibold border-b pb-4 mb-4">In Your Bag</h2>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-0">
                <div className="flex items-center">
                  <img src={item.imageUrl} alt={item.name} className="h-16 w-12 object-cover rounded mr-4"/>
                  <div><p className="font-bold text-sm">{item.name}</p><p className="text-xs text-gray-500">Qty: {item.quantity}</p></div>
                </div>
                <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between font-bold text-lg"><p>Grand Total</p><p>₹{cartTotal.toFixed(2)}</p></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
