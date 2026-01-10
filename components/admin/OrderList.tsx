import React, { useState, useEffect, useMemo } from 'react';
import { Order } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { 
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '../ui/table';
import { 
    Download, Search, Eye, FileDown, 
    ChevronLeft, ChevronRight, Filter, Calendar, Package
} from '../Icons';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem 
} from '../ui/select';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { cn } from '../../utils/utils';

const OrderList: React.FC<{token: string | null}> = ({token}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('orders'), { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
          const data = await res.json();
          setOrders(data);
      }
    } catch (error) { 
      console.error("Order fetch error:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        const orderIdStr = order?.id || (order as any)?._id || '';
        const orderNumStr = order.orderNumber?.toString() || orderIdStr;
        const custName = order.customerName || '';
        const matchesSearch = orderNumStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             custName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All Status" || 
                             (order.status || '').toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    const s = status ? status.toLowerCase() : 'pending';
    if (s === 'delivered' || s === 'paid') return <Badge className="bg-[#E6F4EA] text-[#1E8E3E] hover:bg-[#E6F4EA] border-none px-3 py-1 font-medium text-xs rounded-lg">{status}</Badge>;
    if (s === 'shipped') return <Badge className="bg-[#E8F0FE] text-[#1967D2] hover:bg-[#E8F0FE] border-none px-3 py-1 font-medium text-xs rounded-lg">{status}</Badge>;
    if (s === 'processing' || s === 'pending') return <Badge className="bg-[#FEF7E0] text-[#B06000] hover:bg-[#FEF7E0] border-none px-3 py-1 font-medium text-xs rounded-lg">{status}</Badge>;
    if (s === 'cancelled') return <Badge className="bg-[#FCE8E6] text-[#D93025] hover:bg-[#FCE8E6] border-none px-3 py-1 font-medium text-xs rounded-lg">{status}</Badge>;
    return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-none px-3 py-1 font-medium text-xs rounded-lg">{status}</Badge>;
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-zinc-400 font-medium italic tracking-widest uppercase">Fetching Order Data...</div>;

  return (
    <div className="space-y-6 bg-white p-6 md:p-8 rounded-xl border border-zinc-200 shadow-sm animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Orders</h2>
              <p className="text-zinc-500 text-sm mt-1">Manage and track your customer orders</p>
          </div>
          <div className="flex gap-3">
              <Button variant="outline" className="h-10 rounded-lg text-zinc-700 border-zinc-200 gap-2 font-semibold">
                  <Download className="w-4 h-4" /> Export
              </Button>
              <Button variant="outline" className="h-10 rounded-lg text-zinc-700 border-zinc-200 gap-2 font-semibold">
                  <Calendar className="w-4 h-4" /> Date Range
              </Button>
          </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                  placeholder="Search by order ID or customer..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-zinc-200 focus-visible:ring-zinc-400 rounded-lg bg-zinc-50/30"
              />
          </div>
          <div className="w-full md:w-auto">
              {/* Fix: Removed 'open' and 'onOpenChange' as they are not assignable to Select in ui/select.tsx */}
              <Select 
                value={statusFilter} 
                onValueChange={(val) => {
                  setStatusFilter(val);
                }}
              >
                  <SelectTrigger className="w-full md:w-[180px] rounded-lg h-10 border-zinc-200 font-medium bg-white">
                      <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-zinc-400" />
                          <SelectValue placeholder="All Status" />
                      </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg shadow-xl border-zinc-200 bg-white">
                      <SelectItem value="All Status">All Status</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
              </Select>
          </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-zinc-800 h-12 uppercase text-[11px] tracking-wider">Order ID ⇅</TableHead>
              <TableHead className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">Date ⇅</TableHead>
              <TableHead className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">Customer</TableHead>
              <TableHead className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">Status</TableHead>
              <TableHead className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">Items</TableHead>
              <TableHead className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">Total ⇅</TableHead>
              <TableHead className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">Payment</TableHead>
              <TableHead className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => {
                const orderIdStr = order?.id || (order as any)?._id || '';
                const displayId = order.orderNumber ? `#${order.orderNumber}` : `#${orderIdStr.toString().substring(0, 8).toUpperCase()}`;
                
                return (
                  <TableRow 
                    key={orderIdStr} 
                    className="hover:bg-zinc-50 transition-colors border-zinc-200 cursor-pointer group"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="font-bold text-zinc-900 py-5">{displayId}</TableCell>
                    <TableCell className="text-zinc-600 font-medium">
                        {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                          <span className="font-bold text-zinc-900">{order.customerName}</span>
                          <span className="text-[11px] text-zinc-400 font-medium truncate max-w-[150px]">
                              {order.customerEmail}
                          </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-zinc-600 font-medium">{order.items?.length || 0} items</TableCell>
                    <TableCell className="font-bold text-zinc-900">₹{order.total?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-zinc-400 font-medium">{order.checkoutType === 'magic' ? 'Magic Pay' : 'Standard'}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-zinc-900" onClick={() => setSelectedOrder(order)}>
                                <Eye className="w-4.5 h-4.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-zinc-900">
                                <FileDown className="w-4.5 h-4.5" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-zinc-400 font-medium italic">No orders found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Section */}
        <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white border-t border-zinc-200">
            <p className="text-sm text-zinc-500 font-medium">
                Showing {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 rounded-lg border-zinc-200 text-zinc-700 font-semibold gap-1" 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                
                <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentPage(i + 1)}
                            className={cn(
                                "w-9 h-9 rounded-lg text-sm font-bold transition-all",
                                currentPage === i + 1 
                                ? "bg-zinc-900 text-white" 
                                : "text-zinc-600 hover:bg-zinc-100"
                            )}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 rounded-lg border-zinc-200 text-zinc-700 font-semibold gap-1" 
                    disabled={currentPage === totalPages || totalPages === 0} 
                    onClick={() => setCurrentPage(p => p + 1)}
                >
                    Next <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
      </div>

      {/* Order Details Side Drawer */}
      <Drawer isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details">
        {selectedOrder && (
          <div className="flex flex-col h-full bg-white">
            <div className="p-6 border-b bg-zinc-50/50">
              <DrawerHeader className="p-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <DrawerTitle className="text-2xl font-bold">
                      {selectedOrder.orderNumber ? `#${selectedOrder.orderNumber}` : `#${selectedOrder.id?.substring(0, 8).toUpperCase()}`}
                    </DrawerTitle>
                    <DrawerDescription className="mt-1">
                      Placed on {new Date(selectedOrder.date).toLocaleString()}
                    </DrawerDescription>
                  </div>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </DrawerHeader>
            </div>

            <DrawerContent className="p-6 space-y-8">
              {/* Customer Info */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Customer Info</h4>
                <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/30">
                  <p className="text-sm font-bold text-zinc-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-zinc-600 mt-1">{selectedOrder.customerEmail}</p>
                  <p className="text-sm text-zinc-600">{selectedOrder.customerPhone || 'No phone provided'}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Shipping Address</h4>
                <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/30">
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    {selectedOrder.shippingAddress?.address}<br/>
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}<br/>
                    {selectedOrder.shippingAddress?.country}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Items Ordered</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center p-3 rounded-xl border border-zinc-50">
                      <div className="h-12 w-12 rounded-lg overflow-hidden border border-zinc-100 shrink-0">
                        <img src={item.imageUrl || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">{item.name}</p>
                        <p className="text-xs text-zinc-500 font-medium">QTY: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-bold text-zinc-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="pt-6 border-t border-zinc-100">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-zinc-500">Order Total</span>
                  <span className="text-zinc-900 text-2xl font-black">₹{selectedOrder.total?.toLocaleString()}</span>
                </div>
              </div>

              {/* Internal Notes */}
              {selectedOrder.notes && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Admin Notes</h4>
                  <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-100 text-sm italic text-zinc-600">
                    "{selectedOrder.notes}"
                  </div>
                </div>
              )}
            </DrawerContent>

            <DrawerFooter className="p-6 border-t bg-zinc-50/50 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              <Button className="flex-1 h-12 rounded-xl bg-[#16423C] text-white font-bold shadow-lg">
                Update Status
              </Button>
            </DrawerFooter>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default OrderList;