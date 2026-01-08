
import React, { useState, useEffect, useMemo } from 'react';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { MoreHorizontal, EditPencil, Trash2, LayoutTemplate, Eye, Package } from '../Icons';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import MediaPicker from './MediaPicker';
import { cn } from '../../utils/utils';

interface Category {
    _id: string;
    id: string;
    name: string;
    slug: string;
    parentId: any;
    isActive: boolean;
    imageUrl: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
}

const CategoryList: React.FC<{ token: string | null }> = ({ token }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<Partial<Category> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            // Corrected: Removed redundant /api prefix
            const res = await fetch(getApiUrl('categories'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setCategories(await res.json());
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, [token]);

    const handleSave = async () => {
        if (!selectedCategory?.name) return alert("Name is required");
        setIsSaving(true);
        
        const isEditing = !!(selectedCategory._id || selectedCategory.id);
        const id = selectedCategory._id || selectedCategory.id;
        const method = isEditing ? 'PUT' : 'POST';
        // Corrected: Removed redundant /api prefix
        const url = isEditing ? getApiUrl(`categories/${id}`) : getApiUrl('categories');

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(selectedCategory)
            });

            if (res.ok) {
                await fetchCategories();
                setSelectedCategory(null);
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (e) {
            alert("Error saving");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Permanent delete? This will impact SEO and product links.")) return;
        try {
            // Corrected: Removed redundant /api prefix
            const res = await fetch(getApiUrl(`categories/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchCategories();
            else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (e) { alert("Delete failed"); }
    };

    const columns: ColumnDef<Category>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: "Category Asset",
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0">
                        {row.original.imageUrl ? (
                            <img src={row.original.imageUrl} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                                <LayoutTemplate className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-zinc-900 truncate leading-none mb-1 uppercase tracking-tight italic">
                            {row.original.name}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                            /{row.original.slug}
                        </span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "parentId",
            header: "Hierarchy",
            cell: ({ getValue }) => {
                const parent = getValue();
                return parent ? (
                    <Badge variant="outline" className="text-[9px] font-black uppercase px-2 bg-zinc-50 border-zinc-200 text-zinc-500">
                        {parent.name}
                    </Badge>
                ) : (
                    <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Root Node</span>
                );
            }
        },
        {
            accessorKey: "isActive",
            header: "Visibility",
            cell: ({ getValue }) => (
                <Badge className={cn("text-[9px] font-black uppercase px-2 shadow-sm", getValue() ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-zinc-100 text-zinc-400 border-zinc-200")}>
                    {getValue() ? 'LIVE' : 'HIDDEN'}
                </Badge>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right pr-4">Control</div>,
            cell: ({ row }) => (
                <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu trigger={
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    }>
                        <DropdownMenuLabel>Taxonomy Ops</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedCategory(row.original)}>
                            <EditPencil className="mr-2 h-3.5 w-3.5" /> Modify Node
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(row.original._id)} variant="destructive">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Category
                        </DropdownMenuItem>
                    </DropdownMenu>
                </div>
            )
        }
    ], []);

    if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-zinc-300 italic tracking-[0.3em]">Mapping Taxonomy Map...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Taxonomy Manager</h1>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Organize products into hierarchical structures and manage catalog navigation</p>
                </div>
                <Button onClick={() => setSelectedCategory({ isActive: true, parentId: null })} className="bg-[#16423C] text-white font-black uppercase tracking-widest text-[10px] rounded-xl px-8 shadow-xl">
                    + Inject Category
                </Button>
            </div>

            <DataTable 
                columns={columns} 
                data={categories} 
                searchKey="name" 
                searchPlaceholder="Lookup category node..." 
                onRowClick={setSelectedCategory}
            />

            <Drawer isOpen={!!selectedCategory} onClose={() => setSelectedCategory(null)} title={selectedCategory?._id ? "Update Node" : "Category Injection"}>
                {selectedCategory && (
                    <div className="flex flex-col h-full">
                        <div className="p-6 space-y-8">
                            <DrawerHeader>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Category Title</label>
                                        <Input 
                                            value={selectedCategory.name || ''} 
                                            onChange={e => setSelectedCategory({...selectedCategory, name: e.target.value})} 
                                            className="font-black text-lg h-14 rounded-xl border-zinc-200 italic"
                                            placeholder="e.g. Organic Supplements"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Parent Mapping</label>
                                            <select 
                                                value={selectedCategory.parentId?._id || selectedCategory.parentId || ''} 
                                                onChange={e => setSelectedCategory({...selectedCategory, parentId: e.target.value || null})}
                                                className="w-full bg-white border border-zinc-200 rounded-xl h-11 text-xs font-bold px-3 outline-none focus:border-zinc-900"
                                            >
                                                <option value="">-- No Parent (Root) --</option>
                                                {categories.filter(c => c._id !== selectedCategory._id).map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100 h-11 self-end cursor-pointer" onClick={() => setSelectedCategory({...selectedCategory, isActive: !selectedCategory.isActive})}>
                                            <input type="checkbox" checked={selectedCategory.isActive} readOnly className="w-4 h-4 text-[#16423C] rounded" />
                                            <span className="text-[10px] font-black uppercase text-zinc-600">Active Status</span>
                                        </div>
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Node Visual</label>
                                    <MediaPicker 
                                        value={selectedCategory.imageUrl || ''} 
                                        onChange={url => setSelectedCategory({...selectedCategory, imageUrl: url})} 
                                        type="image" 
                                    />
                                </div>

                                <div className="bg-zinc-900 rounded-[2rem] p-8 space-y-6 text-white shadow-2xl">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">SEO Architecture</h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase opacity-30">Crawl Title</label>
                                            <Input 
                                                value={selectedCategory.seoTitle || ''} 
                                                onChange={e => setSelectedCategory({...selectedCategory, seoTitle: e.target.value})}
                                                className="bg-white/10 border-white/10 text-white h-10 text-xs font-bold"
                                                placeholder="Meta Title..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase opacity-30">Crawl Description</label>
                                            <textarea 
                                                value={selectedCategory.seoDescription || ''} 
                                                onChange={e => setSelectedCategory({...selectedCategory, seoDescription: e.target.value})}
                                                className="w-full bg-white/10 border-white/10 text-white rounded-xl p-3 text-xs outline-none focus:bg-white/20 resize-none h-24"
                                                placeholder="Meta Description..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DrawerFooter className="mt-auto">
                            <Button variant="ghost" className="flex-1 rounded-xl text-[10px] font-black uppercase" onClick={() => setSelectedCategory(null)}>Discard</Button>
                            <Button className="flex-1 bg-[#16423C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Syncing..." : "Publish Node"}
                            </Button>
                        </DrawerFooter>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default CategoryList;
