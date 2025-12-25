
import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Icons, COLORS } from '../../constants';
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
                                <button type="button" onClick={() => handleDateClick(day)} onMouseEnter={() => setHoverDate(day)} onMouseLeave={() => setHoverDate(null)} className={classes}>
                                    {day.getDate()}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };
    
    const prevMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);

    return (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-fade-in-up flex flex-col md:flex-row w-[calc(100vw-2rem)] max-w-sm md:w-auto md:max-w-none">
            <div className="w-full md:w-44 border-b md:border-b-0 md:border-r border-gray-200 p-4">
                <div className="space-y-1">
                    {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'].map(label => (
                        <button key={label} onClick={() => handlePresetClick(label)} className="block w-full text-left text-sm font-medium p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-[#16423C]">{label}</button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col p-4">
                <div className="flex flex-col md:flex-row justify-center gap-x-8">
                     <div className="hidden md:block">
                        {renderCalendar(prevMonthDate)}
                    </div>
                    <div>
                        {renderCalendar(viewDate)}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-4 mt-4 gap-4">
                    <div className="text-sm">
                        <span className="font-bold text-gray-800">{startDate ? formatDate(startDate) : '...'}</span>
                        <span className="text-gray-500 mx-2">~</span>
                        <span className="font-bold text-gray-800">{endDate ? formatDate(endDate) : '...'}</span>
                    </div>
                    <div className="flex justify-end gap-2 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
                        <button onClick={() => startDate && endDate && onApply({ startDate, endDate })} disabled={!startDate || !endDate} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold bg-[#16423C] text-white rounded-md disabled:opacity-50 hover:opacity-90">Apply</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface DashboardStats {
    kpis: {
        totalRevenue: { value: number; growth: number };
        totalOrders: { value: number; growth: number };
        newCustomers: { value: number; growth: number };
        avgOrderValue: { value: number; growth: number };
    };
    logs: any[];
}

const Dashboard: React.FC<{ token: string | null }> = ({ token }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29); 
        return { label: 'Last 30 Days', startDate: start, endDate: end };
    });
    const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    startDate: dateRange.startDate.toISOString(),
                    endDate: dateRange.endDate.toISOString(),
                });
                const res = await fetch(getApiUrl(`/api/analytics/dashboard-summary?${params.toString()}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setStats(await res.json());
            } catch (e) {
                console.error("Dashboard fetch failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token, dateRange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDateSelectorOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleApplyDateRange = (newRange: { startDate: Date, endDate: Date }) => {
        setDateRange({
            startDate: newRange.startDate,
            endDate: newRange.endDate,
            label: `${formatDate(newRange.startDate)} - ${formatDate(newRange.endDate)}`
        });
        setIsDateSelectorOpen(false);
    };

    const handleExport = () => {
        if(!stats) return;
        const csvContent = "data:text/csv;charset=utf-8," 
            + "KPI,Value,Growth\n"
            + `Revenue,${stats.kpis.totalRevenue.value},${stats.kpis.totalRevenue.growth}%\n`
            + `Orders,${stats.kpis.totalOrders.value},${stats.kpis.totalOrders.growth}%\n`
            + `Customers,${stats.kpis.newCustomers.value},${stats.kpis.newCustomers.growth}%\n`
            + `AOV,${stats.kpis.avgOrderValue.value},${stats.kpis.avgOrderValue.growth}%`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "dashboard_summary.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && !stats) return <div className="animate-pulse p-8">Loading analytics...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif font-extrabold text-gray-900">Performance Overview</h2>
                <div className="flex gap-2 bg-white p-1 rounded-lg border relative" ref={datePickerRef}>
                    <button 
                        onClick={() => setIsDateSelectorOpen(!isDateSelectorOpen)}
                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${isDateSelectorOpen ? 'bg-[#16423C] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        {dateRange.label}
                    </button>
                    <button onClick={handleExport} className="px-3 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded">Export</button>
                    
                    {isDateSelectorOpen && (
                        <DateRangePicker 
                            currentRange={dateRange} 
                            onApply={handleApplyDateRange} 
                            onClose={() => setIsDateSelectorOpen(false)} 
                        />
                    )}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Revenue', data: stats?.kpis.totalRevenue, icon: Icons.orders, isCurrency: true },
                    { title: 'Total Orders', data: stats?.kpis.totalOrders, icon: Icons.products },
                    { title: 'Customers', data: stats?.kpis.newCustomers, icon: Icons.users },
                    { title: 'Avg. Order', data: stats?.kpis.avgOrderValue, icon: Icons.marketing, isCurrency: true },
                ].map((kpi, idx) => (
                    <div key={idx} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${loading ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl text-[#16423C]">{kpi.icon}</div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.data?.growth! >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {kpi.data?.growth! >= 0 ? '↑' : '↓'} {Math.abs(kpi.data?.growth!)}%
                            </span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{kpi.title}</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">
                            {kpi.isCurrency ? '₹' : ''}{kpi.data?.value.toLocaleString()}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-8">Sales Trend</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { name: 'Day 1', rev: 4000 }, { name: 'Day 5', rev: 3000 },
                                { name: 'Day 10', rev: 5000 }, { name: 'Day 15', rev: 4500 },
                                { name: 'Day 20', rev: 6000 }, { name: 'Day 25', rev: 7000 },
                                { name: 'Day 30', rev: 8500 }
                            ]}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16423C" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#16423C" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="rev" stroke="#16423C" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Staff Activity</h3>
                    <div className="space-y-6">
                        {stats?.logs.map((log, idx) => (
                            <div key={idx} className="flex gap-4 items-start animate-fade-in">
                                <div className="w-8 h-8 rounded-full bg-[#16423C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {log.userName[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-bold text-gray-900">{log.userName}</span> {log.action} <span className="font-medium text-blue-600">{log.target}</span>
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{new Date(log.createdAt).toLocaleTimeString()} • {log.details}</p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.logs || stats.logs.length === 0) && <p className="text-center py-10 text-gray-400 italic text-sm">No recent activity found for this period.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
