
import React, { useState, useEffect, useMemo } from 'react';
import { Order } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { ArrowUpDown, ShoppingCart, CreditCard, Truck, MoreHorizontal, EditPencil, Trash2, FileText, Activity } from '../Icons';
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
      const ordersRes = await fetch(getApiUrl('/api/orders'), { headers: { 'Authorization': `Bearer ${token}` } });
      if (ordersRes.ok) setOrders(await ordersRes.json());
    } catch (error) { 
        console.error(error); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
        const res = await fetch(getApiUrl(`/api/orders/${orderId}/status`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            fetchData();
        }
    } catch (e) { alert("Failed to update status."); }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order? This action is permanent.")) return;
    try {
        const res = await fetch(getApiUrl(`/api/orders/${orderId}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            fetchData();
        }
    } catch (e) { alert("Delete failed."); }
  };

  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: "orderNumber",
      header: "Manifest #",
      cell: ({ row }) => {
        const order = row.original;
        const fallbackId = order && (order.id || (order as any)._id)
          ? String(order.id || (order as any)._id).substring(0, 6).toUpperCase()
          : "—";
        const display = order.orderNumber || fallbackId;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">
              Manifest <span className="font-semibold text-zinc-900">#{display}</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: "customerName",
      header: "Account",
      cell: ({ row }) => (
          <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{row.original.customerName}</span>
              <span className="text-[11px] text-muted-foreground">{row.original.customerEmail}</span>
          </div>
      )
    },
    {
      accessorKey: "total",
      header: "Value",
      cell: ({ getValue }) => (
        <div className="text-right">
          <div className="font-semibold text-sm text-foreground">₹{Number(getValue()).toLocaleString("en-IN")}</div>
          <div className="text-[11px] text-muted-foreground">Prepaid</div>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "State",
      cell: ({ getValue }) => {
        const s = getValue() as string;
        const styles: any = { 
            'Paid': 'bg-zinc-900 text-white border-zinc-900', 
            'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-100',
            'Pending': 'bg-amber-50 text-amber-700 border-amber-100',
            'Processing': 'bg-blue-50 text-blue-700 border-blue-100',
            'Draft': 'bg-zinc-100 text-zinc-600 border-zinc-200'
        };
        return (
          <Badge variant="outline" className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", styles[s] || 'bg-zinc-50 text-zinc-600 border-zinc-200')}>
            {s}
          </Badge>
        )
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original;
        const orderId = order.id || (order as any)._id;
        return (
          <div className="flex justify-end">
            {/* Fix: Explicitly ensuring children are passed to DropdownMenu components and wrapped in fragment */}
            <DropdownMenu 
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            >
              <React.Fragment>
                <DropdownMenuLabel>Order Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                  <EditPencil className="mr-2 h-3.5 w-3.5" /> Edit Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateStatus(orderId, 'Draft')}>
                  <FileText className="mr-2 h-3.5 w-3.5" /> Save as Draft
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteOrder(orderId)} variant="destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Order
                </DropdownMenuItem>
              </React.Fragment>
            </DropdownMenu>
          </div>
        )
      }
    }
  ], [token]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    if (activeTab === "processing") return orders.filter(o => ['Paid', 'Processing', 'Packed'].includes(o.status));
    return orders.filter(o => (o.status || '').toLowerCase() === activeTab.toLowerCase());
  }, [orders, activeTab]);

  if (loading) return <div className="p-12 text-center text-zinc-400 animate-pulse">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Monitor manifests, payment status, and fulfillment in one place.</p>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredOrders} 
        searchKey="customerName" 
        searchPlaceholder="Manifest lookup..." 
        onRowClick={setSelectedOrder}
        tabs={[
            { value: "all", label: "Omnichannel", count: orders.length },
            { value: "processing", label: "Open Orders", count: orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length },
            { value: "delivered", label: "Fullfilled", count: orders.filter(o => o.status === 'Delivered').length }
        ]}
        onTabChange={setActiveTab}
      />

      <Drawer isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Manifest">
         {selectedOrder && (
             <div className="space-y-6">
                 <DrawerHeader className="border-b bg-zinc-50/50 pb-8">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Transaction Details</p>
                    <DrawerTitle>Invoice #{selectedOrder.orderNumber || (selectedOrder.id || (selectedOrder as any)._id || "").substring(0, 6).toUpperCase()}</DrawerTitle>
                    <DrawerDescription>Recorded on {new Date(selectedOrder.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</DrawerDescription>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <Badge className="bg-zinc-900 text-[10px] font-black italic px-3 py-1 uppercase">{selectedOrder.status}</Badge>
                        <Badge variant="outline" className="bg-white border-zinc-200 text-[10px] font-black px-3 py-1 uppercase">{selectedOrder.checkoutType || 'standard'} channel</Badge>
                    </div>
                 </DrawerHeader>
                 <DrawerContent>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Shipment Content</h4>
                        <div className="space-y-3">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                                    <div className="h-10 w-10 bg-white rounded-xl border overflow-hidden shrink-0"><img src={item.imageUrl} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-zinc-900 truncate leading-none mb-1">{item.name}</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Qty: {item.quantity} × ₹{item.price}</p>
                                    </div>
                                    <p className="font-black italic text-zinc-900">₹{item.price * item.quantity}</p>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-dashed space-y-2">
                            <div className="flex justify-between text-[11px] font-bold text-zinc-400 uppercase"><span>Subtotal</span><span>₹{selectedOrder.total}</span></div>
                            <div className="flex justify-between text-sm font-black text-zinc-900 uppercase"><span>Net Payable</span><span className="text-lg italic tracking-tight">₹{selectedOrder.total}</span></div>
                        </div>
                        <div className="space-y-4 pt-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Logistics Protocol</h4>
                            <div className="p-4 bg-zinc-900 text-white rounded-2xl shadow-xl space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg"><Truck className="h-4 w-4" /></div>
                                    <div><p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Delivery Route</p><p className="text-xs font-black italic">{selectedOrder.shippingAddress?.city || 'N/A'}, {selectedOrder.shippingAddress?.postalCode || 'N/A'}</p></div>
                                </div>
                                <p className="text-[10px] text-white/40 leading-relaxed italic">{selectedOrder.shippingAddress?.address || 'No address provided'}</p>
                            </div>
                        </div>
                    </div>
                 </DrawerContent>
                 <DrawerFooter>
                    <Button variant="outline" className="flex-1 font-bold text-[11px] uppercase tracking-widest">Generate Bill</Button>
                    <Button className="flex-1 font-black text-[11px] uppercase tracking-widest bg-zinc-900">Update Status</Button>
                 </DrawerFooter>
             </div>
         )}
      </Drawer>
    </div>
  );
};

export default OrderList;
