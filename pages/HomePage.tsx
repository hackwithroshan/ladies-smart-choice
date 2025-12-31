import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Product, HomeSection, ShoppableVideo, Slide, Collection } from '../types';
import { useSiteData } from '../contexts/SiteDataContext';
import { COLORS } from '../constants';
import { PlayIcon, NavArrowIcon } from '../components/Icons';
import ErrorBoundary from '../components/ErrorBoundary';
import SEO from '../components/SEO';
import { useToast } from '../contexts/ToastContext';
import { getApiUrl } from '../utils/apiHelper';
import SafeCustomCode from '../components/SafeCustomCode';

interface VideoListItemProps { video: ShoppableVideo; autoplay: boolean; onClick: () => void; }
const VideoListItem: React.FC<VideoListItemProps> = ({ video, autoplay, onClick }) => {
    const videoElRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (autoplay && videoElRef.current) videoElRef.current.play().catch(() => {});
        else if (videoElRef.current) videoElRef.current.pause();
    }, [autoplay]);

    return (
      <div onClick={onClick} className="relative flex-shrink-0 w-44 md:w-full aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer shadow-lg transition-transform transform hover:scale-[1.02]">
          {autoplay ? <video ref={videoElRef} src={video.videoUrl} muted loop playsInline className="w-full h-full object-cover" /> : <img src={video.thumbnailUrl || video.videoUrl.replace('.mp4', '.jpg')} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          {!autoplay && <div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 md:w-12 md:h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform"><PlayIcon className="h-4 w-4 md:h-5 md:w-5 text-white ml-1"/></div></div>}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent text-white">
              <h4 className="font-bold text-sm md:text-base truncate leading-tight">{video.title}</h4>
              <div className="flex justify-between items-center mt-2">
                  <span className="font-black text-xs md:text-sm text-brand-accent">{video.price}</span>
                  <button className="bg-white text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Shop</button>
              </div>
          </div>
      </div>
    );
};

const HomePage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
  const { products, collections, slides, videos, siteSettings, homePageSettings, loading: siteLoading } = useSiteData();
  const [layout, setLayout] = useState<{ sections: HomeSection[] }>({ sections: [] });
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<ShoppableVideo | null>(null);
  const navigate = useNavigate();

  const collectionSliderRef = useRef<HTMLDivElement>(null);
  const newArrivalsSliderRef = useRef<HTMLDivElement>(null);
  const bestSellersSliderRef = useRef<HTMLDivElement>(null);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeSliderRef, setActiveSliderRef] = useState<React.RefObject<HTMLDivElement> | null>(null);

  useEffect(() => {
    const fetchLayout = async () => {
        try {
            const res = await fetch(getApiUrl('/api/settings/layout'));
            if (res.ok) setLayout(await res.json());
        } catch (e) { console.error(e); }
        finally { setLayoutLoading(false); }
    };
    fetchLayout();
  }, []);

  const nextSlide = () => { if (slides.length > 0) setCurrentSlide(current => (current === slides.length - 1 ? 0 : current + 1)); };
  useEffect(() => { 
      if (slides.length > 1) {
        const interval = setInterval(nextSlide, 6000); 
        return () => clearInterval(interval); 
      }
  }, [slides.length]);

  const handleSliderScroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
      if (ref.current) {
          const scrollAmount = ref.current.clientWidth * 0.8;
          ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      }
  };

  const onMouseDown = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
      if (!ref.current) return;
      setIsMouseDown(true);
      setActiveSliderRef(ref);
      setStartX(e.pageX - ref.current.offsetLeft);
      setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => setIsMouseDown(false);
  const onMouseUp = () => setIsMouseDown(false);

  const onMouseMove = (e: React.MouseEvent) => {
      if (!isMouseDown || !activeSliderRef?.current) return;
      e.preventDefault();
      const x = e.pageX - activeSliderRef.current.offsetLeft;
      const walk = (x - startX) * 2; 
      activeSliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const renderSection = (section: HomeSection) => {
    if (!section.isActive) return null;

    const desktopW = section.settings?.desktopWidth || '1280px';

    const sectionStyles: React.CSSProperties = {
        paddingTop: `${section.settings?.paddingTop ?? 48}px`,
        paddingBottom: `${section.settings?.paddingBottom ?? 48}px`,
        backgroundColor: section.settings?.backgroundColor || 'transparent',
        width: '100%',
        margin: '0 auto'
    };

    const getGridClasses = (s: HomeSection) => {
        const isSlider = s.settings?.isSlider;
        const desktopCols = s.settings?.desktopColumns || 4;
        const mobileCols = s.settings?.mobileColumns || 2;
        if (isSlider) return "flex flex-nowrap overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 -mx-4 px-4 cursor-grab active:cursor-grabbing select-none relative items-stretch";
        const gridMap: any = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' };
        const mobMap: any = { 1: 'grid-cols-1', 2: 'grid-cols-2' };
        return `grid ${mobMap[mobileCols] || 'grid-cols-2'} ${gridMap[desktopCols] || 'md:grid-cols-4'}`;
    };

    const getItemClasses = (s: HomeSection) => s.settings?.isSlider ? "shrink-0 snap-start flex-none h-auto" : "w-full h-auto";

    const HeaderSection = ({ s }: { s: HomeSection }) => {
        const alignClass = s.settings?.alignment === 'left' ? 'items-start text-left' : s.settings?.alignment === 'right' ? 'items-end text-right' : 'items-center text-center';
        return (
            <div className={`flex flex-col ${alignClass} mb-12 md:mb-16 px-4`}>
                <h2 className={`font-brand uppercase tracking-tighter text-gray-900 leading-none ${s.settings?.titleItalic ? 'italic' : 'not-italic'}`} style={{ fontSize: `${s.settings?.titleSize || 32}px`, fontWeight: s.settings?.titleWeight || 800 }}>{s.title}</h2>
                {s.settings?.subtitle && <p className={`text-gray-400 mt-4 tracking-widest uppercase max-w-2xl font-medium ${s.settings?.subtitleItalic ? 'italic' : 'not-italic'}`} style={{ fontSize: `${s.settings?.subtitleSize || 13}px`, fontWeight: s.settings?.subtitleWeight || 500 }}>{s.settings.subtitle}</p>}
                <div className="w-16 h-1 bg-brand-primary mt-6 rounded-full opacity-60"></div>
            </div>
        );
    };

    switch (section.type) {
      case 'Hero':
        if (slides.length === 0) return null;
        return (
          <section key={section.id} className="relative bg-white overflow-hidden flex justify-center items-center w-full" style={{ ...sectionStyles, '--desktop-h': section.settings?.desktopHeight || '650px', '--mobile-h': section.settings?.mobileHeight || '400px' } as any}>
            <div className="h-[var(--mobile-h)] md:h-[var(--desktop-h)] w-full relative overflow-hidden" style={{ maxWidth: desktopW }}>
                {slides.map((slide, index) => (
                    <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <picture className="absolute inset-0 w-full h-full"><source media="(max-width: 768px)" srcSet={slide.mobileImageUrl || slide.imageUrl} /><img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" /></picture>
                        <div className="absolute inset-0 bg-black/30 z-20"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-30 text-center px-4">
                            <div className="max-w-3xl">
                                <h1 className="text-3xl md:text-7xl font-brand font-black text-white mb-4 drop-shadow-2xl tracking-tighter uppercase leading-[0.95]">{slide.title}</h1>
                                <p className="text-sm md:text-xl text-white/90 mb-8 max-w-xl mx-auto font-bold uppercase tracking-widest">{slide.subtitle}</p>
                                {slide.buttonText?.trim() && <button onClick={() => navigate('/collections/all')} className="px-10 md:px-14 py-4 md:py-5 rounded-full text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-2xl transition-all" style={{backgroundColor: siteSettings?.primaryColor || COLORS.accent}}>{slide.buttonText}</button>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </section>
        );

      case 'Collections':
      case 'NewArrivals':
      case 'BestSellers':
        const itemGap = section.settings?.itemGap ?? 24;
        const itemWidth = section.settings?.itemWidth || '280px';
        const isSlider = !!section.settings?.isSlider;
        const currentRef = section.type === 'NewArrivals' ? newArrivalsSliderRef : (section.type === 'BestSellers' ? bestSellersSliderRef : collectionSliderRef);

        let displayData: any[] = [];
        if (section.type === 'Collections' && !section.settings?.collectionId) {
            displayData = collections.slice(0, section.settings?.limit || 8);
        } else {
            let source = products;
            const targetCollectionId = section.settings?.collectionId;
            if (targetCollectionId && targetCollectionId !== 'all') {
                const found = collections.find(c => (c.id || (c as any)._id).toString() === targetCollectionId.toString());
                if (found && found.products) {
                    source = (found.products as any[]).map(id => {
                        const idStr = typeof id === 'string' ? id : (id.id || id._id || id).toString();
                        return products.find(p => (p.id || (p as any)._id).toString() === idStr);
                    }).filter(Boolean) as Product[];
                }
            }
            
            displayData = section.type === 'NewArrivals' 
                ? source.slice().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, section.settings?.limit || 4) 
                : (section.type === 'BestSellers' 
                    ? source.slice().sort((a,b) => (b.reviews?.length || 0) - (a.reviews?.length || 0)).slice(0, section.settings?.limit || 4)
                    : source.slice(0, section.settings?.limit || 4)
                  );
        }

        return (
          <section key={section.id} style={sectionStyles} className="group/section relative flex flex-col items-center w-full">
            <div className="w-full mx-auto" style={{ maxWidth: desktopW }}>
              <HeaderSection s={section} />
              <div className="relative px-4">
                {isSlider && (
                    <>
                        <button onClick={() => handleSliderScroll(currentRef, 'left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-xl text-brand-primary hover:scale-110 transition-all opacity-0 group-hover/section:opacity-100 -ml-4" style={{ color: siteSettings?.primaryColor }}><NavArrowIcon className="w-5 h-5 rotate-180" /></button>
                        <button onClick={() => handleSliderScroll(currentRef, 'right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-xl text-brand-primary hover:scale-110 transition-all opacity-0 group-hover/section:opacity-100 -mr-4" style={{ color: siteSettings?.primaryColor }}><NavArrowIcon className="w-5 h-5" /></button>
                    </>
                )}
                <div 
                    ref={isSlider ? currentRef : null} 
                    onMouseDown={isSlider ? (e) => onMouseDown(e, currentRef) : undefined} 
                    className={getGridClasses(section)} 
                    style={{ gap: `${itemGap}px` }}
                >
                  {displayData.map((item: any) => {
                        const isCollection = section.type === 'Collections' && !section.settings?.collectionId;
                        const isRawImage = isCollection && item.displayStyle === 'ImageOnly';
                        
                        return (
                            <div key={item.id || item._id} className={getItemClasses(section)} style={{ width: isSlider ? itemWidth : 'auto' }}>
                                {isCollection ? (
                                    <div onClick={() => navigate(`/collections/${item.slug || item.id}`)} className="group cursor-pointer flex flex-col h-full">
                                        <div className={`overflow-hidden relative transition-all duration-700 aspect-[3/4] flex-1 ${isRawImage ? '' : 'shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2'}`} style={{ height: section.settings?.itemHeight || 'auto', borderRadius: isRawImage ? '0px' : `${section.settings?.itemBorderRadius ?? 24}px` }}>
                                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                            {!isRawImage && (
                                                <>
                                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                                        <h3 className="font-brand font-black uppercase tracking-tighter text-white text-2xl drop-shadow-lg">{item.title}</h3>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <ProductCard product={item as Product} config={section.settings} />
                                )}
                            </div>
                        );
                  })}
                </div>
              </div>
            </div>
          </section>
        );

      case 'Videos':
        return videos.length > 0 && (
          <section key={section.id} style={sectionStyles} className="overflow-hidden w-full flex flex-col items-center">
              <div className="w-full mx-auto px-4" style={{ maxWidth: desktopW }}>
                <HeaderSection s={section} />
                <div className="flex overflow-x-auto gap-8 pb-8 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-4">
                    {videos.map(v => <VideoListItem key={v._id} video={v} autoplay={siteSettings?.videoAutoplay || false} onClick={() => setSelectedVideo(v)} />)}
                </div>
              </div>
          </section>
        );

      case 'CustomCode':
        return <section key={section.id} style={sectionStyles} className="w-full flex justify-center"><div className="w-full" style={{ maxWidth: desktopW }}><SafeCustomCode code={section.code || ''} sectionId={section.id} /></div></section>;

      case 'Newsletter':
        return (
            <section key={section.id} style={sectionStyles} className="w-full flex justify-center items-center py-20 md:py-32">
                 <div className="w-full px-6 flex flex-col items-center text-center" style={{ maxWidth: desktopW }}>
                    <h2 className="text-3xl md:text-6xl font-brand font-black italic tracking-tighter uppercase mb-6 leading-none">Stay Radiant</h2>
                    <p className="text-sm md:text-lg text-gray-500 max-w-xl font-medium mb-12 uppercase tracking-widest">Join our circle for exclusive Ayurvedic tips & launches.</p>
                    <div className="w-full max-w-lg flex flex-col sm:flex-row gap-3">
                         <input type="email" placeholder="YOUR EMAIL ADDRESS" className="flex-1 px-8 py-4 rounded-full border-2 border-gray-100 focus:border-brand-primary outline-none text-xs font-bold tracking-widest transition-all" />
                         <button className="bg-brand-primary text-white px-12 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-105 transition-all">Subscribe</button>
                    </div>
                 </div>
            </section>
        );

      default: return null;
    }
  };

  if (siteLoading || layoutLoading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-[#16423C] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col min-h-screen bg-white" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <SEO title={homePageSettings?.seoTitle || 'Ladies Choice'} />
      <Header user={user} logout={logout} />
      <main className="flex-grow">{layout.sections.map(renderSection)}</main>
      <Footer />
    </div>
  );
};

export default HomePage;