
import React from 'react';
import { Product } from '../types';
import { COLORS } from '../constants';

interface ProductStickyBarProps {
  isVisible: boolean;
  product: Product | null;
  selectedVariants: { [key: string]: string };
  onVariantChange: (name: string, value: string) => void;
  onAddToCart: () => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
}

const ProductStickyBar: React.FC<ProductStickyBarProps> = ({ 
    isVisible, 
    product, 
    selectedVariants, 
    onVariantChange, 
    onAddToCart, 
    quantity,
    onQuantityChange
}) => {
  if (!product) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-[100] transition-all duration-500 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Dynamic Variants Row (Top of bar) */}
      {product.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="bg-gray-50/50 border-b border-gray-100 py-2.5 px-4 overflow-x-auto">
              <div className="container mx-auto flex items-center gap-5 justify-center md:justify-start scrollbar-hide">
                  {product.variants.map((variant) => (
                      <div key={variant.name} className="flex items-center gap-2.5 shrink-0 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{variant.name}</span>
                          <div className="h-3 w-px bg-gray-200"></div>
                          <div className="relative group">
                            <select
                                value={selectedVariants[variant.name] || ''}
                                onChange={(e) => onVariantChange(variant.name, e.target.value)}
                                className="appearance-none bg-transparent text-xs font-bold text-gray-900 pr-5 cursor-pointer outline-none"
                            >
                                {variant.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.value}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Main Bar Actions */}
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4 max-w-[1200px] mx-auto">
          
          {/* Info - Hidden on mobile if space is tight, or condensed */}
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-lg overflow-hidden border border-gray-100 shadow-inner bg-white">
                <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-full w-full object-cover" 
                />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate leading-none mb-1">{product.name}</h3>
              <span className="text-sm font-bold text-rose-600">₹{product.price.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
              {/* Quantity Selector - Pill style */}
              <div className="hidden sm:flex items-center bg-gray-100 rounded-full p-1 border border-gray-200 shadow-inner">
                  <button 
                      onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-black shadow-sm transition-transform active:scale-90"
                      aria-label="Reduce"
                  >−</button>
                  <span className="w-8 text-center text-xs font-black text-gray-900">{quantity}</span>
                  <button 
                      onClick={() => onQuantityChange(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-black shadow-sm transition-transform active:scale-90"
                      aria-label="Increase"
                  >+</button>
              </div>

              {/* Action Button */}
              <button
                onClick={onAddToCart}
                disabled={product.stock <= 0}
                className="flex items-center justify-center bg-rose-600 text-white px-6 md:px-10 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
              </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductStickyBar;
