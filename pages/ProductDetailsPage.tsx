
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useParams, useNavigate } = ReactRouterDom as any;
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useSiteData } from '../contexts/SiteDataContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { getApiUrl } from '../utils/apiHelper';

const ProductDetailsPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { siteSettings } = useSiteData();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/products/slug/${slug}`));
        if (res.ok) setProduct(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchProduct();
  }, [slug]);

  const handleBuyNow = async () => {
      if (!product) return;

      // 1. STANDARD FLOW: Navigate to Custom Form
      if (siteSettings?.checkoutMode === 'standard') {
          addToCart(product, 1);
          navigate('/checkout');
          return;
      }

      // 2. MAGIC FLOW: Immediate Modal
      setBuyLoading(true);
      try {
          const keyRes = await fetch(getApiUrl('/api/orders/key'));
          const { key } = await keyRes.json();

          const options = {
              key,
              amount: Math.round(product.price * 100),
              currency: "INR",
              name: siteSettings?.storeName || "Ayushree Ayurveda",
              description: `Purchase: ${product.name}`,
              // Magic Checkout triggers based on specific notes and lack of order_id
              notes: { 
                  magic_checkout: "true", 
                  shipping_address: "1", 
                  customer_name: user?.name || "" 
              },
              prefill: { contact: user?.phone || "", email: user?.email || "" },
              handler: async (response: any) => {
                  const verifyRes = await fetch(getApiUrl('/api/orders/verify-magic'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          razorpay_payment_id: response.razorpay_payment_id,
                          orderDetails: { items: [{ ...product, quantity: 1 }], total: product.price }
                      })
                  });
                  if ((await verifyRes.json()).success) {
                      window.location.href = "/dashboard?status=success";
                  }
              }
          };
          new (window as any).Razorpay(options).open();
      } catch (e) { alert("Magic Checkout failed."); }
      finally { setBuyLoading(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Product...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Not Found</div>;

  return (
    <div className="bg-white min-h-screen">
      <SEO title={product.name} />
      <Header user={user} logout={logout} />
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-[3/4] bg-gray-50 rounded-3xl overflow-hidden border shadow-sm">
                <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
            </div>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-serif font-black text-gray-900 leading-tight">{product.name}</h1>
                    <p className="text-3xl font-black text-[#16423C] mt-4">₹{product.price.toLocaleString()}</p>
                </div>
                <div className="prose text-gray-600" dangerouslySetInnerHTML={{ __html: product.description }} />
                
                <div className="flex flex-col gap-3 pt-6 border-t">
                    <button 
                        onClick={handleBuyNow}
                        disabled={buyLoading}
                        className="w-full h-16 bg-[#16423C] text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                        {buyLoading ? 'Initializing...' : 'Buy Now'}
                    </button>
                    <button 
                        onClick={() => { addToCart(product, 1); showToast("Added to Cart!"); }}
                        className="w-full h-16 bg-white text-[#16423C] border-2 border-[#16423C] rounded-2xl font-black text-lg hover:bg-gray-50 transition-all"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
