
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { getApiUrl } from '../../utils/apiHelper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { 
    IndianRupee, Users, TrendingUp, Activity, 
    ShoppingCart, Eye, MousePointer2, Zap 
} from '../Icons';
import { cn } from '../../utils/utils';

interface AnalyticsData {
    kpis: { visitors: number; sales: number; orders: number; conversionRate: number };
    funnel: { visitors: number; addToCart: number; checkout: number; purchased: number };
    timeSeries: { _id: string, sales: number, orders: number }[];
    topPages: { path: string, views: number }[];
}

interface LivePulse {
    activeUsers: number;
    recentEvents: any[];
}

const Analytics: React.FC<{ token: string | null }> = ({ token }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [live, setLive] = useState<LivePulse | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('30d');

    const fetchAnalytics = async () => {
        try {
            // Corrected: Removed /api prefix
            const [sRes, lRes] = await Promise.all([
                fetch(getApiUrl('analytics/summary'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('analytics/live'), { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (sRes.ok) setData(await sRes.json());
            if (lRes.ok) setLive(await lRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(async () => {
            // Corrected: Removed /api prefix
            const res = await fetch(getApiUrl('analytics/live'), { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setLive(await res.json());
        }, 10000);
        return () => clearInterval(interval);
    }, [token]);

    if (loading || !data) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="h-12 w-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 italic">Assembling Data Matrix...</p>
        </div>
    );

    const kpiCards = [
        { label: 'Gross Revenue', value: `₹${data.kpis.sales.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Store Visitors', value: data.kpis.visitors.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Orders', value: data.kpis.orders.toLocaleString(), icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Conv. Rate', value: `${data.kpis.conversionRate}%`, icon: TrendingUp, color: 'text-zinc-900', bg: 'bg-zinc-100' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-zinc-900 italic uppercase tracking-tighter">Business Intelligence</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            {live?.activeUsers || 0} Nodes currently active
                        </p>
                    </div>
                </div>
                <Tabs value={timeframe} onValueChange={setTimeframe} className="bg-zinc-100 p-1 rounded-xl border">
                    <TabsList className="bg-transparent h-9">
                        <TabsTrigger value="24h" className="text-[10px] font-bold uppercase px-6">24 Hours</TabsTrigger>
                        <TabsTrigger value="7d" className="text-[10px] font-bold uppercase px-6">7 Days</TabsTrigger>
                        <TabsTrigger value="30d" className="text-[10px] font-bold uppercase px-6">30 Days</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((kpi, i) => (
                    <Card key={i} className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden group">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", kpi.bg, kpi.color)}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black border-zinc-100 uppercase tracking-tighter">Live</Badge>
                            </div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-zinc-900 tracking-tighter italic">{kpi.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Revenue Chart */}
                <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="p-10 border-b border-zinc-50 bg-zinc-50/30">
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Revenue Trajectory</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Daily earnings across all channels</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.timeSeries}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f1f1" />
                                <XAxis 
                                    dataKey="_id" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: '800'}} 
                                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: '800'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#18181b" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Real-time Pulse Feed */}
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-zinc-900 text-white overflow-hidden flex flex-col">
                    <CardHeader className="p-10 border-b border-white/5">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Live Signal Pulse</CardTitle>
                            <span className="flex h-2 w-2 bg-red-500 rounded-full animate-ping" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 overflow-y-auto admin-scroll">
                        <div className="space-y-6">
                            {live?.recentEvents.map((ev, idx) => (
                                <div key={idx} className="flex gap-4 items-start group animate-in slide-in-from-bottom duration-500">
                                    <div className={cn(
                                        "w-1 h-8 rounded-full transition-all group-hover:h-10",
                                        ev.eventType === 'Purchase' ? 'bg-emerald-500' : 
                                        ev.eventType === 'AddToCart' ? 'bg-orange-500' : 'bg-blue-500'
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black uppercase italic tracking-tighter">{ev.eventType}</p>
                                        <p className="text-[9px] text-zinc-500 truncate font-mono uppercase tracking-widest">{ev.path || '/'}</p>
                                    </div>
                                    <span className="text-[9px] font-bold text-zinc-700">
                                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-8 bg-white/5 border-t border-white/5 text-center">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Network Synchronized</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
