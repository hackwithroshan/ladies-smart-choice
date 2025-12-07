
import React from 'react';
import { Product } from '../types';

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
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!isVisible}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 md:gap-6">
          
          {/* Product Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <img src={product.imageUrl} alt={product.name} className="w-12 h-12 md:w-14 md:h-14 rounded-md object-cover flex-shrink-0" />
            <div className="min-w-0 hidden sm:block">
              <h3 className="text-sm font-bold text-gray-800 truncate">{product.name}</h3>
              <p className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
            </div>
          </div>

          {/* Variant Selectors */}
          {product.hasVariants && product.variants && (
            <div className="flex items-center gap-3">
              {product.variants.map((variant) => (
                <div key={variant.name} className="flex items-center">
                  <label className="text-xs text-gray-500 mr-2 hidden lg:block">{variant.name}</label>
                  <select
                    value={selectedVariants[variant.name]}
                    onChange={(e) => onVariantChange(variant.name, e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-rose-500 focus:border-rose-500"
                    aria-label={`Select ${variant.name}`}
                  >
                    {variant.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onAddToCart}
            className="px-4 py-3 sm:px-6 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Add to Cart - <span className="hidden sm:inline">₹{(product.price * quantity).toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductStickyBar;
