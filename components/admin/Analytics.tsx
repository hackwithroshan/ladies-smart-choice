import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
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
                // Fetch in parallel for near-instant response
                const [sRes, lRes] = await Promise.all([
                    fetch(getApiUrl('/api/analytics/summary'), { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(getApiUrl('/api/analytics/live'), { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (sRes.ok) setData(await sRes.json());
                if (lRes.ok) setLive(await lRes.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };

        fetchAnalytics();
        const interval = setInterval(async () => {
            try {
                const res = await fetch(getApiUrl('/api/analytics/live'), { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) setLive(await res.json());
            } catch (e) {}
        }, 8000); // Polling every 8s for live pulse
        return () => clearInterval(interval);
    }, [token]);

    if (loading || !data) return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
            <div className="h-16 w-16 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 animate-pulse italic">Engaging Intelligence Core</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Matrix */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-zinc-900 italic uppercase tracking-tighter leading-none">Intelligence Hub</h2>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Network Real-time: {live?.activeUsers || 0} active nodes</p>
                    </div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-zinc-100 p-1 rounded-2xl border border-zinc-200 shadow-sm">
                    <TabsList className="bg-transparent">
                        <TabsTrigger value="overview" className="text-[10px] font-black uppercase tracking-widest px-8 py-2.5">Real-time Overview</TabsTrigger>
                        <TabsTrigger value="traffic" className="text-[10px] font-black uppercase tracking-widest px-8 py-2.5">Traffic Analysis</TabsTrigger>
                        <TabsTrigger value="conversion" className="text-[10px] font-black uppercase tracking-widest px-8 py-2.5">Flow Metrics</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Premium Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Gross Revenue', value: `₹${data.kpis.sales.toLocaleString()}`, growth: '+18.4%', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Network Reach', value: data.kpis.visitors.toLocaleString(), growth: '+12.1%', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Conversion Velocity', value: `${data.kpis.conversionRate}%`, growth: '+4.2%', icon: TrendingUp, color: 'text-zinc-900', bg: 'bg-zinc-100' },
                    { label: 'Active Sessions', value: live?.activeUsers || 0, growth: 'LIVE', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-xl rounded-[2.5rem] bg-white group overflow-hidden border border-zinc-100/50">
                        <CardContent className="p-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn("p-4 rounded-[1.5rem] group-hover:scale-110 transition-transform duration-500", kpi.bg, kpi.color)}>
                                    <kpi.icon className="w-6 h-6" />
                                </div>
                                <Badge variant="outline" className="text-[10px] font-black border-zinc-200 px-3 py-1 rounded-full uppercase tracking-tighter">{kpi.growth}</Badge>
                            </div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
                            <h3 className="text-4xl font-black text-zinc-900 tracking-tighter italic leading-none">{kpi.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Performance Visualization */}
                <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden border border-zinc-100">
                    <CardHeader className="p-10 border-b border-zinc-50 bg-zinc-50/20">
                        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Market Velocity</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Daily revenue and traffic correlation</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.timeSeries}>
                                <defs>
                                    <linearGradient id="mainGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.12}/>
                                        <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f1f1" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: '900'}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: '900'}} dx={-10} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '20px' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#18181b" strokeWidth={5} fillOpacity={1} fill="url(#mainGrad)" animationDuration={1500} />
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
                        <CardDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">Real-time Node Activity</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 flex-1 overflow-y-auto admin-scroll">
                        <div className="space-y-8">
                            {live?.recentEvents.map((ev, idx) => (
                                <div key={idx} className="flex gap-6 items-start group animate-in slide-in-from-bottom duration-500">
                                    <div className={cn(
                                        "w-1 h-10 rounded-full transition-all group-hover:h-12",
                                        ev.eventType === 'AddToCart' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 
                                        ev.eventType === 'Purchase' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-black uppercase italic tracking-tight mb-1">{ev.eventType}</p>
                                        <p className="text-[10px] text-zinc-500 truncate font-mono uppercase tracking-widest">{ev.path || '/'}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-600 font-mono">
                                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-10 bg-white/5 mt-auto border-t border-white/5">
                        <div className="flex justify-between items-center">
                             <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Efficiency Status</p>
                             <p className="text-lg font-black italic text-emerald-400">OPTIMIZED</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Content & Flow Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Funnel Dynamics */}
                <Card className="border-none shadow-xl rounded-[3rem] bg-white p-12 border border-zinc-100">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                        <span className="w-8 h-0.5 bg-zinc-200" />
                        Conversion Flow Dynamics
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Discovery Phase', value: data.funnel.visitors, color: 'bg-zinc-50', sub: 'Total Platform Entries' },
                            { label: 'Engagement Signal', value: data.funnel.addToCart, color: 'bg-blue-50/50', sub: 'High Intent Sessions' },
                            { label: 'Commitment Start', value: data.funnel.checkout, color: 'bg-zinc-100', sub: 'Payment Initiation' },
                            { label: 'Final Conversion', value: data.funnel.purchased, color: 'bg-zinc-900', text: 'text-white', sub: 'Successfully Closed' }
                        ].map((step, i) => {
                            const percent = Math.round((step.value / data.funnel.visitors) * 100);
                            return (
                                <div key={i} className="relative group">
                                    <div className={cn(
                                        "flex justify-between items-center p-8 rounded-[2rem] border border-zinc-100 transition-all duration-500 group-hover:translate-x-2",
                                        step.color, step.text || "text-zinc-900"
                                    )}>
                                        <div className="space-y-1">
                                            <span className="text-[12px] font-black uppercase tracking-[0.2em]">{step.label}</span>
                                            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{step.sub}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-2xl font-black italic">{step.value.toLocaleString()}</span>
                                            <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-black italic">
                                                {percent}%
                                            </div>
                                        </div>
                                    </div>
                                    {i < 3 && <div className="h-4 flex justify-center"><div className="w-px h-full bg-zinc-200" /></div>}
                                </div>
                            )
                        })}
                    </div>
                </Card>

                {/* Content Impact Heatmap */}
                <Card className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden border border-zinc-100 flex flex-col">
                    <div className="p-12 border-b border-zinc-50 bg-zinc-50/20 flex justify-between items-center">
                        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.4em] flex items-center gap-4">
                            <span className="w-8 h-0.5 bg-zinc-200" />
                            Engagement Landscape
                        </h3>
                        <SearchIcon className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50/50">
                                <tr>
                                    <th className="px-12 py-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Asset URL</th>
                                    <th className="px-12 py-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Reach</th>
                                    <th className="px-12 py-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Density</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {data.topPages.map((p, i) => (
                                    <tr key={i} className="hover:bg-zinc-50/80 transition-colors group">
                                        <td className="px-12 py-8 text-[11px] text-blue-600 font-mono italic group-hover:translate-x-1 transition-transform">{p.path}</td>
                                        <td className="px-12 py-8 text-lg font-black italic text-zinc-900">{p.views.toLocaleString()}</td>
                                        <td className="px-12 py-8">
                                            <div className="w-40 h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50 shadow-inner">
                                                <div 
                                                    className="h-full bg-zinc-900 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.1)]" 
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