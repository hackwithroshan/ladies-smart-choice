
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { ArrowUpDown, Package, MoreHorizontal, EditPencil, IndianRupee } from '../Icons';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../utils/utils';

const Inventory: React.FC<{token: string | null}> = ({token}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/products/all'), { headers: { 'Authorization': `Bearer ${token}` } });
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
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg overflow-hidden border border-zinc-100 bg-zinc-50 shrink-0">
            <img src={row.original.imageUrl} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-zinc-900 truncate text-sm">{row.original.name}</span>
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{row.original.category}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "sku",
      header: "SKU / ID",
      cell: ({ getValue }) => <code className="text-[11px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">{getValue() as string || 'N/A'}</code>
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ getValue }) => <div className="font-black text-zinc-900 italic">₹{Number(getValue()).toLocaleString()}</div>
    },
    {
      accessorKey: "stock",
      header: "Available Stock",
      cell: ({ row }) => {
        const stock = row.original.stock;
        const lowStock = row.original.lowStockThreshold || 10;
        
        let statusColor = "text-emerald-600";
        let bgColor = "bg-emerald-50 border-emerald-100";
        let label = "Healthy";

        if (stock === 0) {
            statusColor = "text-rose-600";
            bgColor = "bg-rose-50 border-rose-100";
            label = "Out of Stock";
        } else if (stock < lowStock) {
            statusColor = "text-amber-600";
            bgColor = "bg-amber-50 border-amber-100";
            label = "Low Stock";
        }

        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <span className={cn("text-sm font-black italic", statusColor)}>{stock} Units</span>
                <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-1.5 py-0 border", bgColor, statusColor)}>
                    {label}
                </Badge>
            </div>
            <div className="w-24 h-1 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                    className={cn("h-full rounded-full transition-all", stock === 0 ? "bg-rose-500" : stock < lowStock ? "bg-amber-500" : "bg-emerald-500")} 
                    style={{ width: `${Math.min(100, (stock / 50) * 100)}%` }}
                ></div>
            </div>
          </div>
        );
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end pr-2">
            <DropdownMenu 
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownMenuLabel>Stock Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => alert("Navigate to Edit for stock update")}>
                <EditPencil className="mr-2 h-3.5 w-3.5" /> Adjust Inventory
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Package className="mr-2 h-3.5 w-3.5" /> View Movement
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                Archive Product
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        )
      }
    }
  ], []);

  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return products;
    if (activeTab === "low") return products.filter(p => p.stock > 0 && p.stock < (p.lowStockThreshold || 10));
    if (activeTab === "out") return products.filter(p => p.stock === 0);
    return products;
  }, [products, activeTab]);

  const stats = useMemo(() => ({
    total: products.length,
    low: products.filter(p => p.stock > 0 && p.stock < (p.lowStockThreshold || 10)).length,
    out: products.filter(p => p.stock === 0).length
  }), [products]);

  if (loading) return <div className="p-12 text-center text-zinc-400 animate-pulse">Scanning Inventory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Inventory Control</h1>
        <p className="text-sm text-muted-foreground">Monitor stock levels, manage SKUs, and prevent stock-outs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Catalog</p>
            <p className="text-2xl font-black italic text-zinc-900">{stats.total} Items</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Alerts: Low Stock</p>
            <p className="text-2xl font-black italic text-amber-600">{stats.low} SKU's</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Alerts: Out of Stock</p>
            <p className="text-2xl font-black italic text-rose-600">{stats.out} SKU's</p>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredProducts} 
        searchKey="name" 
        searchPlaceholder="Manifest lookup..." 
        tabs={[
            { value: "all", label: "Full Inventory", count: stats.total },
            { value: "low", label: "Low Level", count: stats.low },
            { value: "out", label: "Depleted", count: stats.out }
        ]}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default Inventory;
