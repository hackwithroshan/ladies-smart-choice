
import React, { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { TrendingUp, TrendingDown } from '../Icons';
import { getApiUrl } from '../../utils/apiHelper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '../ui/card';
import { Badge } from '../ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { useIsMobile } from '../../hooks/use-mobile';

// Mock data based on the provided pattern
const chartData = [
    { date: "2024-04-01", desktop: 222, mobile: 150 },
    { date: "2024-04-02", desktop: 97, mobile: 180 },
    { date: "2024-05-01", desktop: 165, mobile: 220 },
    { date: "2024-05-15", desktop: 473, mobile: 380 },
    { date: "2024-06-01", desktop: 178, mobile: 200 },
    { date: "2024-06-30", desktop: 446, mobile: 400 },
];

const chartConfig = {
    visitors: { label: "Visitors" },
    desktop: { label: "Desktop", color: "#16423C" },
    mobile: { label: "Mobile", color: "#6A9C89" },
} satisfies ChartConfig;

interface DashboardStats {
    kpis: {
        visitors: number;
        sales: number;
        orders: number;
        conversionRate: number;
    };
    timeSeries: { date: string; sales: number; orders: number; visitors: number }[];
}

const DashboardOverview: React.FC<{ token: string | null }> = ({ token }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("90d");
    const isMobile = useIsMobile();

    useEffect(() => {
        if (isMobile) setTimeRange("7d");
    }, [isMobile]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Use the shared analytics summary endpoint
                const res = await fetch(getApiUrl('/api/analytics/summary'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setStats(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchDashboardData();
    }, [token]);

    // Use original Shadcn keys to preserve UI styling (colors/gradients)
    const chartConfig = {
        visitors: { label: "Total Traffic" },
        desktop: { label: "Sales", color: "hsl(240 5.9% 10%)" }, // Zinc 950 (Black/Dark)
        mobile: { label: "Visitors", color: "hsl(240 3.8% 46.1%)" }, // Zinc 500 (Medium Gray)
    } satisfies ChartConfig;

    // Map real data to Shadcn chart keys
    const chartData = stats?.timeSeries.map(day => ({
        date: day.date,
        desktop: day.sales,
        mobile: day.visitors * 100 // Scale visually for demo/stacking
    })) || [];

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground/40" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 bg-background text-foreground min-h-screen -m-6 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    Store performance
                </h1>
                <p className="text-sm text-muted-foreground">
                    High-level overview of your revenue, orders and traffic.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-3">
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Total revenue
                        </span>
                        <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold border-emerald-100 bg-emerald-50 text-emerald-700">
                            <TrendingUp className="h-3 w-3" />
                            Real
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0 pt-1">
                        <div className="text-3xl font-semibold tracking-tight">
                            ₹{stats?.kpis.sales.toLocaleString("en-IN") || 0}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Total sales in period
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-3">
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Total orders
                        </span>
                        <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold border-emerald-100 bg-emerald-50 text-emerald-700">
                            <TrendingUp className="h-3 w-3" />
                            Real
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0 pt-1">
                        <div className="text-3xl font-semibold tracking-tight">
                            {stats?.kpis.orders.toLocaleString("en-IN") || 0}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Orders completed
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-3">
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Visitors
                        </span>
                        <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold border-emerald-100 bg-emerald-50 text-emerald-700">
                            <TrendingUp className="h-3 w-3" />
                            Live
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0 pt-1">
                        <div className="text-3xl font-semibold tracking-tight">
                            {stats?.kpis.visitors.toLocaleString("en-IN") || 0}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Unique visitors tracked
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-3">
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Conversion Rate
                        </span>
                        <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold border-emerald-100 bg-emerald-50 text-emerald-700">
                            <TrendingUp className="h-3 w-3" />
                            Avg
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0 pt-1">
                        <div className="text-3xl font-semibold tracking-tight">
                            {stats?.kpis.conversionRate}%
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Sessions converted to orders
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm rounded-xl overflow-hidden border border-border bg-card">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-b">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-medium tracking-tight font-serif">
                            Traffic overview
                        </CardTitle>
                        <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Interactive performance metrics
                        </CardDescription>
                    </div>
                    <CardAction>
                        <ToggleGroup
                            type="single"
                            value={timeRange}
                            onValueChange={(v) => v && setTimeRange(v)}
                            className="bg-zinc-900 p-1 rounded-lg border border-zinc-800"
                        >
                            <ToggleGroupItem value="90d" className="rounded-md px-3 py-1 text-xs text-zinc-400 data-[state=on]:bg-zinc-800 data-[state=on]:text-white transition-all">90 Days</ToggleGroupItem>
                            <ToggleGroupItem value="30d" className="rounded-md px-3 py-1 text-xs text-zinc-400 data-[state=on]:bg-zinc-800 data-[state=on]:text-white transition-all">30 Days</ToggleGroupItem>
                            <ToggleGroupItem value="7d" className="rounded-md px-3 py-1 text-xs text-zinc-400 data-[state=on]:bg-zinc-800 data-[state=on]:text-white transition-all">7 Days</ToggleGroupItem>
                        </ToggleGroup>
                        <div className="md:hidden w-40">
                            {/* Fixed Select: Added required SelectContent and SelectItems */}
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-400 font-bold">
                                    <SelectValue placeholder="Select Range" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    <SelectItem value="90d">90 Days</SelectItem>
                                    <SelectItem value="30d">30 Days</SelectItem>
                                    <SelectItem value="7d">7 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardAction>
                </CardHeader>
                <CardContent className="px-2 pt-8 sm:px-6">
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[350px] w-full"
                    >
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                                tickFormatter={(value) => {
                                    const date = new Date(value)
                                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Area
                                dataKey="mobile"
                                type="natural"
                                fill="url(#fillMobile)"
                                stroke="var(--color-mobile)"
                                strokeWidth={2}
                                stackId="a"
                            />
                            <Area
                                dataKey="desktop"
                                type="natural"
                                fill="url(#fillDesktop)"
                                stroke="var(--color-desktop)"
                                strokeWidth={2}
                                stackId="a"
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardOverview;
