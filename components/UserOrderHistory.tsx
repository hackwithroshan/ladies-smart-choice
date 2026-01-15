
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types';
import { getApiUrl } from '../utils/apiHelper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Package, Truck, Calendar, CreditCard, ChevronRight } from 'lucide-react';

const UserOrderHistory: React.FC<{ token: string | null }> = ({ token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const response = await fetch(getApiUrl('/api/orders/my-orders'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders.');
        setOrders(await response.json());
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, [token]);

  if (loading) return (
    <div className="space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="h-48 bg-zinc-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (orders.length === 0) return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
          <Package className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900">No orders yet</h3>
          <p className="text-sm text-zinc-500">When you place an order, it will appear here.</p>
        </div>
        <Button onClick={() => navigate('/shop')}>Start Shopping</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">Purchase History</h2>
        <Badge variant="outline" className="text-zinc-500 border-zinc-200">
          {orders.length} orders
        </Badge>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id || order._id} className="overflow-hidden border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-zinc-900">Order #{order.orderNumber || (order.id || order._id || '').substring(0, 8).toUpperCase()}</span>
                    <Badge variant={
                      order.status === 'Delivered' ? 'default' : // default usually black/primary
                        order.status === 'Cancelled' ? 'destructive' :
                          'secondary'
                    } className={`
                      ${order.status === 'Delivered' ? 'bg-green-600 hover:bg-green-700' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-none' :
                          'bg-zinc-900 text-white hover:bg-zinc-800'}
                    `}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Total: ₹{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {order.trackingInfo?.trackingNumber && (
                  <div className="text-right">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Tracking Info</p>
                    <p className="text-sm font-bold text-zinc-900">{order.trackingInfo.carrier}</p>
                    <p className="text-xs font-mono text-zinc-600">{order.trackingInfo.trackingNumber}</p>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-300">
                          <Package className="w-8 h-8 opacity-20" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-zinc-900 line-clamp-2 md:line-clamp-1">{item.name}</h4>
                        {/* Price & Qty */}
                        <p className="mt-1 text-sm font-medium text-zinc-900">
                          ₹{item.price.toLocaleString()} <span className="text-zinc-400 font-normal">× {item.quantity}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-zinc-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="bg-zinc-50/30 border-t border-zinc-100 p-4 flex justify-between items-center">
              <div className="text-xs text-zinc-500">
                {order.items.length} items
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/track-order?id=${order.orderNumber || order.id || order._id}`)} className="gap-2">
                <Truck className="w-4 h-4" />
                Track Shipment
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserOrderHistory;
