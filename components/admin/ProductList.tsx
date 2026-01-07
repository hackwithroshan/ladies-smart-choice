import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { DataTable, ColumnDef } from '../ui/data-table';
import { IndianRupee, MoreHorizontal, EditPencil, Trash2, Activity, Megaphone } from '../Icons';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../utils/utils';

const ProductList: React.FC<{token: string | null}> = ({token}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/products/all'), { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setProducts(await res.json());
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [token]);

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Permanent delete? This action is irreversible.")) return;
    try {
        const res = await fetch(getApiUrl(`/api/products/${id}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchProducts();
    } catch (e) { alert("Delete failed."); }
  };

  const columns: ColumnDef<Product>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Catalogue Asset",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <img className="h-12 w-12 rounded-2xl object-cover border border-zinc-200 shadow-sm" src={row.original.imageUrl} />
          <div className="flex flex-col min-w-0">
            <span className="font-black text-zinc-900 truncate leading-none mb-1">{row.original.name}</span>
            <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{row.original.category} / {row.original.sku || 'No SKU'}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Lifecycle",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        const styles: any = { 
            'Active': 'bg-emerald-50 text-emerald-700 border-emerald-100', 
            'Draft': 'bg-zinc-100 text-zinc-500 border-zinc-200',
            'Archived': 'bg-rose-50 text-rose-700 border-rose-100'
        };
        // Fix: Badge component now correctly accepts className as per the ui/badge.tsx definition
        return <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2 shadow-sm", styles[val])}>{val}</Badge>
      }
    },
    {
      id: "meta_sync",
      header: "Meta Catalog",
      cell: ({ row }) => (
          <div className="flex items-center gap-2">
              <div className={cn("h-1.5 w-1.5 rounded-full", row.original.status === 'Active' ? "bg-emerald-500 animate-pulse" : "bg-zinc-300")} />
              <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-400">
                  {row.original.status === 'Active' ? 'SYNC READY' : 'IGNORED'}
              </span>
          </div>
      )
    },
    {
      accessorKey: "price",
      header: "Unit Cost",
      cell: ({ getValue }) => <div className="font-black text-zinc-900 italic">₹{Number(getValue()).toLocaleString()}</div>
    },
    {
      accessorKey: "stock",
      header: "Inventory",
      cell: ({ getValue }) => {
        const stock = getValue() as number;
        return (
          <div className="flex flex-col">
             <span className={cn("font-black text-xs italic", stock < 5 ? 'text-rose-600' : 'text-zinc-700')}>{stock} Units</span>
          </div>
        )
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Control</div>,
      cell: ({ row }) => {
        const p = row.original;
        const pid = p.id || (p as any)._id;
        return (
          <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu 
              trigger={
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            >
                <React.Fragment>
                  <DropdownMenuLabel>Product Ops</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate(`/app/products/edit?id=${pid}`)}>
                    <EditPencil className="mr-2 h-3.5 w-3.5" /> Modify Record
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/app/products/design?productId=${pid}`)}>
                    <Activity className="mr-2 h-3.5 w-3.5" /> Launch Designer
                  </DropdownMenuItem>
                  {/* Fixed error: DropdownMenuSeparator does not accept className in its current definition */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeleteProduct(pid!)} variant="destructive">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Wipe Record
                  </DropdownMenuItem>
                </React.Fragment>
            </DropdownMenu>
          </div>
        )
      }
    }
  ], [navigate, token]);

  const filteredProducts = useMemo(() => {
      if (activeTab === "all") return products;
      return products.filter(p => (p.status || '').toLowerCase() === activeTab.toLowerCase());
  }, [products, activeTab]);

  return (
    <div className="space-y-6">
      <DataTable 
        columns={columns} 
        data={filteredProducts} 
        searchKey="name" 
        searchPlaceholder="Lookup catalogue asset..." 
        onRowClick={setSelectedProduct}
        tabs={[
            { value: "all", label: "Registry", count: products.length },
            { value: "active", label: "Live Hub", count: products.filter(p => p.status === 'Active').length },
            { value: "draft", label: "Pre-Flight", count: products.filter(p => p.status === 'Draft').length }
        ]}
        onTabChange={setActiveTab}
        actions={
            <div className="flex gap-2">
                <Button onClick={() => navigate('/app/marketing')} variant="outline" className="h-10 border-zinc-200 text-zinc-600 font-black uppercase text-[9px] rounded-xl px-4 flex gap-2">
                    <Megaphone className="w-3 h-3" /> Catalog Status
                </Button>
                <Button onClick={() => navigate('/app/products/new')} className="h-10 bg-[#16423C] text-white font-black uppercase tracking-widest italic text-[10px] rounded-xl px-8 shadow-xl transition-all active:scale-95">+ Inject Asset</Button>
            </div>
        }
      />

      <Drawer isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Record Overview">
         {selectedProduct && (
             <div className="space-y-8 h-full flex flex-col">
                 <div className="border-b bg-zinc-50/50 pb-8">
                   {/* Removed invalid className prop */}
                   <DrawerHeader>
                      <div className="h-56 w-full rounded-3xl overflow-hidden shadow-2xl mb-8 border border-zinc-200">
                          <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" />
                      </div>
                      <DrawerTitle>{selectedProduct.name}</DrawerTitle>
                      <DrawerDescription>MASTER PROTOCOL: {selectedProduct.sku || 'UNASSIGNED'}</DrawerDescription>
                      <div className="flex gap-4 mt-8">
                          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex-1 shadow-sm"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p><p className="text-sm font-black italic">{selectedProduct.status}</p></div>
                          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex-1 shadow-sm"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Liquidity</p><p className="text-sm font-black italic">₹{selectedProduct.price.toLocaleString()}</p></div>
                      </div>
                   </DrawerHeader>
                 </div>

                 <DrawerContent className="flex-1">
                    <div className="space-y-8">
                        <div className="p-6 bg-zinc-900 rounded-3xl text-white shadow-xl">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-3">Narrative Excerpt</h4>
                            <p className="text-xs leading-relaxed font-medium opacity-80">{selectedProduct.shortDescription || 'No teaser defined.'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-50 rounded-2xl border"><p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Stock</p><p className="text-sm font-black italic">{selectedProduct.stock} Units</p></div>
                            <div className="p-4 bg-zinc-50 rounded-2xl border"><p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Category</p><p className="text-sm font-black italic truncate">{selectedProduct.category}</p></div>
                        </div>
                    </div>
                 </DrawerContent>

                 {/* Removed invalid className prop */}
                 <DrawerFooter>
                    <Button variant="outline" className="flex-1 font-black text-[10px] uppercase tracking-widest rounded-xl" onClick={() => navigate(`/app/products/design?productId=${selectedProduct.id || (selectedProduct as any)._id}`)}>Designer</Button>
                    <Button className="flex-1 font-black text-[10px] uppercase tracking-widest bg-[#16423C] rounded-xl" onClick={() => navigate(`/app/products/edit?id=${selectedProduct.id || (selectedProduct as any)._id}`)}>Master Edit</Button>
                 </DrawerFooter>
             </div>
         )}
      </Drawer>
    </div>
  );
};

export default ProductList;