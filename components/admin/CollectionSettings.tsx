
import React, { useState, useEffect } from 'react';
import { Product, Collection } from '../../types';
import { COLORS } from '../../constants';
import MediaPicker from './MediaPicker';
import { getApiUrl } from '../../utils/apiHelper';

const CollectionSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Partial<Collection>>({ 
        isActive: true, 
        products: [], 
        displayStyle: 'Rectangle' 
    });
    const [productSearch, setProductSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [collRes, prodRes] = await Promise.all([
                fetch(getApiUrl('/api/collections/admin/all'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/products'))
            ]);

            if (collRes.ok) {
                const data = await collRes.json();
                if(!Array.isArray(data)) throw new Error("Collections data from API is not a valid array.");
                setCollections(data);
            } else {
                const errorData = await collRes.json().catch(() => ({ message: `Failed to fetch collections (Status: ${collRes.status})` }));
                throw new Error(errorData.message);
            }
            
            if (prodRes.ok) {
                const data = await prodRes.json();
                if(!Array.isArray(data)) throw new Error("Products data from API is not a valid array.");
                setAllProducts(data);
            } else {
                 const errorData = await prodRes.json().catch(() => ({ message: `Failed to fetch products (Status: ${prodRes.status})` }));
                 throw new Error(errorData.message);
            }
        } catch (error: any) {
            console.error("Error fetching data for collections:", error);
            setError(error.message);
            setCollections([]);
            setAllProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const handleSave = async () => {
        const method = editingCollection.id ? 'PUT' : 'POST';
        const url = editingCollection.id ? getApiUrl(`/api/collections/${editingCollection.id}`) : getApiUrl('/api/collections');
        
        // Convert product objects to IDs for saving
        const payload = {
            ...editingCollection,
            products: editingCollection.products?.map(p => typeof p === 'object' ? p.id : p) || []
        };

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            fetchData();
            setIsModalOpen(false);
            setEditingCollection({ isActive: true, products: [], displayStyle: 'Rectangle' });
        } else {
            alert('Failed to save collection');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this collection?")) return;
        await fetch(getApiUrl(`/api/collections/${id}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        fetchData();
    };

    const toggleProduct = (product: Product) => {
        const current = editingCollection.products || [];
        // Handle both populated objects and ID strings
        const exists = current.find(p => (typeof p === 'object' ? p.id : p) === product.id);
        
        let updated;
        if (exists) {
            updated = current.filter(p => (typeof p === 'object' ? p.id : p) !== product.id);
        } else {
            updated = [...current, product];
        }
        setEditingCollection({ ...editingCollection, products: updated });
    };

    const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    
    // --- Render Helper for Collection Shape ---
    const getShapeClasses = (style?: string) => {
        switch(style) {
            case 'Circle': return 'rounded-full aspect-square w-32 mx-auto';
            case 'Square': return 'rounded-xl aspect-square w-full';
            default: return 'rounded-xl aspect-[3/4] w-full'; // Default Portrait
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
            </div>
        );
    }

    return (
        <div>
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-700 text-lg">Collections (Shop By Category)</h3>
                    <p className="text-xs text-gray-500">Manage categories and their visual style (Circle, Square, etc.)</p>
                </div>
                <button 
                    onClick={() => { setEditingCollection({ isActive: true, products: [], displayStyle: 'Rectangle' }); setIsModalOpen(true); }}
                    className="bg-rose-600 text-white px-4 py-2 rounded-md text-sm"
                >
                    + New Collection
                </button>
            </div>

            {/* Collections Grid - Admin View reflecting Frontend Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {collections.map(col => (
                    <div key={col.id} className="relative group flex flex-col items-center">
                        <div className={`overflow-hidden border bg-gray-100 relative ${getShapeClasses(col.displayStyle)}`}>
                            {col.imageUrl ? (
                                <img 
                                    src={col.imageUrl} 
                                    alt={col.title} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium text-xs text-center p-2">
                                    No Image
                                </div>
                            )}
                            
                            {/* Overlay Edit Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button onClick={() => { setEditingCollection(col); setIsModalOpen(true); }} className="bg-white text-blue-600 p-1.5 rounded-full hover:bg-blue-50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(col.id)} className="bg-white text-red-600 p-1.5 rounded-full hover:bg-red-50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-3 text-center">
                            <h4 className="font-bold text-gray-800 text-sm">{col.title}</h4>
                            <p className="text-[10px] text-blue-600 font-mono">/{col.slug}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {col.displayStyle === 'ImageOnly' ? 'Image Only' : `${col.products?.length || 0} items`}
                            </p>
                            {!col.isActive && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">Hidden</span>}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-fade-in-right">
                        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editingCollection.id ? 'Edit Collection' : 'New Collection'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800">Close</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Collection Title</label>
                                <input type="text" value={editingCollection.title || ''} onChange={e => setEditingCollection({...editingCollection, title: e.target.value})} className="w-full border p-2 rounded focus:ring-rose-500 focus:border-rose-500" placeholder="e.g. Summer Dresses"/>
                            </div>
                            
                            {/* Display Design Selector */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-sm font-bold text-gray-700 mb-3">Display Design</label>
                                <div className="grid grid-cols-4 gap-4">
                                    {['Rectangle', 'Square', 'Circle', 'ImageOnly'].map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => setEditingCollection({ ...editingCollection, displayStyle: style as any })}
                                            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                                                editingCollection.displayStyle === style 
                                                ? 'border-rose-600 bg-rose-50 text-rose-700' 
                                                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                                            }`}
                                        >
                                            {/* Visual Icon representing the shape */}
                                            <div className={`w-8 h-8 bg-current mb-2 ${style === 'Circle' ? 'rounded-full' : style === 'Square' ? 'rounded-md' : 'w-6 h-8 rounded-md'}`}></div>
                                            <span className="text-[10px] font-medium text-center leading-tight">
                                                {style === 'ImageOnly' ? 'Only Image' : style}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    "Only Image" will hide the collection name on the homepage. Others show name below image.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                <MediaPicker 
                                    value={editingCollection.imageUrl || ''} 
                                    onChange={url => setEditingCollection({...editingCollection, imageUrl: url})} 
                                    type="image"
                                    placeholder="Select an image (optional)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea rows={3} value={editingCollection.description || ''} onChange={e => setEditingCollection({...editingCollection, description: e.target.value})} className="w-full border p-2 rounded"/>
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={editingCollection.isActive} onChange={e => setEditingCollection({...editingCollection, isActive: e.target.checked})} className="h-4 w-4 text-rose-600 rounded"/>
                                <label className="text-sm text-gray-700">Visible on Homepage</label>
                            </div>

                            <div className="border-t pt-6">
                                <h4 className="font-bold text-gray-800 mb-2">Manage Products</h4>
                                <p className="text-xs text-gray-500 mb-4">Select products to include in this collection.</p>
                                
                                <input 
                                    type="text" 
                                    placeholder="Search products to add..." 
                                    className="w-full border p-2 rounded mb-3 text-sm"
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                />

                                <div className="h-64 overflow-y-auto border rounded bg-gray-50 p-2 space-y-1">
                                    {filteredProducts.map(prod => {
                                        // Check if product is selected (handling object vs string ID)
                                        const isSelected = editingCollection.products?.some(p => (typeof p === 'object' ? p.id : p) === prod.id);
                                        return (
                                            <div key={prod.id} onClick={() => toggleProduct(prod)} className={`p-2 rounded flex items-center gap-3 cursor-pointer ${isSelected ? 'bg-rose-50 border border-rose-200' : 'bg-white border border-transparent hover:border-gray-200'}`}>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-rose-600 border-rose-600' : 'border-gray-400'}`}>
                                                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                                                </div>
                                                <img src={prod.imageUrl} className="w-8 h-8 object-cover rounded"/>
                                                <span className="text-sm truncate flex-1">{prod.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-2 text-sm text-gray-500 text-right">
                                    {editingCollection.products?.length} products selected
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border bg-white rounded text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 shadow-sm">Save Collection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollectionSettings;
