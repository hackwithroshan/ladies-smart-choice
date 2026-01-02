
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
            <div className="w-full sm:w-64 p-1 min-w-0">
                <div className="flex justify-between items-center mb-3 px-2">
                    <button type="button" onClick={() => setViewDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="p-1 rounded text-gray-400 hover:bg-gray-100 transition-colors">&lt;</button>
                    <h4 className="font-semibold text-gray-800 text-sm">{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                    <button type="button" onClick={() => setViewDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="p-1 rounded text-gray-400 hover:bg-gray-100 transition-colors">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-[10px] text-center text-gray-400 mb-2 font-semibold uppercase tracking-tighter">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="w-8 h-8 flex items-center justify-center">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                    {allDays.map((day, i) => {
                        if (!day) return <div key={`pad-${i}`}></div>;
                        const isStart = startDate && isSameDay(day, startDate);
                        const isEnd = endDate && isSameDay(day, endDate);
                        const inRange = startDate && endDate && day > startDate && day < endDate;
                        const inHoverRange = startDate && !endDate && hoverDate && day > startDate && day <= hoverDate;
                        let classes = "w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer text-xs";
                        if (isStart || isEnd) classes += " bg-gray-900 text-white font-bold";
                        else if (inRange || inHoverRange) classes += " bg-blue-50 text-blue-800 rounded-none";
                        else classes += " hover:bg-gray-100 text-gray-700";
                        return (
                            <div key={day.toISOString()} className={`flex items-center justify-center ${(inRange || inHoverRange) ? 'bg-blue-50' : ''}`}>
                                <button type="button" onClick={() => handleDateClick(day)} onMouseEnter={() => setHoverDate(day)} onMouseLeave={() => setHoverDate(null)} className={classes}>{day.getDate()}</button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-[100] flex flex-col md:flex-row w-full max-w-[calc(100vw-2rem)] md:w-auto overflow-hidden animate-fade-in-up">
            <div className="w-full md:w-40 border-b md:border-b-0 md:border-r border-gray-100 p-2 shrink-0 bg-gray-50/50">
                {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'].map(label => (
                    <button key={label} onClick={() => handlePresetClick(label)} className="block w-full text-left text-xs font-medium p-2.5 rounded hover:bg-white hover:shadow-sm text-gray-600 transition-all">{label}</button>
                ))}
            </div>
            <div className="flex flex-col p-4 min-w-0 flex-1">
                <div className="flex flex-col md:flex-row justify-center gap-x-6 min-w-0">
                    <div className="hidden md:block min-w-0">{renderCalendar(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}</div>
                    <div className="min-w-0">{renderCalendar(viewDate)}</div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-100 pt-4 mt-4 gap-4">
                    <div className="text-[10px] text-gray-500 font-medium truncate max-w-full">Selected: <span className="text-gray-900 font-bold">{startDate ? formatDate(startDate) : '...'} - {endDate ? formatDate(endDate) : '...'}</span></div>
                    <div className="flex justify-end gap-2 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded bg-white hover:bg-gray-50 transition-all">Cancel</button>
                        <button onClick={() => startDate && endDate && onApply({ startDate, endDate })} disabled={!startDate || !endDate} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded disabled:opacity-50 transition-all">Apply</button>
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
  
  // Navigation View State
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29); 
    return { label: 'Last 30 Days', startDate: start, endDate: end };
  });
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({ carrier: '', trackingNumber: '' });
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ordersRes = await fetch(getApiUrl('/api/orders'), { headers: { 'Authorization': `Bearer ${token}` } });
      if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data);
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
            setIsDateSelectorOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOrderClick = (order: Order) => {
      setSelectedOrder(order);
      setTrackingInfo({
          carrier: order.trackingInfo?.carrier || '',
          trackingNumber: order.trackingInfo?.trackingNumber || ''
      });
      setView('details');
      window.scrollTo(0, 0);
  };

  const handleUpdateStatus = async (newStatus: string) => {
      if (!selectedOrder) return;
      setUpdatingStatus(true);
      const orderId = selectedOrder.id || (selectedOrder as any)._id;
      try {
          const res = await fetch(getApiUrl(`/api/orders/${orderId}`), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) {
              const updated = await res.json();
              setOrders(prev => prev.map(o => {
                  const oId = o.id || (o as any)._id;
                  const updatedId = updated.id || (updated as any)._id;
                  return oId === updatedId ? updated : o;
              }));
              setSelectedOrder(updated);
          }
      } catch (e) { console.error(e); }
      finally { setUpdatingStatus(false); }
  };

  const handleUpdateLogistics = async () => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    const orderId = selectedOrder.id || (selectedOrder as any)._id;
    try {
        const res = await fetch(getApiUrl(`/api/orders/${orderId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ trackingInfo })
        });
        if (res.ok) {
            const updated = await res.json();
            setOrders(prev => prev.map(o => {
                const oId = o.id || (o as any)._id;
                const updatedId = updated.id || (updated as any)._id;
                return oId === updatedId ? updated : o;
            }));
            setSelectedOrder(updated);
            alert("Logistics updated!");
        }
    } catch (e) { console.error(e); }
    finally { setUpdatingStatus(false); }
  };

  const handleDownloadInvoice = async () => {
    if (!selectedOrder) return;
    setInvoiceLoading(true);
    const orderId = selectedOrder.id || (selectedOrder as any)._id;
    try {
        const res = await fetch(getApiUrl(`/api/orders/${orderId}/invoice`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fileNameId = selectedOrder.orderNumber || orderId.toString().substring(0,6);
            a.download = `Invoice_${fileNameId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (e) { console.error(e); }
    finally { setInvoiceLoading(false); }
  };

  const processedOrders = orders
    .filter(order => {
        const orderDate = new Date(order.date);
        const matchesDate = orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
        const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
        const matchesSearch = searchTerm === '' || 
                            order.orderNumber?.toString().includes(searchTerm) ||
                            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDate && matchesStatus && matchesSearch;
    });

  if (loading) return <div className="p-12 text-center flex justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-[#16423C] rounded-full animate-spin"></div></div>;

  // --- RENDER LIST VIEW ---
  if (view === 'list') {
      return (
        <div className="w-full max-w-full overflow-x-hidden space-y-6 animate-fade-in relative min-w-0">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">Orders</h1>
                <div className="flex gap-2 relative min-w-0" ref={datePickerRef}>
                    <button 
                        onClick={() => setIsDateSelectorOpen(!isDateSelectorOpen)} 
                        className="bg-white border border-gray-300 shadow-sm rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all whitespace-nowrap"
                    >
                        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span className="truncate">{dateRange.label}</span>
                    </button>
                    {isDateSelectorOpen && <DateRangePicker currentRange={dateRange} onApply={(r) => { setDateRange({ ...r, label: `${formatDate(r.startDate)} - ${formatDate(r.endDate)}` }); setIsDateSelectorOpen(false); }} onClose={() => setIsDateSelectorOpen(false)} />}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-w-0">
                <div className="flex border-b border-gray-200 px-4 overflow-x-auto scrollbar-hide shrink-0 admin-scroll">
                    {['All', 'Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                        <button 
                            key={status} 
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px ${filterStatus === status ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 min-w-0">
                    <div className="relative flex-1 min-w-0">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Filter by Order #, Customer, or Email" 
                            className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg w-full focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full overflow-x-auto admin-scroll min-w-0">
                    <table className="min-w-full divide-y divide-gray-100 table-auto">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest w-10"><input type="checkbox" className="rounded border-gray-300 text-[#16423C]" /></th>
                                <th className="px-2 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Order</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Total</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {processedOrders.length > 0 ? processedOrders.map((order) => {
                                const orderId = order.id || (order as any)._id;
                                return (
                                <tr key={orderId} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => handleOrderClick(order)}>
                                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300 text-[#16423C]" /></td>
                                    <td className="px-2 py-4 whitespace-nowrap text-sm font-black text-gray-900">
                                        #{order.orderNumber || orderId?.toString().substring(0,6).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{new Date(order.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold truncate max-w-[150px] min-w-0">{order.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">₹{order.total.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-[9px] font-black uppercase rounded-lg border ${
                                            order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100' : 
                                            order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-yellow-50 text-yellow-700 border-yellow-100'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                                )
                            }) : (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic text-sm">No orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER DETAIL VIEW SECTION ---
  const orderIdForDisplay = selectedOrder?.orderNumber || (selectedOrder?.id || (selectedOrder as any)?._id)?.toString().substring(0,8);
  
  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setView('list')} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="min-w-0">
                    <h2 className="text-2xl font-black text-gray-900 truncate uppercase tracking-tighter">Order #{orderIdForDisplay}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(selectedOrder?.date || '').toLocaleString()}</span>
                        <span className="px-2 py-0.5 text-[9px] font-black rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-100 uppercase">{selectedOrder?.status}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={handleDownloadInvoice} disabled={invoiceLoading} className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 bg-white rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                    {invoiceLoading ? 'Generating...' : 'Invoice'}
                </button>
                <button className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black">Refund</button>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Line Items ({selectedOrder?.items?.length || 0})</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {selectedOrder?.items?.map((item, idx) => (
                            <div key={idx} className="p-6 flex gap-6 items-center transition-colors hover:bg-gray-50/50">
                                <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 shrink-0 overflow-hidden shadow-inner">
                                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-black text-blue-600 hover:underline truncate cursor-pointer italic">{item.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">SKU: {item.productId?.toString()?.substring(0,8) || 'N/A'}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-gray-500">₹{item.price.toLocaleString()} × {item.quantity}</p>
                                    <p className="text-lg font-black text-gray-900 mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-gray-500 font-bold italic">Standard Secure Packaging</p>
                        <button onClick={() => handleUpdateStatus('Shipped')} className="w-full sm:w-auto bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3.5 rounded-xl hover:bg-black shadow-lg transition-all active:scale-95 whitespace-nowrap">Mark Shipped</button>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-5">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Payment Breakdown</h3>
                        <span className="bg-green-50 text-green-700 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-green-100">Paid</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm font-bold text-gray-500"><span>Subtotal</span><span className="text-gray-900 italic">₹{selectedOrder?.total?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-sm font-bold text-gray-500"><span>Shipping</span><span className="text-green-600 uppercase">Free</span></div>
                        <div className="flex justify-between text-2xl font-black text-gray-900 border-t border-dashed border-gray-200 pt-5">
                            <span>TOTAL</span>
                            <span className="italic">₹{selectedOrder?.total?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 border-b border-gray-50 pb-4">Customer Identity</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center font-black text-gray-400 text-2xl shrink-0 shadow-sm">{selectedOrder?.customerName?.charAt(0)}</div>
                        <div className="min-w-0 flex-1">
                            <p className="text-lg font-black text-blue-600 hover:underline truncate italic cursor-pointer">{selectedOrder?.customerName}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">Verified User</p>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-gray-50">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Shipping Address</p>
                        <div className="text-xs text-gray-800 leading-relaxed font-bold italic bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            {selectedOrder?.shippingAddress ? (
                                <div className="space-y-1">
                                    <p>{(selectedOrder.shippingAddress as any).address || (selectedOrder.shippingAddress as any).line1}</p>
                                    <p>{selectedOrder.shippingAddress.city}, {(selectedOrder.shippingAddress as any).postalCode || (selectedOrder.shippingAddress as any).pincode}</p>
                                    <p className="mt-2 font-black text-gray-900 not-italic uppercase tracking-widest bg-white border border-gray-200 inline-block px-2 py-0.5 rounded">{selectedOrder.shippingAddress.country}</p>
                                </div>
                            ) : <p className="italic text-gray-400">Electronic Provisioning</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 border-b border-gray-50 pb-4">Logistics Management</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Tracking Number</label>
                            <input 
                                type="text" 
                                className="w-full text-xs font-black italic border border-gray-300 rounded-xl p-3 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={trackingInfo.trackingNumber}
                                onChange={e => setTrackingInfo({...trackingInfo, trackingNumber: e.target.value})}
                                placeholder="AWB / REF NO"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Carrier Partner</label>
                            <input 
                                type="text" 
                                className="w-full text-xs font-black italic border border-gray-300 rounded-xl p-3 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={trackingInfo.carrier}
                                onChange={e => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                                placeholder="e.g. BlueDart"
                            />
                        </div>
                        <button 
                            onClick={handleUpdateLogistics}
                            disabled={updatingStatus}
                            className="w-full bg-gray-100 text-gray-800 text-[10px] font-black py-3.5 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-[0.2em] shadow-sm active:scale-95"
                        >
                            {updatingStatus ? 'Updating...' : 'Update Logistics'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default OrderList;
