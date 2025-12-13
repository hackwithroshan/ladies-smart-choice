
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
}

const ProductStickyBar: React.FC<ProductStickyBarProps> = ({ isVisible, product, selectedVariants, onVariantChange, onAddToCart, quantity }) => {
  if (!product) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 transition-transform duration-300 ease-in-out transform ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Product Info - Left Side */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-12 h-12 rounded-md object-cover border border-gray-100 shadow-sm bg-gray-50" 
            />
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate pr-2">{product.name}</h3>
              <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold" style={{ color: COLORS.accent }}>₹{product.price.toLocaleString()}</span>
                  {product.mrp && product.mrp > product.price && (
                      <span className="text-xs text-gray-400 line-through hidden sm:inline">₹{product.mrp.toLocaleString()}</span>
                  )}
              </div>
            </div>
          </div>

          {/* Controls Section - Right Side */}
          <div className="flex items-center gap-3 shrink-0">
              
              {/* Desktop Variants - Hidden on Mobile to save horizontal space */}
              {product.hasVariants && product.variants && (
                <div className="hidden md:flex items-center gap-4 mr-4 border-r border-gray-200 pr-4">
                  {product.variants.map((variant) => (
                    <div key={variant.name} className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{variant.name}</label>
                      <div className="relative">
                        <select
                          value={selectedVariants[variant.name] || ''}
                          onChange={(e) => onVariantChange(variant.name, e.target.value)}
                          className="appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-xs rounded-md pl-2 pr-7 py-1.5 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 cursor-pointer font-semibold min-w-[80px]"
                        >
                          {variant.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.value}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-500">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={onAddToCart}
                disabled={product.stock <= 0}
                className="flex items-center justify-center text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                style={{ backgroundColor: product.stock > 0 ? COLORS.primary : undefined }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
          </div>

        </div>
        
        {/* Mobile Variant Fallback - Shown in a second row on small screens */}
        {product.hasVariants && product.variants && (
            <div className="md:hidden mt-3 pt-2 border-t border-gray-100 flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                 {product.variants.map((variant) => (
                    <div key={variant.name} className="flex items-center gap-2 shrink-0">
                      <label className="text-xs font-bold text-gray-500 uppercase">{variant.name}</label>
                      <div className="relative">
                        <select
                          value={selectedVariants[variant.name] || ''}
                          onChange={(e) => onVariantChange(variant.name, e.target.value)}
                          className="appearance-none bg-white border border-gray-300 text-gray-900 text-xs rounded-md pl-3 pr-6 py-1.5 focus:ring-rose-500 focus:border-rose-500 font-medium"
                        >
                          {variant.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.value}</option>
                          ))}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-500">
                          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductStickyBar;
