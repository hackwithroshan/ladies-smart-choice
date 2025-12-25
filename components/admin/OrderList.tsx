
import React, { useState, useEffect, useRef } from 'react';
import { Order, Product } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

// --- Date Helper Helpers ---
const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// --- REUSABLE DATE PICKER COMPONENT ---
interface DateRange {
    label: string;
    startDate: Date;
    endDate: Date;
}
interface DateRangePickerProps {
    currentRange: DateRange;
    onApply: (range: { startDate: Date; endDate: Date }) => void;
    onClose: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ currentRange, onApply, onClose }) => {
    const [viewDate, setViewDate] = useState(currentRange.endDate || new Date());
    const [startDate, setStartDate] = useState<Date | null>(currentRange.startDate);
    const [endDate, setEndDate] = useState<Date | null>(currentRange.endDate);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    const handleDateClick = (day: Date) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(day);
            setEndDate(null);
        } else if (day < startDate) {
            setStartDate(day);
        } else {
            setEndDate(day);
        }
    };

    const handlePresetClick = (label: string) => {
        const end = new Date();
        const start = new Date();
        end.setHours(23, 59, 59, 999);
        start.setHours(0, 0, 0, 0);

        switch(label) {
            case 'Today': break;
            case 'Yesterday': 
                start.setDate(end.getDate() - 1);
                end.setDate(end.getDate() - 1);
                break;
            case 'Last 7 Days': start.setDate(end.getDate() - 6); break;
            case 'Last 30 Days': start.setDate(end.getDate() - 29); break;
            case 'This Month': start.setDate(1); break;
            case 'Last Month':
                start.setMonth(start.getMonth() - 1);
                start.setDate(1);
                end.setDate(0); 
                break;
        }
        setStartDate(start);
        setEndDate(end);
    };

    const renderCalendar = (date: Date) => {
        const month = date.getMonth();
        const year = date.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
        const padding = Array(firstDay).fill(null);
        const allDays = [...padding, ...days];

        return (
            <div className="w-full sm:w-72 p-1">
                <div className="flex justify-between items-center mb-3 px-2">
                    <button type="button" onClick={() => setViewDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">&lt;</button>
                    <h4 className="font-bold text-gray-800">{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                    <button type="button" onClick={() => setViewDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-xs text-center text-gray-500 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="w-9 h-9 flex items-center justify-center font-medium">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                    {allDays.map((day, i) => {
                        if (!day) return <div key={`pad-${i}`}></div>;
                        const isStart = startDate && isSameDay(day, startDate);
                        const isEnd = endDate && isSameDay(day, endDate);
                        const inRange = startDate && endDate && day > startDate && day < endDate;
                        const inHoverRange = startDate && !endDate && hoverDate && day > startDate && day <= hoverDate;
                        let classes = "w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer text-sm";
                        if (isStart || isEnd) classes += " bg-[#16423C] text-white font-bold";
                        else if (inRange || inHoverRange) classes += " bg-[#6A9C89]/20 text-[#16423C] rounded-none";
                        else classes += " hover:bg-gray-100 text-gray-700";
                        const isToday = isSameDay(day, new Date());
                        if(isToday && !isStart && !isEnd && !inRange) classes += " text-[#16423C] font-bold";
                        return (
                            <div key={day.toISOString()} className={`flex items-center justify-center ${(inRange || inHoverRange) ? 'bg-[#6A9C89]/10' : ''} ${isStart || (inRange && day.getDay() === 0) ? 'rounded-l-full' : ''} ${isEnd || (inRange && day.getDay() === 6) ? 'rounded-r-full' : ''}`}>
                                <button type="button" onClick={() => handleDateClick(day)} onMouseEnter={() => setHoverDate(day)} onMouseLeave={() => setHoverDate(null)} className={classes}>{day.getDate()}</button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };
    const prevMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    return (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] animate-fade-in-up flex flex-col md:flex-row w-[calc(100vw-2rem)] max-w-sm md:w-auto md:max-w-none">
            <div className="w-full md:w-44 border-b md:border-b-0 md:border-r border-gray-200 p-4">
                <div className="space-y-1">
                    {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'].map(label => (
                        <button key={label} onClick={() => handlePresetClick(label)} className="block w-full text-left text-sm font-medium p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-[#16423C]">{label}</button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col p-4">
                <div className="flex flex-col md:flex-row justify-center gap-x-8"><div className="hidden md:block">{renderCalendar(prevMonthDate)}</div><div>{renderCalendar(viewDate)}</div></div>
                <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-4 mt-4 gap-4">
                    <div className="text-sm"><span className="font-bold text-gray-800">{startDate ? formatDate(startDate) : '...'}</span><span className="text-gray-500 mx-2">~</span><span className="font-bold text-gray-800">{endDate ? formatDate(endDate) : '...'}</span></div>
                    <div className="flex justify-end gap-2 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
                        <button onClick={() => startDate && endDate && onApply({ startDate, endDate })} disabled={!startDate || !endDate} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold bg-[#16423C] text-white rounded-md disabled:opacity-50 hover:opacity-90">Apply</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN ORDER LIST COMPONENT ---

const OrderList: React.FC<{token: string | null}> = ({token}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Drawer Editing State
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({ carrier: '', trackingNumber: '' });

  const [dateRange, setDateRange] = useState<any>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    return { label: 'Last 30 Days', startDate: start, endDate: end };
  });
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ordersRes = await fetch(getApiUrl('/api/orders'), { headers: { 'Authorization': `Bearer ${token}` } });
      if (ordersRes.ok) setOrders(await ordersRes.json());
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleOrderClick = (order: Order) => {
      setSelectedOrder(order);
      setTrackingInfo({
          carrier: order.trackingInfo?.carrier || '',
          trackingNumber: order.trackingInfo?.trackingNumber || ''
      });
      setIsDrawerOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
      if (!selectedOrder) return;
      setUpdatingStatus(true);
      try {
          const res = await fetch(getApiUrl(`/api/orders/${selectedOrder.id}`), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) {
              const updated = await res.json();
              setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
              setSelectedOrder(updated);
          }
      } catch (e) { console.error(e); }
      finally { setUpdatingStatus(false); }
  };

  const handleSaveTracking = async () => {
      if (!selectedOrder) return;
      try {
          const res = await fetch(getApiUrl(`/api/orders/${selectedOrder.id}`), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ trackingInfo })
          });
          if (res.ok) {
              const updated = await res.json();
              setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
              setSelectedOrder(updated);
              alert("Tracking info updated!");
          }
      } catch (e) { console.error(e); }
  };

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
    });

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6 animate-fade-in relative">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
            <div className="flex gap-2 relative">
                <button onClick={() => setIsDateSelectorOpen(!isDateSelectorOpen)} className="bg-white border rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    {dateRange.label}
                </button>
                {isDateSelectorOpen && <DateRangePicker currentRange={dateRange} onApply={(r) => { setDateRange({ ...r, label: `${formatDate(r.startDate)} - ${formatDate(r.endDate)}` }); setIsDateSelectorOpen(false); }} onClose={() => setIsDateSelectorOpen(false)} />}
            </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input 
                    type="text" 
                    placeholder="Search Order #, Name, Email..." 
                    className="pl-10 border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-orange-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                    <button 
                        key={status} 
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterStatus === status ? 'bg-[#16423C] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedOrders.length > 0 ? processedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => handleOrderClick(order)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#16423C]">
                    #{order.orderNumber || order.id.substring(0,6).toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="font-bold">{order.customerName}</div>
                    <div className="text-xs text-gray-400">{order.customerEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">₹{order.total.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-full ${
                       order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                       order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                       order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                       'bg-orange-100 text-orange-700'
                    }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-[#16423C] font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Manage &rarr;</button>
                </td>
              </tr>
            )) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No orders found matching criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- ORDER DETAILS DRAWER --- */}
      {isDrawerOpen && selectedOrder && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[110] animate-fade-in" onClick={() => setIsDrawerOpen(false)}></div>
            <div className="fixed top-0 right-0 h-screen w-full max-w-2xl bg-white shadow-2xl z-[120] animate-slide-in-right flex flex-col">
                
                {/* Header */}
                <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold">Order Details</h3>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Order ID: #{selectedOrder.orderNumber || selectedOrder.id}</p>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-white p-2">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    
                    {/* Status Management */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Current Order Status</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {['Pending', 'Processing', 'Shipped', 'Delivered'].map(s => (
                                <button 
                                    key={s} 
                                    disabled={updatingStatus}
                                    onClick={() => handleUpdateStatus(s)}
                                    className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${selectedOrder.status === s ? 'bg-[#16423C] text-white border-[#16423C] shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer Info</h4>
                            <div className="space-y-1">
                                <p className="font-bold text-gray-900">{selectedOrder.customerName}</p>
                                <p className="text-sm text-gray-600">{selectedOrder.customerEmail}</p>
                                <p className="text-sm text-gray-600">{selectedOrder.customerPhone || 'No Phone'}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Shipping Address</h4>
                            <div className="text-sm text-gray-700 leading-relaxed">
                                {selectedOrder.shippingAddress ? (
                                    <>
                                        <p>{selectedOrder.shippingAddress.address}</p>
                                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                                        <p className="font-bold">{selectedOrder.shippingAddress.country}</p>
                                    </>
                                ) : 'No address specified.'}
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Order Items</h4>
                        <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm bg-white">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border shrink-0">
                                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-400">₹{item.price} x {item.quantity}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tracking / Logistics */}
                    <div className="bg-[#F1F8E8] p-6 rounded-xl border border-[#D8E8C0] space-y-4">
                        <div className="flex items-center gap-2">
                             <svg className="w-5 h-5 text-[#16423C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                             <h4 className="text-sm font-black text-[#16423C] uppercase tracking-wider">Logistics & Tracking</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Carrier</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Delhivery, BlueDart"
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#16423C]"
                                    value={trackingInfo.carrier}
                                    onChange={e => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">AWB / Tracking #</label>
                                <input 
                                    type="text" 
                                    placeholder="Order Tracking ID"
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#16423C]"
                                    value={trackingInfo.trackingNumber}
                                    onChange={e => setTrackingInfo({...trackingInfo, trackingNumber: e.target.value})}
                                />
                            </div>
                        </div>
                        <button onClick={handleSaveTracking} className="w-full bg-[#16423C] text-white py-2 rounded-lg text-xs font-bold hover:opacity-90">Update Logistics</button>
                    </div>

                </div>

                {/* Footer Totals */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center text-gray-500 mb-2 font-medium">
                        <span>Subtotal:</span>
                        <span>₹{selectedOrder.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-black text-[#16423C]">
                        <span>Total:</span>
                        <span>₹{selectedOrder.total.toFixed(2)}</span>
                    </div>
                </div>

            </div>
          </>
      )}
    </div>
  );
};

export default OrderList;
