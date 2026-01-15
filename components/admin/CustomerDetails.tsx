
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { ArrowLeft, Mail, Phone, Calendar, Shield, Eye, Download, ShoppingBag, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

// Helper functions reuse
const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
const getRandomColor = (name: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    const index = name.length % colors.length;
    return colors[index];
};

interface AdminUser extends User {
    totalSpent?: number;
    totalOrders?: number;
    lastOrderDate?: string;
    status?: 'Active' | 'Inactive' | 'Blocked';
    segment?: string;
}

const CustomerDetails: React.FC<{ token: string | null; customerId: string | null }> = ({ token, customerId }) => {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (!customerId) return;
            try {
                setLoading(true);
                // Since we don't have a direct "get single user" visible in the previous file (it fetched all), 
                // we'll try to fetch all and find, or check if specific endpoint exists. 
                // To be safe and consistent with the previous logic which mocked data:
                const res = await fetch(getApiUrl('/api/users'), { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    const foundUser = data.find((u: any) => u.id === customerId);

                    if (foundUser) {
                        // Replicating the mock enhancement from Customers.tsx
                        const enhancedUser = {
                            ...foundUser,
                            totalSpent: foundUser.totalSpent || Math.floor(Math.random() * 10000),
                            totalOrders: foundUser.totalOrders || Math.floor(Math.random() * 20),
                            status: 'Active',
                            segment: (foundUser.totalSpent || 0) > 5000 ? 'VIP' : 'Regular'
                        };
                        setUser(enhancedUser);
                    }
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchUser();
    }, [token, customerId]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
                    <p className="text-sm text-zinc-500 font-medium">Loading Profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-zinc-500">Customer not found.</p>
                <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            {/* Nav */}
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-zinc-600" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4" /> Back to Customers
            </Button>

            {/* Header Profile Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className={`h-32 w-32 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl shrink-0 ${getRandomColor(user.name)}`}>
                    {getInitials(user.name)}
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-zinc-900">{user.name}</h1>
                            {user.segment === 'VIP' && <Badge className="bg-amber-100 text-amber-700 border-0">VIP</Badge>}
                            <Badge variant="outline" className={user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}>{user.status}</Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 mt-2 text-sm text-zinc-500">
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4" /> {user.email}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" /> Joined {new Date(user.joinDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4" /> {user.role}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button className="bg-zinc-900 text-white gap-2">
                            <Mail className="w-4 h-4" /> Send Email
                        </Button>
                        <Button variant="outline" className="gap-2">
                            Edit Profile
                        </Button>
                        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            Block User
                        </Button>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Spent</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(user.totalSpent || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.totalOrders || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Last Active</CardTitle>
                        <Clock className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Just now</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs / Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Contact Info & Tags */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-zinc-900">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase">Email</label>
                                <p className="text-sm">{user.email}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase">Phone</label>
                                <p className="text-sm">+91 98765 43210</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase">Address</label>
                                <p className="text-sm text-zinc-600">No address saved.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-zinc-900">Tags & Segments</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 border-0">Customer</Badge>
                            {user.segment === 'VIP' && <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0">VIP</Badge>}
                            <Badge variant="outline" className="border-dashed">Add Tag +</Badge>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Activity & Orders */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-zinc-900">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-zinc-200">
                                <div className="relative pl-10">
                                    <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-blue-100 border-2 border-white ring-1 ring-blue-500" />
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium text-zinc-900">Viewed "Cotton Summer Dress"</p>
                                        <p className="text-xs text-zinc-500">2 minutes ago</p>
                                    </div>
                                </div>
                                <div className="relative pl-10">
                                    <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-emerald-100 border-2 border-white ring-1 ring-emerald-500" />
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium text-zinc-900">Placed Order #{Math.floor(Math.random() * 10000) + 1000}</p>
                                        <p className="text-xs text-zinc-500">5 days ago</p>
                                    </div>
                                </div>
                                <div className="relative pl-10">
                                    <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-zinc-100 border-2 border-white ring-1 ring-zinc-500" />
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium text-zinc-900">Registered Account</p>
                                        <p className="text-xs text-zinc-500">{new Date(user.joinDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetails;
