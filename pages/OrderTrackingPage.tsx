
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getApiUrl } from '../utils/apiHelper';
import { COLORS } from '../constants';

interface OrderTrackingPageProps {
  user: any;
  logout: () => void;
}

const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ user, logout }) => {
    const [searchParams] = useSearchParams();
    const [orderId, setOrderId] = useState(searchParams.get('id') || '');
    const [email, setEmail] = useState(user?.email || '');
    const [orderData, setOrderData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Auto-fetch if ID matches URL params and user is logged in
        if (orderId && user?.email && !orderData) {
            handleTrack(null);
        }
    }, []);

    const handleTrack = async (e: React.FormEvent | null) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        setOrderData(null);

        try {
            const res = await fetch(getApiUrl('/api/orders/track'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, email })
            });
            const data = await res.json();
            
            if (res.ok) {
                setOrderData(data);
            } else {
                setError(data.message || 'Order not found. Please check your details.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getDynamicTrackingLink = (carrier: string, trackingNumber: string) => {
        if(!carrier) return '#';
        const c = carrier.toLowerCase();
        if (c.includes('bluedart')) return `https://www.bluedart.com/track?handler=trakment&loginid=MAA&awb=awb&numbers=${trackingNumber}`;
        if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${trackingNumber}`;
        if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
        if (c.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}&brand=DHL`;
        if (c.includes('india post')) return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
        return '#';
    };

    const steps = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered'];
    const currentStepIndex = orderData ? steps.indexOf(orderData.status) : 0;
    const isCancelled = orderData?.status === 'Cancelled' || orderData?.status === 'Returned';

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header user={user} logout={logout} />
            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-serif font-bold text-center text-gray-900 mb-8">Track Your Order</h1>

                    {/* Search Form */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
                        <form onSubmit={handleTrack} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Order ID</label>
                                <input 
                                    type="text" 
                                    value={orderId} 
                                    onChange={e => setOrderId(e.target.value)} 
                                    placeholder="e.g. 64a..." 
                                    className="w-full border border-gray-300 rounded-md p-3 focus:ring-rose-500 focus:border-rose-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Billing Email</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    placeholder="email@example.com" 
                                    className="w-full border border-gray-300 rounded-md p-3 focus:ring-rose-500 focus:border-rose-500"
                                    required
                                />
                            </div>
                            <div className="flex items-end">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full bg-rose-600 text-white font-bold py-3 px-4 rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Tracking...' : 'Track'}
                                </button>
                            </div>
                        </form>
                        {error && <p className="mt-4 text-red-600 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</p>}
                    </div>

                    {/* Results */}
                    {orderData && (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in-up">
                            {/* Header */}
                            <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Order Status</p>
                                    <h2 className="text-2xl font-bold">#{orderData.id.substring(0,8)}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm opacity-80">Expected Delivery</p>
                                    <p className="font-bold text-lg">
                                        {orderData.trackingInfo?.estimatedDelivery 
                                            ? new Date(orderData.trackingInfo.estimatedDelivery).toLocaleDateString() 
                                            : new Date(new Date(orderData.date).setDate(new Date(orderData.date).getDate() + 7)).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="p-8">
                                {/* Visual Timeline (Top) */}
                                {isCancelled ? (
                                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-center font-bold mb-8">
                                        This order has been {orderData.status}.
                                    </div>
                                ) : (
                                    <div className="relative py-8 mb-8">
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                                        <div 
                                            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 transition-all duration-1000 -z-10" 
                                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                                        ></div>
                                        <div className="flex justify-between w-full">
                                            {steps.map((step, index) => {
                                                const completed = index <= currentStepIndex;
                                                const active = index === currentStepIndex;
                                                return (
                                                    <div key={step} className="flex flex-col items-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-300'} ${active ? 'ring-4 ring-green-100 scale-110' : ''}`}>
                                                            {completed ? (
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            ) : (
                                                                <span className="text-xs font-bold">{index + 1}</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-xs mt-3 font-bold uppercase tracking-wider ${completed ? 'text-green-600' : 'text-gray-400'}`}>{step}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Logistics Info */}
                                {orderData.trackingInfo?.trackingNumber && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-blue-800 uppercase mb-1">Courier Partner</p>
                                            <p className="text-lg font-bold text-gray-800">{orderData.trackingInfo.carrier}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-800 uppercase mb-1">Tracking Number</p>
                                            <p className="text-lg font-mono text-gray-800 tracking-wider">{orderData.trackingInfo.trackingNumber}</p>
                                        </div>
                                        <a 
                                            href={getDynamicTrackingLink(orderData.trackingInfo.carrier, orderData.trackingInfo.trackingNumber)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
                                        >
                                            Track on Courier Site
                                        </a>
                                    </div>
                                )}

                                {/* Detailed Tracking History */}
                                {orderData.trackingHistory && orderData.trackingHistory.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Tracking History</h3>
                                        <div className="space-y-4 max-h-60 overflow-y-auto">
                                            {[...orderData.trackingHistory].reverse().map((event: any, idx: number) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-3 h-3 bg-gray-300 rounded-full mt-1.5"></div>
                                                        {idx < orderData.trackingHistory.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                                                    </div>
                                                    <div className="pb-4">
                                                        <p className="text-sm font-bold text-gray-800">{event.status}</p>
                                                        <p className="text-sm text-gray-600">{event.message}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{new Date(event.date).toLocaleString()} {event.location && `• ${event.location}`}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Items */}
                                <div>
                                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Package Contents</h3>
                                    <div className="space-y-4">
                                        {orderData.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex gap-4">
                                                <img src={item.imageUrl} className="w-16 h-16 rounded-md object-cover border bg-gray-50"/>
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.name}</p>
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OrderTrackingPage;
