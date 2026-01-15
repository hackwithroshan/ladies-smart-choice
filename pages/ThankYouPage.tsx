
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, ArrowRight, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ThankYouPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [orderData, setOrderData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const { order: stateOrder } = location.state || {};

    useEffect(() => {
        const fetchOrder = async () => {
            if (stateOrder) {
                setOrderData(stateOrder);
                setLoading(false);
                return;
            }

            const params = new URLSearchParams(location.search);
            const orderId = params.get('orderId');

            if (orderId) {
                try {
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    // Note: If endpoint is protected, token is needed. If public/optional, fine.
                    // Assuming /api/orders/:id might need auth or admin. 
                    // However, we just placed the order. If user is logged in, token is there.
                    // If guest checkout (magic), we might not have a user token that matches readily unless logged in.
                    // But typically order confirmation is allowed for the session or public if secured by ID/hash.
                    // For now, try fetching with token.
                    const res = await fetch(`/api/orders/${orderId}`, {
                        headers
                    });
                    if (res.ok) {
                        const fetchedOrder = await res.json();
                        // Normalize data to match state structure if needed
                        setOrderData({
                            ...fetchedOrder,
                            // Ensure fields match what render expects
                            orderNumber: fetchedOrder.orderNumber || fetchedOrder._id,
                            customerName: fetchedOrder.customerName,
                            customerEmail: fetchedOrder.customerEmail,
                            customerPhone: fetchedOrder.customerPhone,
                            shippingAddress: fetchedOrder.shippingAddress
                        });
                    }
                } catch (e) { console.error("Failed to fetch order", e); }
            }
            setLoading(false);
        };
        fetchOrder();
    }, [location.search, stateOrder]);

    useEffect(() => {
        if (!loading && orderData) {
            const timer = setTimeout(() => {
                navigate('/dashboard');
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [navigate, loading, orderData]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const order = orderData;

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center space-y-4">
                    <p className="text-zinc-500">No order details found.</p>
                    <Button onClick={() => navigate('/')}>Return Home</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50/50 flex flex-col">
            <Header user={null} logout={() => { }} />

            <main className="flex-grow container mx-auto px-4 py-12 lg:py-20 max-w-3xl">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Success Header */}
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Thank you for your order!</h1>
                        <p className="text-lg text-zinc-600 font-medium max-w-md mx-auto">
                            Your order <span className="text-zinc-900 font-bold">#{order.orderNumber || (order.id || '').substring(0, 8).toUpperCase()}</span> has been placed successfully.
                        </p>
                        <p className="text-sm text-zinc-500">
                            You will be redirected to your dashboard in 15 seconds.
                        </p>
                    </div>

                    {/* Order Details Card */}
                    <Card className="overflow-hidden border-zinc-200 shadow-lg">
                        <CardHeader className="bg-zinc-900 text-white py-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">Order ID</p>
                                    <p className="text-xl font-bold">#{order.orderNumber || (order.id || '').substring(0, 8).toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">Total Amount</p>
                                    <p className="text-xl font-bold">₹{order.total?.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8 space-y-8">

                            {/* Items List */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">Items Ordered</h3>
                                <div className="space-y-6">
                                    {order.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-6 items-start">
                                            <div className="w-20 h-24 bg-zinc-50 border border-zinc-100 rounded-md overflow-hidden shrink-0">
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <h4 className="font-bold text-zinc-900 text-base leading-tight">{item.name}</h4>
                                                <div className="flex items-center gap-4 text-sm text-zinc-500 font-medium">
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>|</span>
                                                    <span>Price: ₹{item.price.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="text-right font-bold text-zinc-900">
                                                ₹{(item.price * item.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Customer & Shipping Info */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2 mb-2">Customer Details</h3>
                                    <div className="text-sm text-zinc-600 space-y-1">
                                        <p><span className="font-bold text-zinc-900">Name:</span> {order.customerName}</p>
                                        <p><span className="font-bold text-zinc-900">Email:</span> {order.customerEmail}</p>
                                        <p><span className="font-bold text-zinc-900">Phone:</span> {order.customerPhone}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2 mb-2">Shipping Address</h3>
                                    <div className="text-sm text-zinc-600 space-y-1">
                                        <p>{order.shippingAddress?.address}</p>
                                        <p>{order.shippingAddress?.city} - {order.shippingAddress?.postalCode}</p>
                                        <p>{order.shippingAddress?.country}</p>
                                    </div>
                                </div>
                            </div>

                        </CardContent>

                        <CardFooter className="bg-zinc-50 p-6 flex justify-between items-center border-t border-zinc-100">
                            <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
                                <Home className="w-4 h-4" /> Return Home
                            </Button>
                            <Button onClick={() => navigate('/dashboard')} className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800">
                                Go to Dashboard <ArrowRight className="w-4 h-4" />
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="text-center pt-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            <Truck className="w-4 h-4" /> Order Confirmation Sent to Email
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ThankYouPage;
