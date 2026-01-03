
import React, { useState, useEffect, useRef } from 'react';
import { Product, User } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { Icons, COLORS } from '../../constants';

interface CreateOrderProps {
    token: string | null;
    onOrderCreated: () => void;
}

interface LineItem extends Product {
    quantity: number;
    customPrice?: number; 
}

interface CustomerInfo {
    id?: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
}

const CreateOrder: React.FC<CreateOrderProps> = ({ token, onOrderCreated }) => {
    // --- State Management ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState<User[]>([]);
    const [isCustomerSearching, setIsCustomerSearching] = useState(false);

    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        name: '', email: '', phone: '', address: '', city: '', postalCode: '', country: 'India'
    });
    
    const [discount, setDiscount] = useState(0);
    const [shipping, setShipping] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid'>('Pending');
    const [notes, setNotes] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [loading, setLoading] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const customerSearchRef = useRef<HTMLDivElement>(null);

    // --- Product Search/Browse Logic ---
    const performProductSearch = async (query: string) => {
        try {
            const res = await fetch(getApiUrl(`/api/products/search?q=${encodeURIComponent(query)}`));
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            }
        } catch (e) {
            console.error("Product search failed", e);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length > 1) {
                performProductSearch(searchTerm);
            } else if (searchTerm.length === 0 && isSearching) {
                performProductSearch(''); // Gets latest arrivals by default
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, isSearching]);

    // --- Customer Search Logic ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (customerSearch.length > 1 || (customerSearch.length === 0 && isCustomerSearching)) {
                try {
                    const res = await fetch(getApiUrl(`/api/users`), { 
                        headers: { 'Authorization': `Bearer ${token}` } 
                    });
                    if (res.ok) {
                        const allUsers: User[] = await res.json();
                        const filtered = customerSearch 
                            ? allUsers.filter(u => 
                                u.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                                u.email.toLowerCase().includes(customerSearch.toLowerCase())
                              )
                            : allUsers;
                        setCustomerResults(filtered.slice(0, 8));
                    }
                } catch (e) {
                    console.error("Customer fetch failed", e);
                }
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [customerSearch, isCustomerSearching, token]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearching(false);
            }
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
                setIsCustomerSearching(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Handlers ---
    const handleBrowseClick = () => {
        setIsSearching(true);
        if (searchResults.length === 0) performProductSearch('');
    };

    const addProduct = (product: Product) => {
        const existing = lineItems.find(i => i.id === product.id);
        if (existing) {
            setLineItems(prev => prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setLineItems(prev => [...prev, { ...product, quantity: 1 }]);
        }
        setIsSearching(false);
        setSearchTerm('');
    };

    const removeProduct = (id: string) => {
        setLineItems(prev => prev.filter(i => i.id !== id));
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) return;
        setLineItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
    };

    const selectCustomer = (user: User) => {
        setCustomerInfo({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: (user as any).phone || '',
            address: (user as any).shippingAddress?.address || '',
            city: (user as any).shippingAddress?.city || '',
            postalCode: (user as any).shippingAddress?.postalCode || '',
            country: (user as any).shippingAddress?.country || 'India'
        });
        setIsCustomerSearching(false);
        setCustomerSearch('');
    };

    const calculateTotal = () => {
        const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return Math.max(0, subtotal + shipping - discount);
    };

    const handleSubmit = async () => {
        if (lineItems.length === 0) return alert('Please add products.');
        if (!customerInfo.email) return alert('Customer email is required.');

        setLoading(true);
        try {
            const payload = {
                customerInfo,
                items: lineItems,
                financials: {
                    subtotal: lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    discount,
                    shipping,
                    total: calculateTotal()
                },
                notes,
                paymentStatus,
                sendEmail
            };

            const res = await fetch(getApiUrl('/api/orders/manual'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Order created successfully!');
                onOrderCreated(); 
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (e) {
            console.error(e);
            alert('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onOrderCreated} className="p-2 rounded-full hover:bg-gray-200">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">Create Order</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Products Management */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">Products</h3>
                        </div>
                        <div className="p-4">
                            <div className="relative mb-4" ref={searchRef}>
                                <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                                    <span className="pl-3 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </span>
                                    <input 
                                        type="text" 
                                        className="w-full p-2.5 outline-none rounded-md"
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        onFocus={() => setIsSearching(true)}
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleBrowseClick}
                                        className="px-4 py-2 bg-gray-100 border-l hover:bg-gray-200 text-sm font-medium text-gray-600 rounded-r-md"
                                    >
                                        Browse
                                    </button>
                                </div>
                                
                                {isSearching && searchResults.length > 0 && (
                                    <div className="absolute border border-gray-200 left-0 right-0 z-50 w-full bg-white border border-gray-200 shadow-xl rounded-md mt-1 max-h-60 overflow-y-auto">
                                        {searchResults.map(prod => (
                                            <div key={prod.id} onClick={() => addProduct(prod)} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                                                <img src={prod.imageUrl} className="w-10 h-10 object-cover rounded bg-gray-100" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-800">{prod.name}</p>
                                                    <p className="text-xs text-gray-500">SKU: {prod.sku || 'N/A'}</p>
                                                </div>
                                                <p className="text-sm font-bold text-gray-700">₹{prod.price}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {lineItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm italic">No products added yet. Use browse or search above.</div>
                            ) : (
                                <div className="space-y-4">
                                    {lineItems.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4 py-2 border-b border-gray-50 last:border-0 animate-fade-in">
                                            <img src={item.imageUrl} className="w-12 h-12 object-cover rounded border" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                                <p className="text-xs text-gray-500">₹{item.price}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={e => updateQuantity(item.id, Number(e.target.value))} 
                                                    className="w-16 border rounded p-1 text-center text-sm mr-4"
                                                />
                                                <p className="text-sm font-bold text-gray-800 w-20 text-right">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                <button onClick={() => removeProduct(item.id)} className="ml-4 text-gray-400 hover:text-red-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment & Totals */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Payment Summary</h3>
                        </div>
                        <div className="p-4 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>₹{lineItems.reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Discount Amount</span>
                                <div className="flex items-center gap-2">
                                    <span>- ₹</span>
                                    <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-24 border border-gray-300 rounded p-1.5 text-right" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Shipping Fees</span>
                                <div className="flex items-center gap-2">
                                    <span>+ ₹</span>
                                    <input type="number" value={shipping} onChange={e => setShipping(Number(e.target.value))} className="w-24 border border-gray-300 rounded p-1.5 text-right" />
                                </div>
                            </div>
                            <div className="border-t pt-3 flex justify-between items-center text-lg font-bold">
                                <span>Total Payable</span>
                                <span className="text-[#16423C]">₹{calculateTotal().toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="emailInvoice" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="h-4 w-4 text-blue-600 rounded" />
                                <label htmlFor="emailInvoice" className="text-sm text-gray-700">Send email notification</label>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setPaymentStatus(prev => prev === 'Paid' ? 'Pending' : 'Paid')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-all ${paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                >
                                    {paymentStatus === 'Paid' ? 'Status: Paid' : 'Mark as Paid'}
                                </button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={loading || lineItems.length === 0}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-black disabled:opacity-50 shadow-lg"
                                >
                                    {loading ? 'Processing...' : 'Complete Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Customer Selection Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Customer Details</h3>
                        </div>
                        <div className="p-4">
                            <div className="relative mb-4" ref={customerSearchRef}>
                                <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
                                    <span className="pl-3 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2}/></svg>
                                    </span>
                                    <input 
                                        type="text" 
                                        className="w-full border-none rounded-md p-2 text-sm focus:ring-0"
                                        placeholder="Search by name or email"
                                        value={customerSearch}
                                        onChange={e => setCustomerSearch(e.target.value)}
                                        onFocus={() => setIsCustomerSearching(true)}
                                    />
                                </div>
                                {isCustomerSearching && customerResults.length > 0 && (
                                    <div className="absolute border border-gray-100 left-0 right-0 z-50 w-full bg-white border border-gray-200 shadow-2xl rounded-md mt-1 max-h-48 overflow-y-auto">
                                        {customerResults.map(u => (
                                            <div key={u.id} onClick={() => selectCustomer(u)} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 group">
                                                <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{u.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{u.email}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Full Name</label>
                                    <input type="text" placeholder="Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Email Address</label>
                                    <input type="email" placeholder="Email" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Phone</label>
                                    <input type="text" placeholder="Phone" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div className="pt-3 border-t mt-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Shipping Destination</label>
                                    <div className="space-y-3">
                                        <textarea placeholder="Street Address" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 resize-none" rows={2} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" placeholder="City" value={customerInfo.city} onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" />
                                            <input type="text" placeholder="Pincode" value={customerInfo.postalCode} onChange={e => setCustomerInfo({...customerInfo, postalCode: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" />
                                        </div>
                                        <input type="text" placeholder="Country" value={customerInfo.country} onChange={e => setCustomerInfo({...customerInfo, country: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Notes */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Order Notes</h3>
                        </div>
                        <div className="p-4">
                            <textarea 
                                placeholder="Internal notes or customer requests..." 
                                rows={4} 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full border-gray-300 rounded-md text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 p-3"
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateOrder;
