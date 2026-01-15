
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Product, HomeSection, ShoppableVideo, Slide, Collection } from '../types';
import { useSiteData } from '../contexts/SiteDataContext';
import { PlayIcon } from '../components/Icons';
import SEO from '../components/SEO';
import SafeCustomCode from '../components/SafeCustomCode';
import { cn } from '../utils/utils';

interface VideoListItemProps { video: ShoppableVideo; autoplay: boolean; onClick: () => void; }
const VideoListItem: React.FC<VideoListItemProps> = ({ video, autoplay, onClick }) => {
    const videoElRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (autoplay && videoElRef.current) videoElRef.current.play().catch(() => { });
        else if (videoElRef.current) videoElRef.current.pause();
    }, [autoplay]);

    return (
        <div onClick={onClick} className="relative flex-shrink-0 w-full aspect-[9/16] overflow-hidden group cursor-pointer shadow-lg transition-transform transform hover:scale-[1.02]">
            <video ref={videoElRef} src={video.videoUrl} muted loop playsInline className="w-full h-full object-cover pointer-events-none" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none"></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform">
                    <PlayIcon className="h-4 w-4 md:h-5 md:w-5 text-white ml-1" />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent text-white pointer-events-none">
                <h4 className="font-bold text-sm md:text-base truncate leading-tight uppercase tracking-tight">{video.title}</h4>
                <div className="flex justify-between items-center mt-2">
                    <span className="font-black text-xs md:text-sm text-emerald-400">{video.price || 'New'}</span>
                    <button className="bg-white text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Shop</button>
                </div>
            </div>
        </div>
    );
};

const HomePage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
    const { products, collections, slides, videos, siteSettings, homePageSettings, homepageLayout, loading: siteLoading, refreshSiteData } = useSiteData();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedVideo, setSelectedVideo] = useState<ShoppableVideo | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const navigate = useNavigate();

    useEffect(() => {
        refreshSiteData();
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = () => { if (slides.length > 0) setCurrentSlide(current => (current === slides.length - 1 ? 0 : current + 1)); };
    useEffect(() => {
        if (slides.length > 1) {
            const interval = setInterval(nextSlide, 6000);
            return () => clearInterval(interval);
        }
    }, [slides.length]);

    const renderSection = (section: HomeSection) => {
        if (!section.isActive) return null;

        let s: any = section.settings || {};

        // For CustomCode, merge settingsJson to allow layout overrides (width, padding, etc.)
        if (section.type === 'CustomCode' && section.settingsJson) {
            try {
                const jsonSettings = JSON.parse(section.settingsJson);
                s = { ...s, ...jsonSettings };
            } catch (e) {
                // Ignore parse errors, fallback to default settings
            }
        }

        // BUILD DYNAMIC STYLES FROM BUILDER
        const isCustom = section.type === 'CustomCode';
        const sectionStyles: React.CSSProperties = {
            paddingTop: `${s.paddingTop ?? (isCustom ? 0 : 60)}px`,
            paddingBottom: `${s.paddingBottom ?? (isCustom ? 0 : 60)}px`,
            paddingLeft: `${s.paddingLeft ?? (isCustom ? 0 : 20)}px`,
            paddingRight: `${s.paddingRight ?? (isCustom ? 0 : 20)}px`,
            marginTop: `${s.marginTop ?? 0}px`,
            marginBottom: `${s.marginBottom ?? 0}px`,
            backgroundColor: s.backgroundColor || 'transparent',
            color: s.textColor || 'inherit',
        };

        const containerStyles: React.CSSProperties = {
            maxWidth: s.desktopWidth || '1400px',
            margin: '0 auto',
        };

        const HeaderBlock = () => (section.title || s.subtitle) ? (
            <div className={cn("mb-12",
                s.alignment === 'center' ? 'text-center items-center flex flex-col' :
                    s.alignment === 'right' ? 'text-right items-end flex flex-col' :
                        'text-left items-start flex flex-col')}
            >
                <h2
                    className={cn("font-brand leading-none uppercase tracking-tighter", s.titleItalic && "italic")}
                    style={{
                        fontSize: s.titleSize ? (isMobile ? `${Math.max(s.titleSize * 0.7, 24)}px` : `${s.titleSize}px`) : '32px',
                        fontWeight: s.titleWeight || 900
                    }}
                >
                    {section.title}
                </h2>
                {s.subtitle && (
                    <p
                        className={cn("mt-4 tracking-widest uppercase leading-relaxed max-w-2xl", s.subtitleItalic && "italic")}
                        style={{
                            fontSize: s.subtitleSize ? `${s.subtitleSize}px` : '14px',
                            fontWeight: s.subtitleWeight || 500,
                            opacity: 0.7
                        }}
                    >
                        {s.subtitle}
                    </p>
                )}
            </div>
        ) : null;

        switch (section.type) {
            case 'Hero':
                const currentS = slides[currentSlide];
                return (
                    <section key={section.id} className="relative w-full overflow-hidden bg-zinc-100" style={{ height: isMobile ? (currentS?.mobileHeight || '500px') : (currentS?.desktopHeight || '650px') }}>
                        {slides.length > 0 ? slides.map((slide, index) => (
                            <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                                <img src={(isMobile && slide.mobileImageUrl) ? slide.mobileImageUrl : slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" style={{ objectFit: slide.imageFit || 'cover' }} />
                                <div className="absolute inset-0 bg-black/25 z-20"></div>
                                <div className="absolute inset-0 flex items-center justify-center z-30 text-center px-4">
                                    <div className="max-w-4xl">
                                        <h1 className="text-4xl md:text-8xl font-brand font-black text-white mb-6 tracking-tighter uppercase leading-[0.85] italic animate-fade-in-up">{slide.title}</h1>
                                        <p className="text-xs md:text-lg text-white/90 mb-10 max-w-2xl mx-auto font-bold uppercase tracking-[0.25em] animate-fade-in-up delay-100">{slide.subtitle}</p>
                                        {slide.buttonText && (
                                            <button
                                                onClick={() => navigate('/collections/all')}
                                                className="px-12 py-5 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all transform hover:scale-105 active:scale-95 animate-fade-in-up delay-200"
                                                style={{ backgroundColor: siteSettings?.primaryColor || '#16423C' }}
                                            >
                                                {slide.buttonText}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-200">
                                <p className="font-black text-zinc-400 uppercase tracking-widest italic opacity-30">No Active Slides</p>
                            </div>
                        )}
                    </section>
                );

            case 'Collections':
                return (
                    <section key={section.id} style={sectionStyles} className="w-full">
                        <div style={containerStyles}>
                            <HeaderBlock />
                            <div
                                className={cn(
                                    s.isSlider
                                        ? "flex overflow-x-auto pb-8 gap-6 scrollbar-hide snap-x snap-mandatory"
                                        : "grid gap-6"
                                )}
                                style={!s.isSlider ? {
                                    gridTemplateColumns: `repeat(${s.itemsPerRow || 4}, minmax(0, 1fr))`
                                } : undefined}
                            >
                                {(collections || []).slice(0, s.limit || 8).map((col) => {
                                    const id = col.id || (col as any)._id;
                                    return (
                                        <div key={id} onClick={() => navigate(`/collections/${col.slug || id}`)} className={cn("group cursor-pointer flex-shrink-0 transition-all snap-start", s.isSlider ? "w-[280px] md:w-[350px]" : "w-full")}>
                                            <div className={cn("overflow-hidden relative shadow-lg group-hover:shadow-2xl transition-all duration-700", s.imageAspectRatio || "aspect-[4/5]")}>
                                                <img src={col.imageUrl || 'https://via.placeholder.com/400x500'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                                    <h3 className="font-brand font-black uppercase tracking-tighter text-white text-2xl md:text-3xl italic leading-none">{col.title}</h3>
                                                    <span className="mt-4 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">Explore Now</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                );

            case 'NewArrivals':
            case 'BestSellers':
                return (
                    <section key={section.id} style={sectionStyles} className="w-full overflow-hidden">
                        <div style={containerStyles}>
                            <HeaderBlock />
                            <div
                                className={cn(
                                    s.isSlider
                                        ? "flex overflow-x-auto pb-8 gap-6 scrollbar-hide snap-x snap-mandatory"
                                        : "grid gap-4 md:gap-8"
                                )}
                                style={!s.isSlider ? {
                                    gridTemplateColumns: `repeat(${s.itemsPerRow || 4}, minmax(0, 1fr))`
                                } : undefined}
                            >
                                {(products || []).slice(0, s.limit || 8).map(p => (
                                    <div key={p.id || (p as any)._id} className={cn("flex-shrink-0 snap-start", s.isSlider ? "w-[260px] md:w-[320px]" : "w-full")}>
                                        <ProductCard product={p} config={s} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                );

            case 'Videos':
                return videos && videos.length > 0 && (
                    <section key={section.id} style={sectionStyles} className="w-full">
                        <div style={containerStyles}>
                            <HeaderBlock />
                            <div
                                className="grid gap-4 md:gap-8"
                                style={{ gridTemplateColumns: `repeat(${s.itemsPerRow || 5}, minmax(0, 1fr))` }}
                            >
                                {videos.slice(0, s.limit || 5).map(v => (
                                    <VideoListItem key={v._id || v.id} video={v} autoplay={siteSettings?.videoAutoplay ?? true} onClick={() => setSelectedVideo(v)} />
                                ))}
                            </div>
                        </div>
                    </section>
                );

            case 'Newsletter':
                return (
                    <section key={section.id} style={sectionStyles} className="w-full">
                        <div style={containerStyles} className="bg-zinc-900 p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden group rounded-[2rem]">
                            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                                <h2
                                    className={cn("font-brand font-black italic tracking-tighter uppercase leading-none", s.titleItalic && "italic")}
                                    style={{ fontSize: s.titleSize ? `${s.titleSize}px` : '40px', color: '#FFFFFF' }}
                                >
                                    {section.title}
                                </h2>
                                <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[9px] md:text-xs leading-relaxed opacity-80">{s.subtitle}</p>
                                <form className="flex flex-col sm:flex-row gap-4 pt-4" onSubmit={(e) => e.preventDefault()}>
                                    <input type="email" placeholder="EMAIL ADDRESS" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-bold outline-none focus:bg-white/10 focus:border-emerald-500/50 transition-all tracking-widest text-xs" />
                                    <button className="bg-white text-zinc-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#16423C] hover:text-white transition-all transform active:scale-95">Subscribe</button>
                                </form>
                            </div>
                        </div>
                    </section>
                );

            case 'CustomCode':
                // Explicitly use the width from settings for CustomCode containers
                const customContainerStyle: React.CSSProperties = {
                    maxWidth: isMobile ? (s.mobileWidth || '100%') : (s.desktopWidth || '100%'),
                    width: '100%',
                    margin: '0 auto',
                };
                return (
                    <section key={section.id} style={sectionStyles} className="w-full">
                        <div style={customContainerStyle}>
                            <SafeCustomCode code={section.code || ''} sectionId={section.id} settingsJson={section.settingsJson} />
                        </div>
                    </section>
                );

            default: return null;
        }
    };

    if (siteLoading) return (
        <div className="h-screen flex items-center justify-center bg-white flex-col gap-4">
            <div className="w-10 h-10 border-4 border-[#16423C] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Booting Storefront...</p>
        </div>
    );

    const activeSections = homepageLayout?.sections?.filter(s => s.isActive) || [];

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SEO title={homePageSettings?.seoTitle || 'Pure Ayurvedic Wellness'} />
            <Header user={user} logout={logout} />

            <main className="flex-grow">
                {activeSections.length > 0 ? (
                    activeSections.map(renderSection)
                ) : (
                    <div className="py-40 text-center">
                        <h1 className="text-4xl font-brand font-black italic tracking-tighter uppercase text-zinc-900">Virtual Storefront</h1>
                        <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Waiting for layout publication...</p>
                    </div>
                )}
            </main>

            <Footer />

            {selectedVideo && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setSelectedVideo(null)}></div>
                    <div className="relative w-full max-w-md h-[85vh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        <video src={selectedVideo.videoUrl} className="w-full h-full object-cover" autoPlay playsInline loop />
                        <button onClick={() => setSelectedVideo(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white hover:text-black transition-all z-20">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5} /></svg>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/40 to-transparent">
                            <h3 className="text-white font-black text-2xl mb-6 italic uppercase tracking-tighter leading-tight">{selectedVideo.title}</h3>
                            <button onClick={() => navigate(`/product/${selectedVideo.productLink}`)} className="w-full bg-white text-zinc-900 font-black py-5 rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-[#16423C] hover:text-white transition-all transform active:scale-95">Shop This Ritual</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
