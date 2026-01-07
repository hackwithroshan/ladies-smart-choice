import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getApiUrl } from '../../utils/apiHelper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { IndianRupee, Users, TrendingUp, Activity, Smartphone, SearchIcon } from '../Icons';
import { cn } from '../../utils/utils';

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

const Analytics: React.FC<{ token: string | null }> = ({ token }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [live, setLive] = useState<LiveData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch both summary and live data in parallel for speed
                const [sRes, lRes] = await Promise.all([
                    fetch(getApiUrl('/api/analytics/summary'), { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(getApiUrl('/api/analytics/live'), { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (sRes.ok) setData(await sRes.json());
                if (lRes.ok) setLive(await lRes.json());
            } catch (e) { 
                console.error("Analytics Sync Error:", e); 
            } finally { 
                setLoading(false); 
            }
        };

        fetchAnalytics();
        const interval = setInterval(async () => {
            try {
                const res = await fetch(getApiUrl('/api/analytics/live'), { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) setLive(await res.json());
            } catch (e) {}
        }, 10000);
        return () => clearInterval(interval);
    }, [token]);

    if (loading || !data) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
            <div className="h-12 w-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 animate-pulse">Synchronizing Intelligence Engine</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Real-time Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-zinc-900 italic uppercase tracking-tighter leading-none">Market Intelligence</h2>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Node Live: {live?.activeUsers || 0} Concurrent Sessions</p>
                    </div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-zinc-100/80 p-1 rounded-2xl border border-zinc-200 shadow-sm">
                    <TabsList className="bg-transparent">
                        {['overview', 'traffic', 'realtime'].map(t => (
                            <TabsTrigger key={t} value={t} className="text-[10px] font-black uppercase tracking-widest px-8 py-2.5 h-auto">
                                {t}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* KPI Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Gross Revenue', value: `₹${data.kpis.sales.toLocaleString()}`, growth: '+14.2%', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Conversion Rate', value: `${data.kpis.conversionRate}%`, growth: '+3.1%', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Orders', value: data.kpis.orders, growth: '+8.4%', icon: TrendingUp, color: 'text-zinc-900', bg: 'bg-zinc-100' },
                    { label: 'Visitor Velocity', value: data.kpis.visitors.toLocaleString(), growth: '-1.2%', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white group overflow-hidden border-zinc-100/50 border">
                        <CardContent className="p-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn("p-4 rounded-3xl group-hover:scale-110 transition-transform duration-500 shadow-sm", kpi.bg, kpi.color)}>
                                    <kpi.icon className="w-6 h-6" />
                                </div>
                                <Badge variant="outline" className="text-[10px] font-black border-zinc-100 px-3 py-1 rounded-full uppercase tracking-tighter">{kpi.growth}</Badge>
                            </div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.25em] mb-2">{kpi.label}</p>
                            <h3 className="text-4xl font-black text-zinc-900 tracking-tighter italic leading-none">{kpi.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Visual Performance Chart */}
                <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden border border-zinc-100">
                    <CardHeader className="p-10 border-b border-zinc-50 bg-zinc-50/30">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Market Velocity</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 text-zinc-400">Revenue trajectory vs Visitor spikes</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full"><div className="w-2 h-2 rounded-full bg-zinc-900" /><span className="text-[9px] font-black uppercase">Revenue</span></div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 rounded-full border"><div className="w-2 h-2 rounded-full bg-zinc-300" /><span className="text-[9px] font-black uppercase text-zinc-400">Visitors</span></div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.timeSeries}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f1f1" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} dx={-10} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '20px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#18181b" strokeWidth={5} fillOpacity={1} fill="url(#revenueGrad)" animationDuration={2000} />
                                <Area type="monotone" dataKey="visitors" stroke="#e4e4e7" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Real-time Event Stream */}
                <Card className="border-none shadow-2xl rounded-[3rem] bg-zinc-900 text-white overflow-hidden flex flex-col">
                    <CardHeader className="p-10 border-b border-white/5">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Live Pulse</CardTitle>
                            <span className="flex h-3 w-3 bg-red-500 rounded-full animate-ping" />
                        </div>
                        <CardDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">Direct Node Monitoring</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 flex-1 overflow-y-auto admin-scroll">
                        <div className="space-y-8">
                            {live?.recentEvents.map((ev, idx) => (
                                <div key={idx} className="flex gap-6 items-start group animate-in slide-in-from-right duration-500">
                                    <div className={cn(
                                        "w-1.5 h-10 rounded-full transition-all group-hover:h-12 shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                                        ev.eventType === 'AddToCart' ? 'bg-orange-500 shadow-orange-500/50' : 
                                        ev.eventType === 'Purchase' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-500 shadow-blue-500/50'
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-black uppercase italic tracking-tight mb-1">{ev.eventType}</p>
                                        <p className="text-[10px] text-zinc-500 truncate font-mono uppercase tracking-widest">{ev.path || '/'}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-600 uppercase font-mono">
                                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-10 bg-white/5 mt-auto border-t border-white/5">
                        <div className="flex justify-between items-center">
                             <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">System Load</p>
                                <p className="text-xl font-black italic text-emerald-400 mt-1">OPTIMIZED</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Active Channels</p>
                                <p className="text-xl font-black italic text-white mt-1">04</p>
                             </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Bottom Insight Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 {/* Funnel Efficiency */}
                 <Card className="border-none shadow-xl rounded-[3rem] bg-white p-12 border border-zinc-100">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] mb-12 flex items-center gap-3">
                        <span className="w-6 h-0.5 bg-zinc-200" />
                        Funnel Conversion Dynamics
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Platform Entry', value: data.funnel.visitors, color: 'bg-zinc-50', text: 'text-zinc-900', sub: 'Total Unique Nodes' },
                            { label: 'Interest Signal', value: data.funnel.addToCart, color: 'bg-blue-50/50', text: 'text-blue-700', sub: 'Add To Cart Intent' },
                            { label: 'Commitment Start', value: data.funnel.checkout, color: 'bg-amber-50/50', text: 'text-amber-700', sub: 'Initiated Checkout' },
                            { label: 'Revenue Target', value: data.funnel.purchased, color: 'bg-zinc-900', text: 'text-white', sub: 'Completed Conversion' }
                        ].map((step, i) => {
                            const percentage = Math.round((step.value / data.funnel.visitors) * 100);
                            return (
                                <div key={i} className="relative group">
                                    <div className={cn(
                                        "flex justify-between items-center p-8 rounded-[2rem] border border-zinc-100 transition-all duration-500 group-hover:translate-x-2 shadow-sm",
                                        step.color, step.text
                                    )}>
                                        <div className="space-y-1">
                                            <span className="text-[12px] font-black uppercase tracking-widest">{step.label}</span>
                                            <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest">{step.sub}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-2xl font-black italic">{step.value.toLocaleString()}</span>
                                            <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-black italic">
                                                {percentage}%
                                            </div>
                                        </div>
                                    </div>
                                    {i < 3 && <div className="h-4 flex justify-center"><div className="w-px h-full bg-zinc-200" /></div>}
                                </div>
                            )
                        })}
                    </div>
                 </Card>

                 {/* Top Pages Heatmap */}
                 <Card className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden border border-zinc-100">
                    <div className="p-10 border-b border-zinc-50 bg-zinc-50/30 flex justify-between items-center">
                        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-6 h-0.5 bg-zinc-200" />
                            Content Engagement Map
                        </h3>
                        <SearchIcon className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Resource Path</th>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Interaction Count</th>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Density</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 font-medium">
                                {data.topPages.map((p, i) => (
                                    <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-10 py-8 text-[11px] text-blue-600 font-mono italic group-hover:translate-x-1 transition-transform">{p.path}</td>
                                        <td className="px-10 py-8 text-lg font-black italic text-zinc-900">{p.views.toLocaleString()}</td>
                                        <td className="px-10 py-8">
                                            <div className="w-40 h-2 bg-zinc-100 rounded-full overflow-hidden shadow-inner border border-zinc-100">
                                                <div 
                                                    className="h-full bg-zinc-900 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.2)]" 
                                                    style={{ width: `${(p.views / data.topPages[0].views) * 100}%` }} 
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </Card>
            </div>
        </div>
    );
};

export default Analytics;