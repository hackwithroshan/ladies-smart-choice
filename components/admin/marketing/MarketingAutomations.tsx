import React, { useState, useEffect } from 'react';
import {
    Activity, Users, ShoppingCart, TrendingUp, DollarSign,
    MoreHorizontal, Mail, Play, Pause, RefreshCw, Eye
} from 'lucide-react';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import EmailTemplateModal from './EmailTemplateModal';
import { cn } from '../../../utils/utils';

interface MarketingAutomationsProps {
    token: string | null;
}

interface Automation {
    _id: string;
    name: string;
    triggerType: string;
    isActive: boolean;
    stats: {
        reach: number;
        sessions: number;
        orders: number;
        conversionRate: number;
        sales: number;
    };
}

const MarketingAutomations: React.FC<MarketingAutomationsProps> = ({ token }) => {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

    useEffect(() => {
        fetchAutomations();
    }, []);

    const fetchAutomations = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/automations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAutomations(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAutomation = async (id: string, currentStatus: boolean) => {
        // Optimistic UI Update
        setAutomations(prev => prev.map(a => a._id === id ? { ...a, isActive: !a.isActive } : a));

        try {
            await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/automations/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Failed to toggle", err);
            // Revert on error
            setAutomations(prev => prev.map(a => a._id === id ? { ...a, isActive: currentStatus } : a));
        }
    };

    // Calculate Summary Metrics
    const totalReach = automations.reduce((acc, curr) => acc + curr.stats.reach, 0);
    const totalSessions = automations.reduce((acc, curr) => acc + curr.stats.sessions, 0);
    const totalOrders = automations.reduce((acc, curr) => acc + curr.stats.orders, 0);
    const totalSales = automations.reduce((acc, curr) => acc + curr.stats.sales, 0);
    const avgConversion = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;

    const MetricCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur hover:bg-white transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl shadow-inner", color)}>
                    <Icon className="size-6 text-white" />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
                    {subtext && <p className="text-xs text-emerald-600 font-bold mt-1">{subtext}</p>}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Marketing Automations</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Manage your automated email campaigns and track their performance.</p>
                </div>
                <Button
                    variant="outline"
                    className="border-emerald-200 hover:border-emerald-500 text-emerald-700 hover:bg-emerald-50 gap-2 font-bold shadow-sm"
                    onClick={() => setIsTemplatesOpen(true)}
                >
                    <Eye className="size-4" />
                    View Templates
                </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in-up delay-100">
                <MetricCard title="Reach" value={totalReach.toLocaleString()} icon={Users} color="bg-blue-500" />
                <MetricCard title="Sessions" value={totalSessions.toLocaleString()} icon={Activity} color="bg-indigo-500" />
                <MetricCard title="Orders" value={totalOrders.toLocaleString()} icon={ShoppingCart} color="bg-violet-500" />
                <MetricCard title="Conversion" value={`${avgConversion.toFixed(2)}%`} icon={TrendingUp} color="bg-emerald-500" subtext="Global Rate" />
                <MetricCard title="Sales" value={`₹${totalSales.toLocaleString()}`} icon={DollarSign} color="bg-amber-500" />
            </div>

            {/* Automations Table */}
            <Card className="border-none shadow-sm overflow-hidden animate-fade-in-up delay-200">
                <CardHeader className="bg-white border-b px-6 py-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Mail className="size-5 text-emerald-600" />
                        Active Automations
                    </CardTitle>
                </CardHeader>
                <div className="bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                <TableHead className="w-[300px] font-bold text-gray-700">Automation</TableHead>
                                <TableHead className="font-bold text-gray-700">Status</TableHead>
                                <TableHead className="text-right font-bold text-gray-700">Reach</TableHead>
                                <TableHead className="text-right font-bold text-gray-700">Sessions</TableHead>
                                <TableHead className="text-right font-bold text-gray-700">Orders</TableHead>
                                <TableHead className="text-right font-bold text-gray-700">Conv. Rate</TableHead>
                                <TableHead className="text-right font-bold text-gray-700">Sales</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                            <RefreshCw className="animate-spin size-4" /> Loading automations...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                automations.map((automation) => (
                                    <TableRow key={automation._id} className="group hover:bg-emerald-50/10 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">{automation.name}</span>
                                                <span className="text-xs text-muted-foreground capitalize">{automation.triggerType.toLowerCase().replace(/_/g, ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={automation.isActive}
                                                    onCheckedChange={() => toggleAutomation(automation._id, automation.isActive)}
                                                    className="data-[state=checked]:bg-emerald-500"
                                                />
                                                <span className={`text-xs font-bold ${automation.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {automation.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs">{automation.stats.reach.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{automation.stats.sessions.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{automation.stats.orders.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono text-xs text-emerald-600">{automation.stats.conversionRate}%</TableCell>
                                        <TableCell className="text-right font-mono text-xs font-bold text-gray-900">₹{automation.stats.sales.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <EmailTemplateModal
                isOpen={isTemplatesOpen}
                onClose={() => setIsTemplatesOpen(false)}
                token={token}
            />
        </div>
    );
};

export default MarketingAutomations;
