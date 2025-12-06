import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants';
import { SyncLog } from '../../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
// FIX: Corrected imports for Recharts tooltip types.
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface AnalyticsData {
    totalVisitors: number;
    adRevenue: number;
    conversionRate: number;
    topSource: string;
    trafficSources: { name: string, value: number }[];
    revenueOverTime: { date: string, meta: number, google: number, organic: number, direct: number }[];
    topPages: { path: string, views: number }[];
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string; color: string }> = ({ title, value, subtext, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="text-3xl font-bold text-gray-900 mt-1" style={{ color }}>{value}</p>
    {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
  </div>
);

const PIE_COLORS = {
    meta: '#4267B2',
    google: '#4285F4',
    organic: '#34A853',
    direct: '#EA4335',
    ads: '#FBBC05',
    referral: '#7e22ce'
};

// FIX: Replaced `TooltipProps` from recharts with an explicit interface to resolve type errors.
// The properties 'payload' and 'label' were not being found on the imported `TooltipProps`.
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{`Date: ${label}`}</p>
        {payload.map(pld => (
             <p key={pld.dataKey} style={{ color: pld.color }}>
                {`${pld.name}: ₹${(pld.value as number).toLocaleString()}`}
            </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics: React.FC<{ token: string | null }> = ({ token }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [summaryRes, syncRes] = await Promise.all([
                    fetch('/api/analytics/summary', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/feed/sync-logs', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (summaryRes.ok) setData(await summaryRes.json());
                if (syncRes.ok) setSyncLogs(await syncRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) return <div>Loading Analytics Dashboard...</div>;
    if (!data) return <div>Failed to load data.</div>;
    
    const lastSync = syncLogs[0];

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Marketing Analytics</h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Visitors" value={data.totalVisitors.toLocaleString()} subtext="Last 30 days" color="#3b82f6" />
                <StatCard title="Ad Revenue" value={`₹${data.adRevenue.toLocaleString()}`} subtext="From Meta & Google" color="#8b5cf6" />
                <StatCard title="Conversion Rate" value={`${data.conversionRate}%`} subtext="Visitors to Purchasers" color="#10b981" />
                <StatCard title="Top Traffic Source" value={data.topSource} subtext="Most popular channel" color="#f97316" />
            </div>

            {/* Catalog Health & Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Catalog Health */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4">Catalog Health</h3>
                    {lastSync ? (
                        <div className={`p-4 rounded-lg border text-center ${lastSync.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                           <p className={`text-sm font-bold uppercase tracking-wider ${lastSync.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                Meta Catalog: {lastSync.status}
                           </p>
                           <p className="text-2xl font-bold text-gray-800 mt-2">{lastSync.processedCount} Products</p>
                           <p className="text-xs text-gray-500 mt-1">Synced {new Date(lastSync.timestamp).toLocaleTimeString()}</p>
                        </div>
                    ) : (
                        <div className="p-4 rounded-lg border text-center bg-gray-50 border-gray-200">
                            <p className="text-sm font-medium text-gray-600">No catalog sync has been performed yet.</p>
                            <p className="text-xs text-gray-500 mt-1">Go to Settings to sync.</p>
                        </div>
                    )}
                </div>

                {/* Traffic Sources Pie Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4">Traffic Sources</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.trafficSources} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {data.trafficSources.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Revenue Over Time Line Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Revenue by Source (Last 30 Days)</h3>
                <div className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.revenueOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="date" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}} tickFormatter={(value) => `₹${value}`}/>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="meta" name="Meta Ads" stroke={PIE_COLORS.meta} strokeWidth={2} />
                            <Line type="monotone" dataKey="google" name="Google Ads" stroke={PIE_COLORS.google} strokeWidth={2} />
                            <Line type="monotone" dataKey="organic" name="Organic" stroke={PIE_COLORS.organic} strokeWidth={2} />
                            <Line type="monotone" dataKey="direct" name="Direct" stroke={PIE_COLORS.direct} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Pages Table */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Top Performing Pages</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Page Path</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pageviews</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {data.topPages.map((page, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 text-sm font-mono text-blue-600 hover:underline">
                                        <a href={page.path} target="_blank" rel="noopener noreferrer">{page.path}</a>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">{page.views.toLocaleString()}</td>
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
