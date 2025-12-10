
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Order, Product, User } from '../../types';
import { Icons, COLORS } from '../../constants';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { getApiUrl } from '../../utils/apiHelper';

// --- TYPE DEFINITIONS (Copied from Analytics.tsx) ---
interface DateRange {
    label: string;
    startDate: Date;
    endDate: Date;
}

// --- HELPER FUNCTIONS (Copied from Analytics.tsx) ---
const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; subtext?: string }> = ({ title, value, icon, color, subtext }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      {subtext && <p className="text-xs text-green-500 mt-1 flex items-center">{subtext}</p>}
    </div>
    <div className="rounded-full p-3 shadow-sm" style={{ backgroundColor: `${color}20`, color: color }}>
      {icon}
    </div>
  </div>
);

// --- Reusable Date Range Picker Component (Copied from Analytics.tsx) ---
const DateRangePicker: React.FC<{
    currentRange: DateRange;
    onApply: (range: { startDate: Date; endDate: Date }) => void;
    onClose: () => void;
}> = ({ currentRange, onApply, onClose }) => {
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
                        if (isStart || isEnd) classes += " bg-indigo-600 text-white font-bold";
                        else if (inRange || inHoverRange) classes += " bg-indigo-100 text-indigo-800 rounded-none";
                        else classes += " hover:bg-gray-100 text-gray-700";
                        const isToday = isSameDay(day, new Date());
                        if(isToday && !isStart && !isEnd && !inRange) classes += " text-indigo-600 font-bold";
                        return (
                            <div key={day.toISOString()} className={`flex items-center justify-center ${(inRange || inHoverRange) ? 'bg-indigo-100' : ''} ${isStart || (inRange && day.getDay() === 0) ? 'rounded-l-full' : ''} ${isEnd || (inRange && day.getDay() === 6) ? 'rounded-r-full' : ''}`}>
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
        <div className="absolute top-full right-4 left-4 md:left-auto md:right-0 mt-2 bg-white rounded-lg shadow-2xl border z-20 animate-fade-in-up flex flex-col md:flex-row w-[calc(100vw-2rem)] max-w-sm md:w-auto md:max-w-none">
            <div className="w-full md:w-44 border-b md:border-b-0 md:border-r border-gray-200 p-4">
                <div className="space-y-1">
                    {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'].map(label => (
                        <button key={label} onClick={() => handlePresetClick(label)} className="block w-full text-left text-sm font-medium p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-indigo-600">{label}</button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col p-4">
                <div className="flex flex-col md:flex-row justify-center gap-x-8">
                     <div className="hidden md:block">{renderCalendar(prevMonthDate)}</div>
                     <div>{renderCalendar(viewDate)}</div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-4 mt-4 gap-4">
                    <div className="text-sm">
                        <span className="font-bold text-gray-800">{startDate ? formatDate(startDate) : '...'}</span>
                        <span className="text-gray-500 mx-2">~</span>
                        <span className="font-bold text-gray-800">{endDate ? formatDate(endDate) : '...'}</span>
                    </div>
                    <div className="flex justify-end gap-2 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
                        <button onClick={() => startDate && endDate && onApply({ startDate, endDate })} disabled={!startDate || !endDate} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-md disabled:opacity-50 hover:bg-indigo-700">Apply</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const COLORS_PIE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<{token: string | null}> = ({token}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: Date Range State ---
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6); // Default to Last 7 Days
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    return { label: 'Last 7 Days', startDate: start, endDate: end };
  });
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, productsRes, usersRes] = await Promise.all([
          fetch(getApiUrl('/api/orders'), { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(getApiUrl('/api/products')),
          fetch(getApiUrl('/api/users'), { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        setOrders(await ordersRes.json());
        setProducts(await productsRes.json());
        setUsers(await usersRes.json());
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // --- NEW: Click outside handler for date picker ---
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
              setIsDateSelectorOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- NEW: Date Range Selection Logic ---
  const handleApplyDateRange = (newRange: { startDate: Date, endDate: Date }) => {
      setDateRange({
          startDate: newRange.startDate,
          endDate: newRange.endDate,
          label: `${formatDate(newRange.startDate)} - ${formatDate(newRange.endDate)}`
      });
      setIsDateSelectorOpen(false);
  };
  
  // --- UPDATED: Memoized Data Calculation Logic ---
  const { filteredOrders, newCustomers, revenueData } = useMemo(() => {
    const start = dateRange.startDate;
    const end = dateRange.endDate;

    const fOrders = orders.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= start && orderDate <= end;
    });

    const nCustomers = users.filter(u => {
        const joinDate = new Date(u.joinDate);
        return joinDate >= start && joinDate <= end;
    }).length;

    // Revenue Chart Data
    const revData: { name: string, revenue: number, orders: number }[] = [];
    const dateCursor = new Date(start);
    while (dateCursor <= end) {
        const dateStr = dateCursor.toDateString();
        const dailyOrders = fOrders.filter(o => new Date(o.date).toDateString() === dateStr);
        const revenue = dailyOrders.reduce((sum, o) => sum + o.total, 0);
        revData.push({
            name: dateCursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: revenue,
            orders: dailyOrders.length,
        });
        dateCursor.setDate(dateCursor.getDate() + 1);
    }

    return { filteredOrders: fOrders, newCustomers: nCustomers, revenueData: revData };
  }, [orders, users, dateRange]);
  
  // --- UNCHANGED: All-time data for non-date-sensitive charts ---
  const funnelData = useMemo(() => {
      const total = orders.length;
      const pending = orders.filter(o => o.status === 'Pending').length;
      const shipped = orders.filter(o => o.status === 'Shipped').length;
      const delivered = orders.filter(o => o.status === 'Delivered').length;
      return [
          { name: 'Total Orders', value: total }, { name: 'Pending', value: pending },
          { name: 'Shipped', value: shipped }, { name: 'Delivered', value: delivered }
      ];
  }, [orders]);

  const categoryData = useMemo(() => {
      const categoryCounts: {[key: string]: number} = {};
      products.forEach(p => {
          categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      });
      return Object.keys(categoryCounts).map(key => ({ name: key, value: categoryCounts[key] }));
  }, [products]);

  if (loading) return <div className="flex h-full items-center justify-center">Loading Analytics...</div>;

  const totalRevenue = filteredOrders.reduce((sum, order) => order.status !== 'Cancelled' ? sum + order.total : sum, 0);
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Overview</h2>
        <div className="relative w-full sm:w-auto" ref={datePickerRef}>
            <button onClick={() => setIsDateSelectorOpen(!isDateSelectorOpen)} className="flex items-center justify-between sm:justify-start gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 w-full">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>{dateRange.label}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isDateSelectorOpen && (
                <DateRangePicker 
                    currentRange={dateRange} 
                    onApply={handleApplyDateRange} 
                    onClose={() => setIsDateSelectorOpen(false)} 
                />
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} icon={Icons.orders} color={COLORS.accent} />
        <StatCard title="Pending Orders" value={pendingOrders} icon={Icons.orders} color="#3B82F6" subtext="Needs attention" />
        <StatCard title="Total Products" value={products.length} icon={Icons.products} color="#10B981" subtext="All-time active" />
        <StatCard title="New Customers" value={newCustomers} icon={Icons.users} color="#8B5CF6" subtext={`in ${dateRange.label}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue & Orders ({dateRange.label})</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.8}/><stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/></linearGradient>
                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                        <YAxis yAxisId="left" tick={{fontSize: 10}} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}}/>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" yAxisId="left" dataKey="revenue" stroke={COLORS.accent} fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" yAxisId="right" dataKey="orders" stroke="#3B82F6" fillOpacity={1} fill="url(#colorOrders)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Order Status Funnel</h3>
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={funnelData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" fill="#8884d8" barSize={20} radius={[0, 10, 10, 0]}>
                            {funnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Product Categories</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
             </div>
             
             <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.slice(0, 4).map(order => (
                        <tr key={order.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.id.substring(0,6)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{order.customerName}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">₹{order.total.toFixed(2)}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                    order.status.includes('Pending') ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {order.status}
                                </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
             </div>
        </div>
    </div>
  );
};

export default Dashboard;
