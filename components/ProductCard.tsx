
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';

interface ProductCardProps {
  product: Product;
  onProductClick?: (slug: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const images = [product.imageUrl, ...(product.galleryImages || [])].filter(Boolean);
  const isWishlisted = isInWishlist(product.id);

  useEffect(() => {
    let interval: any;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1200);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const handleCardClick = () => {
    if (onProductClick && product.slug) onProductClick(product.slug);
    else if (product.slug) navigate(`/product/${product.slug}`);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
      showToast('Removed from wishlist', 'info');
    } else {
      addToWishlist(product.id);
      showToast('Added to wishlist', 'success');
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    addToCart(product, 1);
    showToast(`${product.name} added to cart!`, 'success');
    navigate('/checkout'); 
  };

  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;

  return (
    <div className="group relative flex flex-col w-full cursor-pointer" onClick={handleCardClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl border border-gray-100">
        <img src={images[currentImageIndex]} alt={product.name} className={`h-full w-full object-cover object-top transition-transform duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'}`} loading="lazy" />
        {hasDiscount && <div className="absolute top-3 left-3 z-20"><span className="inline-flex items-center justify-center rounded bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">-{discountPercentage}%</span></div>}
        <button onClick={handleWishlistClick} className="absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm transition-all duration-300 hover:bg-white/60 hover:scale-110 active:scale-95">
          {isWishlisted ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-rose-600 animate-bounce"><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-gray-800"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>}
        </button>
        <div className="absolute inset-x-4 bottom-4 z-20 translate-y-12 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 hidden md:block">
            <button onClick={handleQuickAdd} className={`w-full relative overflow-hidden rounded-xl border border-white/40 py-3.5 text-sm font-bold shadow-lg backdrop-blur-md transition-all hover:text-white flex items-center justify-center gap-2 ${isAdding ? 'bg-green-500/80 text-white' : 'bg-white/30 text-gray-900'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <span>Add to Cart</span>
            </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-start text-left px-1">
        <h3 className="line-clamp-2 text-base font-bold text-gray-900 group-hover:text-brand-accent transition-colors leading-snug font-brand italic">{product.name}</h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-black text-brand-primary">₹{product.price.toLocaleString('en-IN')}</span>
            {hasDiscount && <span className="text-sm text-gray-400 line-through">₹{product.mrp?.toLocaleString('en-IN')}</span>}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
