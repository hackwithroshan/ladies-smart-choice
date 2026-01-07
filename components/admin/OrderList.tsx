
import React, { useState, useEffect, useMemo } from 'react';
import { Order } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { MoreHorizontal, EditPencil, Trash2, Truck } from '../Icons';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../utils/utils';

const OrderList: React.FC<{token: string | null}> = ({token}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/orders'), { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setOrders(await res.json());
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
        const res = await fetch(getApiUrl(`/api/orders/${id}/status`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        if (res.ok) fetchData();
    } catch (e) { alert("Status update failed"); }
  };

  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: "orderNumber",
      header: "Manifest #",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-black text-zinc-900">#{row.original.orderNumber || row.original.id.substring(0, 6).toUpperCase()}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(row.original.date).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      accessorKey: "customerName",
      header: "Channel",
      cell: ({ row }) => (
          <div className="flex flex-col">
              <span className="text-xs font-black text-zinc-800 uppercase">{row.original.customerName}</span>
              <span className="text-[9px] font-bold text-[#6A9C89] uppercase">{row.original.checkoutType || 'Standard'}</span>
          </div>
      )
    },
    {
      accessorKey: "status",
      header: "Stage",
      cell: ({ getValue }) => {
        const s = getValue() as string;
        const styles: any = { 'Paid': 'bg-emerald-50 text-emerald-700', 'Delivered': 'bg-zinc-900 text-white', 'Pending': 'bg-amber-50 text-amber-700' };
        return <Badge className={cn("text-[9px] font-black uppercase px-2 shadow-sm", styles[s])}>{s}</Badge>
      }
    },
    {
      accessorKey: "total",
      header: "Value",
      cell: ({ getValue }) => <div className="font-black italic text-zinc-900">₹{Number(getValue()).toLocaleString()}</div>
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Control</div>,
      cell: ({ row }) => (
        <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu trigger={<Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>}>
              <React.Fragment>
                <DropdownMenuLabel>Logistics</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleUpdateStatus(row.original.id, 'Shipped')}><Truck className="mr-2 h-3.5" /> Dispatch</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus(row.original.id, 'Delivered')}><Badge className="mr-2 h-3.5 bg-emerald-500" /> Mark Delivered</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedOrder(row.original)}><EditPencil className="mr-2 h-3.5" /> Manifest Details</DropdownMenuItem>
              </React.Fragment>
          </DropdownMenu>
        </div>
      )
    }
  ], [token]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter(o => o.status.toLowerCase() === activeTab.toLowerCase());
  }, [orders, activeTab]);

  return (
    <div className="space-y-6">
      <DataTable 
        columns={columns} 
        data={filteredOrders} 
        searchKey="customerName" 
        searchPlaceholder="Manifest lookup..." 
        onRowClick={setSelectedOrder}
        tabs={[
            { value: "all", label: "Registry", count: orders.length },
            { value: "paid", label: "Unfulfilled", count: orders.filter(o => o.status === 'Paid').length },
            { value: "delivered", label: "Archive", count: orders.filter(o => o.status === 'Delivered').length }
        ]}
        onTabChange={setActiveTab}
      />

      <Drawer isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Manifest">
         {selectedOrder && (
             <div className="space-y-6">
                 <DrawerHeader>
                    <DrawerTitle>Invoice #{selectedOrder.orderNumber || selectedOrder.id.substring(0, 6).toUpperCase()}</DrawerTitle>
                    <DrawerDescription>{selectedOrder.customerEmail} / {selectedOrder.customerPhone}</DrawerDescription>
                 </DrawerHeader>
                 <DrawerContent>
                    <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-zinc-400">Content</h4>
                        {selectedOrder.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                                <span className="font-bold truncate max-w-[200px]">{item.name} x {item.quantity}</span>
                                <span className="font-black italic">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-dashed flex justify-between font-black">
                            <span>TOTAL PAID</span>
                            <span>₹{selectedOrder.total}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-zinc-400">Delivery Address</h4>
                        <p className="text-sm font-medium text-zinc-600 leading-relaxed">{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    </div>
                 </DrawerContent>
             </div>
         )}
      </Drawer>
    </div>
  );
};

export default OrderList;
