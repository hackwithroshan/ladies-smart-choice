
import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { getApiUrl } from '../../utils/apiHelper';

// --- TYPE DEFINITIONS ---
interface AnalyticsData {
    kpis: { visitors: number; sales: number; orders: number; conversionRate: number };
    revenueBySource: { name: string, value: number }[];
    funnel: { visitors: number; addToCart: number; checkout: number; purchased: number };
    timeSeries: { date: string, visitors: number, sales: number }[];
    topPages: { path: string, views: number }[];
}

interface LiveData {
    activeUsers: number;
    activePages: { path: string; count: number }[];
    sources: { [key: string]: number };
    recentEvents: { eventType: string; path?: string; createdAt: string; source?: string }[];
}

const PIE_COLORS: { [key: string]: string } = {
    meta: '#1877F2', google: '#EA4335', organic: '#34A853',
    direct: '#16423C', referral: '#6A9C89'
};

const Analytics: React.FC<{ token: string | null }> = ({ token }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [live, setLive] = useState<LiveData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('Last 30 Days');

    // Fetch Historical Data
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch(getApiUrl('/api/analytics/summary?startDate=2024-01-01&endDate=2025-12-31'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setData(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchSummary();
    }, [token]);

    // Polling for LIVE data every 10 seconds
    useEffect(() => {
        const fetchLive = async () => {
            try {
                const res = await fetch(getApiUrl('/api/analytics/live'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setLive(await res.json());
            } catch (e) { console.error("Live fetch error", e); }
        };

        fetchLive();
        const interval = setInterval(fetchLive, 10000);
        return () => clearInterval(interval);
    }, [token]);

    if (loading || !data) return <div className="p-20 text-center animate-pulse text-gray-400 font-bold">Initializing Advanced Analytics...</div>;

    return (
        <div className="space-y-8 pb-20">
            {/* --- LIVE DASHBOARD SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Live Pulse Card */}
                <div className="bg-[#16423C] text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Active Visitors Now</span>
                        </div>
                        <h2 className="text-7xl font-black italic tracking-tighter mb-2">{live?.activeUsers || 0}</h2>
                        <p className="text-sm font-medium opacity-60">Real-time traffic across all devices</p>
                        
                        <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                            {live?.activePages.map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <span className="opacity-70 truncate max-w-[180px] font-mono">{p.path}</span>
                                    <span className="font-black bg-white/10 px-2 py-0.5 rounded">{p.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Live Traffic Sources */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6">Live Traffic Origin</h3>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.entries(live?.sources || {}).map(([name, value]) => ({ name, value }))}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {Object.entries(live?.sources || {}).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry[0]] || '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Meta</p><p className="font-black text-blue-600">{live?.sources.meta || 0}</p></div>
                        <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Google</p><p className="font-black text-red-600">{live?.sources.google || 0}</p></div>
                        <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Organic</p><p className="font-black text-green-600">{live?.sources.organic || 0}</p></div>
                    </div>
                </div>

                {/* Live Event Stream */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6">Live Activity Stream</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 admin-scroll">
                        {live?.recentEvents.map((ev, idx) => (
                            <div key={idx} className="flex items-center gap-3 animate-fade-in-up">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${ev.eventType === 'AddToCart' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-800 truncate">{ev.eventType}</p>
                                    <p className="text-[10px] text-gray-400 truncate font-mono">{ev.path}</p>
                                </div>
                                <span className="text-[9px] font-black text-gray-300 uppercase shrink-0">
                                    {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- HISTORICAL DATA SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Revenue & Growth Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-gray-800 italic">Sales Performance</h3>
                        <span className="text-[10px] font-black bg-green-50 text-green-600 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100">+12.5% Growth</span>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.timeSeries}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16423C" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#16423C" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                                <Area type="monotone" dataKey="sales" stroke="#16423C" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Funnel & Conversion */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 italic mb-8">E-commerce Funnel</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Visitors', value: data.funnel.visitors, color: '#94a3b8' },
                            { label: 'Product Views', value: Math.round(data.funnel.visitors * 0.7), color: '#6A9C89' },
                            { label: 'Add to Cart', value: data.funnel.addToCart, color: '#f59e0b' },
                            { label: 'Orders', value: data.funnel.purchased, color: '#16423C' },
                        ].map((step, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-black uppercase text-gray-400 tracking-widest">{step.label}</span>
                                    <span className="text-lg font-black text-gray-800">{step.value.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(step.value / data.funnel.visitors) * 100}%`, backgroundColor: step.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                         <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Overall Store Conversion</p>
                         <h4 className="text-4xl font-black text-[#16423C] italic">{data.kpis.conversionRate}%</h4>
                    </div>
                </div>
            </div>

            {/* Top Landing Pages Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <h3 className="text-xl font-bold text-gray-800 italic">Historical Traffic Distribution</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Page Path</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Visitors</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Popularity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.topPages.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-8 py-4 text-sm font-bold text-blue-600 font-mono italic">{p.path}</td>
                                    <td className="px-8 py-4 text-sm font-black text-gray-800">{p.views.toLocaleString()}</td>
                                    <td className="px-8 py-4">
                                        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#6A9C89] rounded-full" style={{ width: `${(p.views / data.topPages[0].views) * 100}%` }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
