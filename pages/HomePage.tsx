
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
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  const handleSliderScroll = (direction: 'left' | 'right') => {
      if (collectionSliderRef.current) {
          const scrollAmount = collectionSliderRef.current.clientWidth * 0.8;
          collectionSliderRef.current.scrollBy({
              left: direction === 'left' ? -scrollAmount : scrollAmount,
              behavior: 'smooth'
          });
      }
  };

  const onMouseDown = (e: React.MouseEvent) => {
      if (!collectionSliderRef.current) return;
      setIsMouseDown(true);
      setStartX(e.pageX - collectionSliderRef.current.offsetLeft);
      setScrollLeft(collectionSliderRef.current.scrollLeft);
  };

  const onMouseLeave = () => setIsMouseDown(false);
  const onMouseUp = () => setIsMouseDown(false);

  const onMouseMove = (e: React.MouseEvent) => {
      if (!isMouseDown || !collectionSliderRef.current) return;
      e.preventDefault();
      const x = e.pageX - collectionSliderRef.current.offsetLeft;
      const walk = (x - startX) * 2; 
      collectionSliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const renderSection = (section: HomeSection) => {
    if (!section.isActive) return null;

    const sectionStyles: React.CSSProperties = {
        paddingTop: `${section.settings?.paddingTop ?? 48}px`,
        paddingBottom: `${section.settings?.paddingBottom ?? 48}px`,
        paddingLeft: `${section.settings?.paddingLeft ?? 0}px`,
        paddingRight: `${section.settings?.paddingRight ?? 0}px`,
        marginTop: `${section.settings?.marginTop ?? 0}px`,
        marginBottom: `${section.settings?.marginBottom ?? 0}px`,
        marginLeft: `${section.settings?.marginLeft ?? 0}px`,
        marginRight: `${section.settings?.marginRight ?? 0}px`,
        backgroundColor: section.settings?.backgroundColor || 'transparent'
    };

    const getGridClasses = (s: HomeSection) => {
        const isSlider = s.settings?.isSlider;
        const desktopCols = s.settings?.desktopColumns || 4;
        const mobileCols = s.settings?.mobileColumns || 2;
        if (isSlider) return "flex flex-nowrap overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 md:gap-10 pb-2 -mx-4 px-4 cursor-grab active:cursor-grabbing select-none relative";
        const gridMap: any = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' };
        const mobMap: any = { 1: 'grid-cols-1', 2: 'grid-cols-2' };
        return `grid ${mobMap[mobileCols] || 'grid-cols-2'} ${gridMap[desktopCols] || 'md:grid-cols-4'} gap-4 md:gap-12`;
    };

    const getItemClasses = (s: HomeSection) => s.settings?.isSlider ? "shrink-0 w-[65%] sm:w-[40%] md:w-[22%] snap-start" : "w-full";

    const HeaderSection = ({ s }: { s: HomeSection }) => {
        const alignClass = s.settings?.alignment === 'left' ? 'items-start text-left' : s.settings?.alignment === 'right' ? 'items-end text-right' : 'items-center text-center';
        return (
            <div className={`flex flex-col ${alignClass} mb-12 md:mb-20`}>
                <h2 
                    className={`font-brand uppercase tracking-tighter text-gray-900 leading-none ${s.settings?.titleItalic ? 'italic' : 'not-italic'}`}
                    style={{ 
                        fontSize: `${s.settings?.titleSize || 32}px`,
                        fontWeight: s.settings?.titleWeight || 700
                    }}
                >
                    {s.title}
                </h2>
                {s.settings?.subtitle && (
                    <p 
                        className={`text-gray-400 mt-4 tracking-widest uppercase max-w-2xl ${s.settings?.subtitleItalic ? 'italic' : 'not-italic'}`}
                        style={{ 
                            fontSize: `${s.settings?.subtitleSize || 14}px`,
                            fontWeight: s.settings?.subtitleWeight || 400
                        }}
                    >
                        {s.settings.subtitle}
                    </p>
                )}
                <div className="w-20 h-1.5 bg-brand-primary mt-6 rounded-full shadow-sm"></div>
            </div>
        );
    };

    switch (section.type) {
      case 'Hero':
        if (slides.length === 0) return null;
        return (
          <section key={section.id} className="relative bg-gray-100 overflow-hidden flex justify-center items-center" style={{ ...sectionStyles, '--desktop-h': section.settings?.desktopHeight || '650px', '--mobile-h': section.settings?.mobileHeight || '400px' } as any}>
            <div className="h-[var(--mobile-h)] md:h-[var(--desktop-h)] w-full relative overflow-hidden">
                {slides.map((slide, index) => (
                    <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <picture className="absolute inset-0 w-full h-full">
                            <source media="(max-width: 768px)" srcSet={slide.mobileImageUrl || slide.imageUrl} />
                            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                        </picture>
                        <div className="absolute inset-0 bg-black/30 z-20"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-30 text-center px-4">
                            <div className="max-w-2xl">
                                <h1 className="text-3xl md:text-7xl font-brand font-black text-white mb-4 drop-shadow-xl tracking-tighter uppercase leading-none">{slide.title}</h1>
                                <p className="text-sm md:text-xl text-white/90 mb-8 max-w-lg mx-auto font-medium">{slide.subtitle}</p>
                                {slide.buttonText?.trim() && (
                                    <button onClick={() => navigate('/collections/all')} className="px-8 md:px-12 py-3 md:py-4 rounded-full text-white font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl transition-all" style={{backgroundColor: siteSettings?.primaryColor || COLORS.accent}}>{slide.buttonText}</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </section>
        );

      case 'Collections':
        const activeColl = section.settings?.collectionId && section.settings.collectionId !== 'all' ? collections.find(c => c.id === section.settings?.collectionId) : null;
        return (
          <section key={section.id} style={sectionStyles} className="overflow-hidden group/section relative">
              <div className="max-w-7xl mx-auto px-4">
                <HeaderSection s={section} />
                <div className="relative">
                    {section.settings?.isSlider && (
                        <>
                            <button onClick={() => handleSliderScroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white shadow-xl text-brand-primary hover:scale-110 transition-all border border-gray-100 opacity-0 group-hover/section:opacity-100 -ml-4 md:ml-0" style={{ color: siteSettings?.primaryColor }}>
                                <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                            </button>
                            <button onClick={() => handleSliderScroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white shadow-xl text-brand-primary hover:scale-110 transition-all border border-gray-100 opacity-0 group-hover/section:opacity-100 -mr-4 md:mr-0" style={{ color: siteSettings?.primaryColor }}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </>
                    )}
                    <div ref={section.settings?.isSlider ? collectionSliderRef : null} onMouseDown={section.settings?.isSlider ? onMouseDown : undefined} className={getGridClasses(section)}>
                        {activeColl ? (
                            (activeColl.products as Product[]).slice(0, section.settings?.limit || 4).map(p => <div key={p.id} className={getItemClasses(section)}><ProductCard product={p} /></div>)
                        ) : (
                            collections.slice(0, section.settings?.limit || 8).map((col) => (
                                <div key={col.id} onClick={() => navigate(`/collections/${col.slug || col.id}`)} className={`group cursor-pointer text-center ${getItemClasses(section)}`}>
                                    <div className={`overflow-hidden relative shadow-lg transition-all duration-700 group-hover:shadow-2xl group-hover:-translate-y-2 ${col.displayStyle === 'Circle' ? 'rounded-full aspect-square w-full mx-auto' : 'rounded-3xl aspect-square w-full'}`}>
                                        <img src={col.imageUrl} alt={col.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                    </div>
                                    <div className="mt-5 md:mt-8">
                                        <h3 className="font-brand font-black text-sm md:text-xl uppercase tracking-tighter text-gray-900 group-hover:text-brand-accent transition-colors">{col.title}</h3>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
              </div>
          </section>
        );

      case 'NewArrivals':
      case 'BestSellers':
        const displayLimit = section.settings?.limit || 4;
        const sourceCollId = section.settings?.collectionId;
        
        let sourceProducts = products;
        if (sourceCollId && sourceCollId !== 'all') {
            const foundColl = collections.find(c => c.id === sourceCollId);
            if (foundColl) sourceProducts = foundColl.products as Product[];
        }

        const displayProducts = section.type === 'NewArrivals' 
            ? sourceProducts.slice().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, displayLimit) 
            : sourceProducts.slice().sort((a,b) => (b.reviews?.length || 0) - (a.reviews?.length || 0)).slice(0, displayLimit);
            
        return (
          <section key={section.id} style={sectionStyles} className="border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4">
              <HeaderSection s={section} />
              <div className={getGridClasses(section)}>
                {displayProducts.map(p => <div key={p.id} className={getItemClasses(section)}><ProductCard product={p} /></div>)}
              </div>
            </div>
          </section>
        );

      case 'Videos':
        return videos.length > 0 && (
          <section key={section.id} style={sectionStyles} className="overflow-hidden">
              <div className="max-w-7xl mx-auto px-4">
                <HeaderSection s={section} />
                <div className="flex overflow-x-auto gap-4 md:gap-8 pb-8 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-4">
                    {videos.map(v => <VideoListItem key={v._id} video={v} autoplay={siteSettings?.videoAutoplay || false} onClick={() => setSelectedVideo(v)} />)}
                </div>
              </div>
          </section>
        );

      case 'CustomCode':
        return (
          <section key={section.id} style={sectionStyles} className="w-full">
            <SafeCustomCode code={section.code || ''} sectionId={section.id} />
          </section>
        );

      default: return null;
    }
  };

  if (siteLoading || layoutLoading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-[#16423C] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO title={homePageSettings?.seoTitle || 'Organic Wellness'} />
      <Header user={user} logout={logout} />
      <main className="flex-grow">{layout.sections.map(renderSection)}</main>
      <Footer />
    </div>
  );
};

export default HomePage;
