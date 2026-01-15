
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import {
    Search, MoreHorizontal, Mail, Phone, Calendar,
    Shield, ArrowUpRight, Download, Filter, Eye, Trash2
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AdminUser extends User {
    totalSpent?: number;
    lastOrderDate?: string;
    status?: 'Active' | 'Inactive' | 'Blocked';
}

const Customers: React.FC<{ token: string | null }> = ({ token }) => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSegment, setFilterSegment] = useState("all");
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Custom Dropdown State
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteId || !token) return;
        setIsDeleting(true);
        try {
            const res = await fetch(getApiUrl(`/api/users/${deleteId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== deleteId));
                showToast("Customer deleted successfully", 'success');
            } else {
                showToast("Failed to delete customer", 'error');
            }
        } catch (error) {
            showToast("An error occurred", 'error');
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch(getApiUrl('/api/users'), { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                // Use real data from API
                const realData = data.map((u: any) => ({
                    ...u,
                    status: 'Active', // Default since not tracked in backend yet
                    phone: u.phone || 'N/A'
                }));
                setUsers(realData);
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [token]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            vip: users.filter(u => u.segment === 'VIP').length,
            active: users.filter(u => u.status === 'Active').length,
            totalRevenue: users.reduce((acc, curr) => acc + (curr.totalSpent || 0), 0)
        };
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterSegment === 'all' ||
                (filterSegment === 'vip' && u.segment === 'VIP') ||
                (filterSegment === 'active' && u.status === 'Active');
            return matchesSearch && matchesFilter;
        });
    }, [users, searchQuery, filterSegment]);

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
    const getRandomColor = (name: string) => {
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
        const index = name.length % colors.length;
        return colors[index];
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
                    <p className="text-sm text-zinc-500 font-medium">Loading Customers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full space-y-4 p-1 md:p-2 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Customers</h1>
                    <p className="text-zinc-500 mt-1">Manage your customer base and view insights.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Export CSV
                    </Button>
                    <Button className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2">
                        <Mail className="w-4 h-4" /> Email All
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
                        <div className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">VIP Members</CardTitle>
                        <div className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.vip}</div>
                        <p className="text-xs text-muted-foreground mt-1">High value customers</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <div className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime value</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
                        <div className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active}</div>
                        <p className="text-xs text-muted-foreground mt-1">Currently online</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl border shadow-sm outline-none overflow-visible">
                {/* Filters */}
                <div className="p-4 border-b bg-zinc-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search customers by name, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={filterSegment} onValueChange={setFilterSegment}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-zinc-500" />
                                    <SelectValue placeholder="Filter Segment" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Customers</SelectItem>
                                <SelectItem value="vip">VIP Only</SelectItem>
                                <SelectItem value="active">Active Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-visible min-h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/80 hover:bg-zinc-50/80">
                                <TableHead className="w-[250px]">Customer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Orders</TableHead>
                                <TableHead className="text-right">Total Spent</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="group hover:bg-zinc-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/app/customers/${user.id}`)}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${getRandomColor(user.name)}`}>
                                                    {getInitials(user.name)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">{user.name}</span>
                                                    <span className="text-[11px] text-zinc-500">Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs space-y-1">
                                                <div className="flex items-center gap-1.5 text-zinc-700">
                                                    <Mail className="h-3 w-3 text-zinc-400" />
                                                    {user.email}
                                                </div>
                                                {/* Mock Phone if needed */}
                                                <div className="flex items-center gap-1.5 text-zinc-500">
                                                    <Phone className="h-3 w-3 text-zinc-400" />
                                                    {user.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {user.segment === 'VIP' && (
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100 border-0 text-[10px] font-bold px-2">VIP</Badge>
                                                )}
                                                <Badge variant="outline" className={`text-[10px] font-medium border-0 px-2 ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                    {user.status || 'Active'}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {user.totalOrders || 0}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-zinc-900">
                                            ₹{(user.totalSpent || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="relative">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === user.id ? null : user.id);
                                                    }}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>

                                                {/* Custom 3-Dot Dropdown Menu */}
                                                {openMenuId === user.id && (
                                                    <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-zinc-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                                                        <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2" onClick={() => { navigate(`/app/customers/${user.id}`); setOpenMenuId(null); }}>
                                                            <Eye className="w-4 h-4 text-zinc-400" /> View Details
                                                        </button>
                                                        <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                                                            <Mail className="w-4 h-4 text-zinc-400" /> Send Email
                                                        </button>
                                                        <div className="h-px bg-zinc-100 my-1"></div>
                                                        <button
                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(null);
                                                                setDeleteId(user.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" /> Delete Customer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-zinc-500">
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-4 border-t bg-zinc-50 text-xs text-zinc-500 flex justify-end">
                    Showing {filteredUsers.length} results
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the customer account and remove all their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Customer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
};

export default Customers;
