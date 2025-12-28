
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
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (autoplay && videoRef.current) videoRef.current.play().catch(() => {});
        else if (videoRef.current) videoRef.current.pause();
    }, [autoplay]);
    return (
      <div onClick={onClick} className="relative flex-shrink-0 w-44 md:w-full aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer shadow-lg transition-transform transform hover:scale-[1.02]">
          {autoplay ? <video ref={videoRef} src={video.videoUrl} muted loop playsInline className="w-full h-full object-cover" /> : <img src={video.thumbnailUrl || video.videoUrl.replace('.mp4', '.jpg')} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>}
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
  const { showToast } = useToast();

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

  const renderSection = (section: HomeSection) => {
    if (!section.isActive) return null;

    // Helper for grid/slider layout
    const getGridClasses = (s: HomeSection) => {
        const isSlider = s.settings?.isSlider;
        const desktopCols = s.settings?.desktopColumns || 4;
        const mobileCols = s.settings?.mobileColumns || 2;
        
        if (isSlider) {
            return "flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 md:gap-8 pb-8 -mx-4 px-4";
        }
        
        const gridMap: any = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' };
        const mobMap: any = { 1: 'grid-cols-1', 2: 'grid-cols-2' };
        
        return `grid ${mobMap[mobileCols] || 'grid-cols-2'} ${gridMap[desktopCols] || 'md:grid-cols-4'} gap-4 md:gap-12`;
    };

    const getItemClasses = (s: HomeSection) => {
        return s.settings?.isSlider ? "shrink-0 w-[70%] sm:w-[45%] md:w-[28%] snap-start" : "w-full";
    };

    switch (section.type) {
      case 'Hero':
        if (slides.length === 0) return null;
        const globalSlideConfig = slides[0];
        const desktopHeight = section.settings?.desktopHeight || globalSlideConfig.desktopHeight || '650px';
        const mobileHeight = section.settings?.mobileHeight || globalSlideConfig.mobileHeight || '400px';
        const desktopWidth = section.settings?.desktopWidth || globalSlideConfig.desktopWidth || '100%';
        const mobileWidth = section.settings?.mobileWidth || globalSlideConfig.mobileWidth || '100%';
        const customStyles = section.settings?.customStyles || '';

        return (
          <section 
            key={section.id} 
            className="relative bg-gray-100 overflow-hidden flex justify-center items-center"
            style={{ 
                '--desktop-h': desktopHeight, 
                '--mobile-h': mobileHeight,
                '--desktop-w': desktopWidth,
                '--mobile-w': mobileWidth,
                ...(customStyles ? customStyles.split(';').reduce((acc: any, curr) => {
                    const [prop, val] = curr.split(':');
                    if (prop && val) acc[prop.trim()] = val.trim();
                    return acc;
                }, {}) : {})
            } as any}
          >
            <div className="h-[var(--mobile-h)] md:h-[var(--desktop-h)] w-[var(--mobile-w)] md:w-[var(--desktop-w)] relative overflow-hidden">
                {slides.map((slide, index) => {
                  const fitClass = slide.imageFit === 'contain' ? 'object-contain' : slide.imageFit === 'fill' ? 'object-fill' : 'object-cover';
                  return (
                    <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <picture className="absolute inset-0 w-full h-full">
                            <source media="(max-width: 768px)" srcSet={slide.mobileImageUrl || slide.imageUrl} />
                            <img src={slide.imageUrl} alt={slide.title} className={`w-full h-full ${fitClass}`} />
                        </picture>
                        <div className="absolute inset-0 bg-black/30 z-20"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-30 text-center px-4">
                            <div className="max-w-2xl">
                                {slide.title && <h1 className="text-3xl md:text-7xl font-brand font-black text-white mb-4 drop-shadow-xl tracking-tighter italic uppercase leading-none">{slide.title}</h1>}
                                {slide.subtitle && <p className="text-sm md:text-xl text-white/90 mb-8 max-w-lg mx-auto font-medium">{slide.subtitle}</p>}
                                {slide.buttonText && (
                                    <button onClick={() => navigate('/collections/all')} className="px-8 md:px-12 py-3 md:py-4 rounded-full text-white font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl transition-all hover:scale-105 active:scale-95" style={{backgroundColor: COLORS.accent}}>{slide.buttonText}</button>
                                )}
                            </div>
                        </div>
                    </div>
                  )
                })}
            </div>
          </section>
        );

      case 'Collections':
        const isSingleColl = section.settings?.collectionId && section.settings.collectionId !== 'all';
        const activeColl = isSingleColl ? collections.find(c => c.id === section.settings?.collectionId) : null;
        
        return (
          <section key={section.id} className="max-w-7xl mx-auto py-12 md:py-20 px-4">
              <div className="flex flex-col items-center mb-10 md:mb-16">
                <h2 className="text-2xl md:text-4xl font-brand font-black uppercase italic tracking-tighter text-center">
                    {section.title || (activeColl ? activeColl.title : 'Ancient Rituals')}
                </h2>
                <div className="w-16 h-1 bg-brand-primary mt-4 rounded-full"></div>
              </div>

              <div className={getGridClasses(section)}>
                  {activeColl ? (
                      (activeColl.products as Product[]).slice(0, section.settings?.limit || 4).map(p => (
                          <div key={p.id} className={getItemClasses(section)}>
                              <ProductCard product={p} />
                          </div>
                      ))
                  ) : (
                      collections.slice(0, section.settings?.limit || 6).map((col) => (
                          <div key={col.id} onClick={() => navigate(`/collections/${col.id}`)} className={`group cursor-pointer text-center ${getItemClasses(section)}`}>
                              <div className={`overflow-hidden relative shadow-lg transition-all duration-700 group-hover:shadow-2xl ${col.displayStyle === 'Circle' ? 'rounded-full aspect-square w-full mx-auto' : 'rounded-2xl aspect-square w-full'}`}>
                                  <img src={col.imageUrl} alt={col.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                              </div>
                              {col.displayStyle !== 'ImageOnly' && (
                                  <h3 className="mt-4 md:mt-6 font-black text-sm md:text-lg uppercase tracking-tight text-gray-800">{col.title}</h3>
                              )}
                          </div>
                      ))
                  )}
              </div>
          </section>
        );

      case 'NewArrivals':
      case 'BestSellers':
        const displayLimit = section.settings?.limit || 4;
        const displayProducts = section.type === 'NewArrivals' ? products.slice(0, displayLimit) : products.slice().sort((a,b) => (b.reviews?.length || 0) - (a.reviews?.length || 0)).slice(0, displayLimit);

        return (
          <section key={section.id} className="bg-[#FBF9F1] py-12 md:py-24 border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-end mb-10 md:mb-16">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-brand font-black uppercase italic tracking-tighter leading-none">{section.title || (section.type === 'NewArrivals' ? 'The New Earth' : 'Trusted Elixirs')}</h2>
                    <p className="text-xs md:text-sm text-gray-400 mt-3 font-medium tracking-widest uppercase">Purely Handpicked Selection</p>
                  </div>
                  {!section.settings?.isSlider && (
                      <button onClick={() => navigate('/collections/all')} className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-brand-primary border-b-2 border-brand-primary pb-1 hover:text-brand-accent hover:border-brand-accent transition-colors">View Whole Archive</button>
                  )}
              </div>
              <div className={getGridClasses(section)}>
                {displayProducts.map(p => <div key={p.id} className={getItemClasses(section)}><ProductCard product={p} /></div>)}
              </div>
            </div>
          </section>
        );

      case 'Videos':
        return videos.length > 0 && (
          <section key={section.id} className="max-w-7xl mx-auto py-12 md:py-20 px-4 overflow-hidden">
              <h2 className="text-2xl md:text-4xl font-brand font-black text-center mb-10 md:mb-16 uppercase italic tracking-tighter">Shop From Videos</h2>
              <div className="flex overflow-x-auto gap-4 md:gap-8 pb-8 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-4">
                  {videos.map(v => <VideoListItem key={v._id} video={v} autoplay={siteSettings?.videoAutoplay || false} onClick={() => setSelectedVideo(v)} />)}
              </div>
          </section>
        );

      case 'CustomCode':
        return (
          <section key={section.id} className="w-full">
            <SafeCustomCode code={section.code || ''} sectionId={section.id} />
          </section>
        );

      case 'Newsletter':
        return (
          <section key={section.id} className="bg-brand-primary py-16 md:py-32 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
              
              <div className="relative z-10 px-4">
                <h2 className="text-3xl md:text-6xl font-brand font-black mb-6 uppercase italic tracking-tighter leading-tight">{section.title || 'Soul & Wellness'}</h2>
                <p className="opacity-70 mb-12 max-w-xl mx-auto text-sm md:text-lg font-medium">Join our community for early access to ancient wisdom and herbal releases.</p>
                <form onSubmit={e => { e.preventDefault(); showToast('Welcome to the Circle!'); }} className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto">
                    <input type="email" placeholder="YOUR EMAIL ADDRESS" className="px-8 py-5 rounded-2xl text-black flex-1 focus:ring-4 focus:ring-brand-accent/30 outline-none text-xs font-bold bg-white/95 tracking-widest uppercase" required />
                    <button className="bg-brand-accent hover:bg-white hover:text-brand-primary text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all active:scale-95">Invite Me</button>
                </form>
              </div>
          </section>
        );

      default: return null;
    }
  };

  if (siteLoading || layoutLoading) return (
    <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#16423C] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO title={homePageSettings?.seoTitle || 'Organic Wellness'} />
      <Header user={user} logout={logout} />
      <main className="flex-grow">
          {layout.sections.map(renderSection)}
      </main>
      
      {/* Premium Video Modal */}
      {selectedVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in" onClick={() => setSelectedVideo(null)}>
              <div className="relative w-full max-w-md h-[85vh] bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 z-50 text-white/50 hover:text-white p-2 bg-black/40 rounded-full backdrop-blur-md transition-colors">&times;</button>
                  <video src={selectedVideo.videoUrl} className="w-full h-full object-cover" autoPlay playsInline loop />
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent text-white">
                      <h3 className="text-2xl font-brand font-black mb-1 uppercase tracking-tight">{selectedVideo.title}</h3>
                      <p className="text-brand-accent font-black text-xl mb-6">{selectedVideo.price}</p>
                      <button onClick={() => navigate(`/product/${selectedVideo.productLink}`)} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-transform">Unlock Ritual</button>
                  </div>
              </div>
          </div>
      )}
      <Footer />
    </div>
  );
};

export default HomePage;
