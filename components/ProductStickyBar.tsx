import React from 'react';
import { Product } from '../types';
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Minus, Plus } from 'lucide-react';

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
      className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-[100] transition-all duration-300 ease-in-out transform ${isVisible ? 'translate-y-0 opacity-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
    >
      <div className="container mx-auto px-4 h-24 lg:h-20 flex items-center justify-between gap-4">

        {/* Left: Image & Info */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="h-14 w-14 rounded-md overflow-hidden border border-gray-100 bg-white shrink-0">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 truncate max-w-[150px] lg:max-w-[250px] leading-tight">{product.name}</h3>
            <span className="text-sm font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          </div>
        </div>

        {/* Center: Variants (Desktop Only or scrolling on mobile) */}
        {product.hasVariants && product.variants && (
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {product.variants.map((variant) => (
              <div key={variant.name} className="flex flex-col gap-1 w-28 lg:w-32 shrink-0">
                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {variant.name}
                </Label>
                <Select
                  value={selectedVariants[variant.name]}
                  onValueChange={(val) => onVariantChange(variant.name, val)}
                >
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-white shadow-sm focus:ring-0">
                    <SelectValue placeholder={`Select ${variant.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {variant.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quantity */}
          <div className="flex items-center border border-gray-200 rounded-md h-9 bg-white hidden md:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="h-full w-8 rounded-none text-gray-600 hover:text-black hover:bg-gray-50"
              disabled={quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center text-xs font-bold text-gray-900">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onQuantityChange(quantity + 1)}
              className="h-full w-8 rounded-none text-gray-600 hover:text-black hover:bg-gray-50"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onBuyNow}
              disabled={product.stock <= 0}
              className="h-9 lg:h-10 px-4 lg:px-6 bg-black text-white hover:bg-gray-800 font-bold uppercase text-[10px] lg:text-xs tracking-wider whitespace-nowrap"
            >
              Buy Now
            </Button>
            <Button
              onClick={onAddToCart}
              disabled={product.stock <= 0}
              variant="outline"
              className="h-9 lg:h-10 px-4 lg:px-6 border-black text-black hover:bg-black hover:text-white font-bold uppercase text-[10px] lg:text-xs tracking-wider hidden sm:flex whitespace-nowrap"
            >
              Add to Cart
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductStickyBar;
