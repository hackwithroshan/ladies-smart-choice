
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
import { masterTracker } from '../utils/tracking';

const ProductDetailsPage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { siteSettings, loading: siteLoading } = useSiteData();
    const [product, setProduct] = useState<Product | null>(null);
    const [layout, setLayout] = useState<ProductPageLayout | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    
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
                const pRes = await fetch(getApiUrl(`products/slug/${slug}`));
                if (!pRes.ok) throw new Error("Product not found");
                const p = await pRes.json();
                setProduct(p);

                // FIRE VIEW CONTENT TRACKING
                masterTracker('ViewContent', {
                    content_name: p.name,
                    content_category: p.category,
                    content_ids: [String(p.sku || p._id || p.id)],
                    value: p.price,
                    currency: 'INR'
                });

                if (p.hasVariants && p.variants) {
                    const defaults: any = {};
                    p.variants.forEach((v: ProductVariant) => {
                        if (v.options?.length > 0) defaults[v.name] = v.options[0].value;
                    });
                    setSelectedVariants(defaults);
                }
                
                const pId = p.id || p._id;
                const [lRes, rRes] = await Promise.all([
                    fetch(getApiUrl(`settings/pdp-layout/${pId}`)),
                    fetch(getApiUrl(`products/${pId}/related`))
                ]);
                
                if (lRes.ok) setLayout(await lRes.json());
                if (rRes.ok) setRelatedProducts(await rRes.json());

            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        fetchAllData();
    }, [slug]);

    const handleAction = async (isBuyNow = true) => {
        if (!product) return;
        setProcessing(true);
        
        const trackingId = String(product.sku || product.id);

        if (isBuyNow) {
            // TRACK INITIATE CHECKOUT IMMEDIATELY
            await masterTracker('InitiateCheckout', {
                content_name: product.name,
                content_category: product.category,
                content_ids: [trackingId],
                value: product.price * quantity,
                num_items: quantity,
                currency: 'INR'
            });
            
            addToCart(product, quantity);
            navigate('/checkout');
        } else {
            // TRACK ADD TO CART
            await masterTracker('AddToCart', {
                content_name: product.name,
                content_category: product.category,
                content_ids: [trackingId],
                value: product.price * quantity,
                currency: 'INR'
            });

            addToCart(product, quantity);
            showToast(`${product.name} added! Redirecting to checkout...`, 'success');
            
            // REDIRECT TO CHECKOUT AFTER 2 SECONDS
            setTimeout(() => {
                navigate('/checkout');
            }, 2000);
        }
    };

    if (loading || siteLoading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div></div>;
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
                        return (
                            <section key={sec.id} className="relative overflow-visible px-4 lg:px-8 py-10">
                                <div className="max-w-[1400px] mx-auto">
                                    {sec.type === 'Hero' && (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start" ref={heroRef}>
                                            <div className="lg:col-span-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <img src={product.imageUrl} className="w-full aspect-[3/4] object-cover border" alt={product.name} />
                                                    {product.galleryImages?.slice(0, 1).map((img, i) => (
                                                        <img key={i} src={img} className="w-full aspect-[3/4] object-cover border" />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="lg:col-span-4 space-y-6">
                                                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 uppercase tracking-tighter italic">{product.name}</h1>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-2xl font-black text-zinc-900">₹{product.price.toLocaleString()}</span>
                                                    <span className="text-sm text-zinc-400 line-through">₹{product.mrp?.toLocaleString()}</span>
                                                </div>
                                                <div className="pt-6 border-t flex flex-col gap-3">
                                                    <button onClick={() => handleAction(false)} disabled={processing} className="w-full bg-zinc-100 h-14 font-black uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-all">Add to Cart</button>
                                                    <button onClick={() => handleAction(true)} disabled={processing} className="w-full bg-zinc-900 text-white h-14 font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all">Buy Now</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {sec.type === 'CustomCode' && <SafeCustomCode code={sec.code || ''} sectionId={sec.id} settingsJson={sec.settingsJson} productContext={product} />}
                                </div>
                            </section>
                        );
                    })
                ) : <div className="h-64 flex items-center justify-center italic text-zinc-300">Designer engine initializing...</div>}
            </main>
            <Footer />
        </div>
    );
};

export default ProductDetailsPage;
