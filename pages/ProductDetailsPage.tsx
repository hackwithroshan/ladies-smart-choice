
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useParams, useNavigate } = ReactRouterDom as any;
import { Product, ProductPageLayout, Review } from '../types';
import { getApiUrl } from '../utils/apiHelper';
import { trackEvent } from '../utils/metaPixel';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import SafeCustomCode from '../components/SafeCustomCode';
import Accordion from '../components/Accordion';
import ProductStickyBar from '../components/ProductStickyBar';
import ProductCard from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useSiteData } from '../contexts/SiteDataContext';
import { Button } from '../components/ui/button';
import {
    Accordion as UiAccordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../components/ui/accordion"
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Share2, Star } from 'lucide-react';


const ProductDetailsPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { siteSettings } = useSiteData();
    const [product, setProduct] = useState<Product | null>(null);
    const [layout, setLayout] = useState<ProductPageLayout | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [heroTab, setHeroTab] = useState<'desc' | 'ship'>('desc');
    const [mainImage, setMainImage] = useState<string>('');
    const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
    const [quantity, setQuantity] = useState(1);
    const [showSticky, setShowSticky] = useState(false);

    // Review Form State
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const heroRef = useRef<HTMLDivElement>(null);
    const { addToCart } = useCart();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const pRes = await fetch(getApiUrl(`/api/products/slug/${slug}`));
                if (!pRes.ok) throw new Error("Product not found");
                const p = await pRes.json();
                setProduct(p);
                setMainImage(p.imageUrl);

                // Track ViewContent
                trackEvent('ViewContent', {
                    content_name: p.name,
                    content_ids: [p.id || p._id],
                    content_type: 'product',
                    value: p.price,
                    currency: 'INR'
                });

                if (p.hasVariants && p.variants) {
                    const defaults: any = {};
                    p.variants.forEach((v: any) => {
                        if (v.options?.length > 0) defaults[v.name] = v.options[0].value;
                    });
                    setSelectedVariants(defaults);
                }

                const pId = p.id || p._id;
                const [lRes, rRes] = await Promise.all([
                    fetch(getApiUrl(`/api/settings/pdp-layout/${pId}`)),
                    fetch(getApiUrl(`/api/products/${pId}/related`))
                ]);

                if (lRes.ok) setLayout(await lRes.json());
                if (rRes.ok) setRelatedProducts(await rRes.json());

            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchAllData();
    }, [slug]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setShowSticky(!entry.isIntersecting),
            { threshold: 0.1 }
        );
        if (heroRef.current) observer.observe(heroRef.current);
        return () => observer.disconnect();
    }, [loading]);

    const averageRating = useMemo(() => {
        if (!product?.reviews || product.reviews.length === 0) return 5;
        const sum = product.reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / product.reviews.length).toFixed(1);
    }, [product]);

    const handleVariantSelect = (vName: string, oValue: string, oImage?: string) => {
        setSelectedVariants(prev => ({ ...prev, [vName]: oValue }));
        if (oImage) setMainImage(oImage);
    };

    const handleAddToCart = (buyNow = false) => {
        if (!product) return;

        // Create a unique product identity for the cart based on selected variants
        let productToAdd = { ...product };
        if (product.hasVariants && product.variants && Object.keys(selectedVariants).length > 0) {
            // override ID and Name for cart distinction
            const variantValues = Object.values(selectedVariants);
            const variantKey = variantValues.join('-');
            const variantLabel = Object.entries(selectedVariants).map(([k, v]) => `${v}`).join(' / ');

            productToAdd.id = `${product.id}-${variantKey}`;
            productToAdd.name = `${product.name} - ${variantLabel}`;

            // Update price if 'Size' variant affects it (common case)
            if (selectedVariants['Size']) {
                const sizeVar = product.variants.find(v => v.name === 'Size');
                const sizeOpt = sizeVar?.options.find(o => o.value === selectedVariants['Size']);
                if (sizeOpt) productToAdd.price = sizeOpt.price;
            }
        }

        addToCart(productToAdd, quantity);

        // Track AddToCart
        trackEvent('AddToCart', {
            content_name: productToAdd.name,
            content_ids: [productToAdd.id],
            content_type: 'product',
            value: productToAdd.price * quantity,
            currency: 'INR'
        });

        showToast(`${product.name} added to bag!`, 'success');
        if (buyNow) navigate('/checkout');
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return navigate('/login');
        if (!reviewComment.trim()) return showToast('Please write a comment.', 'error');

        setSubmittingReview(true);
        const pId = product?.id || product?._id;
        try {
            const res = await fetch(getApiUrl(`/api/products/${pId}/reviews`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
            });

            if (res.ok) {
                const data = await res.json();
                setProduct(prev => prev ? { ...prev, reviews: data.reviews } : null);
                setReviewComment('');
                setReviewRating(5);
                showToast('Thank you for your review!', 'success');
            }
        } catch (e) { console.error(e); }
        finally { setSubmittingReview(false); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
    if (!product) return <div className="h-screen flex items-center justify-center font-bold uppercase text-gray-400 tracking-widest">Product Not Found</div>;

    const hasLayout = layout && layout.sections && layout.sections.length > 0;

    return (
        <div className="bg-white min-h-screen">
            <SEO title={product.name} description={product.shortDescription} image={product.imageUrl} type="product" />
            <Header user={user} logout={logout} />

            <main className="flex flex-col">
                {hasLayout ? (
                    layout?.sections.map(sec => {
                        if (!sec.isActive) return null;

                        const commonStyles: React.CSSProperties = {
                            paddingTop: `${sec.style?.paddingTop}px`,
                            paddingBottom: `${sec.style?.paddingBottom}px`,
                            paddingLeft: `${sec.style?.paddingLeft}px`,
                            paddingRight: `${sec.style?.paddingRight}px`,
                            marginTop: `${sec.style?.marginTop}px`,
                            marginBottom: `${sec.style?.marginBottom}px`,
                            marginLeft: `${sec.style?.marginLeft}px`,
                            marginRight: `${sec.style?.marginRight}px`,
                            backgroundColor: sec.style?.backgroundColor,
                            color: sec.style?.textColor
                        };

                        return (
                            <section key={sec.id} style={commonStyles}>
                                <div style={{ maxWidth: sec.style?.containerMaxWidth || '1200px', width: '100%' }} className="mx-auto">
                                    {sec.type === 'Hero' && (
                                        <div className="w-full" ref={heroRef}>
                                            <div className="text-xs text-gray-500 mb-6 px-4">Home / {product.category} / <span className="text-gray-900">{product.name}</span></div>

                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-0 lg:px-4">
                                                {/* Image Gallery - Left Side */}
                                                <div className="lg:col-span-7">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                                        {[product.imageUrl, ...(product.galleryImages || [])].slice(0, 4).map((img, i) => (
                                                            <div key={i} className="aspect-[3/4] overflow-hidden bg-gray-100 relative group cursor-pointer" onClick={() => setMainImage(img)}>
                                                                <img
                                                                    src={img}
                                                                    alt={`${product.name} view ${i + 1}`}
                                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Product Info - Right Side */}
                                                <div className="lg:col-span-5 space-y-6 pt-4 px-4 lg:px-0">
                                                    <div>
                                                        <h1 className="text-2xl lg:text-3xl font-normal text-gray-900 mb-2 leading-tight">{product.name}</h1>
                                                        <p className="text-gray-500 text-sm mb-4">{product.shortDescription}</p>

                                                        {/* Ratings */}
                                                        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                                                            <div className="flex gap-1 border border-gray-200 px-2 py-1 rounded-[2px] items-center">
                                                                <span className="text-sm font-bold text-gray-900">{averageRating}</span>
                                                                <Star className="w-3 h-3 fill-teal-500 text-teal-500" />
                                                            </div>
                                                            <span className="text-gray-500 text-sm">|</span>
                                                            <span className="text-gray-500 text-sm">{product.reviews?.length || 562} Ratings</span>
                                                        </div>
                                                    </div>

                                                    {/* Price */}
                                                    <div>
                                                        <div className="flex items-baseline gap-3 mb-1">
                                                            <span className="text-2xl font-bold text-gray-900">
                                                                ₹{product.hasVariants && product.variants?.some(v => v.name === 'Size' && selectedVariants['Size'])
                                                                    ? (product.variants.find(v => v.name === 'Size')?.options.find(o => o.value === selectedVariants['Size'])?.price || product.price).toLocaleString('en-IN')
                                                                    : product.price.toLocaleString('en-IN')
                                                                }
                                                            </span>
                                                            <span className="text-lg text-gray-500 line-through">₹{Math.floor(product.price * 1.3).toLocaleString('en-IN')}</span>
                                                            <span className="text-lg text-[#ff3f6c] font-bold">(30% OFF)</span>
                                                        </div>
                                                        <p className="text-teal-600 text-xs font-bold uppercase tracking-wider">inclusive of all taxes</p>
                                                    </div>

                                                    {/* Variants */}
                                                    {product.hasVariants && product.variants && (
                                                        <div className="space-y-6">
                                                            {product.variants.map((v, idx) => {
                                                                const isColor = v.name.toLowerCase().includes('color') || v.name.toLowerCase().includes('colour');
                                                                if (isColor) return null; // Handle colors separately below

                                                                return (
                                                                    <div key={idx} className="space-y-3">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-sm font-bold uppercase text-gray-900">Select {v.name}</span>
                                                                            <span className="text-xs font-bold text-[#ff3f6c] uppercase cursor-pointer hover:underline">Size Chart &gt;</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-3">
                                                                            {v.options.map((opt, oIdx) => {
                                                                                const isSelected = selectedVariants[v.name] === opt.value;
                                                                                return (
                                                                                    <button
                                                                                        key={oIdx}
                                                                                        onClick={() => handleVariantSelect(v.name, opt.value, opt.image)}
                                                                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all border ${isSelected
                                                                                            ? 'border-[#ff3f6c] text-[#ff3f6c] bg-white ring-1 ring-[#ff3f6c]'
                                                                                            : 'border-gray-200 text-gray-700 hover:border-[#ff3f6c]'
                                                                                            }`}
                                                                                    >
                                                                                        {opt.value}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}

                                                            {/* Color Variants specific UI */}
                                                            {product.variants.filter(v => v.name.toLowerCase().includes('color') || v.name.toLowerCase().includes('colour')).map((v, idx) => (
                                                                <div key={idx} className="space-y-3">
                                                                    <span className="text-sm font-bold uppercase text-gray-900">Colors</span>
                                                                    <div className="flex flex-wrap gap-4">
                                                                        {v.options.map((opt, oIdx) => {
                                                                            const isSelected = selectedVariants[v.name] === opt.value;
                                                                            return (
                                                                                <div key={oIdx} className="group cursor-pointer text-center space-y-1" onClick={() => handleVariantSelect(v.name, opt.value, opt.image)}>
                                                                                    <div className={`w-16 h-20 rounded-md overflow-hidden border-2 transition-all ${isSelected ? 'border-[#ff3f6c]' : 'border-transparent group-hover:border-gray-300'}`}>
                                                                                        {opt.image ? (
                                                                                            <img src={opt.image} className="w-full h-full object-cover" alt={opt.value} />
                                                                                        ) : (
                                                                                            <div className="w-full h-full" style={{ backgroundColor: opt.value.toLowerCase() }} />
                                                                                        )}
                                                                                    </div>
                                                                                    <span className={`text-xs ${isSelected ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{opt.value}</span>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                                                        <Button
                                                            onClick={() => handleAddToCart(false)}
                                                            className="flex-1 h-12 bg-white border border-black text-black hover:bg-black hover:text-white rounded-md font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all"
                                                        >
                                                            <ShoppingBag size={18} />
                                                            Add to Cart
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleAddToCart(true)}
                                                            className="flex-1 h-12 bg-[#9f2089] hover:bg-[#851b72] text-white rounded-md font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                                                        >
                                                            <ShoppingBag size={18} fill="currentColor" />
                                                            Buy Now
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="w-12 h-12 border-gray-200 text-gray-500 rounded-md flex items-center justify-center hover:border-[#ff3f6c] hover:text-[#ff3f6c] transition-colors"
                                                            aria-label="Add to Wishlist"
                                                        >
                                                            <Heart size={20} />
                                                        </Button>
                                                    </div>

                                                    {/* Delivery Info */}
                                                    <div className="mt-8 space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <Truck size={20} className="text-gray-400" />
                                                            <span className="text-sm text-gray-600">Get it by <span className="font-bold text-gray-900">{new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString().slice(0, 10)}</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <RotateCcw size={20} className="text-gray-400" />
                                                            <span className="text-sm text-gray-600">14 Day Return Policy</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <ShieldCheck size={20} className="text-gray-400" />
                                                            <span className="text-sm text-gray-600">100% Original Products</span>
                                                        </div>
                                                    </div>

                                                    {/* Render Child Nested Sections (e.g. ProductDetails) */}
                                                    {sec.children && sec.children.map(child => {
                                                        if (child.type === 'ProductDetails') {
                                                            return (
                                                                <div key={child.id} className="pt-6 border-t border-gray-100 mt-6">
                                                                    <UiAccordion type="single" collapsible className="w-full">
                                                                        <AccordionItem value="desc">
                                                                            <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Description</AccordionTrigger>
                                                                            <AccordionContent>
                                                                                <div className="prose prose-sm max-w-none text-zinc-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }}></div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                        <AccordionItem value="details">
                                                                            <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Product Details</AccordionTrigger>
                                                                            <AccordionContent>
                                                                                <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                    <p>Material: 100% Cotton</p>
                                                                                    <p>Fit: Regular Fit</p>
                                                                                    <p>Pattern: Solid</p>
                                                                                </div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                        <AccordionItem value="care">
                                                                            <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Product Care</AccordionTrigger>
                                                                            <AccordionContent>
                                                                                <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                    Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.
                                                                                </div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                        <AccordionItem value="shipping">
                                                                            <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Shipping & Delivery</AccordionTrigger>
                                                                            <AccordionContent>
                                                                                <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                    Standard shipping: 3-5 business days. Express shipping available at checkout.
                                                                                </div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                        <AccordionItem value="returns">
                                                                            <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Return & Exchange Policy</AccordionTrigger>
                                                                            <AccordionContent>
                                                                                <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                    Easy returns within 14 days of delivery. Items must be unworn and in original packaging.
                                                                                </div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                        <AccordionItem value="seller">
                                                                            <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Seller Information</AccordionTrigger>
                                                                            <AccordionContent>
                                                                                <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                    Sold by: {siteSettings?.storeName || 'Store Name'}
                                                                                </div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                        <AccordionItem value="gst">
                                                                            <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">GST Benefits</AccordionTrigger>
                                                                            <AccordionContent>
                                                                                <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                    Save up to 18% with GST input credit for business purchases.
                                                                                </div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                    </UiAccordion>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {sec.type === 'A+Content' && (
                                        <div className="space-y-16">
                                            {(sec.content?.title || sec.content?.description) && (
                                                <div className="text-center space-y-4 max-w-4xl mx-auto px-4">
                                                    {sec.content.title && <h2 style={{ color: sec.style?.textColor }} className="text-3xl font-black uppercase tracking-tight leading-none">{sec.content.title}</h2>}
                                                    {sec.content.description && <p style={{ color: sec.style?.textColor }} className="opacity-80 leading-relaxed text-base whitespace-pre-wrap">{sec.content.description}</p>}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 gap-12">
                                                {(sec.content?.blocks || []).map((b: any, i: number) => (
                                                    <div key={i} className="space-y-6 animate-fade-in text-center">
                                                        {b.img && (
                                                            <div className="relative overflow-hidden mx-auto" style={{ borderRadius: `${sec.style?.imageBorderRadius || 0}px`, width: sec.style?.imageWidth || '100%' }}>
                                                                {b.link ? (
                                                                    <a href={b.link}>
                                                                        <img
                                                                            src={b.img}
                                                                            style={{ width: '100%', height: sec.style?.imageHeight || 'auto' }}
                                                                            className={`object-cover ${sec.style?.imageAlign === 'left' ? 'mr-auto ml-0' : sec.style?.imageAlign === 'right' ? 'ml-auto mr-0' : 'mx-auto'}`}
                                                                            alt={b.title || 'Product Feature'}
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <img
                                                                        src={b.img}
                                                                        style={{ width: '100%', height: sec.style?.imageHeight || 'auto' }}
                                                                        className={`object-cover ${sec.style?.imageAlign === 'left' ? 'mr-auto ml-0' : sec.style?.imageAlign === 'right' ? 'ml-auto mr-0' : 'mx-auto'}`}
                                                                        alt={b.title || 'Product Feature'}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}

                                                        {(b.title || b.text) && (
                                                            <div className={`max-w-4xl mx-auto px-4 text-${sec.style?.textAlign || 'center'}`}>
                                                                {b.title && <h3 style={{ color: sec.style?.textColor }} className="text-2xl font-black uppercase tracking-tighter italic mb-4 leading-tight">{b.title}</h3>}
                                                                {b.text && <p style={{ color: sec.style?.textColor }} className="opacity-80 leading-relaxed text-lg whitespace-pre-wrap">{b.text}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sec.type === 'FAQ' && (
                                        <div className="max-w-3xl mx-auto px-4">
                                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center mb-12">Care & Guidance</h2>
                                            <div className="space-y-2 text-left">
                                                {(sec.content?.faqs || []).map((f: any, i: number) => (
                                                    <Accordion key={i} title={f.q}>{f.a}</Accordion>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sec.type === 'Reviews' && (
                                        <div className="px-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                                                <div className="space-y-12">
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Customer Voices</h2>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-5xl font-black text-brand-primary">{averageRating}</div>
                                                            <div className="space-y-1">
                                                                <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => <svg key={i} className={`w-5 h-5 fill-current ${i < Math.floor(Number(averageRating)) ? 'text-yellow-400' : 'text-gray-200'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Based on {product.reviews?.length || 0} reviews</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {user ? (
                                                        <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 space-y-6">
                                                            <h4 className="text-xl font-black uppercase italic">Write a Review</h4>
                                                            <div className="flex gap-2">
                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                    <button key={s} type="button" onClick={() => setReviewRating(s)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${reviewRating === s ? 'bg-black text-white shadow-xl scale-110' : 'bg-white border-2 border-gray-100 text-gray-300'}`}>
                                                                        {s}★
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <textarea
                                                                value={reviewComment}
                                                                onChange={e => setReviewComment(e.target.value)}
                                                                placeholder="Tell us your experience..."
                                                                className="w-full bg-white border-2 border-gray-100 rounded-3xl p-6 outline-none focus:border-black transition-all h-32 resize-none"
                                                            />
                                                            <button type="submit" disabled={submittingReview} className="w-full h-14 bg-black text-white rounded-full font-black uppercase text-xs tracking-widest">Submit Feedback</button>
                                                        </form>
                                                    ) : (
                                                        <div className="bg-gray-900 text-white p-10 rounded-[3rem] text-center space-y-6">
                                                            <p className="text-lg font-black italic uppercase tracking-tighter">Share your experience!</p>
                                                            <button onClick={() => navigate('/login')} className="bg-white text-black px-10 py-3 rounded-full font-black uppercase text-[10px] tracking-widest">Login to Review</button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-8 max-h-[600px] overflow-y-auto admin-scroll pr-4">
                                                    {product.reviews && product.reviews.length > 0 ? (
                                                        [...product.reviews].reverse().map((rev, idx) => (
                                                            <div key={idx} className="bg-white border-b border-gray-100 pb-8 animate-fade-in">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div>
                                                                        <p className="text-sm font-black uppercase tracking-tight text-gray-900">{rev.name}</p>
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(rev.date).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <div className="flex text-yellow-400">
                                                                        {[...Array(5)].map((_, i) => <svg key={i} className={`w-3 h-3 fill-current ${i < rev.rating ? 'text-yellow-400' : 'text-gray-100'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-gray-600 font-medium leading-relaxed italic">"{rev.comment}"</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-400 italic">No reviews yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {sec.type === 'RelatedProducts' && relatedProducts.length > 0 && (
                                        <div className="px-4">
                                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center mb-12">Discover More</h2>
                                            <div className="grid grid-cols-2 gap-6" style={{ gridTemplateColumns: `repeat(${sec.settings?.itemsPerRow || 4}, minmax(0, 1fr))` }}>
                                                {relatedProducts.slice(0, sec.settings?.limit || 4).map(p => (
                                                    <ProductCard key={p.id || p._id} product={p} onProductClick={(slug) => navigate(`/product/${slug}`)} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sec.type === 'ProductDetails' && (
                                        <div className="px-6 mx-auto" style={{ maxWidth: '800px' }}>
                                            <UiAccordion type="single" collapsible className="w-full">
                                                <AccordionItem value="desc">
                                                    <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Description</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="prose prose-sm max-w-none text-zinc-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }}></div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="details">
                                                    <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Product Details</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="text-zinc-500 text-sm leading-relaxed">
                                                            <p>Material: 100% Cotton</p>
                                                            <p>Fit: Regular Fit</p>
                                                            <p>Pattern: Solid</p>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="care">
                                                    <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Product Care</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="text-zinc-500 text-sm leading-relaxed">
                                                            Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="shipping">
                                                    <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Shipping & Delivery</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="text-zinc-500 text-sm leading-relaxed">
                                                            Standard shipping: 3-5 business days. Express shipping available at checkout.
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="returns">
                                                    <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Return & Exchange Policy</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="text-zinc-500 text-sm leading-relaxed">
                                                            Easy returns within 14 days of delivery. Items must be unworn and in original packaging.
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="seller">
                                                    <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Seller Information</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="text-zinc-500 text-sm leading-relaxed">
                                                            Sold by: {siteSettings?.storeName || 'Store Name'}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="gst">
                                                    <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">GST Benefits</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="text-zinc-500 text-sm leading-relaxed">
                                                            Save up to 18% with GST input credit for business purchases.
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </UiAccordion>
                                        </div>
                                    )}

                                    {sec.type === 'CustomCode' && <SafeCustomCode code={sec.code || ''} sectionId={sec.id} productContext={product} />}
                                </div>
                            </section>
                        );
                    })
                ) : (
                    <section className="container mx-auto px-4 py-20 text-center text-gray-400 italic">No design layout configured.</section>
                )}
            </main>
            <ProductStickyBar
                isVisible={showSticky}
                product={product}
                selectedVariants={selectedVariants}
                onVariantChange={handleVariantSelect}
                onAddToCart={() => handleAddToCart(false)}
                onBuyNow={() => handleAddToCart(true)}
                quantity={quantity}
                onQuantityChange={setQuantity}
            />
            <Footer />
        </div>
    );
};

export default ProductDetailsPage;
