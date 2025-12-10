
import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// --- TYPE DEFINITIONS ---
interface KpiData {
    visitors: number;
    sales: number;
    orders: number;
    conversionRate: number;
}
interface FunnelData {
    visitors: number;
    addToCart: number;
    checkout: number;
    purchased: number;
}
interface AnalyticsData {
    kpis: KpiData;
    revenueBySource: { name: string, value: number }[];
    funnel: FunnelData;
    timeSeries: { date: string, visitors: number, sales: number }[];
    topPages: { path: string, views: number }[];
}
interface LiveData {
    activeUsers: number;
    recentEvents: { eventType: string; path?: string; data?: any; createdAt: string }[];
}
interface DateRange {
    label: string;
    startDate: Date;
    endDate: Date;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}

// --- HELPER FUNCTIONS & CONSTANTS ---
const PIE_COLORS: { [key: string]: string } = {
    meta: '#4267B2', google: '#4285F4', organic: '#34A853',
    direct: '#EA4335', ads: '#FBBC05', referral: '#7e22ce', unknown: '#9ca3af'
};
const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

// --- UI COMPONENTS ---

const StatCard: React.FC<{ title: string; value: string; subtext?: string; color?: string; isLoading?: boolean }> = ({ title, value, subtext, color, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            </div>
        );
    }
    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1" style={{ color }}>{value}</p>
            {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        {payload.map(pld => (
             <p key={pld.dataKey} style={{ color: pld.stroke || pld.fill }}>
                {`${pld.name}: ${pld.dataKey === 'sales' ? '₹' : ''}${(pld.value as number).toLocaleString(undefined, { maximumFractionDigits: pld.dataKey === 'sales' ? 2 : 0 })}`}
            </p>
        ))}
      </div>
    );
  }
  return null;
};

const SkeletonLoader: React.FC<{className?: string}> = ({ className }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse ${className}`}>
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
    </div>
);

// --- UPDATED: Date Range Picker Component matching user-provided image ---
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
                end.setDate(0); // Sets to the last day of the previous month
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
        <div className="absolute top-full right-4 left-4 md:left-auto md:right-0 mt-2 bg-white rounded-lg shadow-2xl border z-20 animate-fade-in-up flex flex-col md:flex-row w-[calc(100vw-2rem)] max-w-sm md:w-auto md:max-w-none">
             {/* Left Column: Presets */}
            <div className="w-full md:w-44 border-b md:border-b-0 md:border-r border-gray-200 p-4">
                <div className="space-y-1">
                    {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'].map(label => (
                        <button key={label} onClick={() => handlePresetClick(label)} className="block w-full text-left text-sm font-medium p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-indigo-600">{label}</button>
                    ))}
                </div>
            </div>

            {/* Right Column: Calendars & Actions */}
            <div className="flex flex-col p-4">
                {/* Calendars */}
                <div className="flex flex-col md:flex-row justify-center gap-x-8">
                     <div className="hidden md:block">
                        {renderCalendar(prevMonthDate)}
                    </div>
                    <div>
                        {renderCalendar(viewDate)}
                    </div>
                </div>

                {/* Footer Actions */}
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


// --- UPDATED: Conversion Funnel Step Component ---
const FunnelStep: React.FC<{ title: string; value: number; initialValue: number; previousValue?: number; color: string; isLast?: boolean }> = ({ title, value, initialValue, previousValue, color, isLast }) => {
    const conversionFromPrev = previousValue && previousValue > 0 ? (value / previousValue) * 100 : 100;
    const conversionFromStart = initialValue > 0 ? (value / initialValue) * 100 : 100;
    const dropOff = previousValue ? 100 - conversionFromPrev : 0;

    return (
        <div className="relative">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">{title}</span>
                    <span className="text-xl font-bold text-gray-900">{value.toLocaleString()}</span>
                </div>
                <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${conversionFromPrev}%`, backgroundColor: color }}></div>
                </div>
                 {initialValue !== value && (
                    <div className="text-xs text-gray-500 mt-2 text-right">
                        Overall Conversion: <span className="font-bold text-gray-700">{conversionFromStart.toFixed(1)}%</span>
                    </div>
                 )}
            </div>
            {!isLast && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 flex items-center flex-col text-xs text-gray-500">
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="mt-1 flex items-center gap-1.5 p-1 bg-white rounded-full border shadow-sm">
                         <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l-5-5 5-5m-5 5h12" /></svg>
                        <span className="font-bold text-red-600" title="Drop-off from previous step">{dropOff.toFixed(1)}%</span>
                        <span className="font-medium text-green-600" title="Conversion from previous step">{conversionFromPrev.toFixed(1)}%</span>
                        <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" /></svg>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- MAIN ANALYTICS COMPONENT ---

const Analytics: React.FC<{ token: string | null }> = ({ token }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [liveData, setLiveData] = useState<LiveData>({ activeUsers: 0, recentEvents: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29); // Default to last 30 days
        return { label: 'Last 30 Days', startDate: start, endDate: end };
    });
    
    // Date Range Picker state
    const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    startDate: dateRange.startDate.toISOString(),
                    endDate: dateRange.endDate.toISOString(),
                });
                const res = await fetch(`/api/analytics/summary?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch analytics data.');
                setData(await res.json());
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateRange, token]);
    
    // Live data polling
    useEffect(() => {
        const fetchLiveData = async () => {
            try {
                const res = await fetch('/api/analytics/live', { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) setLiveData(await res.json());
            } catch (err) { console.error("Live data fetch failed:", err); }
        };

        fetchLiveData(); // Initial fetch
        const interval = setInterval(fetchLiveData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [token]);

    // Click outside handler for date picker
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDateSelectorOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    // --- Data Transformation for Charts ---
    const funnelChartData = data ? [
        { name: 'Visitors', value: data.funnel.visitors, color: '#3b82f6' },
        { name: 'Added to Cart', value: data.funnel.addToCart, color: '#8b5cf6' },
        { name: 'Reached Checkout', value: data.funnel.checkout, color: '#f97316' },
        { name: 'Purchased', value: data.funnel.purchased, color: '#10b981' },
    ] : [];
    
    // Date Range Selection Logic
    const handleApplyDateRange = (newRange: { startDate: Date, endDate: Date }) => {
        setDateRange({
            startDate: newRange.startDate,
            endDate: newRange.endDate,
            label: `${formatDate(newRange.startDate)} - ${formatDate(newRange.endDate)}`
        });
        setIsDateSelectorOpen(false);
    };

    // --- Render Logic ---
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;

    const kpis = data?.kpis;
    const recentEvents = liveData.recentEvents;
    const totalRevenueFromSource = data?.revenueBySource.reduce((sum, item) => sum + item.value, 0) || 0;
    const totalFunnelConversion = (data?.funnel.visitors && data.funnel.visitors > 0) ? (data.funnel.purchased / data.funnel.visitors) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Marketing Analytics</h2>
                <div className="relative w-full md:w-auto" ref={datePickerRef}>
                    <button onClick={() => setIsDateSelectorOpen(!isDateSelectorOpen)} className="flex items-center justify-between md:justify-start gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 w-full">
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

            {/* KPIs & Live View */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard isLoading={loading} title="Visitors" value={kpis?.visitors?.toLocaleString() || '0'} color="#3b82f6" />
                    <StatCard isLoading={loading} title="Sales" value={`₹${kpis?.sales?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}`} color="#10b981" />
                    <StatCard isLoading={loading} title="Orders" value={kpis?.orders?.toLocaleString() || '0'} color="#8b5cf6" />
                    <StatCard isLoading={loading} title="Conversion" value={`${kpis?.conversionRate || '0.0'}%`} color="#f97316" />
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <p className="text-3xl font-bold text-green-600">{liveData.activeUsers}</p>
                        <p className="font-medium text-gray-500">Live Visitors</p>
                    </div>
                    <div className="mt-3 text-xs text-gray-400 truncate">
                        {recentEvents.length > 0 ? `${recentEvents[0].eventType} on ${recentEvents[0].path || 'home'}` : 'Awaiting activity...'}
                    </div>
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {loading ? (
                    <>
                        <SkeletonLoader className="lg:col-span-2" />
                        <SkeletonLoader />
                    </>
                ) : data && (
                    <>
                        {/* Time Series Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4">Visitors & Sales Trend</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.timeSeries} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis dataKey="date" tick={{fontSize: 12}}/>
                                        <YAxis yAxisId="left" tick={{fontSize: 12}} tickFormatter={(val) => val.toLocaleString()}/>
                                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} tickFormatter={(val) => `₹${(val/1000)}k`}/>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area type="monotone" dataKey="visitors" name="Visitors" yAxisId="left" stroke="#3b82f6" fill="url(#colorVisitors)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="sales" name="Sales" yAxisId="right" stroke="#10b981" fill="url(#colorSales)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenue by Source */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-4">Sales by Traffic Source</h3>
                            <div className="relative h-48">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data.revenueBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} stroke="none">
                                            {data.revenueBySource.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name] || PIE_COLORS.unknown} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-xs text-gray-500">Total Sales</p>
                                    <p className="text-2xl font-bold text-gray-800">₹{Math.round(totalRevenueFromSource).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 mt-4 overflow-y-auto">
                                {data.revenueBySource.sort((a,b) => b.value - a.value).map(entry => (
                                    <div key={entry.name} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[entry.name] || PIE_COLORS.unknown }}></span>
                                            <span className="capitalize font-medium text-gray-600">{entry.name}</span>
                                        </div>
                                        <div className="font-bold text-gray-800">
                                            <span>{((entry.value / totalRevenueFromSource) * 100).toFixed(1)}%</span>
                                            <span className="text-xs text-gray-400 font-normal ml-2">₹{entry.value.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Conversion Funnel & Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {loading ? <SkeletonLoader /> : data && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-6">Conversion Funnel</h3>
                        <div className="space-y-12">
                            {funnelChartData.map((step, index) => (
                                <FunnelStep 
                                    key={step.name}
                                    title={step.name}
                                    value={step.value}
                                    initialValue={funnelChartData[0].value}
                                    previousValue={index > 0 ? funnelChartData[index-1].value : undefined}
                                    color={step.color}
                                    isLast={index === funnelChartData.length - 1}
                                />
                            ))}
                        </div>
                         <div className="mt-12 text-center border-t border-gray-200 pt-6">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Funnel Conversion</p>
                            <p className="text-4xl font-extrabold text-green-600 mt-2">
                                {totalFunnelConversion.toFixed(2)}%
                            </p>
                            <p className="text-xs text-gray-400 mt-1">(Visitors to Purchasers)</p>
                        </div>
                    </div>
                )}

                {loading ? <SkeletonLoader /> : data && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4">Top Landing Pages</h3>
                        <div className="space-y-3">
                            {data.topPages.map((page, index) => (
                                <div key={index} className="text-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <a href={page.path} target="_blank" rel="noopener noreferrer" className="font-mono text-blue-600 hover:underline truncate pr-4">{page.path}</a>
                                        <span className="font-bold text-gray-800">{page.views.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(page.views / (data.topPages[0]?.views || page.views)) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
