
import React from 'react';
import { Product, ProductVariant } from '../types';
import { COLORS } from '../constants';
import { cn } from '../utils/utils';

interface ProductStickyBarProps {
  isVisible: boolean;
  product: Product | null;
  selectedVariants: { [key: string]: string };
  onVariantChange: (name: string, value: string) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
}

const ProductStickyBar: React.FC<ProductStickyBarProps> = ({ 
    isVisible, 
    product, 
    selectedVariants, 
    onVariantChange, 
    onAddToCart, 
    onBuyNow,
    quantity,
    onQuantityChange
}) => {
  if (!product) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t border-zinc-100 shadow-[0_-5px_20px_rgba(0,0,0,0.08)] z-[110] transition-all duration-700 ease-in-out transform",
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div className="container mx-auto px-4 md:px-8 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4 md:gap-10 max-w-[1400px] mx-auto">
          
          {/* PRODUCT INFO */}
          <div className="hidden lg:flex items-center gap-4 min-w-0 overflow-hidden">
            <div className="h-12 w-12 shrink-0 border border-zinc-100 bg-white overflow-hidden rounded-md">
                <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-full w-full object-cover" 
                />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-[12px] font-bold text-zinc-900 truncate leading-none uppercase tracking-tight">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-sm font-black text-zinc-900">₹{product.price.toLocaleString()}</span>
                 {product.mrp && product.mrp > product.price && (
                    <span className="text-[10px] text-zinc-400 line-through">₹{product.mrp.toLocaleString()}</span>
                 )}
              </div>
            </div>
          </div>

          {/* VARIANT SELECTOR IN STICKY BAR */}
          {product.hasVariants && (
            <div className="flex-1 flex items-center gap-6 overflow-x-auto scrollbar-hide py-1">
                {product.variants?.map((v) => {
                    const isColor = ['color', 'colors', 'colour', 'colours'].includes(v.name.toLowerCase());
                    return (
                        <div key={v.name} className="flex items-center gap-3 shrink-0">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest hidden sm:inline">{v.name}:</span>
                            <div className="flex items-center gap-1.5">
                                {isColor ? (
                                    v.options.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => onVariantChange(v.name, opt.value)}
                                            className={cn(
                                                "w-6 h-8 border transition-all relative group",
                                                selectedVariants[v.name] === opt.value ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
                                            )}
                                        >
                                            <img src={opt.image || product.imageUrl} className="w-full h-full object-cover" alt={opt.value} />
                                            {selectedVariants[v.name] === opt.value && <div className="absolute inset-0 bg-zinc-900/10" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="flex bg-zinc-100 p-0.5 rounded-sm">
                                        {v.options.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => onVariantChange(v.name, opt.value)}
                                                className={cn(
                                                    "px-2.5 py-1 text-[9px] font-bold transition-all uppercase rounded-sm",
                                                    selectedVariants[v.name] === opt.value 
                                                        ? "bg-white text-zinc-900 shadow-sm" 
                                                        : "text-zinc-500 hover:text-zinc-900"
                                                )}
                                            >
                                                {opt.value}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center bg-zinc-100 rounded-sm p-0.5 mr-2">
                    <button onClick={() => onQuantityChange(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center font-bold text-zinc-500 hover:text-zinc-900">-</button>
                    <span className="w-8 text-center text-[10px] font-black">{quantity}</span>
                    <button onClick={() => onQuantityChange(quantity + 1)} className="w-8 h-8 flex items-center justify-center font-bold text-zinc-500 hover:text-zinc-900">+</button>
                </div>
                <button
                    onClick={onAddToCart}
                    disabled={product.stock <= 0}
                    className="h-10 md:h-12 bg-zinc-900 text-white px-6 md:px-10 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-lg hover:brightness-110 transition-all active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400 whitespace-nowrap"
                >
                    {product.stock > 0 ? 'Add To Bag' : 'Sold Out'}
                </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductStickyBar;
