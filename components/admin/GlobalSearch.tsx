
import React, { useState, useEffect, useRef } from 'react';
import { Product, Order, User } from '../../types';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    orders: Order[];
    customers: User[];
    setCurrentView: (view: any) => void;
}

interface SearchResult {
    type: 'Product' | 'Order' | 'Customer' | 'Navigation';
    id: string;
    title: string;
    description: string;
    data: any;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, products, orders, customers, setCurrentView }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Hardcoded navigation links
    const navLinks: SearchResult[] = [
        { type: 'Navigation', id: 'nav-products', title: 'View All Products', description: 'Go to Product Management', data: { view: 'products' } },
        { type: 'Navigation', id: 'nav-orders', title: 'View All Orders', description: 'Go to Order Management', data: { view: 'orders' } },
        { type: 'Navigation', id: 'nav-customers', title: 'View All Customers', description: 'Go to Customer List', data: { view: 'customers' } },
        { type: 'Navigation', id: 'nav-settings', title: 'Store Settings', description: 'Go to Settings', data: { view: 'settings' } },
    ];

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100); // Focus input when opened
        }
    }, [isOpen]);

    useEffect(() => {
        if (!searchTerm) {
            setResults(navLinks);
            return;
        }

        const term = searchTerm.toLowerCase();
        
        const productResults: SearchResult[] = products
            .filter(p => p.name.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term))
            .map(p => ({ type: 'Product', id: p.id, title: p.name, description: `SKU: ${p.sku || 'N/A'} | Price: ₹${p.price}`, data: p }));

        const orderResults: SearchResult[] = orders
            .filter(o => o.id.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term) || o.customerEmail.toLowerCase().includes(term))
            .map(o => ({ type: 'Order', id: o.id, title: `Order #${o.id.substring(0, 7)}`, description: `By ${o.customerName} for ₹${o.total}`, data: o }));

        const customerResults: SearchResult[] = customers
            .filter(c => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term))
            .map(c => ({ type: 'Customer', id: c.id, title: c.name, description: c.email, data: c }));

        const navResults = navLinks.filter(n => n.title.toLowerCase().includes(term));
        
        setResults([...productResults, ...orderResults, ...customerResults, ...navResults]);

    }, [searchTerm, products, orders, customers]);

    const handleSelect = (result: SearchResult) => {
        // Here you would navigate to the specific item.
        // For now, it will just log and close.
        console.log('Selected:', result);
        if (result.type === 'Navigation') {
            setCurrentView(result.data.view);
        }
        if(result.type === 'Product') {
            alert('Navigation to specific product editor is not implemented yet.')
        }
        if(result.type === 'Order') {
            alert('Navigation to specific order is not implemented yet.')
        }
        if(result.type === 'Customer') {
            alert('Navigation to specific customer is not implemented yet.')
        }

        onClose();
        setSearchTerm('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-20 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search for anything..."
                        className="w-full p-4 text-lg border-b border-gray-200 focus:outline-none"
                    />
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {results.length > 0 ? (
                        results.map(result => (
                            <div key={`${result.type}-${result.id}`} onClick={() => handleSelect(result)} className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-800">{result.title}</p>
                                    <p className="text-sm text-gray-500">{result.description}</p>
                                </div>
                                <span className="text-xs font-semibold uppercase text-gray-400 bg-gray-100 px-2 py-1 rounded">{result.type}</span>
                            </div>
                        ))
                    ) : (
                        <p className="p-8 text-center text-gray-500">No results found for "{searchTerm}".</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
