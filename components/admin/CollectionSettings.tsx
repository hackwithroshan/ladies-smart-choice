
import React, { useState, useEffect } from 'react';
import { Product, Collection } from '../../types';
import { COLORS } from '../../constants';
import MediaPicker from './MediaPicker';
import { getApiUrl } from '../../utils/apiHelper';
import { useNavigate } from 'react-router-dom';

const CollectionSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const navigate = useNavigate();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const collRes = await fetch(getApiUrl('/api/collections/admin/all'), { headers: { 'Authorization': `Bearer ${token}` } });

            if (collRes.ok) {
                const data = await collRes.json();
                setCollections(data);
            }
        } catch (error: any) {
            console.error("Error fetching data:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);



    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this collection?")) return;
        await fetch(getApiUrl(`/api/collections/${id}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        fetchData();
    };



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight italic">Category Collections</h3>
                    <p className="text-xs text-zinc-500 font-medium">Control visual presentation of shop categories.</p>
                </div>
                <button
                    onClick={() => navigate('/app/categories/new')}
                    className="bg-zinc-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic shadow-lg hover:scale-105 transition-transform"
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
                                <button onClick={() => navigate(`/app/categories/edit/${col.id}`)} className="bg-white text-zinc-900 p-2 rounded-full shadow-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2} /></svg></button>
                                <button onClick={() => handleDelete(col.id)} className="bg-white text-rose-600 p-2 rounded-full shadow-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg></button>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <h4 className="font-black text-zinc-900 uppercase italic text-sm tracking-tight">{col.title}</h4>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{col.displayStyle === 'ImageOnly' ? 'ONLY IMAGE' : 'WITH LABEL'}</span>
                        </div>
                    </div>
                ))}
            </div>


        </div>
    );
};

export default CollectionSettings;
