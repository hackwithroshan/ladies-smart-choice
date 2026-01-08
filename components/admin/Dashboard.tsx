
import React, { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { TrendingUp, TrendingDown } from '../Icons';
import { getApiUrl } from '../../utils/apiHelper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart';

const chartConfig = {
  visitors: { label: "Visitors" },
  desktop: { label: "Desktop", color: "#16423C" },
  mobile: { label: "Mobile", color: "#6A9C89" },
} satisfies ChartConfig;

interface DashboardStats {
    kpis: {
        sales: number;
        visitors: number;
        orders: number;
        conversionRate: number;
    };
    timeSeries: any[];
}

const DashboardOverview: React.FC<{ token: string | null }> = ({ token }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Corrected: getApiUrl('analytics/summary') returns /api/analytics/summary
                const res = await fetch(getApiUrl('analytics/summary'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchDashboardData();
    }, [token]);

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
                <h1 className="text-xl font-black italic uppercase tracking-tighter sm:text-2xl text-zinc-900">
                    Command Center
                </h1>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
                    Real-time store vitals and lifecycle metrics.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-zinc-100 rounded-3xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Gross Revenue</span>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-black uppercase">Live</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black italic tracking-tighter text-zinc-900">
                            ₹{stats?.kpis.sales.toLocaleString("en-IN") || 0}
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">30 Day Cycle</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-100 rounded-3xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Manifests</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-black uppercase">Sync</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black italic tracking-tighter text-zinc-900">
                            {stats?.kpis.orders || 0}
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Successful Shipments</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-100 rounded-3xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Store Traffic</span>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100 text-[9px] font-black uppercase">Nodes</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black italic tracking-tighter text-zinc-900">
                            {stats?.kpis.visitors || 0}
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Unique Impressions</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-100 rounded-3xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">CVR Rate</span>
                        <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 text-[9px] font-black uppercase">Logic</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black italic tracking-tighter text-zinc-900">
                            {stats?.kpis.conversionRate || 0}%
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Visitor to Lead Ratio</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-xl rounded-[2.5rem] overflow-hidden border border-zinc-100 bg-white">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-10 border-b border-zinc-50 bg-zinc-50/30">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter">
                            Market Penetration
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                            Historical Revenue Matrix
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-10">
                    <ChartContainer
                      config={chartConfig}
                      className="aspect-auto h-[350px] w-full"
                    >
                      <AreaChart data={stats?.timeSeries || []}>
                        <defs>
                          <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16423C" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#16423C" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#f1f1f1" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="_id"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: '800'}}
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
                          dataKey="sales"
                          type="natural"
                          fill="url(#fillDesktop)"
                          stroke="#16423C"
                          strokeWidth={4}
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
