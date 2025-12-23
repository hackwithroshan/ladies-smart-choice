
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Icons, COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

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

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(getApiUrl('/api/analytics/dashboard-summary'), {
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
    }, [token]);

    if (loading) return <div className="animate-pulse p-8">Loading analytics...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif font-extrabold text-gray-900">Performance Overview</h2>
                <div className="flex gap-2 bg-white p-1 rounded-lg border">
                    <button className="px-3 py-1 text-xs font-bold bg-[#16423C] text-white rounded">Last 30 Days</button>
                    <button className="px-3 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded">Export</button>
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
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
                            <div key={idx} className="flex gap-4 items-start">
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
                        {(!stats?.logs || stats.logs.length === 0) && <p className="text-center py-10 text-gray-400 italic text-sm">No recent activity.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
