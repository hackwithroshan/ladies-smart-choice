
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Product, Slide, Collection, ShoppableVideo, Testimonial, HomeSection } from '../types';
import { useSiteData } from '../contexts/SiteDataContext';
import { COLORS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '../components/Icons';
import ErrorBoundary from '../components/ErrorBoundary';
import SEO from '../components/SEO';
import { useToast } from '../contexts/ToastContext';
import { getApiUrl } from '../utils/apiHelper';
import SafeCustomCode from '../components/SafeCustomCode'; // Import the new component

// ... helper components like VideoListItem stay the same ...
interface VideoListItemProps { video: ShoppableVideo; autoplay: boolean; onClick: () => void; }
const VideoListItem: React.FC<VideoListItemProps> = ({ video, autoplay, onClick }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (autoplay && videoRef.current) videoRef.current.play().catch(() => {});
        else if (videoRef.current) videoRef.current.pause();
    }, [autoplay]);
    return (
      <div onClick={onClick} className="relative flex-shrink-0 w-64 sm:w-auto aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer shadow-lg transition-transform transform hover:scale-105">
          {autoplay ? <video ref={videoRef} src={video.videoUrl} muted loop playsInline className="w-full h-full object-cover" /> : <img src={video.thumbnailUrl || video.videoUrl.replace('.mp4', '.jpg')} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          {!autoplay && <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform"><PlayIcon className="h-5 w-5 text-white ml-1"/></div></div>}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white"><h4 className="font-bold text-lg truncate">{video.title}</h4><div className="flex justify-between items-center mt-2"><span className="font-medium">{video.price}</span><button className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">Shop</button></div></div>
      </div>
    );
};

const HomePage: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => {
  const { products, collections, slides, videos, testimonials, siteSettings, homePageSettings, loading: siteLoading } = useSiteData();
  const [layout, setLayout] = useState<{ sections: HomeSection[] }>({ sections: [] });
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<ShoppableVideo | null>(null);
  const [email, setEmail] = useState('');
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
  useEffect(() => { const interval = setInterval(nextSlide, 5000); return () => clearInterval(interval); }, [slides.length]);

  const renderSection = (section: HomeSection) => {
    if (!section.isActive) return null;

    switch (section.type) {
      case 'Hero':
        return (
          <section key={section.id} className="relative bg-gray-100 h-[450px] md:h-[600px] overflow-hidden group">
            {slides.map((slide, index) => (
              <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <picture className="absolute inset-0 w-full h-full">
                    <source media="(max-width: 768px)" srcSet={slide.mobileImageUrl || slide.imageUrl} />
                    <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                </picture>
                <div className="absolute inset-0 bg-black/30 z-20"></div>
                <div className="absolute inset-0 flex items-center justify-center z-30 text-center px-4">
                  <div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{slide.title}</h1>
                    <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl mx-auto">{slide.subtitle}</p>
                    <button className="px-10 py-3 rounded-full text-white font-bold shadow-xl transition-all hover:scale-105" style={{backgroundColor: COLORS.accent}}>{slide.buttonText}</button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        );

      case 'Collections':
        return (
          <section key={section.id} className="max-w-7xl mx-auto py-16 px-4">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">{section.title || 'Shop Categories'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  {collections.map((col) => (
                      <div key={col.id} onClick={() => navigate(`/collections/${col.id}`)} className="group cursor-pointer text-center">
                          <div className={`overflow-hidden relative shadow-md transition-all group-hover:shadow-xl ${col.displayStyle === 'Circle' ? 'rounded-full aspect-square w-48 mx-auto' : 'rounded-2xl aspect-square w-full'}`}>
                              <img src={col.imageUrl} alt={col.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>
                          <h3 className="mt-4 font-bold text-lg">{col.title}</h3>
                      </div>
                  ))}
              </div>
          </section>
        );

      case 'NewArrivals':
        return (
          <section key={section.id} className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-serif font-bold">{section.title || 'New Arrivals'}</h2>
                  <button className="text-rose-600 font-bold border-b-2 border-rose-600">View All</button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        );

      case 'Videos':
        return videos.length > 0 && (
          <section key={section.id} className="max-w-7xl mx-auto py-16 px-4">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">{section.title || 'Shop From Videos'}</h2>
              <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide md:grid md:grid-cols-4">
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
          <section key={section.id} className="bg-[#16423C] py-20 text-white text-center">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{section.title || 'Join the Family'}</h2>
              <p className="opacity-80 mb-8 max-w-lg mx-auto">Get early access to Ayurvedic guides and new herbal launches.</p>
              <form onSubmit={e => { e.preventDefault(); showToast('Subscribed!'); }} className="flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto px-4">
                  <input type="email" placeholder="Your email address" className="px-6 py-3 rounded-full text-black flex-1 focus:ring-2 focus:ring-green-400 outline-none" />
                  <button className="bg-white text-[#16423C] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all">Join Now</button>
              </form>
          </section>
        );

      default: return null;
    }
  };

  if (siteLoading || layoutLoading) return <div className="h-screen flex items-center justify-center">Loading Storefront...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO title={homePageSettings?.seoTitle || 'Dynamic Home'} />
      <Header user={user} logout={logout} />
      <main className="flex-grow">
          {layout.sections.map(renderSection)}
      </main>
      
      {/* Video Modal same as before */}
      {selectedVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedVideo(null)}>
              <div className="relative w-full max-w-md h-[80vh] bg-black rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                  <video src={selectedVideo.videoUrl} className="w-full h-full object-cover" autoPlay playsInline loop />
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent text-white">
                      <h3 className="text-2xl font-bold mb-1">{selectedVideo.title}</h3>
                      <p className="text-rose-400 font-bold text-xl mb-6">{selectedVideo.price}</p>
                      <button onClick={() => navigate(`/product/${selectedVideo.productLink}`)} className="w-full bg-white text-black py-4 rounded-xl font-bold">Shop This Style</button>
                  </div>
              </div>
          </div>
      )}
      <Footer />
    </div>
  );
};

export default HomePage;
