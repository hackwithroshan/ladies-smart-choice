import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { ArrowUpDown, Package, MoreHorizontal, EditPencil, Activity } from '../Icons';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../utils/utils';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;

const Inventory: React.FC<{token: string | null}> = ({token}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/products/all'), { 
          headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) setProducts(await res.json());
    } catch (error) { 
        console.error("Inventory fetch failed", error); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchInventory(); }, [token]);

  const columns: ColumnDef<Product>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Product Detail",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0 shadow-sm">
            <img src={row.original.imageUrl} className="w-full h-full object-cover" alt={row.original.name} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-zinc-900 truncate leading-none mb-1 uppercase italic tracking-tighter">
                {row.original.name}
            </span>
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{row.original.category}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "sku",
      header: "SKU / Serial",
      cell: ({ getValue }) => (
          <code className="text-[10px] font-mono font-black bg-zinc-100 px-2 py-1 rounded-lg text-zinc-600 border border-zinc-200 uppercase">
              {getValue() as string || 'UNASSIGNED'}
          </code>
      )
    },
    {
      accessorKey: "price",
      header: "Unit Value",
      cell: ({ getValue }) => <div className="font-black text-zinc-900 italic">₹{Number(getValue()).toLocaleString()}</div>
    },
    {
      accessorKey: "stock",
      header: "Inventory Status",
      cell: ({ row }) => {
        const stock = row.original.stock;
        const threshold = row.original.lowStockThreshold || 5;
        
        let statusClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
        let label = "Healthy";

        if (stock === 0) {
            statusClass = "bg-rose-50 text-rose-700 border-rose-100";
            label = "Out of Stock";
        } else if (stock < threshold) {
            statusClass = "bg-amber-50 text-amber-700 border-amber-100";
            label = "Low Stock";
        }

        const percentage = Math.min(100, (stock / (threshold * 4)) * 100);

        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <span className={cn("text-xs font-black italic", stock === 0 ? "text-rose-600" : stock < threshold ? "text-amber-600" : "text-zinc-700")}>
                    {stock} Units
                </span>
                <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2 py-0.5 shadow-sm", statusClass)}>
                    {label}
                </Badge>
            </div>
            <div className="w-28 h-1 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                <div 
                    className={cn("h-full rounded-full transition-all duration-700", 
                        stock === 0 ? "bg-rose-500" : 
                        stock < threshold ? "bg-amber-500" : 
                        "bg-emerald-500"
                    )} 
                    style={{ width: `${percentage}%` }}
                />
            </div>
          </div>
        )
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Control</div>,
      cell: ({ row }) => (
        <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu 
            trigger={
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          >
              <React.Fragment>
                <DropdownMenuLabel>Stock Ops</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate(`/app/products/edit?id=${row.original.id || (row.original as any)._id}`)}>
                  <EditPencil className="mr-2 h-3.5 w-3.5" /> Adjust Inventory
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert("History coming soon")}>
                  <Activity className="mr-2 h-3.5 w-3.5" /> Movement Logs
                </DropdownMenuItem>
              </React.Fragment>
          </DropdownMenu>
        </div>
      )
    }
  ], [navigate]);

  const filteredInventory = useMemo(() => {
      if (activeTab === "all") return products;
      if (activeTab === "low") return products.filter(p => p.stock > 0 && p.stock < (p.lowStockThreshold || 5));
      if (activeTab === "out") return products.filter(p => p.stock === 0);
      return products;
  }, [products, activeTab]);

  if (loading) return <div className="p-20 text-center font-black italic text-zinc-400 animate-pulse tracking-widest uppercase">Syncing Warehouse Data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex flex-col">
              <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Inventory Monitor</h1>
              <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Real-time stock tracking and SKU distribution across master catalog</p>
          </div>
          <div className="flex items-center gap-3">
              <div className="bg-zinc-50 px-4 py-2 rounded-2xl border border-zinc-100 flex flex-col items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Total SKU Count</span>
                  <span className="text-sm font-black italic">{products.length}</span>
              </div>
          </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredInventory} 
        searchKey="name" 
        searchPlaceholder="Lookup SKU or Product..." 
        onRowClick={(p) => navigate(`/app/products/edit?id=${p.id || (p as any)._id}`)}
        tabs={[
            { value: "all", label: "Full Registry", count: products.length },
            { value: "low", label: "Attention Needed", count: products.filter(p => p.stock > 0 && p.stock < (p.lowStockThreshold || 5)).length },
            { value: "out", label: "Depleted", count: products.filter(p => p.stock === 0).length }
        ]}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default Inventory;