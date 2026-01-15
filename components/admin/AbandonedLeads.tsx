
import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/apiHelper';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Info, Search, ArrowUpDown, Download, CheckCircle, MapPin, MoreHorizontal, X, CreditCard, Mail } from "lucide-react";

interface AbandonedLead {
    _id: string;
    checkoutId?: number;
    email: string;
    phone: string;
    name: string;
    total: number;
    status: string;
    createdAt: string;
    lastAttempt: string;
    items: {
        productId: string;
        name: string;
        quantity: number;
        price: number;
        imageUrl?: string;
    }[];
    shippingAddress?: {
        city: string;
        country: string;
        address?: string;
        postalCode?: string;
    }
}

const AbandonedLeads: React.FC<{ token: string | null }> = ({ token }) => {
    const [leads, setLeads] = useState<AbandonedLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<AbandonedLead | null>(null);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const res = await fetch(getApiUrl('/api/orders/abandoned'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setLeads(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchLeads();
    }, [token]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;

    if (selectedLead) {
        return (
            <div className="fixed inset-0 z-50 bg-[#f1f1f1] overflow-y-auto pb-10 font-sans">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedLead(null)} className="h-8 w-8 -ml-2 text-gray-500 hover:bg-gray-100">
                                <span className="text-xl">←</span>
                            </Button>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">#{selectedLead.checkoutId || selectedLead._id.substring(0, 8)}</h1>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                                    Abandoned
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    Not Recovered
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 pl-9">
                            {formatDate(selectedLead.lastAttempt || selectedLead.createdAt)} from Online Store
                        </p>
                    </div>
                    <div className="pl-9 md:pl-0">
                        <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium h-9">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Cart Recovery Email
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Abandoned Cart Details */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                <h3 className="text-sm font-bold text-gray-900">Abandoned Cart Details</h3>
                            </div>
                            <div className="p-6">
                                {selectedLead.items && selectedLead.items.length > 0 ? selectedLead.items.map((item, i) => (
                                    <div key={i} className={`flex gap-4 ${i !== 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}`}>
                                        <div className="h-16 w-16 bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] text-gray-400 text-center leading-tight">No<br />Image</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer leading-snug">
                                                        {item.name}
                                                    </p>
                                                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded textxs bg-gray-100 text-gray-500 font-medium">
                                                        ₹{item.price}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-900">
                                                        ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-900 mt-1">
                                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 italic">No items available</p>
                                )}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                <h3 className="text-sm font-bold text-gray-900">Total</h3>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-600">{selectedLead.items?.length || 0} item(s)</span>
                                    <span className="font-medium text-gray-900">₹{selectedLead.total.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="pt-4 mt-2 border-t border-gray-100 md:border-dashed md:border-gray-200 flex justify-between items-center">
                                    <span className="font-bold text-base text-gray-900">Total</span>
                                    <span className="font-bold text-base text-gray-900">₹{selectedLead.total.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Customer */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-900">Customer</h3>
                                <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Contact Information</h4>
                                    {selectedLead.name && (
                                        <p className="text-sm text-gray-900 mb-1">{selectedLead.name}</p>
                                    )}
                                    <p className="text-sm text-blue-600 hover:underline cursor-pointer mb-1 w-full truncate">
                                        {selectedLead.email}
                                    </p>
                                    {selectedLead.phone && (
                                        <p className="text-sm text-gray-900">{selectedLead.phone}</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Shipping Address</h4>
                                    <div className="text-sm text-gray-900 leading-relaxed">
                                        {selectedLead.shippingAddress ? (
                                            <>
                                                {selectedLead.shippingAddress.address && <p>{selectedLead.shippingAddress.address}</p>}
                                                <p>
                                                    {selectedLead.shippingAddress.city && `${selectedLead.shippingAddress.city}, `}
                                                    {selectedLead.shippingAddress.country || 'India'}
                                                </p>
                                                {selectedLead.shippingAddress.postalCode && <p className="mt-0.5">{selectedLead.shippingAddress.postalCode}</p>}
                                            </>
                                        ) : (
                                            <p className="text-gray-400 italic">No shipping address provided</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between px-1">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">Abandoned checkouts</h1>
                <Button variant="outline" size="sm" className="gap-2 font-bold text-xs uppercase tracking-wider">
                    <Download className="w-3.5 h-3.5" /> Export
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-1 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 font-bold text-xs bg-gray-100 text-gray-900 rounded-md px-3">All</Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900">+</Button>
                </div>
                <div className="flex items-center gap-2 px-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className="h-8 pl-8 pr-3 text-xs border border-gray-200 rounded-md w-48 focus:outline-none focus:border-zinc-300 transition-colors" placeholder="Search..." />
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-gray-200 rounded-md text-gray-500">
                        <ArrowUpDown className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-h-[70vh] overflow-y-auto">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead className="w-[50px] pl-4"><Checkbox /></TableHead>
                            <TableHead className="w-[180px] text-xs font-bold text-gray-500 uppercase tracking-tight">Checkout</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-tight cursor-pointer flex items-center gap-1">
                                Date <ArrowUpDown className="w-3 h-3" />
                            </TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-tight">Customer</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-tight">Region</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-tight">Email Status</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-tight">Recovery Status</TableHead>
                            <TableHead className="text-right text-xs font-bold text-gray-500 uppercase tracking-tight pr-6">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.length > 0 ? leads.map((lead) => (
                            <TableRow
                                key={lead._id}
                                className="hover:bg-gray-50 border-gray-50 group transition-colors cursor-pointer"
                                onClick={() => setSelectedLead(lead)}
                            >
                                <TableCell className="pl-4"><Checkbox onClick={(e) => e.stopPropagation()} /></TableCell>
                                <TableCell className="font-bold text-zinc-700 text-xs text-nowrap">#{lead.checkoutId || lead._id.substring(0, 8)}</TableCell>
                                <TableCell className="text-xs text-gray-500 font-medium whitespace-nowrap">{formatDate(lead.lastAttempt || lead.createdAt)}</TableCell>
                                <TableCell className="text-xs text-gray-600 font-medium max-w-[200px] truncate" title={lead.email}>
                                    {lead.email || lead.phone || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-xs text-gray-500 font-medium">
                                    {lead.shippingAddress?.city || 'India'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 font-bold text-[10px] uppercase shadow-none px-2 py-0.5 rounded-full">
                                        Sent
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100 font-bold text-[10px] uppercase shadow-none px-2 py-0.5 rounded-full">
                                        Not Recovered
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-zinc-900 pr-6 text-sm">₹{lead.total.toLocaleString()}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center text-gray-400 italic bg-gray-50/20">
                                    No abandoned checkouts found yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-center pt-4">
                <p className="text-xs font-medium text-gray-500 cursor-pointer hover:underline hover:text-zinc-800 transition-colors">
                    Learn more about abandoned checkouts
                </p>
            </div>
        </div>
    );
};

export default AbandonedLeads;
