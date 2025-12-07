
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom;
import { useCart } from '../contexts/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { COLORS } from '../constants';
import { trackEvent as trackPixelEvent } from '../utils/metaPixel';
import { masterTracker } from '../utils/tracking';
import { handleApiError, getFriendlyErrorMessage } from '../utils/errorHandler';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/apiHelper';

// Helper to read a cookie value
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
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

  // Track InitiateCheckout once when the page loads with items in cart
  useEffect(() => {
      if (cart.length > 0) {
          const eventPayload = {
            contents: cart.map(item => ({
                id: item.sku || item.id,
                quantity: item.quantity,
                item_price: item.price,
            })),
            content_type: 'product',
            value: cartTotal,
            currency: 'INR',
            num_items: cartCount
        };
        masterTracker('InitiateCheckout', eventPayload, eventPayload);
      }
  }, []); // Run only once on mount

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
            body: JSON.stringify({ 
                amount: cartTotal,
                currency: 'INR' 
            })
        });

        if (!orderResponse.ok) {
            throw orderResponse;
        }

        const { order_id, amount, currency, key_id } = await orderResponse.json();

        const options = {
            key: key_id, 
            amount: amount,
            currency: currency,
            name: "Ladies Smart Choice",
            description: "Payment for Your Order",
            image: "https://cdn-icons-png.flaticon.com/512/4440/4440935.png", 
            order_id: order_id,
            handler: async function (response: any) {
                // The event ID for deduplication is generated here and passed to both browser and server.
                const eventId = `purchase_${order_id}`;

                // Trigger Backend Order Creation & CAPI event
                // The pixel event will be fired inside this function upon success.
                await verifyAndPlaceOrder({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                }, eventId, order_id); 
            },
            prefill: {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                contact: formData.phone
            },
            notes: {
                address: `${formData.address}, ${formData.city}`
            },
            theme: {
                color: COLORS.accent
            }
        };

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.on('payment.failed', function (response: any){
            setError(`Payment Failed: ${response.error.description}. Please try again or contact support.`);
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
        shippingAddress: {
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country
        },
        items: cart,
        total: cartTotal,
        paymentInfo: paymentInfo,
        eventId: eventId, // Pass event ID to backend for CAPI
        // Pass Meta browser cookies to backend for CAPI
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

        const responseData = await response.json();
        
        // --- Fire the browser-side Purchase event AFTER successful server verification ---
        const purchasePayload = {
            contents: cart.map(item => ({
                id: item.sku || item.id,
                quantity: item.quantity,
                item_price: item.price,
            })),
            content_type: 'product',
            value: cartTotal,
            currency: 'INR',
            order_id: orderId, // Use the Razorpay order ID
        };
        trackPixelEvent('Purchase', { ...purchasePayload, event_id: eventId });
        
        // --- Clear cart and show success message ---
        clearCart();
        
        const successDiv = document.createElement('div');
        successDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;">
                <div style="background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 400px;">
                    <svg style="width: 60px; height: 60px; color: green; margin: 0 auto;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <h2 style="margin-top: 20px; font-size: 24px; color: #333;">Order Placed!</h2>
                    <p style="color: #666; margin-top: 10px;">Invoice sent to <b>${formData.email}</b>.</p>
                    ${responseData.accountCreated ? `<div style="margin-top:15px; padding: 10px; background: #f0fdf4; color: #166534; border-radius: 5px; font-size: 14px;">An account has been created for you.<br/>Password: Your Mobile Number</div>` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(successDiv);
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
              document.body.removeChild(successDiv);
            }
            navigate('/');
        }, 5000);

      } catch (err: any) {
          const apiError = await handleApiError(err);
          setError(getFriendlyErrorMessage(apiError));
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header user={user} logout={logout} />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form Section */}
          <div>
            <form onSubmit={handleRazorpayPayment} className="bg-white p-8 rounded-lg shadow-md space-y-6">
              <h2 className="text-xl font-semibold border-b pb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
              </div>

              <h2 className="text-xl font-semibold border-b pb-4 pt-4">Shipping Address</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input type="text" name="country" value={formData.country} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
              </div>

              <ErrorMessage message={error} onClose={() => setError(null)} />

              <button 
                type="submit" 
                disabled={loading || cart.length === 0}
                className="w-full py-3 px-4 text-white font-bold rounded-md shadow-md transition-opacity disabled:opacity-50"
                style={{ backgroundColor: COLORS.accent }}
              >
                {loading ? 'Processing...' : `Pay ₹${cartTotal.toFixed(2)}`}
              </button>
            </form>
          </div>
          {/* Order Summary */}
          <div className="bg-white p-8 rounded-lg shadow-md h-fit">
            <h2 className="text-xl font-semibold border-b pb-4 mb-4">Your Order</h2>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center">
                  <img src={item.imageUrl} alt={item.name} className="h-16 w-16 object-cover rounded-md mr-4"/>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <div className="pt-4 space-y-2">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>₹{cartTotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Shipping</p>
                <p className="text-green-600 font-medium">Free</p>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                <p>Total</p>
                <p>₹{cartTotal.toFixed(2)}</p>
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
