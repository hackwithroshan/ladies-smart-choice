
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import {
    AlertTriangle, PackageOpen, TrendingUp, DollarSign,
    Download, Plus, Minus, MoreHorizontal
} from 'lucide-react';
import { DataTable, ColumnDef } from '../ui/data-table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const Inventory: React.FC<{ token: string | null }> = ({ token }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch(getApiUrl('/api/products/all'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [token]);

    const handleStockUpdate = async (productId: string, newStock: number) => {
        // Optimistic update
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));

        try {
            await fetch(getApiUrl(`/api/products/${productId}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ stock: newStock })
            });
        } catch (error) {
            console.error("Failed to update stock", error);
            fetchProducts(); // Revert on failure
        }
    };

    const stats = useMemo(() => {
        let totalStock = 0;
        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        products.forEach(p => {
            totalStock += p.stock || 0;
            totalValue += (p.stock || 0) * (p.price || 0);
            if ((p.stock || 0) === 0) outOfStockCount++;
            else if ((p.stock || 0) <= (p.lowStockThreshold || 5)) lowStockCount++;
        });

        return { totalStock, totalValue, lowStockCount, outOfStockCount };
    }, [products]);

    // Enhance products with search string
    const tableData = useMemo(() => {
        let filtered = products;
        if (filterStatus === 'low') {
            filtered = products.filter(p => (p.stock || 0) <= (p.lowStockThreshold || 5) && (p.stock || 0) > 0);
        } else if (filterStatus === 'out') {
            filtered = products.filter(p => (p.stock || 0) === 0);
        }

        return filtered.map(p => ({
            ...p,
            searchable: `${p.name} ${p.sku || ''} ${p.brand || ''} ${p.category}`
        }));
    }, [products, filterStatus]);

    const columns: ColumnDef<Product & { searchable: string }>[] = [
        {
            accessorKey: "image",
            header: "Product",
            cell: ({ row }) => (
                <div className="flex items-center gap-4 py-1">
                    <div className="h-12 w-12 rounded-lg border border-zinc-200 bg-white p-0.5 overflow-hidden shrink-0 shadow-sm">
                        <img
                            src={row.original.imageUrl || '/placeholder.png'}
                            alt={row.original.name}
                            className="h-full w-full object-cover rounded-md"
                        />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-zinc-900 line-clamp-1">{row.original.name}</span>
                        <span className="text-[11px] text-zinc-500 font-medium">{row.original.brand || 'No Brand'}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "sku",
            header: "SKU / Category",
            cell: ({ row }) => (
                <div className="flex flex-col items-start gap-1.5">
                    <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-[10px] text-zinc-600 bg-zinc-50 border-zinc-200">
                            {row.original.sku || 'N/A'}
                        </Badge>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-medium px-1">
                        {row.original.category}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "stock",
            header: "Stock Level",
            cell: ({ row }) => {
                const stock = row.original.stock || 0;
                const isLow = stock <= (row.original.lowStockThreshold || 5);
                const isOut = stock === 0;

                return (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white border border-zinc-200 rounded-lg shadow-sm h-8">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-full w-8 rounded-l-lg hover:bg-zinc-100 hover:text-zinc-900 border-r border-zinc-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStockUpdate(row.original.id, Math.max(0, stock - 1));
                                }}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            <div className="w-12 text-center text-xs font-bold tabular-nums">
                                {stock}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-full w-8 rounded-r-lg hover:bg-zinc-100 hover:text-zinc-900 border-l border-zinc-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStockUpdate(row.original.id, stock + 1);
                                }}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                        {isOut ? (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Out</Badge>
                        ) : isLow && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-amber-200 text-amber-700 bg-amber-50">Low</Badge>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: "price",
            header: "Price & Value",
            cell: ({ row }) => (
                <div className="flex flex-col items-end gap-0.5">
                    <span className="text-sm font-bold text-zinc-900">₹{row.original.price.toLocaleString()}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                        Total: ₹{((row.original.stock || 0) * (row.original.price || 0)).toLocaleString()}
                    </span>
                </div>
            )
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-zinc-100 hover:text-zinc-900 h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
                                    Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="opacity-50 cursor-not-allowed">Edit Product</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 opacity-50 cursor-not-allowed">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            }
        }
    ];

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[600px] animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-zinc-100 border-t-zinc-900 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <PackageOpen className="h-4 w-4 text-zinc-900" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium animate-pulse">Loading Inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full max-w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-100 pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900">Inventory Management</h1>
                    <p className="text-zinc-500 font-medium text-sm max-w-lg">
                        Manage your product stock, track inventory value, and monitor low stock alerts in real-time.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-all font-semibold">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                    <Button className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 font-semibold transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-4 h-4" /> Add Product
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-zinc-200/60 shadow-sm bg-gradient-to-br from-white to-zinc-50/50 hover:shadow-md transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Value</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-zinc-900">₹{stats.totalValue.toLocaleString()}</div>
                        <p className="text-[11px] font-medium text-zinc-400 mt-1 flex items-center gap-1">
                            Current inventory valuation
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200/60 shadow-sm bg-gradient-to-br from-white to-zinc-50/50 hover:shadow-md transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Products</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <PackageOpen className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-zinc-900">{stats.totalStock.toLocaleString()}</div>
                        <p className="text-[11px] font-medium text-zinc-400 mt-1 flex items-center gap-1">
                            Across {products.length} unique items
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200/60 shadow-sm bg-gradient-to-br from-white to-zinc-50/50 hover:shadow-md transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Low Stock</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-amber-600">{stats.lowStockCount}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100/50 text-amber-700">Action Needed</span>
                            <p className="text-[11px] font-medium text-zinc-400">Restock soon</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200/60 shadow-sm bg-gradient-to-br from-white to-zinc-50/50 hover:shadow-md transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Out of Stock</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-600">{stats.outOfStockCount}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100/50 text-red-700">Urgent</span>
                            <p className="text-[11px] font-medium text-zinc-400">Sales lost</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Data Table */}
            <DataTable
                key={filterStatus}
                columns={columns}
                data={tableData}
                searchKey="searchable"
                searchPlaceholder="Search products, SKU, or brand..."
                tabs={[
                    { value: "all", label: "All Items", count: products.length },
                    { value: "low", label: "Low Stock", count: stats.lowStockCount },
                    { value: "out", label: "Out of Stock", count: stats.outOfStockCount }
                ]}
                onTabChange={setFilterStatus}
            />
        </div>
    );
};

export default Inventory;
