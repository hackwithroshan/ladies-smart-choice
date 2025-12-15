
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
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] z-[100] transition-all duration-300 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Variants Row - Distinct background for separation */}
      {product.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm px-4 py-2.5">
              <div className="container mx-auto flex items-center gap-4 overflow-x-auto scrollbar-hide">
                  {product.variants.map((variant) => (
                      <div key={variant.name} className="flex items-center gap-2 shrink-0 bg-white rounded-full border border-gray-200 px-3 py-1 shadow-sm">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{variant.name}</span>
                          <div className="h-4 w-px bg-gray-200 mx-1"></div>
                          <div className="relative group">
                            <select
                                value={selectedVariants[variant.name] || ''}
                                onChange={(e) => onVariantChange(variant.name, e.target.value)}
                                className="appearance-none bg-transparent text-gray-900 text-xs font-bold pr-6 cursor-pointer focus:outline-none"
                            >
                                {variant.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.value}</option>
                                ))}
                            </select>
                            {/* Custom Chevron Icon */}
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400 group-hover:text-gray-600">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Main Action Bar */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Product Info - Thumbnail & Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
            <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-full w-full object-cover" 
                />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">{product.name}</h3>
              <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-sm font-bold text-rose-600">₹{product.price.toLocaleString()}</span>
                  {product.mrp && product.mrp > product.price && (
                      <span className="text-xs text-gray-400 line-through decoration-gray-400 hidden sm:inline">₹{product.mrp.toLocaleString()}</span>
                  )}
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center gap-3 shrink-0">
              
              {/* Quantity Selector - Pill Shape */}
              <div className="hidden sm:flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                  <button 
                      onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-black shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                      aria-label="Decrease quantity"
                  >-</button>
                  <span className="w-8 text-center text-sm font-bold text-gray-800">{quantity}</span>
                  <button 
                      onClick={() => onQuantityChange(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-black shadow-sm transition-transform active:scale-95"
                      aria-label="Increase quantity"
                  >+</button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={onAddToCart}
                disabled={product.stock <= 0}
                className="flex items-center justify-center text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-rose-200 hover:shadow-xl hover:bg-rose-700 transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap bg-rose-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductStickyBar;
