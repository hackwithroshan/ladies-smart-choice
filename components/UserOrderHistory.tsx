
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { Order } from '../types';
import { getApiUrl } from '../utils/apiHelper';

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

  if (loading) return <div className="p-12 text-center animate-pulse text-zinc-400">Fetching history...</div>;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">Purchase History</h2>
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{orders.length} total orders</span>
      </div>
      
      {orders.length === 0 ? (
        <div className="p-20 text-center space-y-4">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth={2}/></svg>
            </div>
            <p className="text-sm font-medium text-zinc-500">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Order ID</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/30 transition-colors group">
                  <td className="px-8 py-5 text-sm font-bold text-zinc-900">
                    #{order.orderNumber || order.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="px-8 py-5 text-sm text-zinc-500">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase border ${
                        order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' : 
                        order.status === 'Cancelled' ? 'bg-zinc-50 text-zinc-400 border-zinc-200' :
                        'bg-zinc-900 text-zinc-50 border-zinc-900 shadow-sm'
                    }`}>
                        {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-zinc-900 text-right">₹{order.total.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <button 
                        onClick={() => navigate(`/track-order?id=${order.orderNumber || order.id}`)}
                        className="text-xs font-bold text-zinc-900 hover:underline underline-offset-4"
                    >
                        Track Shipment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserOrderHistory;
