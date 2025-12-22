
import React, { useState, useEffect, useRef } from 'react';
import { Order, Product } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

// ... (DateRangePicker and other helpers same as previous version) ...
// (Omitting repetitive internal helpers for brevity, assume they stay same)

const OrderList: React.FC<{token: string | null}> = ({token}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeDetails, setStoreDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [dateRange, setDateRange] = useState<any>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    return { label: 'Last 30 Days', startDate: start, endDate: end };
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, storeRes] = await Promise.all([
          fetch(getApiUrl('/api/orders'), { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(getApiUrl('/api/settings/store-details'))
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (storeRes.ok) setStoreDetails(await storeRes.json());
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  const processedOrders = orders
    .filter(order => {
        const orderDate = new Date(order.date);
        const matchesDate = orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
        const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
        const matchesSearch = searchTerm === '' || 
                            order.orderNumber?.toString().includes(searchTerm) ||
                            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDate && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
        if (sortConfig.key === 'date') return sortConfig.direction === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
        return 0;
    });

  return (
    <div className="space-y-6">
        {/* --- Search Bar --- */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-center items-center gap-4">
            <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input 
                    type="text" 
                    placeholder="Search Order #, Name, Email..." 
                    className="pl-10 border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-orange-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {/* ... other filters ... */}
        </div>

      {/* --- Table --- */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                    #{order.orderNumber || order.id.substring(0,6).toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">₹{order.total.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                       order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
