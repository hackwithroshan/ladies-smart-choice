
import React, { useState, useEffect, useMemo } from 'react';
import { Order } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../utils/utils';
import { MoreHorizontal, Mail, X, CreditCard, CheckCircle, MapPin, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const OrderList: React.FC<{ token: string | null }> = ({ token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [activeModal, setActiveModal] = useState<'tracking' | 'customer' | 'notes' | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const { showToast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const ordersRes = await fetch(getApiUrl('/api/orders'), { headers: { 'Authorization': `Bearer ${token}` } });
      if (ordersRes.ok) setOrders(await ordersRes.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); }, [token]);

  // Open confirmation modal
  const handleDelete = (e: any, order: Order) => {
    e.stopPropagation();
    if (order._id) setDeleteId(order._id);
  };

  // Perform actual delete
  const confirmDelete = async () => {
    if (!deleteId || !token) return;
    setIsDeleting(true);
    try {
      const res = await fetch(getApiUrl(`/api/orders/${deleteId}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o._id !== deleteId));
        if (selectedOrder?._id === deleteId) setSelectedOrder(null);
        showToast("Order deleted successfully", 'success');
      } else {
        showToast("Failed to delete order", 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred", 'error');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const startEdit = () => {
    if (selectedOrder) {
      setEditForm({
        status: selectedOrder.status,
        customerName: selectedOrder.customerName,
        customerEmail: selectedOrder.customerEmail,
        customerPhone: selectedOrder.customerPhone || "",
        notes: selectedOrder.notes || "",
        shippingAddress: { ...selectedOrder.shippingAddress },
        trackingInfo: { carrier: selectedOrder.trackingInfo?.carrier || "", trackingNumber: selectedOrder.trackingInfo?.trackingNumber || "" }
      });
      setIsEditing(true);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(getApiUrl(`/api/orders/${selectedOrder._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
        setSelectedOrder(updated);
        setIsEditing(false);
      }
    } catch (err) { console.error(err); }
  };

  // Stats Logic
  const totalCount = orders.length;
  const openCount = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;

  // Filter Logic
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    if (activeTab === "processing") return orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
    if (activeTab === "delivered") return orders.filter(o => o.status === 'Delivered');
    return orders;
  }, [orders, activeTab]);

  // Columns
  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: "orderNumber",
      header: "ORDER ID",
      cell: ({ row }) => {
        const id = row.original.orderNumber || (row.original as any).id || "—";
        return <span className="font-semibold text-zinc-900">#{String(id).toUpperCase().substring(0, 8)}</span>;
      }
    },
    {
      accessorKey: "customerName",
      header: "CUSTOMER",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-zinc-900">{row.original.customerName}</span>
          <span className="text-[11px] text-zinc-500">{row.original.customerEmail}</span>
        </div>
      )
    },
    {
      accessorKey: "total",
      header: "VALUE",
      cell: ({ getValue }) => (
        <span className="font-bold text-zinc-900">₹{Number(getValue()).toLocaleString("en-IN")}</span>
      )
    },
    {
      id: "payment",
      header: "PAYMENT",
      cell: () => (
        <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-zinc-200 font-medium">Prepaid</Badge>
      )
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ getValue }) => {
        const s = getValue() as string;
        const styles: any = {
          'Paid': 'bg-blue-50 text-blue-700 border-blue-200',
          'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
          'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
          'Processing': 'bg-purple-50 text-purple-700 border-purple-200'
        };
        return (
          <Badge variant="outline" className={cn("capitalize font-medium", styles[s] || "bg-zinc-50 text-zinc-600 border-zinc-200")}>
            {s}
          </Badge>
        )
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm transition-all focus-visible:ring-0 outline-none flex items-center justify-center p-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Manage Order</DropdownMenuLabel>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedOrder(row.original); }}>
                View Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedOrder(row.original); setEditForm({ ...row.original, shippingAddress: { ...row.original.shippingAddress } }); setIsEditing(true); }}>
                Edit Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                <Mail className="mr-2 h-3.5 w-3.5" /> Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={(e) => handleDelete(e, row.original)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ], [handleDelete]);

  if (selectedOrder) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto pb-10 font-sans">
        <div className="sticky top-0 z-40 bg-white flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-100 backdrop-blur-sm p-4 md:p-1 md:py-2 pb-8">

          {/* Left: Title & Status */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-8 w-8 -ml-2 text-zinc-500 hover:bg-zinc-100 rounded-md">
                <span className="text-xl">←</span>
              </Button>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                #{selectedOrder.orderNumber || selectedOrder.id}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 border border-zinc-200">
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedOrder.status === 'Paid' ? 'bg-zinc-500' : 'bg-zinc-400'}`}></span>
                  Paid
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 border border-zinc-200">
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedOrder.status === 'Delivered' ? 'bg-zinc-500' : 'bg-zinc-400'}`}></span>
                  {selectedOrder.status === 'Delivered' ? 'Fulfilled' : 'Unfulfilled'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold border border-zinc-200">
                  Archived
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 pl-9">
              {new Date(selectedOrder.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })} from Online Store
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 pl-9 md:pl-0">
            <Button variant="outline" onClick={() => alert("Refund process initiated")} className="h-8 text-xs font-semibold text-zinc-700 bg-white border-zinc-300 hover:bg-zinc-50 transition-colors">Refund</Button>
            <Button variant="outline" onClick={() => alert("Return process initiated")} className="h-8 text-xs font-semibold text-zinc-700 bg-white border-zinc-300 hover:bg-zinc-50 transition-colors">Return</Button>
            <Button variant="outline" onClick={startEdit} className="h-8 text-xs font-semibold text-zinc-700 bg-white border-zinc-300 hover:bg-zinc-50 transition-colors">Edit</Button>
            <Button variant="outline" onClick={() => window.print()} className="h-8 text-xs font-semibold text-zinc-700 bg-white border-zinc-300 hover:bg-zinc-50 transition-colors flex items-center gap-2">
              Print <span className="opacity-50">▼</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedOrder._id && setDeleteId(selectedOrder._id)}
              className="h-8 text-xs font-bold text-red-600 bg-white border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <Button variant="outline" onClick={() => alert("More actions menu")} className="h-8 text-xs font-semibold text-zinc-700 bg-white border-zinc-300 hover:bg-zinc-50 transition-colors flex items-center gap-2">
              More actions <span className="opacity-50">▼</span>
            </Button>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white border-zinc-300 text-zinc-500 disabled:opacity-50"
                onClick={() => {
                  const idx = filteredOrders.findIndex(o => o._id === selectedOrder._id);
                  if (idx > 0) setSelectedOrder(filteredOrders[idx - 1]);
                }}
                disabled={filteredOrders.findIndex(o => o._id === selectedOrder._id) <= 0}
              >
                <span className="rotate-90">›</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white border-zinc-300 text-zinc-500 disabled:opacity-50"
                onClick={() => {
                  const idx = filteredOrders.findIndex(o => o._id === selectedOrder._id);
                  if (idx < filteredOrders.length - 1) setSelectedOrder(filteredOrders[idx + 1]);
                }}
                disabled={filteredOrders.findIndex(o => o._id === selectedOrder._id) >= filteredOrders.length - 1}
              >
                <span className="rotate-90">‹</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 2. MAIN LAYOUT */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* --- LEFT COLUMN (2/3) --- */}
          <div className="lg:col-span-2 space-y-8">

            {/* Fulfillment Card */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <span className="p-1 rounded bg-zinc-200 text-zinc-600"><CheckCircle size={14} className="fill-current text-zinc-500" /></span>
                  Fulfilled
                  <span className="text-zinc-300 font-normal mx-1">|</span>
                  <span className="flex items-center gap-1 text-zinc-500 font-normal bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                    <MapPin size={12} /> HO Mumbai
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">#{selectedOrder.orderNumber}-F1</span>
                  <MoreHorizontal size={16} className="text-zinc-400 cursor-pointer hover:text-zinc-600" />
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 text-sm text-zinc-600 font-medium">
                  July 23, 2025
                </div>
                <div className="space-y-6">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-14 w-14 rounded border border-zinc-200 overflow-hidden bg-zinc-50 flex-shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 flex justify-between">
                        <div>
                          <p className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">{item.name}</p>
                          <p className="text-xs text-zinc-500 bg-zinc-100 inline-block px-2 py-0.5 rounded mt-1">Default Title</p>
                        </div>
                        <div className="text-right text-sm">
                          <span className="font-medium">₹{item.price.toLocaleString('en-IN')}.00</span>
                          <span className="text-zinc-400 mx-2">×</span>
                          <span>{item.quantity}</span>
                          <p className="font-semibold mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}.00</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={() => { startEdit(); setActiveModal('tracking'); }} className="bg-zinc-900 hover:bg-black text-white text-xs font-semibold h-9 rounded-md px-4 shadow-sm">
                    <span className="mr-1.5">+</span> Add tracking
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <span className="p-1 rounded bg-zinc-200 text-zinc-600"><CreditCard size={14} className="fill-current text-zinc-500" /></span>
                  Paid
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Subtotal</span>
                  <span className="text-zinc-900 font-medium">{selectedOrder.items.length} item</span>
                  <span className="text-zinc-900 font-medium">₹{selectedOrder.total.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Shipping</span>
                  <span className="text-zinc-600">Free (0.5 kg)</span>
                  <span className="text-zinc-900 font-medium">₹0.00</span>
                </div>
                <div className="flex justify-between text-base font-bold text-zinc-900 pt-4 mt-2 border-t border-dashed border-zinc-200">
                  <span>Total</span>
                  <span>₹{selectedOrder.total.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="pt-4 border-t border-zinc-100 mt-2 flex justify-between text-sm">
                  <span className="text-zinc-600">Paid by customer</span>
                  <span className="text-zinc-900 font-medium">₹{selectedOrder.total.toLocaleString('en-IN')}.00</span>
                </div>
              </div>
            </div>

            {/* Timeline / Comments */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden p-6 shadow-sm">
              <h3 className="font-bold text-zinc-900 mb-4">Timeline</h3>
              <div className="flex gap-4 items-start">
                <div className="h-9 w-9 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center font-bold text-xs shrink-0 border border-zinc-300">
                  AS
                </div>
                <div className="flex-1">
                  <input
                    placeholder="Leave a comment..."
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN (1/3) --- */}
          <div className="space-y-8">

            {/* Notes Card */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-50">
                <h3 className="font-bold text-sm text-zinc-900">Notes</h3>
                <Button variant="ghost" size="icon" onClick={() => { startEdit(); setActiveModal('notes'); }} className="h-6 w-6 text-zinc-400 hover:text-zinc-600"><Edit size={14} /></Button>
              </div>
              <div className="px-6 py-4 text-sm text-zinc-500">
                {selectedOrder.notes || "No notes from customer"}
              </div>
            </div>

            {/* Customer Card */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-50">
                <h3 className="font-bold text-sm text-zinc-900">Customer</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-6 w-6 text-zinc-400 hover:text-zinc-600"><X size={14} /></Button>
              </div>
              <div className="px-6 py-4 space-y-6">
                <div>
                  <p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">{selectedOrder.customerName}</p>
                  <p className="text-xs text-zinc-500 mt-1">1 order</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Contact information</h4>
                    <Edit size={13} onClick={() => { startEdit(); setActiveModal('customer'); }} className="text-blue-600 cursor-pointer hover:text-blue-800" />
                  </div>
                  <p className="text-sm text-blue-600 hover:underline cursor-pointer">{selectedOrder.customerEmail}</p>
                  <p className="text-sm text-zinc-900 mt-1">{selectedOrder.customerPhone || 'No phone number'}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Shipping address</h4>
                    <Edit size={13} onClick={() => { startEdit(); setActiveModal('customer'); }} className="text-blue-600 cursor-pointer hover:text-blue-800" />
                  </div>
                  <div className="text-sm text-zinc-700 leading-relaxed">
                    <p>{selectedOrder.customerName}</p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country || 'India'}</p>
                    <p className="mt-1">{selectedOrder.customerPhone}</p>
                  </div>
                  <p className="text-sm text-blue-600 hover:underline cursor-pointer mt-3 font-medium">View map</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-zinc-500 mb-2 tracking-wider">Billing address</h4>
                  <p className="text-sm text-zinc-500">Same as shipping address</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Action Modals */}
        <Dialog open={isEditing && !!activeModal} onOpenChange={(o) => { if (!o) { setIsEditing(false); setActiveModal(null); } }}>
          <DialogContent className="sm:max-w-[600px] bg-white text-zinc-900">
            {/* ... Existing dialog content ... */}
            <DialogHeader>
              <DialogTitle className="text-zinc-900">
                {activeModal === 'tracking' && 'Update Tracking'}
                {activeModal === 'customer' && 'Edit Customer Info'}
                {activeModal === 'notes' && 'Edit Notes'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {activeModal === 'tracking' && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-xs font-bold text-zinc-500 uppercase">Carrier</label>
                    <input
                      className="col-span-3 h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      value={editForm.trackingInfo?.carrier || ''}
                      onChange={(e) => setEditForm({ ...editForm, trackingInfo: { ...editForm.trackingInfo, carrier: e.target.value } })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-xs font-bold text-zinc-500 uppercase">Tracking #</label>
                    <input
                      className="col-span-3 h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      value={editForm.trackingInfo?.trackingNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, trackingInfo: { ...editForm.trackingInfo, trackingNumber: e.target.value } })}
                    />
                  </div>
                </>
              )}

              {activeModal === 'customer' && (
                <>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                    <div className="space-y-5">
                      <h4 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2 mb-2">Contact Information</h4>
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editForm.customerName || ''}
                          onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.customerEmail || ''}
                          onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editForm.customerPhone || ''}
                          onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-5 pt-4">
                      <h4 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2 mb-2">Shipping Address</h4>
                      <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={editForm.shippingAddress?.address || ''}
                          onChange={(e) => setEditForm({ ...editForm, shippingAddress: { ...editForm.shippingAddress, address: e.target.value } })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={editForm.shippingAddress?.city || ''}
                            onChange={(e) => setEditForm({ ...editForm, shippingAddress: { ...editForm.shippingAddress, city: e.target.value } })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={editForm.shippingAddress?.postalCode || ''}
                            onChange={(e) => setEditForm({ ...editForm, shippingAddress: { ...editForm.shippingAddress, postalCode: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={editForm.shippingAddress?.country || ''}
                          onChange={(e) => setEditForm({ ...editForm, shippingAddress: { ...editForm.shippingAddress, country: e.target.value } })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'notes' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Order Notes</label>
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsEditing(false); setActiveModal(null); }}>Cancel</Button>
              <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => { handleUpdateOrder(); setActiveModal(null); }}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this order? This action cannot be undone and will permanently remove the order from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Order"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div >
    );
  }

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={filteredOrders}
        searchKey="customerName"
        searchPlaceholder="Order or Manifest lookup..."
        onRowClick={(row) => { setSelectedOrder(row); setIsEditing(false); }}
        headerContent={
          <div className="flex flex-col gap-3 max-w-md">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Orders</h1>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-xs font-medium bg-zinc-100/80 px-2.5 py-1 rounded-full border border-zinc-200/50 text-zinc-600">
                <span>Total Orders</span>
                <span className="bg-white px-1.5 py-0.5 rounded-md shadow-sm text-zinc-900 font-bold border border-zinc-200">{totalCount}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium bg-zinc-100/80 px-2.5 py-1 rounded-full border border-zinc-200/50 text-zinc-600">
                <span>Open</span>
                <span className="bg-white px-1.5 py-0.5 rounded-md shadow-sm text-amber-700 font-bold border border-amber-200/50">{openCount}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium bg-zinc-100/80 px-2.5 py-1 rounded-full border border-zinc-200/50 text-zinc-600">
                <span>Delivered</span>
                <span className="bg-white px-1.5 py-0.5 rounded-md shadow-sm text-emerald-700 font-bold border border-emerald-200/50">{deliveredCount}</span>
              </div>
            </div>
          </div>
        }
        tabs={[
          { value: "all", label: "Omnichannel" },
          { value: "processing", label: "Open Orders" },
          { value: "delivered", label: "Fulfilled" }
        ]}
        onTabChange={setActiveTab}
      />

      {/* Delete Confirmation for List View - Reused */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default OrderList;
