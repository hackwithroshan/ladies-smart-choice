import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Funnel, FunnelChart, LabelList
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
const PIE_COLORS = {
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


// --- NEW: Full Calendar Date Range Picker Component ---
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
        switch(label) {
            case 'Today': start.setHours(0,0,0,0); break;
            case 'Last 7 Days': start.setDate(end.getDate() - 6); break;
            case 'Last 30 Days': start.setDate(end.getDate() - 29); break;
            case 'This Month': start.setDate(1); break;
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
            <div>
                <h4 className="font-bold text-center mb-2">{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-500 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {allDays.map((day, i) => {
                        if (!day) return <div key={i}></div>;
                        
                        const isStart = startDate && isSameDay(day, startDate);
                        const isEnd = endDate && isSameDay(day, endDate);
                        const inRange = startDate && endDate && day > startDate && day < endDate;
                        const inHoverRange = startDate && !endDate && hoverDate && day > startDate && day <= hoverDate;

                        let classes = "w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer";
                        if (isStart || isEnd) classes += " bg-rose-600 text-white font-bold";
                        else if (inRange || inHoverRange) classes += " bg-rose-100 text-rose-800";
                        else classes += " hover:bg-gray-100";
                        if (isStart && endDate) classes += " rounded-r-none";
                        if (isEnd) classes += " rounded-l-none";

                        return (
                            <button key={i} onClick={() => handleDateClick(day)} onMouseEnter={() => setHoverDate(day)} onMouseLeave={() => setHoverDate(null)} className={classes}>
                                {day.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };
    
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);

    return (
        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-2xl border z-20 animate-fade-in-up flex p-4">
            <div className="w-40 border-r pr-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Presets</h4>
                {['Today', 'Last 7 Days', 'Last 30 Days', 'This Month'].map(label => (
                    <button key={label} onClick={() => handlePresetClick(label)} className="block w-full text-left text-sm p-2 rounded hover:bg-gray-100">{label}</button>
                ))}
            </div>
            <div className="pl-4">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setViewDate(prevMonth)} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                    <div className="flex gap-8">
                        {renderCalendar(prevMonth)}
                        {renderCalendar(viewDate)}
                    </div>
                    <button onClick={() => setViewDate(nextMonth)} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
                </div>
                <div className="flex justify-end gap-2 border-t pt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-white border rounded-md">Cancel</button>
                    <button onClick={() => startDate && endDate && onApply({ startDate, endDate })} disabled={!startDate || !endDate} className="px-4 py-2 text-sm bg-rose-600 text-white rounded-md disabled:opacity-50">Apply</button>
                </div>
            </div>
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
        { name: 'Visitors', value: data.funnel.visitors },
        { name: 'Added to Cart', value: data.funnel.addToCart },
        { name: 'Reached Checkout', value: data.funnel.checkout },
        { name: 'Purchased', value: data.funnel.purchased },
    ] : [];

    const getFunnelStepPercentage = (current: number, previous: number) => {
        if (previous === 0) return '0%';
        return `${((current / previous) * 100).toFixed(1)}%`;
    };
    
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

    // FIX: The `formatter` prop on LabelList does not receive the `index` property needed for this calculation.
    // Switched to the `content` prop which provides a custom render function with more properties, including `index`.
    const renderCustomFunnelLabel = (props: any) => {
        const { x, y, width, height, value, index } = props;
        const cx = x + width / 2;
        const cy = y + height / 2;
    
        let labelText: string;
        if (index === 0) {
            labelText = value.toLocaleString();
        } else {
            const prevValue = funnelChartData[index - 1].value;
            labelText = getFunnelStepPercentage(value, prevValue);
        }
    
        return (
            <text x={cx} y={cy} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight="bold">
                {labelText}
            </text>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Marketing Analytics</h2>
                <div className="relative" ref={datePickerRef}>
                    <button onClick={() => setIsDateSelectorOpen(!isDateSelectorOpen)} className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>{dateRange.label}</span>
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
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4">Sales by Traffic Source</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data.revenueBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} labelLine={false}
                                             label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                                                const x  = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                const y = cy  + radius * Math.sin(-midAngle * Math.PI / 180);
                                                return <text x={x} y={y} fill="#6b7280" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>{`${(percent * 100).toFixed(0)}%`}</text>;
                                             }}>
                                            {data.revenueBySource.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || PIE_COLORS.unknown} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                                        <Legend iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Conversion Funnel & Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {loading ? <SkeletonLoader /> : data && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4">Conversion Funnel</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <FunnelChart>
                                    <Tooltip />
                                    <Funnel dataKey="value" data={funnelChartData} isAnimationActive>
                                        <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                                        <LabelList
                                            position="center"
                                            content={renderCustomFunnelLabel}
                                        />
                                    </Funnel>
                                </FunnelChart>
                            </ResponsiveContainer>
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
                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(page.views / data.topPages[0].views) * 100}%` }}></div>
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
