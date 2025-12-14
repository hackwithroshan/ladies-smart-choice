
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    const { id } = useParams<{ id: string }>();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCollection = async () => {
            try {
                const res = await fetch(getApiUrl(`/api/collections/${id}`));
                if (!res.ok) throw new Error('Collection not found');
                const data = await res.json();
                setCollection(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCollection();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Collection...</div>;
    if (!collection) return <div className="min-h-screen flex items-center justify-center">Collection Not Found</div>;

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header user={user} logout={logout} />
            
            {/* Banner */}
            <div className="relative w-full h-48 md:h-80 overflow-hidden">
                <img src={collection.imageUrl} alt={collection.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2">{collection.title}</h1>
                    {collection.description && <p className="text-white text-sm md:text-lg max-w-2xl">{collection.description}</p>}
                </div>
            </div>

            <main className="flex-grow container mx-auto px-3 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg md:text-2xl font-bold text-gray-800">{collection.products.length} Products Found</h2>
                </div>
                
                {collection.products.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>No products added to this collection yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {collection.products.map(product => (
                            <ProductCard 
                                key={product.id} 
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
