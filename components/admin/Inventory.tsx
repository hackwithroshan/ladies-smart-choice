
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { Package, MoreHorizontal, EditPencil, ArrowUpDown, ChevronRight } from '../Icons';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../utils/utils';

const Inventory: React.FC<{ token: string | null }> = ({ token }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
    const [qty, setQty] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    const fetchInventory = async () => {
        setLoading(true);
        try {
            // Corrected: Removed redundant /api prefix
            const res = await fetch(getApiUrl('products/all'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setProducts(await res.json());
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchInventory(); }, [token]);

    const handleAdjustment = async () => {
        if (!selectedProduct || qty <= 0) return;
        setIsSaving(true);
        try {
            const id = selectedProduct.id || (selectedProduct as any)._id;
            // Corrected: Removed redundant /api prefix
            const res = await fetch(getApiUrl(`inventory/adjust/${id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ type: adjustType, quantity: qty, reason: 'Manual Adjustment' })
            });

            if (res.ok) {
                await fetchInventory();
                setSelectedProduct(null);
                setQty(0);
            }
        } catch (e) { alert("Sync failed"); }
        finally { setIsSaving(false); }
    };

    const columns: ColumnDef<Product>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: "Product Detail",
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <img className="h-12 w-12 rounded-2xl object-cover border border-zinc-200" src={row.original.imageUrl} />
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-zinc-900 truncate leading-none mb-1 uppercase tracking-tight italic">{row.original.name}</span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{row.original.category}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "sku",
            header: "Serial/SKU",
            cell: ({ getValue }) => <code className="text-[10px] font-mono font-black text-zinc-500 uppercase">{getValue() as string || 'PENDING'}</code>
        },
        {
            accessorKey: "stock",
            header: "Warehouse Status",
            cell: ({ row }) => {
                const stock = row.original.stock;
                const threshold = row.original.lowStockThreshold || 5;
                const isOut = stock <= 0;
                const isLow = stock < threshold;

                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <span className={cn("text-xs font-black italic", isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-zinc-700")}>
                                {stock} UNITS
                            </span>
                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2", 
                                isOut ? "bg-rose-50 text-rose-700 border-rose-100" : 
                                isLow ? "bg-amber-50 text-amber-700 border-amber-100" : 
                                "bg-emerald-50 text-emerald-700 border-emerald-100"
                            )}>
                                {isOut ? 'Depleted' : isLow ? 'Low' : 'Healthy'}
                            </Badge>
                        </div>
                        <div className="w-24 h-1 bg-zinc-100 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-1000", isOut ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500")} 
                                 style={{ width: `${Math.min(100, (stock / (threshold * 4)) * 100)}%` }} />
                        </div>
                    </div>
                )
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right pr-4">Logistics</div>,
            cell: ({ row }) => (
                <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu trigger={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button>}>
                        <DropdownMenuLabel>Stock Ops</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedProduct(row.original); setAdjustType('in'); }}>
                            <Package className="mr-2 h-3.5 w-3.5" /> Stock In (+)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedProduct(row.original); setAdjustType('out'); }}>
                            <ArrowUpDown className="mr-2 h-3.5 w-3.5" /> Stock Out (-)
                        </DropdownMenuItem>
                    </DropdownMenu>
                </div>
            )
        }
    ], []);

    const filtered = useMemo(() => {
        if (activeTab === "all") return products;
        if (activeTab === "low") return products.filter(p => p.stock < (p.lowStockThreshold || 5) && p.stock > 0);
        if (activeTab === "out") return products.filter(p => p.stock <= 0);
        return products;
    }, [products, activeTab]);

    if (loading) return <div className="p-20 text-center font-black uppercase text-zinc-300 italic tracking-[0.4em]">Auditing Warehouse...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Inventory Ledger</h1>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Global stock distribution and replenishment pipeline</p>
                </div>
                <div className="bg-zinc-50 px-6 py-2 rounded-2xl border flex flex-col items-end">
                    <span className="text-[9px] font-black text-zinc-400 uppercase">Registry Count</span>
                    <span className="text-sm font-black italic text-zinc-900">{products.length} Assets</span>
                </div>
            </div>

            <DataTable 
                columns={columns} 
                data={filtered} 
                searchKey="name" 
                searchPlaceholder="Search warehouse asset..." 
                onRowClick={setSelectedProduct}
                tabs={[
                    { value: "all", label: "All Items", count: products.length },
                    { value: "low", label: "Attention", count: products.filter(p => p.stock < (p.lowStockThreshold || 5) && p.stock > 0).length },
                    { value: "out", label: "Out of Stock", count: products.filter(p => p.stock <= 0).length }
                ]}
                onTabChange={setActiveTab}
            />

            <Drawer isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Inventory Adjustment">
                {selectedProduct && (
                    <div className="flex flex-col h-full">
                        <div className="p-6">
                            <DrawerHeader>
                                <div className="flex items-center gap-4 mb-8">
                                    <img src={selectedProduct.imageUrl} className="h-16 w-16 rounded-2xl object-cover border shadow-xl" />
                                    <div>
                                        <DrawerTitle>{selectedProduct.name}</DrawerTitle>
                                        <DrawerDescription>SKU: {selectedProduct.sku || 'N/A'}</DrawerDescription>
                                    </div>
                                </div>
                                <div className="bg-zinc-900 rounded-[2rem] p-8 text-white shadow-2xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Current Floor Stock</p>
                                        <Badge className="bg-white/10 text-white border-none text-base px-4 py-1 italic font-black">{selectedProduct.stock} UNITS</Badge>
                                    </div>
                                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                                        <button onClick={() => setAdjustType('in')} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all", adjustType === 'in' ? 'bg-[#16423C] text-white shadow-lg' : 'text-white/40')}>Inventory In</button>
                                        <button onClick={() => setAdjustType('out')} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all", adjustType === 'out' ? 'bg-rose-600 text-white shadow-lg' : 'text-white/40')}>Inventory Out</button>
                                    </div>
                                </div>
                            </DrawerHeader>
                        </div>
                        <DrawerContent>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Adjustment Units</label>
                                    <input 
                                        type="number" 
                                        value={qty || ''} 
                                        onChange={e => setQty(parseInt(e.target.value))}
                                        className="w-full h-14 rounded-2xl border-2 border-zinc-100 px-6 text-xl font-black italic outline-none focus:border-zinc-900 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-dashed flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full mt-1 animate-pulse" />
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed italic">
                                        Adjustment Reason: Manual store replenishment. This action updates the master catalog record immediately.
                                    </p>
                                </div>
                            </div>
                        </DrawerContent>
                        <DrawerFooter className="mt-auto">
                            <Button variant="ghost" className="flex-1 rounded-xl text-[10px] font-black uppercase" onClick={() => setSelectedProduct(null)}>Discard</Button>
                            <Button 
                                className={cn("flex-1 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl", adjustType === 'in' ? 'bg-[#16423C]' : 'bg-rose-600')} 
                                onClick={handleAdjustment}
                                disabled={isSaving || qty <= 0}
                            >
                                {isSaving ? "Syncing..." : `Confirm ${adjustType === 'in' ? 'Replenish' : 'Release'}`}
                            </Button>
                        </DrawerFooter>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default Inventory;
