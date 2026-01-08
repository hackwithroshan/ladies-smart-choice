
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useParams, useNavigate } = ReactRouterDom as any;
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { getApiUrl } from '../utils/apiHelper';

interface Collection {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    products: Product[];
}

const CollectionPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { id } = useParams();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCollection = async () => {
            try {
                // Corrected API path - removed redundant /api
                const res = await fetch(getApiUrl(`collections/${id}`));
                if (!res.ok) throw new Error('Collection not found');
                const data = await res.json();
                setCollection(data);
            } catch (err) {
                console.error("Collection Load Error:", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCollection();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-[#16423C] border-t-transparent rounded-full animate-spin"></div></div>;
    
    if (!collection) return (
        <div className="flex flex-col min-h-screen">
            <Header user={user} logout={logout} />
            <main className="flex-grow flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest italic">Collection Not Found</h2>
                    <button onClick={() => navigate('/')} className="mt-4 text-sm font-bold text-[#16423C] underline">Return Home</button>
                </div>
            </main>
            <Footer />
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header user={user} logout={logout} />
            
            <div className="relative w-full h-48 md:h-80 overflow-hidden bg-zinc-900">
                <img src={collection.imageUrl} alt={collection.title} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-3xl md:text-6xl font-brand font-black text-white mb-2 uppercase italic tracking-tighter">{collection.title}</h1>
                    {collection.description && <p className="text-white/80 text-xs md:text-sm font-bold uppercase tracking-[0.2em] max-w-2xl">{collection.description}</p>}
                </div>
            </div>

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-10 border-b pb-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400">Inventory: {collection.products?.length || 0} Assets</h2>
                </div>
                
                {(!collection.products || collection.products.length === 0) ? (
                    <div className="text-center py-20 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
                        <p className="text-zinc-400 font-black uppercase text-xs tracking-widest italic">No assets linked to this taxonomy node</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
                        {collection.products.map(product => (
                            <ProductCard 
                                key={product.id || (product as any)._id} 
                                product={product} 
                                onProductClick={(slug) => navigate(`/product/${slug}`)} 
                            />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default CollectionPage;
