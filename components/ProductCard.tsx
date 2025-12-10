
import React from 'react';
import { Product } from '../types';
import { COLORS } from '../constants';
import { useCart } from '../contexts/CartContext';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom;
import { masterTracker } from '../utils/tracking';

interface ProductCardProps {
  product: Product;
  onProductClick?: (slug: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);

    const eventPayload = {
        contents: [{
            id: product.sku || product.id,
            quantity: 1,
            item_price: product.price,
        }],
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'INR'
    };
    
    // Use the master tracker for dual browser/server events with deduplication
    masterTracker('AddToCart', eventPayload, eventPayload);

    // Since this action immediately redirects to checkout, it's considered a "magic checkout" event.
    masterTracker('magic_checkout_requested', eventPayload, eventPayload);
    
    navigate('/checkout');
  };

  const discount = product.mrp && product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  return (
    <div 
      className="group relative bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl lg:hover:-translate-y-1 cursor-pointer flex flex-col h-full"
      onClick={() => onProductClick && product.slug && onProductClick(product.slug)}
    >
      <div className="aspect-[3/4] w-full overflow-hidden relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-md">
                    {discount}% OFF
                </span>
            )}
            {product.stock > 0 && product.stock < 10 && (
                 <span className="bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-md">
                    Low Stock
                </span>
            )}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{product.category}</p>
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 flex-grow">
          <span aria-hidden="true" className="absolute inset-0" />
          {product.name}
        </h3>
        
        <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-3">
                <p className="text-lg font-extrabold text-gray-900">₹{product.price.toLocaleString('en-IN')}</p>
                {product.mrp && product.mrp > product.price && (
                    <p className="text-sm text-gray-400 line-through decoration-1">₹{product.mrp.toLocaleString('en-IN')}</p>
                )}
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="w-full text-center px-4 py-2.5 text-xs font-bold text-white rounded-md shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 lg:opacity-0 lg:group-hover:opacity-100 lg:transform lg:translate-y-2 lg:group-hover:translate-y-0" 
              style={{ backgroundColor: COLORS.accent }}
             >
              Add to Cart
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;