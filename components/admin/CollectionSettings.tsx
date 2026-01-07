import React, { useState, useEffect, useMemo } from 'react';
import { Product, Collection } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { EditPencil, Trash2, MoreHorizontal, Package, ChevronRight } from '../Icons';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import MediaPicker from './MediaPicker';
import { cn } from '../../utils/utils';

const CollectionSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCollection, setSelectedCollection] = useState<Partial<Collection> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [collRes, prodRes] = await Promise.all([
                fetch(getApiUrl('/api/collections/admin/all')),
                fetch(getApiUrl('/api/products/all'), { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (collRes.ok) setCollections(await collRes.json());
            if (prodRes.ok) setAllProducts(await prodRes.json());
        } catch (error) {
            console.error("Error fetching collections data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const handleSave = async () => {
        if (!selectedCollection?.title) return alert("Collection title is required");
        setIsSaving(true);
        
        const isEditing = !!(selectedCollection.id || (selectedCollection as any)._id);
        const id = selectedCollection.id || (selectedCollection as any)._id;
        
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? getApiUrl(`/api/collections/${id}`) : getApiUrl('/api/collections');
        
        // Extract only IDs for the products array
        const productIds = selectedCollection.products?.map(p => 
            typeof p === 'string' ? p : (p.id || (p as any)._id)
        ) || [];

        const payload = {
            ...selectedCollection,
            products: productIds
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchData();
                setSelectedCollection(null);
            } else {
                const err = await res.json();
                alert(err.message || "Failed to save collection");
            }
        } catch (e) {
            alert("Network error while saving");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Permanent delete? This collection will be removed from all navigation and homepage blocks.")) return;
        try {
            const res = await fetch(getApiUrl(`/api/collections/${id}`), { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) fetchData();
        } catch (e) {
            alert("Delete operation failed");
        }
    };

    const toggleProductSelection = (product: Product) => {
        if (!selectedCollection) return;
        const productId = product.id || (product as any)._id;
        const currentProducts = selectedCollection.products || [];
        
        const isAlreadySelected = currentProducts.some(p => {
            const id = typeof p === 'string' ? p : (p.id || (p as any)._id);
            return id === productId;
        });
        
        let updatedProducts;
        if (isAlreadySelected) {
            updatedProducts = currentProducts.filter(p => {
                const id = typeof p === 'string' ? p : (p.id || (p as any)._id);
                return id !== productId;
            });
        } else {
            updatedProducts = [...currentProducts, product];
        }
        
        setSelectedCollection({ ...selectedCollection, products: updatedProducts });
    };

    const columns: ColumnDef<Collection>[] = useMemo(() => [
        {
            accessorKey: "title",
            header: "Collection Asset",
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0 shadow-sm">
                        <img src={row.original.imageUrl || 'https://via.placeholder.com/100'} className="h-full w-full object-cover" alt="" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-zinc-900 truncate leading-none mb-1 uppercase italic tracking-tighter">{row.original.title}</span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">URL: /{row.original.slug}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "displayStyle",
            header: "Visual UI",
            cell: ({ getValue }) => (
                <Badge variant="outline" className="text-[9px] font-black uppercase px-2 bg-zinc-50 border-zinc-200 text-zinc-600">
                    {getValue() as string || 'Rectangle'}
                </Badge>
            )
        },
        {
            id: "product_count",
            header: "Assets Linked",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-zinc-400" />
                    <span className="text-xs font-black italic text-zinc-700">{row.original.products?.length || 0} Products</span>
                </div>
            )
        },
        {
            accessorKey: "isActive",
            header: "Live Status",
            cell: ({ getValue }) => (
                <Badge className={cn("text-[9px] font-black uppercase px-2", getValue() ? "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm" : "bg-zinc-100 text-zinc-400 border-zinc-200")}>
                    {getValue() ? 'ACTIVE' : 'DRAFT'}
                </Badge>
            )
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
                                <DropdownMenuLabel>Collection Ops</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSelectedCollection(row.original)}>
                                    <EditPencil className="mr-2 h-3.5 w-3.5" /> Modify Taxonomy
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(id)} variant="destructive">
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Collection
                                </DropdownMenuItem>
                            </React.Fragment>
                        </DropdownMenu>
                    </div>
                );
            }
        }
    ], []);

    const filteredProductList = useMemo(() => {
        return allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    }, [allProducts, productSearch]);

    if (loading) return <div className="p-12 text-center text-zinc-400 animate-pulse font-black uppercase tracking-widest italic">Indexing Store Taxonomy...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Collections Manager</h1>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Organize products into groups for navigation & storefront blocks</p>
                </div>
                <Button onClick={() => setSelectedCollection({ isActive: true, products: [], displayStyle: 'Rectangle' })} className="bg-[#16423C] text-white font-black uppercase tracking-widest text-[10px] rounded-xl px-8 shadow-xl hover:brightness-110 active:scale-95 transition-all">
                    + Inject Collection
                </Button>
            </div>

            <DataTable 
                columns={columns} 
                data={collections} 
                searchKey="title" 
                searchPlaceholder="Lookup collection by title..." 
                onRowClick={setSelectedCollection}
            />

            <Drawer isOpen={!!selectedCollection} onClose={() => setSelectedCollection(null)} title={selectedCollection?.id || (selectedCollection as any)?._id ? "Update Taxonomy" : "Collection Injection"}>
                {selectedCollection && (
                    <div className="flex flex-col h-full">
                        <div className="p-6">
                            <DrawerHeader>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Collection Headline</label>
                                        <Input 
                                            value={selectedCollection.title || ''} 
                                            onChange={e => setSelectedCollection({...selectedCollection, title: e.target.value})} 
                                            className="font-black text-sm h-12 rounded-xl border-zinc-200 focus-visible:ring-zinc-950"
                                            placeholder="e.g. Winter Essentials"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Visual Interface</label>
                                            <select 
                                                value={selectedCollection.displayStyle || 'Rectangle'} 
                                                onChange={e => setSelectedCollection({...selectedCollection, displayStyle: e.target.value as any})}
                                                className="w-full bg-white border border-zinc-200 rounded-xl h-11 text-xs font-bold px-3 outline-none focus:border-zinc-900 transition-all shadow-sm"
                                            >
                                                <option value="Rectangle">Classic Rectangle</option>
                                                <option value="Circle">Modern Circle</option>
                                                <option value="Square">Perfect Square</option>
                                                <option value="ImageOnly">Minimalist (Raw)</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 cursor-pointer h-11 shadow-sm hover:bg-zinc-50 transition-all">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedCollection.isActive} 
                                                    onChange={e => setSelectedCollection({...selectedCollection, isActive: e.target.checked})}
                                                    className="w-4 h-4 rounded-md border-zinc-300 text-[#16423C] focus:ring-0"
                                                />
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Live Visibility</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </DrawerHeader>
                        </div>

                        <DrawerContent>
                            <div className="space-y-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Collection Master Key Visual</label>
                                    <MediaPicker 
                                        value={selectedCollection.imageUrl || ''} 
                                        onChange={url => setSelectedCollection({...selectedCollection, imageUrl: url})} 
                                        type="image" 
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Linked Assets ({selectedCollection.products?.length || 0})</label>
                                        <span className="text-[9px] font-black text-[#16423C] uppercase bg-emerald-50 px-2 py-0.5 rounded">Selection active</span>
                                    </div>
                                    <div className="relative">
                                        <Input 
                                            placeholder="Filter master catalog..." 
                                            value={productSearch}
                                            onChange={e => setProductSearch(e.target.value)}
                                            className="bg-zinc-50 border-zinc-100 h-11 text-xs font-bold pl-4 rounded-xl"
                                        />
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto admin-scroll border border-zinc-100 rounded-3xl bg-zinc-50/30 p-2 space-y-1">
                                        {filteredProductList.map(product => {
                                            const pid = product.id || (product as any)._id;
                                            const isSelected = (selectedCollection.products || []).some(p => {
                                                const id = typeof p === 'string' ? p : (p.id || (p as any)._id);
                                                return id === pid;
                                            });
                                            return (
                                                <div 
                                                    key={pid} 
                                                    onClick={() => toggleProductSelection(product)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border group",
                                                        isSelected ? "bg-white border-zinc-200 shadow-md ring-1 ring-zinc-900/5" : "border-transparent hover:bg-zinc-100/50"
                                                    )}
                                                >
                                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "bg-zinc-900 border-zinc-900" : "bg-white border-zinc-200")}>
                                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-100 bg-white shrink-0">
                                                        <img src={product.imageUrl} className="h-full w-full object-cover" alt="" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-black text-zinc-900 truncate uppercase">{product.name}</p>
                                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter italic">UNIT COST: ₹{product.price.toLocaleString()}</p>
                                                    </div>
                                                    <ChevronRight className={cn("w-3 h-3 text-zinc-300 transition-all", isSelected ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:opacity-100")} />
                                                </div>
                                            );
                                        })}
                                        {filteredProductList.length === 0 && (
                                            <div className="py-10 text-center text-[10px] font-black text-zinc-300 uppercase italic">No matching assets in catalog</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DrawerContent>

                        <DrawerFooter>
                            <Button variant="ghost" className="flex-1 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-900" onClick={() => setSelectedCollection(null)}>Discard</Button>
                            <Button 
                                className="flex-1 bg-[#16423C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:brightness-110 disabled:opacity-50" 
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? "Synchronizing..." : "Publish Taxonomy"}
                            </Button>
                        </DrawerFooter>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default CollectionSettings;