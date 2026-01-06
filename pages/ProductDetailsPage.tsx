
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useParams, useNavigate, Link } = ReactRouterDom as any;
import { Product, ProductPageLayout, Review, ProductVariant } from '../types';
import { getApiUrl } from '../utils/apiHelper';
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
import { Badge } from '../components/ui/badge';
import { StarIcon, HeartIcon } from '../components/Icons';
import { cn } from '../utils/utils';

const ProductDetailsPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { siteSettings } = useSiteData();
    const [product, setProduct] = useState<Product | null>(null);
    const [layout, setLayout] = useState<ProductPageLayout | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
    const [quantity, setQuantity] = useState(1);
    const [showSticky, setShowSticky] = useState(false);
    
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

                if (p.hasVariants && p.variants) {
                    const defaults: any = {};
                    p.variants.forEach((v: ProductVariant) => {
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
        if (!product?.reviews || product.reviews.length === 0) return 4.8;
        const sum = product.reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / product.reviews.length).toFixed(1);
    }, [product]);

    const handleVariantSelect = (vName: string, oValue: string) => {
        setSelectedVariants(prev => ({ ...prev, [vName]: oValue }));
    };

    const handleAddToCart = (buyNow = false) => {
        if (!product) return;
        const variantStr = Object.values(selectedVariants).join(' / ');
        const productWithVariant = {
            ...product,
            name: variantStr ? `${product.name} (${variantStr})` : product.name
        };
        addToCart(productWithVariant, quantity);
        showToast(`${product.name} added to bag!`, 'success');
        if (buyNow) navigate('/checkout');
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!product) return <div className="h-screen flex items-center justify-center font-bold uppercase text-zinc-300 tracking-widest">Product Not Found</div>;

    const discountPercentage = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

    return (
        <div className="bg-white min-h-screen">
            <SEO title={product.name} description={product.shortDescription} image={product.imageUrl} type="product" />
            <Header user={user} logout={logout} />
            
            <main className="flex flex-col">
                <div className="container mx-auto px-4 lg:px-8 pt-6">
                    <nav className="text-[11px] text-zinc-500 font-medium tracking-tight">
                        <Link to="/" className="hover:text-zinc-900">Home</Link> / 
                        <Link to={`/collections/${product.category}`} className="mx-1 hover:text-zinc-900">{product.category}</Link> / 
                        <span className="text-zinc-400 font-normal">{product.name}</span>
                    </nav>
                </div>

                {layout?.sections && layout.sections.length > 0 ? (
                    layout.sections.map((sec) => {
                        if (!sec.isActive) return null;
                        
                        const sectionStyle: React.CSSProperties = {
                            paddingTop: `${sec.style?.paddingTop ?? 40}px`,
                            paddingBottom: `${sec.style?.paddingBottom ?? 80}px`,
                            backgroundColor: sec.style?.backgroundColor || 'transparent',
                            color: sec.style?.textColor || '#000000',
                            minHeight: sec.style?.minHeight || 'auto',
                            width: '100%',
                        };

                        const containerStyle: React.CSSProperties = {
                            maxWidth: sec.style?.containerMaxWidth || '1920px',
                            margin: '0 auto',
                        };

                        return (
                            <section key={sec.id} style={sectionStyle} className="relative overflow-visible">
                                <div style={containerStyle} className="px-4 lg:px-8">
                                    
                                    {sec.type === 'Hero' && (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-start" ref={heroRef}>
                                            
                                            {/* LEFT GALLERY */}
                                            <div className="lg:col-span-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <div className="overflow-hidden bg-zinc-50 border border-zinc-100 aspect-[3/4]">
                                                        <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
                                                    </div>
                                                    {[...(product.galleryImages || [])].slice(0, 3).map((img, i) => (
                                                        <div key={i} className="overflow-hidden bg-zinc-50 border border-zinc-100 aspect-[3/4]">
                                                            <img src={img} className="w-full h-full object-cover" alt={`${product.name} angle ${i+1}`} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* RIGHT INFO */}
                                            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                                                <div>
                                                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight leading-snug mb-4">
                                                        {product.name}
                                                    </h1>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex text-rose-300 gap-0.5">
                                                                {[...Array(5)].map((_, i) => <StarIcon key={i} className={cn("w-3.5 h-3.5", i < 4 ? 'fill-current' : 'text-zinc-200')} />)}
                                                            </div>
                                                            <span className="text-xs font-semibold text-zinc-400">({product.reviews?.length || 562})</span>
                                                        </div>
                                                        <button className="text-zinc-400 hover:text-rose-600 transition-colors">
                                                            <HeartIcon className="w-6 h-6 stroke-1" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-zinc-400 mt-2">Sku: {product.sku || 'N/A'}</p>
                                                </div>

                                                <div className="flex items-baseline gap-3 pt-2">
                                                    <span className="text-sm text-zinc-400 line-through font-medium">₹{product.mrp?.toLocaleString()}</span>
                                                    <span className="text-2xl font-bold text-zinc-900">₹{product.price.toLocaleString()}</span>
                                                    <span className="text-sm font-bold text-rose-500 uppercase">{discountPercentage}% Off</span>
                                                </div>

                                                {/* DYNAMIC VARIANT RENDERER */}
                                                {product.hasVariants && product.variants?.map((v) => {
                                                    const isColor = ['color', 'colors', 'colour', 'colours'].includes(v.name.toLowerCase());
                                                    const isSize = v.name.toLowerCase() === 'size';

                                                    return (
                                                        <div key={v.name} className="space-y-4 border-t border-zinc-100 pt-6">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-xs font-bold text-zinc-800 uppercase tracking-wide">{v.name}: <span className="text-zinc-400 ml-1">{selectedVariants[v.name]}</span></label>
                                                                {isSize && <button className="text-[10px] font-bold text-zinc-600 hover:underline">Size Chart</button>}
                                                            </div>

                                                            {isColor ? (
                                                                <div className="flex flex-wrap gap-3">
                                                                    {v.options.map((opt) => (
                                                                        <button
                                                                            key={opt.value}
                                                                            onClick={() => handleVariantSelect(v.name, opt.value)}
                                                                            className={cn(
                                                                                "group relative w-12 h-16 border transition-all overflow-hidden",
                                                                                selectedVariants[v.name] === opt.value ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
                                                                            )}
                                                                            title={opt.value}
                                                                        >
                                                                            <img src={opt.image || product.imageUrl} className="w-full h-full object-cover" alt={opt.value} />
                                                                            {selectedVariants[v.name] === opt.value && (
                                                                                <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                                                                                     <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {v.options.map((opt) => (
                                                                        <button
                                                                            key={opt.value}
                                                                            onClick={() => handleVariantSelect(v.name, opt.value)}
                                                                            className={cn(
                                                                                "px-4 py-2 border rounded-sm text-[10px] font-bold transition-all uppercase",
                                                                                selectedVariants[v.name] === opt.value 
                                                                                    ? "bg-zinc-900 text-white border-zinc-900 shadow-md" 
                                                                                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-900"
                                                                            )}
                                                                        >
                                                                            {opt.value}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                <div className="pt-6 border-t border-zinc-100">
                                                    <button 
                                                        onClick={() => handleAddToCart(false)}
                                                        className="w-full bg-[#16423C] text-white h-14 font-bold uppercase tracking-[0.15em] text-[13px] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all"
                                                    >
                                                        ADD TO BAG
                                                    </button>
                                                </div>
                                                
                                                <div className="pt-6">
                                                     <p className="text-xs text-zinc-500 leading-relaxed italic">
                                                        {product.shortDescription || "Premium quality Ayurvedic formulation crafted for pure wellness."}
                                                     </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* A+ CONTENT */}
                                    {sec.type === 'A+Content' && (
                                        <div className="space-y-32">
                                            {sec.content?.blocks?.map((block: any, bIdx: number) => (
                                                <div key={bIdx} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                                    <div className="max-w-5xl mx-auto text-center space-y-6">
                                                        <h3 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter text-zinc-900 italic leading-none">{block.title}</h3>
                                                        <p className="text-base md:text-xl text-zinc-500 leading-relaxed font-medium max-w-3xl mx-auto">{block.text}</p>
                                                    </div>
                                                    <div className="w-full aspect-[21/9] md:aspect-[3/1] bg-zinc-50 overflow-hidden shadow-2xl">
                                                        <img src={block.img} alt={block.title} className="w-full h-full object-cover" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* OTHER SECTIONS ... */}
                                    {sec.type === 'FAQ' && (
                                        <div className="max-w-4xl mx-auto py-12">
                                            <h2 className="text-2xl font-bold uppercase mb-10 tracking-widest text-center italic">Product Inquiries</h2>
                                            <div className="space-y-1">
                                                {sec.content?.faqs?.map((f: any, i: number) => (
                                                    <Accordion key={i} title={f.q} className="border-zinc-100 bg-zinc-50/30 px-6 rounded-lg mb-2">{f.a}</Accordion>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sec.type === 'Reviews' && (
                                        <div className="py-20">
                                            <div className="flex justify-between items-center mb-12">
                                                 <h2 className="text-4xl font-bold uppercase tracking-tighter italic">Client Voices</h2>
                                                 <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-black">{averageRating}</span>
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-4 h-4 fill-current" />)}
                                                    </div>
                                                 </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {product.reviews?.map((r, i) => (
                                                    <div key={i} className="bg-zinc-50/50 p-10 rounded-[2rem] border border-zinc-100 space-y-6">
                                                        <p className="text-zinc-600 font-medium italic text-lg leading-relaxed">"{r.comment}"</p>
                                                        <div className="flex items-center gap-4 pt-6 border-t border-zinc-100">
                                                            <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">{r.name[0]}</div>
                                                            <div>
                                                                <p className="text-xs font-black uppercase tracking-widest">{r.name}</p>
                                                                <p className="text-[10px] text-zinc-400 font-bold uppercase">{new Date(r.date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sec.type === 'RelatedProducts' && relatedProducts.length > 0 && (
                                        <div className="py-20 border-t border-zinc-50">
                                            <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-12 text-center text-zinc-400">Curated For You</h2>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-10">
                                                {relatedProducts.map(rp => <ProductCard key={rp.id} product={rp} />)}
                                            </div>
                                        </div>
                                    )}

                                    {sec.type === 'CustomCode' && <SafeCustomCode code={sec.code || ''} sectionId={sec.id} settingsJson={sec.settingsJson} productContext={product} relatedProducts={relatedProducts} />}
                                </div>
                            </section>
                        );
                    })
                ) : (
                    <div className="h-64 flex items-center justify-center italic text-zinc-300">Designer engine initializing...</div>
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
