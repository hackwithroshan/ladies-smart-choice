
import React, { useState, useEffect, useMemo } from 'react';
import { Discount, Product } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { BadgePercent, Trash2, MoreHorizontal, EditPencil, Calendar, Package } from '../Icons';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../utils/utils';

const Discounts: React.FC<{ token: string | null }> = ({ token }) => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDiscount, setSelectedDiscount] = useState<Partial<Discount> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    const fetchData = async () => {
        setLoading(true);
        try {
            // Corrected: Removed redundant /api prefix
            const [discRes, prodRes, catRes] = await Promise.all([
                fetch(getApiUrl('discounts'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('products/all'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('products/categories'))
            ]);
            if (discRes.ok) setDiscounts(await discRes.json());
            if (prodRes.ok) setProducts(await prodRes.json());
            if (catRes.ok) setCategories(await catRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const handleSave = async () => {
        if (!selectedDiscount?.code || !selectedDiscount?.value) return alert("Required fields missing");
        setIsSaving(true);
        const isEditing = !!(selectedDiscount.id || (selectedDiscount as any)._id);
        const id = selectedDiscount.id || (selectedDiscount as any)._id;
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? getApiUrl(`discounts/${id}`) : getApiUrl('discounts');

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(selectedDiscount)
            });
            if (res.ok) {
                await fetchData();
                setSelectedDiscount(null);
            }
        } catch (e) { alert("Save failed"); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Purge this coupon?")) return;
        try {
            const res = await fetch(getApiUrl(`discounts/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (e) { alert("Delete failed"); }
    };

    const columns: ColumnDef<Discount>[] = useMemo(() => [
        {
            accessorKey: "code",
            header: "Campaign Engine",
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black italic shadow-lg shrink-0">%</div>
                    <div className="flex flex-col">
                        <span className="font-black text-zinc-900 uppercase tracking-widest leading-none mb-1">{row.original.code}</span>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 h-4 bg-zinc-50">{row.original.scope || 'Cart'}</Badge>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{row.original.type}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "value",
            header: "Benefit",
            cell: ({ row }) => (
                <div className="font-black text-zinc-900 italic">
                    {row.original.type === 'Percentage' ? `${row.original.value}% OFF` : `₹${row.original.value} OFF`}
                </div>
            )
        },
        {
            accessorKey: "usageCount",
            header: "Velocity",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 w-24">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-400">
                        <span>{row.original.usageCount} Sold</span>
                        <span>{Math.round((row.original.usageCount / (row.original.maxUsage || 1)) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#16423C]" style={{ width: `${Math.min(100, (row.original.usageCount / (row.original.maxUsage || 1)) * 100)}%` }} />
                    </div>
                </div>
            )
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const now = new Date();
                const expired = row.original.endDate && new Date(row.original.endDate) < now;
                return (
                    <Badge className={cn("text-[9px] font-black uppercase px-2 shadow-sm", 
                        !row.original.isActive ? "bg-zinc-100 text-zinc-400" :
                        expired ? "bg-rose-50 text-rose-700 border-rose-100" : 
                        "bg-emerald-50 text-emerald-700 border-emerald-100"
                    )}>
                        {!row.original.isActive ? 'Disabled' : expired ? 'Expired' : 'Active'}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right pr-4">Control</div>,
            cell: ({ row }) => (
                <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu trigger={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button>}>
                        <DropdownMenuLabel>Campaign Ops</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedDiscount(row.original)}><EditPencil className="mr-2 h-3.5" /> Modify Logic</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(row.original.id || (row.original as any)._id)} variant="destructive"><Trash2 className="mr-2 h-3.5" /> Purge Coupon</DropdownMenuItem>
                    </DropdownMenu>
                </div>
            )
        }
    ], []);

    const filtered = useMemo(() => {
        if (activeTab === "all") return discounts;
        if (activeTab === "active") return discounts.filter(d => d.isActive && (!d.endDate || new Date(d.endDate) > new Date()));
        return discounts.filter(d => !d.isActive || (d.endDate && new Date(d.endDate) < new Date()));
    }, [discounts, activeTab]);

    if (loading) return <div className="p-20 text-center font-black uppercase text-zinc-300 italic tracking-[0.4em]">Auditing Promotions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Campaign Manager</h1>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Configure automated discounts, flash sale codes and targeting rules</p>
                </div>
                <Button onClick={() => setSelectedDiscount({ isActive: true, type: 'Percentage', scope: 'Cart', minOrderValue: 0, maxUsage: 100, usageLimitPerUser: 1 })} className="bg-[#16423C] text-white font-black uppercase tracking-widest text-[10px] rounded-xl px-8 shadow-xl">
                    + Inject Campaign
                </Button>
            </div>

            <DataTable 
                columns={columns} 
                data={filtered} 
                searchKey="code" 
                searchPlaceholder="Lookup coupon logic..." 
                onRowClick={setSelectedDiscount}
                tabs={[
                    { value: "all", label: "Master Registry", count: discounts.length },
                    { value: "active", label: "Live Hub", count: discounts.filter(d => d.isActive && (!d.endDate || new Date(d.endDate) > new Date())).length },
                    { value: "inactive", label: "Archived", count: discounts.filter(d => !d.isActive || (d.endDate && new Date(d.endDate) < new Date())).length }
                ]}
                onTabChange={setActiveTab}
            />

            <Drawer isOpen={!!selectedDiscount} onClose={() => setSelectedDiscount(null)} title="Modify Campaign Logic">
                {selectedDiscount && (
                    <div className="flex flex-col h-full">
                        <div className="p-6 space-y-8">
                            <DrawerHeader>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Campaign Identifier (Code)</label>
                                        <Input 
                                            value={selectedDiscount.code || ''} 
                                            onChange={e => setSelectedDiscount({...selectedDiscount, code: e.target.value.toUpperCase()})}
                                            className="font-black text-lg h-14 rounded-xl border-zinc-200 italic"
                                            placeholder="e.g. WELCOME10"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Benefit Type</label>
                                            <select 
                                                value={selectedDiscount.type} 
                                                onChange={e => setSelectedDiscount({...selectedDiscount, type: e.target.value as any})}
                                                className="w-full bg-white border border-zinc-200 rounded-xl h-11 text-xs font-bold px-3 outline-none"
                                            >
                                                <option value="Percentage">Percentage (%)</option>
                                                <option value="Flat">Flat Amount (₹)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Benefit Value</label>
                                            <Input 
                                                type="number" 
                                                value={selectedDiscount.value || 0} 
                                                onChange={e => setSelectedDiscount({...selectedDiscount, value: Number(e.target.value)})}
                                                className="h-11 rounded-xl border-zinc-200 font-black italic"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="space-y-6">
                                <div className="bg-zinc-900 rounded-[2rem] p-8 text-white shadow-2xl space-y-8">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic border-b border-white/10 pb-4">Targeting Engine</h4>
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase opacity-30">Target Scope</label>
                                            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                                                {['Cart', 'Category', 'Product'].map(s => (
                                                    <button 
                                                        key={s} 
                                                        onClick={() => setSelectedDiscount({...selectedDiscount, scope: s as any, scopeIds: []})}
                                                        className={cn("flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all", selectedDiscount.scope === s ? "bg-white text-zinc-900 shadow-lg" : "text-white/40")}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedDiscount.scope !== 'Cart' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <label className="text-[9px] font-bold uppercase opacity-30">Selection ({selectedDiscount.scopeIds?.length || 0})</label>
                                                <div className="max-h-32 overflow-y-auto pr-2 admin-scroll space-y-2">
                                                    {(selectedDiscount.scope === 'Category' ? categories : products).map((item: any) => {
                                                        const id = item.id || item._id;
                                                        const isSelected = selectedDiscount.scopeIds?.includes(id);
                                                        return (
                                                            <div key={id} onClick={() => {
                                                                const ids = [...(selectedDiscount.scopeIds || [])];
                                                                isSelected ? ids.splice(ids.indexOf(id), 1) : ids.push(id);
                                                                setSelectedDiscount({...selectedDiscount, scopeIds: ids});
                                                            }} className={cn("p-2 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer", isSelected ? "bg-[#16423C] border-[#16423C]" : "bg-white/5 border-white/10 text-white/40")}>
                                                                {item.name || item.title}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-50 p-4 rounded-2xl border">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase block mb-1">Start Activation</label>
                                        <Input 
                                            type="datetime-local" 
                                            // Corrected: Cast to string for Input value
                                            value={selectedDiscount.startDate ? new Date(selectedDiscount.startDate).toISOString().slice(0, 16) : ''}
                                            // Corrected: Cast to string for property assignment
                                            onChange={e => setSelectedDiscount({...selectedDiscount, startDate: new Date(e.target.value).toISOString()})}
                                            className="h-8 text-[10px] font-bold uppercase border-none bg-transparent p-0"
                                        />
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-2xl border">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase block mb-1">End Sunset</label>
                                        <Input 
                                            type="datetime-local" 
                                            // Corrected: Cast to string for Input value
                                            value={selectedDiscount.endDate ? new Date(selectedDiscount.endDate).toISOString().slice(0, 16) : ''}
                                            // Corrected: Cast to string for property assignment
                                            onChange={e => setSelectedDiscount({...selectedDiscount, endDate: new Date(e.target.value).toISOString()})}
                                            className="h-8 text-[10px] font-bold uppercase border-none bg-transparent p-0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DrawerFooter className="mt-auto">
                            <Button variant="ghost" className="flex-1 rounded-xl text-[10px] font-black uppercase" onClick={() => setSelectedDiscount(null)}>Discard</Button>
                            <Button className="flex-1 bg-[#16423C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Syncing..." : "Publish Logic"}
                            </Button>
                        </DrawerFooter>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default Discounts;
