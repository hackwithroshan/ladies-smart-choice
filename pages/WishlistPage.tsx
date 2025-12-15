
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../contexts/WishlistContext';
import { Product } from '../types';
import { getApiUrl } from '../utils/apiHelper';

interface WishlistPageProps {
  user: any;
  logout: () => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ user, logout }) => {
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(getApiUrl('/api/products'));
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      // Filter products that match IDs in the wishlist context
      const filtered = products.filter(p => wishlist.includes(p.id));
      setWishlistProducts(filtered);
    } else {
        setWishlistProducts([]);
    }
  }, [products, wishlist]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={user} logout={logout} />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-4">
            <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900">My Wishlist</h1>
                <p className="text-sm text-gray-500 mt-1">Saved items for later</p>
            </div>
            <span className="text-gray-900 font-medium bg-white px-3 py-1 rounded-full border border-gray-200 text-sm shadow-sm mt-4 md:mt-0">
                {wishlistProducts.length} items
            </span>
        </div>

        {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 aspect-[2/3] rounded-xl mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
             </div>
        ) : wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {wishlistProducts.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onProductClick={(slug) => navigate(`/product/${slug}`)}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.672l1.318-1.354a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Looks like you haven't saved any items yet. Start browsing to find your favorites!</p>
                <Link to="/" className="px-8 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors shadow-md inline-flex items-center gap-2">
                    <span>Start Shopping</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;
