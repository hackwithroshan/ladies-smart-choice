
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

interface ProductCardProps {
  product: Product;
  onProductClick?: (slug: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  // --- State ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Combine main image and gallery for the slideshow
  const images = [product.imageUrl, ...(product.galleryImages || [])].filter(Boolean);
  const isWishlisted = isInWishlist(product.id);

  // --- Effects ---

  // Handle Image Slideshow on Hover
  useEffect(() => {
    let interval: any;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1200); // Change image every 1.2 seconds
    } else {
      setCurrentImageIndex(0); // Reset to cover image when not hovering
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  // --- Handlers ---

  const handleCardClick = () => {
    if (onProductClick && product.slug) {
      onProductClick(product.slug);
    } else if (product.slug) {
        navigate(`/product/${product.slug}`);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    addToCart(product, 1);
    
    // Redirect to Checkout immediately
    navigate('/checkout');
  };

  // Metrics
  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) 
    : 0;

  return (
    <div 
      className="group relative flex flex-col w-full cursor-pointer"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. IMAGE CONTAINER (Taller Aspect Ratio 2:3 for Full Portrait) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg md:rounded-2xl bg-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl border border-gray-100">
        
        {/* Images - Full Cover */}
        <img
          src={images[currentImageIndex]}
          alt={product.name}
          className={`h-full w-full object-cover object-top transition-transform duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}
          loading="lazy"
        />

        {/* Discount Badge */}
        {hasDiscount && (
            <div className="absolute top-2 left-2 md:top-3 md:left-3 z-20">
                <span className="inline-flex items-center justify-center rounded bg-rose-600 px-1.5 py-0.5 md:px-2.5 md:py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                    -{discountPercentage}%
                </span>
            </div>
        )}

        {/* Wishlist Button - Glassmorphism Transparent Type */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 md:top-3 md:right-3 z-20 flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md hover:scale-110 active:scale-95"
          aria-label="Add to wishlist"
        >
          {isWishlisted ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 md:h-5 md:w-5 text-rose-600 animate-bounce">
              <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 md:h-5 md:w-5 text-gray-800">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          )}
        </button>

        {/* GLASS PRISM ADD TO CART BUTTON (Desktop Only Hover) */}
        <div className="absolute inset-x-4 bottom-4 z-20 translate-y-12 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 hidden md:block">
            <button
                onClick={handleQuickAdd}
                className={`w-full relative overflow-hidden rounded-xl border border-white/40 bg-white/30 py-3.5 text-sm font-bold text-gray-900 shadow-lg backdrop-blur-md transition-all hover:bg-white/50 hover:text-black active:scale-95 flex items-center justify-center gap-2 ${isAdding ? 'bg-green-500/80 text-white border-green-400' : ''}`}
            >
                {isAdding ? (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Added</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Buy Now</span>
                    </>
                )}
            </button>
        </div>
      </div>

      {/* 2. PRODUCT INFO - Left Aligned */}
      <div className="mt-2 md:mt-4 flex flex-col items-start text-left px-1">
        <h3 className="line-clamp-2 text-xs md:text-base font-medium text-gray-900 group-hover:text-rose-600 transition-colors leading-snug font-serif">
          {product.name}
        </h3>

        <div className="mt-1 md:mt-2 flex flex-wrap items-baseline gap-1 md:gap-2">
            <span className="text-sm md:text-lg font-bold text-gray-900">
                RS {product.price.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
                <span className="text-xs md:text-sm text-gray-400 line-through decoration-gray-400">
                    RS {product.mrp?.toLocaleString('en-IN')}
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
