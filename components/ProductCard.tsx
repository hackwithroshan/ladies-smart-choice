import React, { useState, useEffect } from 'react';
import { Product, HomeSection } from '../types';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';

interface ProductCardProps {
  product: Product;
  onProductClick?: (slug: string) => void;
  config?: HomeSection['settings'];
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick, config }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Safety check to ensure we have a product object
  if (!product || typeof product !== 'object' || !product.name) return null;

  const images = [product.imageUrl, ...(product.galleryImages || [])].filter(Boolean);
  const isWishlisted = isInWishlist(product.id || (product as any)._id);

  useEffect(() => {
    let interval: any;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1400);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const handleCardClick = () => {
    const slug = product.slug;
    if (onProductClick && slug) onProductClick(slug);
    else if (slug) navigate(`/product/${slug}`);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const id = product.id || (product as any)._id;
    if (isWishlisted) {
      removeFromWishlist(id);
      showToast('Removed from Wishlist', 'info');
    } else {
      addToWishlist(id);
      showToast('Added to Wishlist', 'success');
    }
  };

  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;

  // Visual Builder Configuration mapping
  const isFlatMode = config?.itemStyle === 'ImageOnly';
  const wishlistPos = config?.wishlistPosition || 'bottom-right-overlay';
  
  const cardStyles: React.CSSProperties = {
      backgroundColor: isFlatMode ? 'transparent' : (config?.itemBgColor || 'transparent'),
      borderRadius: isFlatMode ? '0px' : `${config?.itemBorderRadius ?? 12}px`,
      padding: isFlatMode ? '0px' : `${config?.itemPadding ?? 0}px`,
      border: !isFlatMode && config?.itemBorder ? `1px solid ${config?.itemBorderColor || '#f3f4f6'}` : 'none',
      boxShadow: !isFlatMode && config?.itemShadow && isHovered ? '0 10px 15px -3px rgb(0 0 0 / 0.08)' : 'none',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
  };

  const imageContainerStyles: React.CSSProperties = {
      height: config?.itemHeight && config?.itemHeight !== 'auto' ? config.itemHeight : 'auto',
      aspectRatio: config?.itemHeight && config?.itemHeight !== 'auto' ? 'unset' : '3/4',
      borderRadius: isFlatMode ? '0px' : `${config?.itemBorderRadius ?? 12}px`,
  };

  return (
    <div 
        className="group relative flex flex-col w-full cursor-pointer transition-all duration-500" 
        onClick={handleCardClick} 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
        style={cardStyles}
    >
      <div 
        className="relative w-full overflow-hidden bg-gray-50 shadow-sm shrink-0"
        style={imageContainerStyles}
      >
        <img 
            src={images[currentImageIndex] || 'https://via.placeholder.com/400x600?text=Product'} 
            alt={product.name} 
            className="h-full w-full transition-transform duration-1000 object-cover group-hover:scale-105" 
            loading="lazy" 
        />
        
        {/* NEW Badge */}
        {(config?.showBadge !== false) && (
            <div className="absolute top-2.5 left-0 z-20">
                <span className="bg-[#FCE7F3] text-gray-800 text-[10px] font-black py-1.5 px-4 uppercase tracking-[0.2em] shadow-lg">
                    {config?.badgeText || 'NEW'}
                </span>
            </div>
        )}

        {/* Wishlist Heart */}
        {(config?.showWishlist !== false) && (
            <button 
                onClick={handleWishlistClick} 
                className={`absolute z-20 transition-all duration-300 active:scale-90 ${
                    wishlistPos === 'bottom-right-overlay' 
                    ? 'bottom-4 right-4 text-white group-hover:scale-125 drop-shadow-2xl' 
                    : 'top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-md text-gray-700 hover:bg-white shadow-sm'
                }`}
            >
                {isWishlisted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-rose-600"><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247) 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" /></svg> 
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                )}
            </button>
        )}
      </div>

      {/* Information Layer: Now ALWAYS Visible */}
      <div className="mt-4 flex flex-col items-start text-left px-1 space-y-1.5 w-full pb-4">
        <h3 
            className="line-clamp-1 text-gray-800 leading-tight font-bold uppercase tracking-tight w-full opacity-90 group-hover:opacity-100 transition-opacity"
            style={{ 
                fontSize: `${config?.itemTitleSize || 15}px`, 
                color: config?.itemTitleColor || '#111827'
            }}
        >
            {product.name}
        </h3>
        
        <div className="flex items-center gap-3">
            <span className="font-black text-gray-900" style={{ fontSize: `${config?.itemPriceSize || 16}px`, color: config?.itemPriceColor }}>
                ₹{(product.price || 0).toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 line-through font-medium text-[11px] md:text-xs">
                        ₹{(product.mrp || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-rose-600 font-black text-[10px] md:text-[11px] uppercase tracking-tighter">
                        {discountPercentage}% Off
                    </span>
                </div>
            )}
        </div>

        {/* Display Variant Sizes if available */}
        {(config?.showVariants !== false) && product.hasVariants && product.variants && product.variants.length > 0 && (
            <div className="pt-1.5 flex flex-wrap gap-x-3 gap-y-1.5 overflow-hidden">
                {product.variants[0].options.map((opt, i) => (
                    <span key={i} className="text-[10px] md:text-[11px] text-gray-400 uppercase font-black tracking-widest hover:text-rose-600 transition-colors">
                        {opt.value}
                    </span>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;