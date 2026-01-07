import React, { useState, useEffect, useMemo } from 'react';
import { Discount } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { BadgePercent, Trash2, MoreHorizontal, EditPencil, Calendar } from '../Icons';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../utils/utils';

const Discounts: React.FC<{ token: string | null }> = ({ token }) => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDiscount, setSelectedDiscount] = useState<Partial<Discount> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/discounts'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setDiscounts(await res.json());
        } catch (error) {
            console.error("Error fetching discounts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDiscounts(); }, [token]);

    const handleSave = async () => {
        if (!selectedDiscount?.code || !selectedDiscount?.expiry) return alert("Code and Expiry are required");
        setIsSaving(true);
        
        const isEditing = !!(selectedDiscount.id || (selectedDiscount as any)._id);
        const id = selectedDiscount.id || (selectedDiscount as any)._id;
        
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? getApiUrl(`/api/discounts/${id}`) : getApiUrl('/api/discounts');

        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(selectedDiscount)
            });

            if (res.ok) {
                await fetchDiscounts();
                setSelectedDiscount(null);
            } else {
                const err = await res.json();
                alert(err.message || "Failed to save discount");
            }
        } catch (e) {
            alert("Network error while saving");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Permanent delete? Customers will no longer be able to use this code.")) return;
        try {
            const res = await fetch(getApiUrl(`/api/discounts/${id}`), { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) fetchDiscounts();
        } catch (e) {
            alert("Delete operation failed");
        }
    };

    const columns: ColumnDef<Discount>[] = useMemo(() => [
        {
            accessorKey: "code",
            header: "Coupon Engine",
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black italic shadow-sm shrink-0">
                        %
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-zinc-900 truncate leading-none mb-1 uppercase tracking-widest">{row.original.code}</span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{row.original.type}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "value",
            header: "Benefit",
            cell: ({ row }) => {
                const type = row.original.type;
                const val = row.original.value;
                return (
                    <div className="font-black text-zinc-900 italic">
                        {type === 'Percentage' ? `${val}% OFF` : type === 'Flat' ? `₹${val.toLocaleString()} OFF` : 'Free Shipping'}
                    </div>
                )
            }
        },
        {
            accessorKey: "usageCount",
            header: "Utilization",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-black text-zinc-700 italic">{row.original.usageCount} / {row.original.maxUsage}</span>
                    <div className="w-24 h-1 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                        <div 
                            className="h-full bg-[#16423C]" 
                            style={{ width: `${Math.min(100, (row.original.usageCount / row.original.maxUsage) * 100)}%` }} 
                        />
                    </div>
                </div>
            )
        },
        {
            accessorKey: "expiry",
            header: "Expiry",
            cell: ({ getValue }) => {
                const date = new Date(getValue() as string);
                const isExpired = date < new Date();
                return (
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2", isExpired ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-zinc-50 text-zinc-500 border-zinc-200")}>
                        {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right pr-4">Control</div>,
            cell: ({ row }) => {
                const id = row.original.id || (row.original as any)._id;
                return (
                    <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu trigger={
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        }>
                            <React.Fragment>
                                <DropdownMenuLabel>Discount Ops</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSelectedDiscount(row.original)}>
                                    <EditPencil className="mr-2 h-3.5 w-3.5" /> Modify Logic
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(id)} variant="destructive">
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Coupon
                                </DropdownMenuItem>
                            </React.Fragment>
                        </DropdownMenu>
                    </div>
                );
            }
        }
    ], []);

    const filteredDiscounts = useMemo(() => {
        if (activeTab === "all") return discounts;
        const now = new Date();
        if (activeTab === "active") return discounts.filter(d => new Date(d.expiry) > now && d.usageCount < d.maxUsage);
        if (activeTab === "expired") return discounts.filter(d => new Date(d.expiry) <= now || d.usageCount >= d.maxUsage);
        return discounts;
    }, [discounts, activeTab]);

    if (loading) return <div className="p-20 text-center font-black italic text-zinc-400 animate-pulse tracking-widest uppercase">Calculating Promotions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Promotions Engine</h1>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Manage global coupon codes, flash sales and shipping waivers</p>
                </div>
                <Button onClick={() => setSelectedDiscount({ code: '', type: 'Percentage', value: 0, maxUsage: 100, expiry: '' })} className="bg-[#16423C] text-white font-black uppercase tracking-widest text-[10px] rounded-xl px-8 shadow-xl hover:brightness-110 active:scale-95 transition-all">
                    + Inject Promotion
                </Button>
            </div>

            <DataTable 
                columns={columns} 
                data={filteredDiscounts} 
                searchKey="code" 
                searchPlaceholder="Lookup promo code..." 
                onRowClick={setSelectedDiscount}
                tabs={[
                    { value: "all", label: "Registry", count: discounts.length },
                    { value: "active", label: "Live Hub", count: discounts.filter(d => new Date(d.expiry) > new Date() && d.usageCount < d.maxUsage).length },
                    { value: "expired", label: "Archived", count: discounts.filter(d => new Date(d.expiry) <= new Date() || d.usageCount >= d.maxUsage).length }
                ]}
                onTabChange={setActiveTab}
            />

            <Drawer isOpen={!!selectedDiscount} onClose={() => setSelectedDiscount(null)} title={selectedDiscount?.id || (selectedDiscount as any)?._id ? "Update Logic" : "Promotion Injection"}>
                {selectedDiscount && (
                    <div className="flex flex-col h-full">
                        <div className="p-6">
                            <DrawerHeader>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Coupon Identifier</label>
                                        <Input 
                                            value={selectedDiscount.code || ''} 
                                            onChange={e => setSelectedDiscount({...selectedDiscount, code: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                                            className="font-black text-lg h-14 rounded-xl border-zinc-200 focus-visible:ring-zinc-950 uppercase italic"
                                            placeholder="e.g. WELCOME50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Strategy</label>
                                            <select 
                                                value={selectedDiscount.type || 'Percentage'} 
                                                onChange={e => setSelectedDiscount({...selectedDiscount, type: e.target.value as any})}
                                                className="w-full bg-white border border-zinc-200 rounded-xl h-11 text-xs font-bold px-3 outline-none focus:border-zinc-900 transition-all shadow-sm"
                                            >
                                                <option value="Percentage">Percentage (%)</option>
                                                <option value="Flat">Fixed Amount (₹)</option>
                                                <option value="Free Shipping">Free Shipping</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Value</label>
                                            <Input 
                                                type="number"
                                                disabled={selectedDiscount.type === 'Free Shipping'}
                                                value={selectedDiscount.value || 0} 
                                                onChange={e => setSelectedDiscount({...selectedDiscount, value: Number(e.target.value)})}
                                                className="h-11 rounded-xl border-zinc-200 font-black italic"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </DrawerHeader>
                        </div>

                        <DrawerContent>
                            <div className="space-y-8">
                                <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100 space-y-6">
                                    <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> Constraints & Lifecycle
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Utilization Limit (Max Uses)</label>
                                            <Input 
                                                type="number"
                                                value={selectedDiscount.maxUsage || 100} 
                                                onChange={e => setSelectedDiscount({...selectedDiscount, maxUsage: Number(e.target.value)})}
                                                className="rounded-xl border-zinc-200 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Sunset Date (Expiry)</label>
                                            <Input 
                                                type="date"
                                                value={selectedDiscount.expiry ? new Date(selectedDiscount.expiry).toISOString().split('T')[0] : ''} 
                                                onChange={e => setSelectedDiscount({...selectedDiscount, expiry: e.target.value})}
                                                className="rounded-xl border-zinc-200 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 animate-pulse" />
                                    <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase tracking-tight italic">
                                        Logic Tip: Codes are applied during checkout. If "Magic Checkout" is active, ensures codes are synced to Razorpay dashboard for real-time validation.
                                    </p>
                                </div>
                            </div>
                        </DrawerContent>

                        <DrawerFooter>
                            <Button variant="ghost" className="flex-1 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-900" onClick={() => setSelectedDiscount(null)}>Discard</Button>
                            <Button 
                                className="flex-1 bg-[#16423C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:brightness-110 disabled:opacity-50" 
                                onClick={handleSave}
                                disabled={isSaving}
                            >
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