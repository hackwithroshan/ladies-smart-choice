
import React, { useState, useEffect } from 'react';
import { Product, HomeSection } from '../types';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { HeartIcon } from './Icons';
import { cn } from '../utils/utils';

interface ProductCardProps {
  product: Product;
  onProductClick?: (slug: string) => void;
  config?: HomeSection['settings'];
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick, config }) => {
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  if (!product || typeof product !== 'object' || !product.name) return null;

  const images = [product.imageUrl, ...(product.galleryImages || [])].filter(Boolean);
  const isWishlisted = isInWishlist(product.id || (product as any)._id);

  // Auto-scroll images on hover
  useEffect(() => {
    let interval: any;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 800);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const handleCardClick = () => {
    if (product.slug) {
      if (onProductClick) onProductClick(product.slug);
      else navigate(`/product/${product.slug}`);
    }
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

  // "New" logic: Product created within last 30 days
  const isNew = product.createdAt && (new Date().getTime() - new Date(product.createdAt).getTime()) < (30 * 24 * 60 * 60 * 1000);

  return (
    <div
      className="group relative cursor-pointer w-full"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("relative overflow-hidden bg-zinc-100 rounded-sm", config?.imageAspectRatio || "aspect-[3/4] md:aspect-[4/5]")}>
        <img
          src={images[currentImageIndex] || 'https://via.placeholder.com/400x500'}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badge: Priority to NEW, then Discount */}
        <div className="absolute top-3 left-3 z-20">
          {isNew ? (
            <span className="bg-pink-100 text-pink-900 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
              NEW
            </span>
          ) : discountPercentage > 0 ? (
            <span className="bg-pink-100 text-pink-900 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
              -{discountPercentage}%
            </span>
          ) : null}
        </div>

        {/* Wishlist Button - Bottom Right */}
        <button
          onClick={handleWishlistClick}
          className="absolute bottom-3 right-3 z-30 p-2 rounded-full hover:bg-black/10 transition-colors"
        >
          <HeartIcon
            className={cn(
              "h-6 w-6 transition-all drop-shadow-md",
              isWishlisted ? "fill-rose-500 text-[inter-700]" : "text-white fill-transparent stroke-[2px]"
            )}
          />
        </button>
      </div>

      {/* Product Details */}
      <div className="pt-3 pb-1 space-y-2 flex flex-col items-start text-left">
        <h3 className="text-[15px] font-medium font-inter text-zinc-900 w-full leading-snug">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 w-full">
          <span className="text-[15px] font-medium text-[inter-700]">Rs. {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          {hasDiscount && (
            <>
              <span className="text-xs text-[inter-700] line-through">Rs. {product.mrp?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-xs font-bold text-[inter-700] tracking-wide">{discountPercentage}% OFF</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
