
import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Activity, Users, ShoppingCart, DollarSign, ArrowUpRight, ArrowDownRight, MousePointer2 } from '../Icons';
import { getApiUrl } from '../../utils/apiHelper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

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

interface AnalyticsDetails {
    device: { _id: string, count: number }[];
    location: { _id: { country: string, state: string, city: string, area?: string }, count: number }[];
    landingPage: { _id: string, count: number }[];
    referrer: { _id: string, count: number }[];
    socialSessions: { _id: string, count: number }[];
    socialSales: { _id: string, totalSales: number }[];
}

const COLORS = ['#8884d8', '#00C49F', '#FFBB28', '#FF8042'];

const Analytics: React.FC<{ token: string | null }> = ({ token }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [live, setLive] = useState<LiveData | null>(null);
    const [details, setDetails] = useState<AnalyticsDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Chart Configuration
    const chartConfig = {
        visitors: { label: "Total Traffic" },
        desktop: { label: "Sales", color: "hsl(240 5.9% 10%)" },
        mobile: { label: "Visitors", color: "hsl(240 3.8% 46.1%)" },
    } satisfies ChartConfig;

    const chartData = data?.timeSeries.map(day => ({
        date: day.date,
        desktop: day.sales,
        mobile: day.visitors // Real data, no scaling
    })) || [];

    const fetchDetails = async () => {
        try {
            const resDetails = await fetch(getApiUrl('/api/analytics/details'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resDetails.ok) setDetails(await resDetails.json());
        } catch (e) {
            console.error("Details fetch error", e);
        }
    };

    // Fetch Summary & Details
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Summary
                const res = await fetch(getApiUrl('/api/analytics/summary?startDate=2024-01-01&endDate=2025-12-31'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setData(await res.json());

                // Details (Initial Fetch)
                await fetchDetails();

            } catch (e) {
                console.error("Analytics fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    // Polling for LIVE data & Details (Near real-time)
    useEffect(() => {
        const fetchLive = async () => {
            try {
                const res = await fetch(getApiUrl('/api/analytics/live'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setLive(await res.json());

                // Refresh location stats
                await fetchDetails();
            } catch (e) { console.error("Live fetch error", e); }
        };
        // Initial call in separate effect handles loading state, this is just for polling
        const interval = setInterval(fetchLive, 10000);
        return () => clearInterval(interval);
    }, [token]);

    // Process Location Data for Shopify-style accurate display
    const processedLocations = React.useMemo(() => {
        if (!details?.location) return [];
        return details.location
            .map(loc => {
                // 1. Filter 'Unknown' at all levels
                const parts = [loc._id.country, loc._id.state, loc._id.city, loc._id.area];
                const validParts = parts
                    .filter(p => p && typeof p === 'string' && p.trim() !== '' && p.toLowerCase() !== 'unknown');

                return {
                    label: validParts.join(' · ') || 'Unknown Location', // 5. Fallback rule
                    count: loc.count,
                    // 4. Stable Key: Country-State-City-Area
                    key: parts.join('-')
                };
            })
            // 1. Sort Data First (Descending Count)
            .sort((a, b) => b.count - a.count);
    }, [details?.location]);

    // 2. Fix Progress Bar Calculation (Max count from sorted data)
    const maxLocationCount = processedLocations.length > 0 ? processedLocations[0].count : 0;
    const getLocationPercent = (count: number) => {
        if (!maxLocationCount) return 0;
        return (count / maxLocationCount) * 100;
    };

    if (loading || !data) return (
        <div className="flex h-full items-center justify-center p-8">
            <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-sm text-muted-foreground">Monitor your store's performance and traffic in real-time.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Tabs defaultValue="30d" className="w-[400px]">
                        <TabsList>
                            <TabsTrigger value="30d">30d</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button variant="outline"><ArrowDownRight className="mr-2 h-4 w-4" /> Export</Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.kpis.sales.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpis.visitors.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+10.5% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpis.orders.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+12.2% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{live?.activeUsers || 0}</div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <p className="text-xs text-muted-foreground">Live users on site</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Graphs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>Revenue & traffic trends.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar name="Sales (₹)" dataKey="desktop" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar name="Visitors" dataKey="mobile" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>Live Activity Stream</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 pr-2 max-h-[250px] overflow-y-auto">
                            {live?.recentEvents.map((ev, idx) => (
                                <div key={idx} className="flex items-center">
                                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mr-4 shrink-0">
                                        <MousePointer2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{ev.eventType}</p>
                                        <p className="text-xs text-muted-foreground truncate">{ev.path}</p>
                                    </div>
                                    <div className="ml-auto text-xs text-muted-foreground">
                                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content & Funnel */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader><CardTitle>Content Performance</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Page</TableHead><TableHead className="text-right">Active Users</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {live?.activePages.map((page, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="truncate max-w-[200px]">{page.path}</TableCell>
                                        <TableCell className="text-right"><Badge variant="secondary">{page.count}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { label: 'Visitors', value: data.funnel.visitors },
                                { label: 'Purchased', value: data.funnel.purchased }
                            ].map((step, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span>{step.label}</span>
                                    <span className="font-bold">{step.value}</span>
                                </div>
                            ))}
                        </div>
                        <Separator className="my-6" />
                        <div className="flex justify-between items-center">
                            <span>Conversion Rate</span>
                            <span className="text-2xl font-bold">{data.kpis.conversionRate}%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* NEW REAL-TIME INSIGHTS (The 6 Cards) */}
            <h3 className="text-lg font-bold mt-8">Real-Time Insights</h3>
            <div className="grid gap-4 md:grid-cols-3">

                {/* 1. Device Type */}
                <Card>
                    <CardHeader><CardTitle className="text-sm font-semibold">Sessions by device type</CardTitle></CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center">
                        {details?.device?.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={details.device}
                                        dataKey="count"
                                        nameKey="_id"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                    >
                                        {details.device.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        verticalAlign="middle"
                                        align="right"
                                        layout="vertical"
                                        formatter={(value, entry: any) => {
                                            const count = entry.payload.count;
                                            // Explicitly use payload _id for name, fallback to Desktop
                                            const name = entry.payload._id || value || 'Desktop';
                                            const total = details.device.reduce((a, b) => a + b.count, 0) || 1;
                                            const percent = ((count / total) * 100).toFixed(0);
                                            return <span className="text-sm font-medium text-zinc-700 ml-2">{name} <span className="text-muted-foreground font-normal">{count} ({percent}%)</span></span>;
                                        }}
                                    />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="text-center py-10 text-muted-foreground text-sm">No data</div>}
                    </CardContent>
                </Card>

                {/* 2. Location */}
                <Card>
                    <CardHeader><CardTitle className="text-sm font-semibold">Sessions by location</CardTitle></CardHeader>
                    <CardContent className="space-y-4 pt-0">
                        {processedLocations.length > 0 ? processedLocations.map((loc) => (
                            <div key={loc.key} className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-700 font-medium">{loc.label}</span>
                                    <span className="font-bold text-zinc-900">{loc.count}</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500/80 rounded-full"
                                        style={{ width: `${getLocationPercent(loc.count)}%` }}
                                    />
                                </div>
                            </div>
                        )) : <div className="text-center py-10 text-muted-foreground text-sm">No data</div>}
                    </CardContent>
                </Card>

                {/* 3. Sales by Social */}
                <Card>
                    <CardHeader><CardTitle className="text-sm font-semibold">Total sales by social referrer</CardTitle></CardHeader>
                    <CardContent className="space-y-4 pt-0">
                        {details?.socialSales?.length ? details.socialSales.map((s, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-700 font-medium capitalize">{s._id}</span>
                                    <span className="font-bold text-zinc-900">₹{s.totalSales.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 rounded-full">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${(s.totalSales / (details.socialSales[0]?.totalSales || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )) : <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground text-sm">
                            <p>No data for this date range</p>
                        </div>}
                    </CardContent>
                </Card>

                {/* 4. Landing Page */}
                <Card>
                    <CardHeader><CardTitle className="text-sm font-semibold">Sessions by landing page</CardTitle></CardHeader>
                    <CardContent className="space-y-0 pt-0">
                        {details?.landingPage?.length ? details.landingPage.map((p, i) => (
                            <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0">
                                <span className="text-sm font-medium text-zinc-700 truncate max-w-[220px]" title={p._id}>
                                    {p._id}
                                </span>
                                <Badge variant="secondary" className="font-mono">{p.count}</Badge>
                            </div>
                        )) : <div className="text-center py-10 text-muted-foreground text-sm">No data</div>}
                    </CardContent>
                </Card>

                {/* 5. Social Referrer */}
                <Card>
                    <CardHeader><CardTitle className="text-sm font-semibold">Sessions by social referrer</CardTitle></CardHeader>
                    <CardContent className="space-y-0 pt-0">
                        {details?.socialSessions?.length ? details.socialSessions.map((s, i) => (
                            <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0">
                                <span className="text-sm font-medium text-zinc-700 capitalize">{s._id}</span>
                                <Badge variant="outline" className="font-bold">{s.count}</Badge>
                            </div>
                        )) : <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground text-sm">
                            <p>No social traffic</p>
                        </div>}
                    </CardContent>
                </Card>

                {/* 6. Referrer */}
                <Card>
                    <CardHeader><CardTitle className="text-sm font-semibold">Sessions by referrer</CardTitle></CardHeader>
                    <CardContent className="space-y-0 pt-0">
                        {details?.referrer?.length ? details.referrer.map((r, i) => (
                            <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0">
                                <span className="text-sm font-medium text-zinc-700 truncate max-w-[220px]">
                                    {r._id}
                                </span>
                                <span className="font-bold text-sm text-zinc-900">{r.count}</span>
                            </div>
                        )) : <div className="text-center py-10 text-muted-foreground text-sm">No referrer data</div>}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default Analytics;
