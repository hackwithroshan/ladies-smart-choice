
import React, { useState, useEffect, useRef } from 'react';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors in this environment
import * as ReactRouterDom from 'react-router-dom';
const { useParams, Link, useNavigate } = ReactRouterDom as any;
import { Product, Review } from '../types';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useSiteData } from '../contexts/SiteDataContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Accordion from '../components/Accordion';
import ProductStickyBar from '../components/ProductStickyBar';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { StarIcon, PlayIcon } from '../components/Icons';
import { masterTracker } from '../utils/tracking';
import { handleApiError, getFriendlyErrorMessage } from '../utils/errorHandler';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/apiHelper';
import ErrorBoundary from '../components/ErrorBoundary';
import MediaPicker from '../components/admin/MediaPicker';
import { stripHtml, truncateText } from '../utils/seoHelper';
import { COLORS } from '../constants';

interface ShopVideo {
    _id: string;
    title: string;
    videoUrl: string;
    thumbnailUrl: string;
    price: string;
    productLink?: string;
}

const ProductDetailsPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, addMultipleToCart } = useCart();
  const { showToast } = useToast();
  const { siteSettings } = useSiteData();
  const token = localStorage.getItem('token');

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [fbtProducts, setFbtProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [shopVideos, setShopVideos] = useState<ShopVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<{[key: string]: string}>({});
  const [selectedVideo, setSelectedVideo] = useState<ShopVideo | null>(null);
  const [selectedFbtIds, setSelectedFbtIds] = useState<Set<string>>(new Set());

  const [newReview, setNewReview] = useState({ rating: 5, comment: '', imageUrl: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  
  const [isStickyBarVisible, setIsStickyBarVisible] = useState(false);
  const addToCartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const productRes = await fetch(getApiUrl(`/api/products/slug/${slug}`));
        if (!productRes.ok) throw new Error("Product not found");
        
        const foundProduct: Product = await productRes.json();
        
        if (foundProduct) {
            setProduct(foundProduct);
            setActiveImage(foundProduct.imageUrl);
            
            if (foundProduct.hasVariants && foundProduct.variants) {
                const defaults: {[key: string]: string} = {};
                foundProduct.variants.forEach(v => {
                    if (v.options.length > 0) defaults[v.name] = v.options[0].value;
                });
                setSelectedVariants(defaults);
            }

            const [allProductsRes, fbtRes, videosRes] = await Promise.all([
                fetch(getApiUrl('/api/products')),
                fetch(getApiUrl(`/api/products/${foundProduct.id}/frequently-bought-together`)),
                fetch(getApiUrl('/api/content/videos'))
            ]);

            const allProducts: Product[] = await allProductsRes.json();
            
            let related = allProducts.filter(p => p.category === foundProduct.category && p.id !== foundProduct.id);
            if (related.length < 4) {
                const others = allProducts.filter(p => p.category !== foundProduct.category && p.id !== foundProduct.id);
                related = [...related, ...others];
            }
            setRelatedProducts(related.slice(0, 4));

            if (fbtRes.ok) {
                const fbtData = await fbtRes.json();
                setFbtProducts(fbtData);
                setSelectedFbtIds(new Set(fbtData.map((p: Product) => p.id)));
            }

            if (videosRes.ok) {
                setShopVideos(await videosRes.json());
            }

            const viewedIds: string[] = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            const history = viewedIds.map(vid => allProducts.find(p => p.id === vid)).filter((p): p is Product => !!p && p.id !== foundProduct.id);
            setRecentlyViewed(history);
            
            const newHistory = [foundProduct.id, ...viewedIds.filter(vid => vid !== foundProduct.id)].slice(0, 8);
            localStorage.setItem('recentlyViewed', JSON.stringify(newHistory));

            const eventPayload = {
                contents: [{
                    id: foundProduct.sku || foundProduct.id,
                    quantity: 1,
                    item_price: foundProduct.price,
                }],
                content_name: foundProduct.name,
                content_type: 'product',
                value: foundProduct.price,
                currency: 'INR'
            };
            masterTracker('ViewContent', eventPayload, eventPayload);
        }

      } catch (error) {
        console.error('Failed to fetch product data', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isBelowButton = entry.boundingClientRect.top < 0;
        setIsStickyBarVisible(!entry.isIntersecting && isBelowButton);
      },
      { threshold: 0 }
    );

    const currentRef = addToCartRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [product, loading]);

  const handleVariantChange = (name: string, value: string) => {
      setSelectedVariants(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = (isBuyNow = false) => {
      if (!product) return;

      let variantLabel = "";
      if (Object.keys(selectedVariants).length > 0) {
          variantLabel = Object.values(selectedVariants).join(' / ');
      }
      
      const cartItem = {
          ...product,
          name: variantLabel ? `${product.name} - ${variantLabel}` : product.name,
      };

      addToCart(cartItem, quantity);
      showToast(`${quantity} x ${product.name} added to cart!`, 'success');

      const eventPayload = {
        contents: [{
            id: product.sku || product.id,
            quantity: quantity,
            item_price: product.price,
        }],
        content_name: cartItem.name,
        content_type: 'product',
        value: product.price * quantity,
        currency: 'INR'
      };
      
      if (isBuyNow) {
        masterTracker('InitiateCheckout', eventPayload, eventPayload);
        // REDIRECT TO MAGIC CHECKOUT
        navigate('/checkout?magic=true'); 
      } else {
        masterTracker('AddToCart', eventPayload, eventPayload);
      }
  };

  const handleToggleFbt = (id: string) => {
      const newSelected = new Set(selectedFbtIds);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      setSelectedFbtIds(newSelected);
  };

  const handleAddFbtBundle = () => {
      if (!product) return;
      
      const bundleItems = [
          { product: product, quantity: 1 },
          ...fbtProducts.filter(p => selectedFbtIds.has(p.id)).map(p => ({ product: p, quantity: 1 }))
      ];

      addMultipleToCart(bundleItems);
      showToast(`Bundle of ${bundleItems.length} items added to cart!`, 'success');
      navigate('/checkout?magic=true'); // Multi-item also supports Magic Checkout
  };

  const fbtSellingTotal = (product ? product.price : 0) + fbtProducts.filter(p => selectedFbtIds.has(p.id)).reduce((sum, p) => sum + p.price, 0);
  const fbtMrpTotal = (product ? (product.mrp || product.price) : 0) + fbtProducts.filter(p => selectedFbtIds.has(p.id)).reduce((sum, p) => sum + (p.mrp || p.price), 0);
  const fbtSavings = fbtMrpTotal - fbtSellingTotal;
  const selectedCount = selectedFbtIds.size + 1;

  const submitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!product || !token) return;
      setSubmittingReview(true);
      setReviewError(null);
      try {
          const res = await fetch(getApiUrl(`/api/products/${product.id}/reviews`), {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({
                  rating: newReview.rating,
                  comment: newReview.comment,
                  imageUrl: newReview.imageUrl
              })
          });
          if (res.ok) {
              const saved = await res.json();
              setProduct(prev => prev ? ({ ...prev, reviews: [saved, ...(prev.reviews || [])] }) : null);
              setNewReview({ rating: 5, comment: '', imageUrl: '' });
              showToast('Review submitted successfully!', 'success');
          } else {
              throw res;
          }
      } catch(err) {
          const apiError = await handleApiError(err);
          setReviewError(getFriendlyErrorMessage(apiError));
      } finally {
          setSubmittingReview(false);
      }
  };
  
  const handleVideoShop = (link?: string) => {
      if (!link) return;
      if (link.startsWith('http')) {
          window.open(link, '_blank');
      } else {
          const target = link.startsWith('/') ? link : `/product/${link}`;
          navigate(target);
      }
      setSelectedVideo(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white">Loading...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center bg-white">Product not found</div>;

  const images = [product.imageUrl, ...(product.galleryImages || [])];
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  
  const reviews = product.reviews || [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviewCount).toFixed(1) : null;

  const plainDescription = truncateText(stripHtml(product.description));

  return (
    <div className="bg-white min-h-screen font-sans text-[#333]">
      <SEO 
        title={product.seoTitle || product.name}
        description={product.seoDescription || product.shortDescription || plainDescription}
        image={product.imageUrl}
        type="product"
        keywords={product.seoKeywords}
      />
      
      <Header user={user} logout={logout} />
      
      <ErrorBoundary>
        <div className="container mx-auto px-4 py-4 max-w-[1400px]">
            <nav className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Link to="/" className="hover:text-black transition-colors">Home</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate">{product.name}</span>
            </nav>
        </div>

        <main className="container mx-auto px-0 md:px-4 max-w-[1400px] pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-16">
              <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="relative w-full bg-gray-50 overflow-x-auto flex snap-x snap-mandatory scrollbar-hide lg:block lg:overflow-visible lg:rounded-xl group">
                      {images.map((img, idx) => (
                          <div key={idx} className="min-w-full lg:min-w-0 snap-center lg:hidden">
                              <img src={img} alt={`${product.name} ${idx}`} className="w-full h-auto aspect-[3/4] object-cover" />
                          </div>
                      ))}
                      
                      <img 
                          src={activeImage} 
                          alt={product.name} 
                          className="hidden lg:block w-full h-full object-cover aspect-[3/4] transition-transform duration-700 ease-in-out group-hover:scale-105 rounded-xl"
                      />

                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                          {discount > 0 && <span className="bg-rose-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded shadow-lg">-{discount}% Sale</span>}
                          {product.stock < 5 && product.stock > 0 && <span className="bg-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded shadow-lg">Low Stock</span>}
                      </div>
                  </div>

                  {images.length > 1 && (
                      <div className="hidden lg:grid grid-cols-5 gap-4">
                          {images.map((img, idx) => (
                              <button 
                                  key={idx} 
                                  onClick={() => setActiveImage(img)}
                                  className={`relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all ${activeImage === img ? 'border-rose-600 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                              >
                                  <img src={img} className="w-full h-full object-cover" alt="thumbnail"/>
                              </button>
                          ))}
                      </div>
                  )}
              </div>

              <div className="lg:col-span-5 relative px-4 pt-6 lg:px-0 lg:pt-0">
                  <div className="sticky top-28 space-y-8">
                      <div className="border-b border-gray-100 pb-6">
                          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">{product.brand || siteSettings?.storeName || 'Ayushree Ayurveda'}</h2>
                          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 leading-tight mb-4">{product.name}</h1>
                          <div className="flex items-center justify-between">
                              <div className="flex items-baseline gap-4">
                                  <span className="text-3xl font-bold text-rose-600">₹{product.price.toLocaleString()}</span>
                                  {product.mrp && product.mrp > product.price && (
                                      <span className="text-lg text-gray-400 line-through decoration-1">₹{product.mrp.toLocaleString()}</span>
                                  )}
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                  {reviewCount > 0 && avgRating ? (
                                      <>
                                          <StarIcon className="w-4 h-4 text-yellow-500" fill="currentColor"/>
                                          <span className="font-bold">{avgRating}</span>
                                          <a href="#reviews" className="text-gray-400 underline cursor-pointer hover:text-gray-600">({reviewCount} reviews)</a>
                                      </>
                                  ) : (
                                      <span className="text-gray-400">No reviews yet</span>
                                  )}
                              </div>
                          </div>

                          {product.shortDescription && (
                              <p className="mt-6 text-gray-600 text-sm leading-relaxed border-l-4 border-rose-100 pl-4 italic">
                                  {product.shortDescription}
                              </p>
                          )}
                      </div>

                      <div className="space-y-6">
                          {product.hasVariants && product.variants?.map((variant, idx) => (
                              <div key={idx}>
                                  <div className="flex justify-between mb-2">
                                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{variant.name}</span>
                                      <span className="text-xs font-bold text-gray-900">{selectedVariants[variant.name]}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                      {variant.options.map((opt, oIdx) => {
                                          const isSelected = selectedVariants[variant.name] === opt.value;
                                          return (
                                              <button 
                                                  key={oIdx}
                                                  onClick={() => handleVariantChange(variant.name, opt.value)}
                                                  className={`px-5 py-2 text-sm border rounded-lg transition-all min-w-[3rem] font-medium ${isSelected ? 'border-rose-600 bg-rose-50 text-rose-600 ring-1 ring-rose-600' : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'}`}
                                              >
                                                  {opt.value}
                                              </button>
                                          )
                                      })}
                                  </div>
                              </div>
                          ))}
                          
                          <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Quantity</span>
                              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg w-32 h-12">
                                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center hover:bg-gray-200 transition-colors text-xl font-medium">-</button>
                                  <span className="flex-1 text-center font-bold text-sm text-gray-900">{quantity}</span>
                                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center hover:bg-gray-200 transition-colors text-xl font-medium">+</button>
                              </div>
                          </div>
                      </div>

                      <div ref={addToCartRef} className="flex flex-col gap-3 pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleAddToCart(true)}
                                disabled={product.stock <= 0}
                                className="w-full bg-black text-white h-14 text-sm font-bold uppercase tracking-widest hover:bg-gray-900 rounded-xl shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Buy Now
                            </button>
                            <button 
                                onClick={() => handleAddToCart(false)}
                                disabled={product.stock <= 0}
                                className="w-full bg-rose-600 text-white h-14 text-sm font-bold uppercase tracking-widest hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                          </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                          <Accordion title="Product Description" defaultOpen>
                              <div 
                                  className="prose prose-sm max-w-none text-gray-600"
                                  dangerouslySetInnerHTML={{ __html: product.description }} 
                              />
                          </Accordion>
                          <Accordion title="Shipping & Returns">
                              <p>Free standard shipping on orders over ₹999. Easy 7-day returns for all eligible products in original condition.</p>
                          </Accordion>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* FBT Products and the rest remain unchanged */}
          {fbtProducts.length > 0 && (
              <div className="mt-20 border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
                      <h3 className="text-xl font-bold text-gray-800 font-serif">Frequently Bought Together</h3>
                  </div>
                  
                  <div className="p-8 flex flex-col xl:flex-row gap-12 items-start">
                      <div className="flex flex-wrap items-center justify-center gap-4 flex-1 w-full">
                          <div className="relative">
                              <div className="w-36 h-48 rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm bg-white">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-lg uppercase tracking-wider">This Item</div>
                          </div>

                          {fbtProducts.map((fbt) => (
                              <React.Fragment key={fbt.id}>
                                  <div className="text-gray-300 font-light text-3xl">＋</div>
                                  <div className="relative group">
                                      <Link to={`/product/${fbt.slug}`} className="block w-36 h-48 rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm bg-white transition-all hover:border-rose-400">
                                          <img src={fbt.imageUrl} alt={fbt.name} className={`w-full h-full object-cover transition-opacity duration-300 ${selectedFbtIds.has(fbt.id) ? 'opacity-100' : 'opacity-40 grayscale'}`} />
                                      </Link>
                                      {selectedFbtIds.has(fbt.id) && (
                                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-md">
                                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                          </div>
                                      )}
                                  </div>
                              </React.Fragment>
                          ))}
                      </div>

                      <div className="w-full xl:w-[400px] flex-shrink-0 bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                          <div className="mb-6">
                              <div className="flex items-baseline gap-2 mb-2">
                                  <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">Bundle Total:</span>
                                  <span className="text-3xl font-bold text-rose-600">₹{fbtSellingTotal.toLocaleString()}</span>
                              </div>
                              {fbtSavings > 0 && (
                                  <p className="text-sm text-green-600 font-bold bg-green-100 inline-block px-3 py-1 rounded-full shadow-sm">
                                      ✨ You Save ₹{fbtSavings.toLocaleString()}
                                  </p>
                              )}
                          </div>

                          <button 
                              onClick={handleAddFbtBundle}
                              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2 mb-6 uppercase tracking-wider"
                          >
                              <span>Add All {selectedCount} to Cart</span>
                          </button>

                          <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                  <input type="checkbox" checked disabled className="mt-1 w-4 h-4 text-gray-400 bg-gray-200 border-gray-300 rounded cursor-not-allowed" />
                                  <div className="text-sm">
                                      <span className="font-bold text-gray-900">Current item:</span> {product.name}
                                      <span className="block font-bold text-rose-600 mt-0.5">₹{product.price.toLocaleString()}</span>
                                  </div>
                              </div>

                              {fbtProducts.map((fbt) => (
                                  <div key={fbt.id} className="flex items-start gap-3">
                                      <input 
                                          type="checkbox" 
                                          id={`fbt-${fbt.id}`}
                                          checked={selectedFbtIds.has(fbt.id)} 
                                          onChange={() => handleToggleFbt(fbt.id)} 
                                          className="mt-1 w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500 cursor-pointer" 
                                      />
                                      <label htmlFor={`fbt-${fbt.id}`} className={`text-sm cursor-pointer transition-colors ${selectedFbtIds.has(fbt.id) ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                          <span className="font-medium hover:text-rose-600">{fbt.name}</span>
                                          <span className="block font-bold text-rose-600 mt-0.5">₹{fbt.price.toLocaleString()}</span>
                                      </label>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {shopVideos.length > 0 && (
              <div className="mt-24 pt-16 border-t border-gray-100">
                  <h3 className="text-3xl font-serif font-bold text-gray-900 mb-10 text-center uppercase tracking-widest">Style Inspiration</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 md:px-0">
                      {shopVideos.slice(0, 4).map(video => (
                          <div 
                              key={video._id}
                              onClick={() => setSelectedVideo(video)}
                              className="relative aspect-[9/16] bg-gray-100 cursor-pointer group overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500"
                          >
                              <video 
                                  src={video.videoUrl} 
                                  muted 
                                  loop 
                                  autoPlay 
                                  playsInline 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 border border-white/40 shadow-xl">
                                      <PlayIcon className="w-6 h-6 text-white ml-0.5"/>
                                  </div>
                              </div>
                              <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/80 to-transparent">
                                  <p className="text-white font-bold truncate mb-1 shadow-sm">{video.title}</p>
                                  <p className="text-rose-300 text-sm font-bold">{video.price}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {relatedProducts.length > 0 && (
              <div className="mt-24 pt-16 border-t border-gray-100">
                  <h3 className="text-3xl font-serif font-bold text-gray-900 mb-12 text-center uppercase tracking-widest">You Might Also Like</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 px-2 md:px-0">
                      {relatedProducts.map((p) => (
                          <ProductCard 
                            key={p.id} 
                            product={p} 
                            onProductClick={(s) => {
                                navigate(`/product/${s}`);
                                window.scrollTo(0,0);
                            }} 
                          />
                      ))}
                  </div>
              </div>
          )}

          <div id="reviews" className="mt-24 border-t border-gray-100 pt-16 pb-16 px-4 lg:px-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-4">
                      {user ? (
                          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">Leave a Review</h3>
                              <p className="text-sm text-gray-500 mb-8">Sharing your experience as <span className="font-bold text-gray-900">{user.name}</span> helps others choose better.</p>
                              <form onSubmit={submitReview} className="space-y-6">
                                  <ErrorMessage message={reviewError} onClose={() => setReviewError(null)} />
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Overall Rating</label>
                                      <div className="flex gap-2">
                                          {[1, 2, 3, 4, 5].map(star => (
                                              <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })} className="focus:outline-none transition-transform hover:scale-125">
                                                  <StarIcon className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" />
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-widest">Comment</label>
                                      <textarea required rows={4} value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all" placeholder="How was the quality? Any tips?" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-widest">Add a Photo (Optional)</label>
                                      <MediaPicker value={newReview.imageUrl} onChange={url => setNewReview({ ...newReview, imageUrl: url })} type="image" />
                                  </div>
                                  <button type="submit" disabled={submittingReview} className="w-full bg-black text-white font-bold py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-gray-900 disabled:opacity-50 transition-all shadow-lg active:scale-95">
                                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                                  </button>
                              </form>
                          </div>
                      ) : (
                          <div className="bg-rose-50 p-10 rounded-2xl text-center border border-rose-100">
                              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">Honest Feedback</h3>
                              <p className="text-sm text-gray-600 mb-8">Only verified customers can leave reviews. Please login to share your thoughts.</p>
                              <Link to="/login" className="inline-block px-10 py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest">
                                  Login to Review
                              </Link>
                          </div>
                      )}
                  </div>

                  <div className="lg:col-span-8">
                      <div className="mb-10">
                          <h3 className="text-3xl font-serif font-bold text-gray-900">What Others Say</h3>
                          <div className="w-20 h-1 bg-rose-600 mt-4"></div>
                      </div>
                      <div className="space-y-10">
                          {reviews.length > 0 ? (
                              reviews.map((review, index) => (
                                  <div key={review._id || index} className="flex gap-6 pb-10 border-b border-gray-100 last:border-b-0 animate-fade-in">
                                      <div className="flex-shrink-0">
                                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-600 shadow-inner">
                                              {review.name.charAt(0).toUpperCase()}
                                          </div>
                                      </div>
                                      <div className="flex-1">
                                          <div className="flex items-center justify-between mb-3">
                                              <div>
                                                  <span className="font-bold text-lg text-gray-900">{review.name}</span>
                                                  <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{new Date(review.date).toLocaleDateString()}</p>
                                              </div>
                                              <div className="flex gap-0.5">
                                                  {[...Array(5)].map((_, i) => (
                                                      <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" />
                                                  ))}
                                              </div>
                                          </div>
                                          <p className="text-gray-600 leading-relaxed italic">"{review.comment}"</p>
                                          {review.imageUrl && (
                                            <img src={review.imageUrl} alt={`Review by ${review.name}`} className="mt-5 rounded-xl w-40 h-40 object-cover border border-gray-200 shadow-sm hover:scale-105 transition-transform cursor-zoom-in"/>
                                          )}
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400 italic">No reviews yet. Be the first to share your choice!</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
        </main>
      </ErrorBoundary>

      <ProductStickyBar
        isVisible={isStickyBarVisible && product.stock > 0}
        product={product}
        selectedVariants={selectedVariants}
        onVariantChange={handleVariantChange}
        onAddToCart={() => handleAddToCart(true)} // Sticky bar buy now also goes to Magic Checkout
        quantity={quantity}
        onQuantityChange={setQuantity}
      />
      
      <Footer />
      
      {selectedVideo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
              <div className="absolute inset-0" onClick={() => setSelectedVideo(null)}></div>
              <div className="relative w-full max-w-md h-[85vh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                  <button onClick={() => setSelectedVideo(null)} className="absolute top-6 right-6 z-20 text-white bg-black/50 hover:bg-black/80 rounded-full p-2.5 transition-all backdrop-blur-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <video src={selectedVideo.videoUrl} className="w-full h-full object-cover" autoPlay playsInline loop onClick={(e) => (e.target as HTMLVideoElement).paused ? (e.target as HTMLVideoElement).play() : (e.target as HTMLVideoElement).pause()} />
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent">
                      <h3 className="text-white font-bold text-2xl mb-1 shadow-sm">{selectedVideo.title}</h3>
                      <p className="text-rose-400 font-bold text-xl mb-8">{selectedVideo.price}</p>
                      <button onClick={() => handleVideoShop(selectedVideo.productLink)} className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-100 transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-2xl">
                          <span className="uppercase text-sm tracking-widest">Shop This Style</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;
