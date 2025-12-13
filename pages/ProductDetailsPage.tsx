
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useParams, Link, useNavigate } = ReactRouterDom;
import { Helmet } from 'react-helmet-async';
import { Product, Review } from '../types';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Accordion from '../components/Accordion';
import ProductCard from '../components/ProductCard';
import ProductStickyBar from '../components/ProductStickyBar';
import { StarIcon, PlayIcon } from '../components/Icons';
import { masterTracker } from '../utils/tracking';
import { handleApiError, getFriendlyErrorMessage } from '../utils/errorHandler';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/apiHelper';
import ErrorBoundary from '../components/ErrorBoundary';
import MediaPicker from '../components/admin/MediaPicker';

interface ShopVideo {
    _id: string;
    title: string;
    videoUrl: string;
    thumbnailUrl: string;
    price: string;
    productLink?: string;
}

const ProductDetailsPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const token = localStorage.getItem('token');

  // --- Data State ---
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [shopVideos, setShopVideos] = useState<ShopVideo[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Interaction State ---
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<{[key: string]: string}>({});
  const [selectedVideo, setSelectedVideo] = useState<ShopVideo | null>(null);
  
  // --- Reviews State ---
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', imageUrl: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  
  // --- Sticky Bar State & Ref ---
  const [isStickyBarVisible, setIsStickyBarVisible] = useState(false);
  const addToCartRef = useRef<HTMLDivElement>(null);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [productRes, allProductsRes, videosRes] = await Promise.all([
            fetch(getApiUrl(`/api/products/slug/${slug}`)),
            fetch(getApiUrl('/api/products')),
            fetch(getApiUrl('/api/content/videos'))
        ]);

        if (!productRes.ok) {
            throw new Error("Product not found");
        }
        
        const foundProduct: Product = await productRes.json();
        const allProducts: Product[] = await allProductsRes.json();
        
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

            setRelatedProducts(allProducts.filter(p => p.category === foundProduct.category && p.id !== foundProduct.id).slice(0, 4));

            const viewedIds: string[] = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            const history = viewedIds.map(vid => allProducts.find(p => p.id === vid)).filter((p): p is Product => !!p && p.id !== foundProduct.id);
            setRecentlyViewed(history);
            
            const newHistory = [foundProduct.id, ...viewedIds.filter(vid => vid !== foundProduct.id)].slice(0, 8);
            localStorage.setItem('recentlyViewed', JSON.stringify(newHistory));

            // Meta Pixel & CAPI Tracking for ViewContent
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

        if (videosRes.ok) {
            setShopVideos(await videosRes.json());
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

  // --- Intersection Observer for Sticky Bar ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the main "Add to Cart" button is NOT visible in the viewport, show the sticky bar.
        // This is more reliable than checking scroll position.
        setIsStickyBarVisible(!entry.isIntersecting);
      },
      { 
        // Trigger when the element is fully out of view.
        threshold: 0 
      }
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
  }, [product]); // Re-observe if the product (and thus the layout) changes

  const handleVariantChange = (name: string, value: string) => {
      setSelectedVariants(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = () => {
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

      // Meta Pixel & CAPI Tracking for AddToCart
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
      masterTracker('AddToCart', eventPayload, eventPayload);
      
      navigate('/checkout');
  };

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
  
  // --- UPDATED: More accurate review calculation ---
  const reviews = product.reviews || [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviewCount).toFixed(1) : null;

  // --- ADDED: Helper for cleaning HTML and generating JSON-LD Schema ---
  const stripHtml = (html: string) => {
    if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>?/gm, '');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };
  
  const productSchema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.imageUrl,
    "description": product.seoDescription || product.shortDescription || stripHtml(product.description),
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Ladies Smart Choice"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
    }
  };

  if (reviewCount > 0 && avgRating) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": avgRating,
      "reviewCount": reviewCount
    };
  }

  return (
    <div className="bg-white min-h-screen font-sans text-[#333]">
      <Helmet>
        <title>{product.seoTitle || product.name} | Ladies Smart Choice</title>
        <meta name="description" content={product.seoDescription || product.shortDescription || stripHtml(product.description).substring(0, 160)} />
        <meta property="og:title" content={product.seoTitle || product.name} />
        <meta property="og:description" content={product.seoDescription || product.shortDescription} />
        <meta property="og:image" content={product.imageUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />
        <meta property="product:price:amount" content={String(product.price)} />
        <meta property="product:price:currency" content="INR" />
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      </Helmet>
      
      <Header user={user} logout={logout} />
      <ErrorBoundary>
        <div className="container mx-auto px-4 py-4 max-w-[1400px]">
            <nav className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Link to="/" className="hover:text-black transition-colors">Home</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate">{product.name}</span>
            </nav>
        </div>

        <main className="container mx-auto px-4 max-w-[1400px] pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden rounded-sm group cursor-zoom-in">
                      <img 
                          src={activeImage} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {discount > 0 && <span className="bg-rose-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">-{discount}% Sale</span>}
                          {product.stock < 5 && product.stock > 0 && <span className="bg-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">Low Stock</span>}
                      </div>
                  </div>
                  {images.length > 1 && (
                      <div className="grid grid-cols-5 gap-4">
                          {images.map((img, idx) => (
                              <button 
                                  key={idx} 
                                  onClick={() => setActiveImage(img)}
                                  className={`relative aspect-[3/4] overflow-hidden rounded-sm border transition-all ${activeImage === img ? 'border-black ring-1 ring-black' : 'border-transparent opacity-70 hover:opacity-100'}`}
                              >
                                  <img src={img} className="w-full h-full object-cover"/>
                              </button>
                          ))}
                      </div>
                  )}
              </div>

              <div className="lg:col-span-5 relative">
                  <div className="sticky top-8 space-y-8 bg-white z-30">
                      <div className="border-b border-gray-100 pb-6">
                          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">{product.brand || 'LADIES SMART CHOICE'}</h2>
                          <h1 className="text-3xl md:text-4xl font-serif text-gray-900 leading-tight mb-4">{product.name}</h1>
                          <div className="flex items-center justify-between">
                              <div className="flex items-baseline gap-4">
                                  <span className="text-2xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
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
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed">
                          {product.shortDescription || product.description.substring(0, 150) + "..."}
                      </p>

                      <div className="space-y-6">
                          {product.hasVariants && product.variants?.map((variant, idx) => (
                              <div key={idx}>
                                  <div className="flex justify-between mb-2">
                                      <span className="text-xs font-bold uppercase tracking-wider text-gray-900">{variant.name}</span>
                                      <span className="text-xs text-gray-500">{selectedVariants[variant.name]}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                      {variant.options.map((opt, oIdx) => {
                                          const isSelected = selectedVariants[variant.name] === opt.value;
                                          return (
                                              <button 
                                                  key={oIdx}
                                                  onClick={() => handleVariantChange(variant.name, opt.value)}
                                                  className={`px-6 py-2 text-sm border transition-all min-w-[3rem] ${isSelected ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}
                                              >
                                                  {opt.value}
                                              </button>
                                          )
                                      })}
                                  </div>
                              </div>
                          ))}
                          <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 block">Quantity</span>
                              <div className="flex items-center border border-gray-300 w-32 h-10">
                                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center hover:bg-gray-50">-</button>
                                  <span className="flex-1 text-center font-medium text-sm">{quantity}</span>
                                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center hover:bg-gray-50">+</button>
                              </div>
                          </div>
                      </div>

                      <div ref={addToCartRef} className="flex flex-col gap-3 pt-4">
                          <button 
                              onClick={handleAddToCart}
                              disabled={product.stock <= 0}
                              className="w-full bg-black text-white h-12 text-sm font-bold uppercase tracking-widest hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-opacity"
                          >
                              {product.stock > 0 ? `Add to Cart - ₹${(product.price * quantity).toLocaleString()}` : 'Out of Stock'}
                          </button>
                          {product.stock > 0 && (
                              <button 
                                  onClick={handleAddToCart}
                                  className="w-full bg-white border border-black text-black h-12 text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                              >
                                  Buy Now
                              </button>
                          )}
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                          <Accordion title="Product Description" defaultOpen>
                              <div 
                                  className="prose prose-sm max-w-none text-gray-600"
                                  dangerouslySetInnerHTML={{ __html: product.description }} 
                              />
                          </Accordion>
                          <Accordion title="Shipping & Delivery">
                              <p>Free shipping on orders over ₹999. Standard delivery takes 3-5 business days.</p>
                          </Accordion>
                          <Accordion title="Returns & Exchanges">
                              <p>Easy 7-day returns on unworn items with original tags attached.</p>
                          </Accordion>
                      </div>
                  </div>
              </div>
          </div>

          {shopVideos.length > 0 && (
              <div className="mt-24 border-t border-gray-100 pt-16">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-8 text-center">Style Inspiration</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      {shopVideos.slice(0, 4).map(video => (
                          <div 
                              key={video._id}
                              onClick={() => setSelectedVideo(video)}
                              className="relative aspect-[9/16] bg-gray-100 cursor-pointer group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all"
                          >
                              <video 
                                  src={video.videoUrl} 
                                  muted 
                                  loop 
                                  autoPlay 
                                  playsInline 
                                  className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-110 shadow-lg">
                                      <PlayIcon className="w-5 h-5 text-black ml-0.5"/>
                                  </div>
                              </div>
                              <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                  <p className="text-white font-bold truncate mb-1">{video.title}</p>
                                  <p className="text-white/80 text-xs">{video.price}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div id="reviews" className="mt-24 border-t border-gray-100 pt-16 pb-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-4">
                      {user ? (
                          <div className="bg-gray-50 p-8 rounded-xl">
                              <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Write a Review</h3>
                              <p className="text-sm text-gray-500 mb-6">Share your thoughts as <span className="font-bold">{user.name}</span>.</p>
                              <form onSubmit={submitReview} className="space-y-4">
                                  <ErrorMessage message={reviewError} onClose={() => setReviewError(null)} />
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Rating</label>
                                      <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                              <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })} className="focus:outline-none transition-transform hover:scale-110">
                                                  <StarIcon className={`w-6 h-6 ${star <= newReview.rating ? 'text-yellow-500' : 'text-gray-300'}`} fill="currentColor" />
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Review</label>
                                      <textarea required rows={4} value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-black focus:border-black" placeholder="How was the fit? Material quality?" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Add a Photo (Optional)</label>
                                      <MediaPicker value={newReview.imageUrl} onChange={url => setNewReview({ ...newReview, imageUrl: url })} type="image" />
                                  </div>
                                  <button type="submit" disabled={submittingReview} className="w-full bg-black text-white font-bold py-3 rounded-md uppercase text-xs tracking-widest hover:bg-gray-900 disabled:opacity-50 transition-colors">
                                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                                  </button>
                              </form>
                          </div>
                      ) : (
                          <div className="bg-gray-50 p-8 rounded-xl text-center">
                              <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Want to share your thoughts?</h3>
                              <p className="text-sm text-gray-600 mb-6">Please log in to write a review and share your feedback with other customers.</p>
                              <Link to="/login" className="px-6 py-3 bg-rose-600 text-white font-semibold rounded-md hover:bg-rose-700 transition-colors">
                                  Login to Review
                              </Link>
                          </div>
                      )}
                  </div>

                  <div className="lg:col-span-8">
                      <div className="flex items-end justify-between mb-8">
                          <div>
                              <h3 className="text-2xl font-serif font-bold text-gray-900">Customer Reviews</h3>
                              <p className="text-sm text-gray-500 mt-1">Real feedback from our amazing customers.</p>
                          </div>
                      </div>
                      <div className="space-y-8">
                          {reviews.length > 0 ? (
                              reviews.map((review, index) => (
                                  <div key={review._id || index} className="flex gap-4 border-b border-gray-100 pb-8 last:border-b-0">
                                      <div className="flex-shrink-0">
                                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                              {review.name.charAt(0)}
                                          </div>
                                      </div>
                                      <div>
                                          <div className="flex items-center mb-2">
                                              <span className="font-bold text-gray-800 mr-3">{review.name}</span>
                                              <div className="flex">
                                                  {[...Array(5)].map((_, i) => (
                                                      <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`} fill="currentColor" />
                                                  ))}
                                              </div>
                                          </div>
                                          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                          {review.imageUrl && (
                                            <img src={review.imageUrl} alt={`Review by ${review.name}`} className="mt-4 rounded-lg w-32 h-32 object-cover border"/>
                                          )}
                                          <p className="text-xs text-gray-400 mt-3">{new Date(review.date).toLocaleDateString()}</p>
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
                          )}
                      </div>
                  </div>
              </div>
          </div>

          {selectedVideo && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="absolute inset-0" onClick={() => setSelectedVideo(null)}></div>
                  
                  <div className="relative w-full max-w-md h-[85vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                      <button 
                          onClick={() => setSelectedVideo(null)} 
                          className="absolute top-4 right-4 z-20 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors backdrop-blur-md"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                      
                      <video 
                          src={selectedVideo.videoUrl} 
                          className="w-full h-full object-cover" 
                          autoPlay 
                          playsInline 
                          loop
                          onClick={(e) => {
                              const v = e.target as HTMLVideoElement;
                              v.paused ? v.play() : v.pause();
                          }}
                      />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pointer-events-none">
                          <div className="pointer-events-auto">
                              <h3 className="text-white font-bold text-2xl mb-1 drop-shadow-md">{selectedVideo.title}</h3>
                              <p className="text-white/90 font-medium text-xl mb-6 drop-shadow-sm">{selectedVideo.price}</p>
                              
                              <button 
                                  onClick={() => handleVideoShop(selectedVideo.productLink)}
                                  className="w-full bg-white text-black font-bold py-4 rounded-full hover:bg-gray-100 transition-transform transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                              >
                                  <span>View Product</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
        </main>
      </ErrorBoundary>

      <ProductStickyBar
        isVisible={isStickyBarVisible && product.stock > 0}
        product={product}
        selectedVariants={selectedVariants}
        onVariantChange={handleVariantChange}
        onAddToCart={handleAddToCart}
        quantity={quantity}
      />
      
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
