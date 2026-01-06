
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
                setCollections(data);
            }
            if (prodRes.ok) {
                const data = await prodRes.json();
                setAllProducts(data);
            }
        } catch (error: any) {
            console.error("Error fetching data:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const handleSave = async () => {
        const method = editingCollection.id ? 'PUT' : 'POST';
        const url = editingCollection.id ? getApiUrl(`/api/collections/${editingCollection.id}`) : getApiUrl('/api/collections');
        
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
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this collection?")) return;
        await fetch(getApiUrl(`/api/collections/${id}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        fetchData();
    };

    const toggleProduct = (product: Product) => {
        const current = editingCollection.products || [];
        const exists = current.find(p => (typeof p === 'object' ? p.id : p) === product.id);
        const updated = exists 
            ? current.filter(p => (typeof p === 'object' ? p.id : p) !== product.id)
            : [...current, product];
        setEditingCollection({ ...editingCollection, products: updated });
    };

    const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight italic">Category Collections</h3>
                    <p className="text-xs text-zinc-500 font-medium">Control visual presentation of shop categories.</p>
                </div>
                <button 
                    onClick={() => { setEditingCollection({ isActive: true, products: [], displayStyle: 'Rectangle' }); setIsModalOpen(true); }}
                    className="bg-zinc-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic shadow-lg"
                >
                    + Create New
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {collections.map(col => (
                    <div key={col.id} className="group relative flex flex-col items-center">
                        <div className={`overflow-hidden border border-zinc-100 transition-all duration-700 hover:scale-[1.03] ${col.displayStyle === 'Circle' ? 'rounded-full' : 'rounded-none'} aspect-[3/4] w-full bg-zinc-50`}>
                            {col.imageUrl && <img src={col.imageUrl} className="w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <button onClick={() => { setEditingCollection(col); setIsModalOpen(true); }} className="bg-white text-zinc-900 p-2 rounded-full shadow-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2}/></svg></button>
                                <button onClick={() => handleDelete(col.id)} className="bg-white text-rose-600 p-2 rounded-full shadow-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg></button>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <h4 className="font-black text-zinc-900 uppercase italic text-sm tracking-tight">{col.title}</h4>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{col.displayStyle === 'ImageOnly' ? 'ONLY IMAGE' : 'WITH LABEL'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="px-8 py-6 border-b bg-zinc-50 flex justify-between items-center">
                            <h3 className="font-black text-lg uppercase italic text-zinc-900">Configure Collection</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 text-2xl font-black">×</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 admin-scroll">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest">Collection Title</label>
                                <input type="text" value={editingCollection.title || ''} onChange={e => setEditingCollection({...editingCollection, title: e.target.value})} className="w-full border-b-2 border-zinc-200 p-2 text-xl font-black italic uppercase outline-none focus:border-zinc-900 transition-colors" placeholder="e.g. SUMMER ESSENTIALS"/>
                            </div>
                            
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest">Visual Mode</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'Rectangle', label: 'Classic Box', icon: '◻️' },
                                        { id: 'Circle', label: 'Rounded', icon: '⭕' },
                                        { id: 'ImageOnly', label: 'Only Image (Premium)', icon: '🖼️' },
                                        { id: 'Square', label: 'Perfect Square', icon: '⏹️' }
                                    ].map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => setEditingCollection({ ...editingCollection, displayStyle: style.id as any })}
                                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-2 ${editingCollection.displayStyle === style.id ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl' : 'border-zinc-100 hover:border-zinc-300 bg-white text-zinc-400'}`}
                                        >
                                            <span className="text-2xl">{style.icon}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{style.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {editingCollection.displayStyle === 'ImageOnly' && <p className="text-[10px] font-bold text-rose-600 italic">✨ Premium "ImageOnly" mode removes all titles and borders on the homepage.</p>}
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest">Category Photography</label>
                                <MediaPicker value={editingCollection.imageUrl || ''} onChange={url => setEditingCollection({...editingCollection, imageUrl: url})} type="image" />
                            </div>

                            <div className="space-y-4 pt-6 border-t">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Inventory Attachment</label>
                                    <span className="text-[10px] font-bold text-zinc-900">{editingCollection.products?.length || 0} Products</span>
                                </div>
                                <input type="text" placeholder="Lookup products..." className="w-full bg-zinc-100 rounded-xl p-3 text-sm outline-none" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                                <div className="h-48 overflow-y-auto border border-zinc-100 rounded-xl p-2 space-y-1 admin-scroll bg-zinc-50/50">
                                    {filteredProducts.map(prod => {
                                        const isSelected = editingCollection.products?.some(p => (typeof p === 'object' ? p.id : p) === prod.id);
                                        return (
                                            <div key={prod.id} onClick={() => toggleProduct(prod)} className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'bg-zinc-900 text-white' : 'hover:bg-white'}`}>
                                                <div className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-white border-white' : 'border-zinc-300'}`} />
                                                <span className="text-xs font-bold truncate">{prod.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t bg-zinc-50 flex gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Discard</button>
                            <button onClick={handleSave} className="flex-1 py-4 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">Publish Collection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollectionSettings;
