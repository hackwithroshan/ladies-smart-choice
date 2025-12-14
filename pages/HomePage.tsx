
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Product, Slide, Collection, ShoppableVideo, Testimonial, HomePageSettings } from '../types';
import { useSiteData } from '../contexts/SiteDataContext';
import { COLORS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '../components/Icons';
import ErrorBoundary from '../components/ErrorBoundary';
import SEO from '../components/SEO';

interface HomePageProps {
  user: any;
  logout: () => void;
}

interface VideoListItemProps {
    video: ShoppableVideo;
    autoplay: boolean;
    onClick: () => void;
}

// Video Component for List (Handles Autoplay/Mute)
const VideoListItem: React.FC<VideoListItemProps> = ({ video, autoplay, onClick }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (autoplay && videoRef.current) {
            videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
        } else if (videoRef.current) {
            videoRef.current.pause();
        }
    }, [autoplay]);

    return (
      <div 
          onClick={onClick}
          className="relative flex-shrink-0 w-64 sm:w-auto aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer shadow-lg transition-transform transform hover:scale-105"
      >
          {autoplay ? (
              <video 
                  ref={videoRef}
                  src={video.videoUrl}
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover"
              />
          ) : (
              <img src={video.thumbnailUrl || video.videoUrl.replace('.mp4', '.jpg')} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
          )}
          
          {/* Overlays */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          {!autoplay && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform">
                      <PlayIcon className="h-5 w-5 text-white ml-1"/>
                  </div>
              </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
              <h4 className="font-bold text-lg truncate">{video.title}</h4>
              <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">{video.price}</span>
                  <button className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">Shop</button>
              </div>
          </div>
      </div>
    );
};

const HomePage: React.FC<HomePageProps> = ({ user, logout }) => {
  // --- All data is now consumed from the central SiteDataContext ---
  const { 
    products, 
    collections, 
    slides, 
    videos, 
    testimonials, 
    siteSettings, 
    homePageSettings, 
    loading 
  } = useSiteData();
  
  // --- Local UI State ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<ShoppableVideo | null>(null);
  const navigate = useNavigate();

  // --- Derived settings from context ---
  const videoAutoplay = siteSettings?.videoAutoplay || false;
  const seoSettings = homePageSettings;

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide(current => (current === slides.length - 1 ? 0 : current + 1));
  };
  
  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide(current => (current === 0 ? slides.length - 1 : current + 1));
  };

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [slides.length]);

  const handleProductClick = (slug: string) => {
    navigate(`/product/${slug}`);
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

  const newArrivals = products.slice(0, 4);
  const bestSellers = products.length > 4 ? products.slice(4, 8) : products.slice(0, 4);

  // --- SEO Schemas ---
  const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Ladies Smart Choice",
      "url": window.location.origin,
      "logo": `${window.location.origin}/logo.png`, // Assumes logo.png exists in public or handle dynamically
      "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91 987 654 3210",
          "contactType": "customer service"
      }
  };

  const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Ladies Smart Choice",
      "url": window.location.origin,
      "potentialAction": {
          "@type": "SearchAction",
          "target": `${window.location.origin}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
      }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO 
        title={seoSettings?.seoTitle || 'Ladies Smart Choice | Fashion & Lifestyle'}
        description={seoSettings?.seoDescription || "The premier online destination for women's fashion, clothing, accessories, and lifestyle products."}
        keywords={seoSettings?.seoKeywords}
        schema={[orgSchema, websiteSchema]}
      />

      <Header user={user} logout={logout} />
      <ErrorBoundary>
        <main className="flex-grow">
          
          {/* HERO SECTION SLIDER */}
          {/* Updated Strategy: "Separate Banners + Cover" */}
          {/* We use <picture> to show a different image for mobile vs desktop */}
          <div className="relative bg-gray-100 h-[450px] md:h-[500px] lg:h-[600px] overflow-hidden group">
            {slides.length > 0 ? slides.map((slide, index) => (
              <div
                key={slide._id || index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                {/* The Picture Element switches source based on media query */}
                <picture className="absolute inset-0 w-full h-full">
                    {/* If mobileImageUrl exists, use it for screens <= 768px */}
                    <source media="(max-width: 768px)" srcSet={slide.mobileImageUrl || slide.imageUrl} />
                    {/* Default (Desktop) Image */}
                    <img 
                        src={slide.imageUrl} 
                        alt={slide.title || 'Slide Image'} 
                        className="w-full h-full object-cover"
                    />
                </picture>

                {/* Text Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20"></div>
                
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
                      {slide.title && (
                          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white mb-4 drop-shadow-lg animate-fade-in-up leading-tight">
                              {slide.title}
                          </h1>
                      )}
                      {slide.subtitle && (
                          <p className="mt-2 max-w-xl mx-auto text-base md:text-xl text-gray-100 drop-shadow-md font-light mb-8 px-4">
                              {slide.subtitle}
                          </p>
                      )}
                      {slide.buttonText && (
                          <div className="mt-2">
                              <button className="px-8 py-3 text-sm md:text-base font-bold rounded-full text-white shadow-xl hover:opacity-90 transition-transform transform hover:scale-105 border-2 border-white/20 backdrop-blur-sm" style={{backgroundColor: COLORS.accent}}>
                                  {slide.buttonText}
                              </button>
                          </div>
                      )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-full text-gray-400 bg-gray-200">
                  <p>Loading slides...</p>
              </div>
            )}
            
            {slides.length > 1 && <>
              <button 
                onClick={prevSlide} 
                className="absolute top-1/2 left-2 sm:left-4 transform -translate-y-1/2 bg-black/30 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/50 z-40 transition-all border border-white/10 opacity-0 group-hover:opacity-100 hidden md:block"
              >
                <ChevronLeftIcon />
              </button>
              <button 
                onClick={nextSlide} 
                className="absolute top-1/2 right-2 sm:right-4 transform -translate-y-1/2 bg-black/30 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/50 z-40 transition-all border border-white/10 opacity-0 group-hover:opacity-100 hidden md:block"
              >
                <ChevronRightIcon />
              </button>
              
              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-40">
                  {slides.map((_, idx) => (
                      <button 
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
                      />
                  ))}
              </div>
            </>}
          </div>

          {/* COLLECTIONS (Dynamic Shop By Category) */}
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 text-center mb-8 md:mb-10">Curated Collections</h2>
              {collections.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 items-start">
                      {collections.map((col) => {
                          const style = col.displayStyle || 'Rectangle';
                          const isImageOnly = style === 'ImageOnly';
                          
                          let containerClass = "w-full rounded-2xl overflow-hidden relative shadow-sm";
                          let imgClass = "w-full h-auto block transition-transform duration-700 ease-in-out group-hover:scale-105";

                          if (style === 'Circle') {
                              containerClass = "w-32 h-32 sm:w-48 sm:h-48 md:w-80 md:h-80 rounded-full mx-auto shadow-xl border-4 border-white overflow-hidden relative";
                              imgClass = "w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110";
                          } else if (style === 'Square') {
                              containerClass = "w-full aspect-square rounded-2xl overflow-hidden relative shadow-sm";
                              imgClass = "w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110";
                          }

                          return (
                              <div 
                                  key={col.id} 
                                  onClick={() => navigate(`/collections/${col.id}`)}
                                  className="group cursor-pointer flex flex-col items-center"
                              >
                                  <div className={containerClass}>
                                      <img 
                                          src={col.imageUrl} 
                                          alt={col.title} 
                                          className={imgClass}
                                      />
                                      {/* NEW: Glass Overlay for ImageOnly style */}
                                      {isImageOnly && (
                                          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-black/40 backdrop-blur-md border-t border-white/10 text-center transition-all duration-300 group-hover:bg-black/50">
                                              <h3 className="text-sm md:text-lg font-bold text-white drop-shadow-md tracking-wide truncate">
                                                  {col.title}
                                              </h3>
                                          </div>
                                      )}
                                  </div>
                                  
                                  {/* Title Below Image - Only if NOT ImageOnly */}
                                  {!isImageOnly && (
                                      <div className="mt-3 md:mt-4 text-center">
                                          <h3 className="text-sm md:text-lg font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
                                              {col.title}
                                          </h3>
                                          <p className="hidden md:flex text-sm text-gray-500 mt-1 items-center justify-center gap-1 group-hover:translate-x-1 transition-transform">
                                              Explore <span aria-hidden="true">&rarr;</span>
                                          </p>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              ) : (
                  <p className="text-center text-gray-500">No collections found.</p>
              )}
          </div>

          {/* NEW ARRIVALS */}
          <div className="bg-gray-50 py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-6 md:mb-8 px-1">
                  <div>
                      <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">New Arrivals</h2>
                      <p className="text-sm md:text-base text-gray-500 mt-1">Fresh styles just for you</p>
                  </div>
                  <a href="#" className="text-rose-600 font-medium hover:underline text-sm md:text-base">View All</a>
              </div>
              
              {loading ? <p className="text-center">Loading...</p> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                  {newArrivals.map((product) => (
                    <ProductCard key={product.id} product={product} onProductClick={handleProductClick} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SHOP FROM VIDEO */}
          {videos.length > 0 && (
              <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 text-center mb-8 md:mb-10">Shop From Video</h2>
                  <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
                      {videos.map((video) => (
                          <div key={video._id} className="snap-center">
                            <VideoListItem 
                                video={video} 
                                autoplay={videoAutoplay} 
                                onClick={() => setSelectedVideo(video)} 
                            />
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* BEST SELLERS */}
          <div className="bg-white py-12 md:py-16 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="text-center mb-8 md:mb-12">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Best Sellers</h2>
                  <p className="text-sm md:text-base text-gray-500 mt-2">Our most loved styles this season</p>
              </div>
              {loading ? <p className="text-center">Loading...</p> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                  {bestSellers.map((product) => (
                    <ProductCard key={product.id} product={product} onProductClick={handleProductClick} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HAPPY CUSTOMERS */}
          {testimonials.length > 0 && (
              <div className="bg-rose-50 py-12 md:py-16">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 text-center mb-8 md:mb-12">Happy Customers</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                          {testimonials.map((review) => (
                              <div key={review._id} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-rose-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                  <img src={review.imageUrl || 'https://via.placeholder.com/100?text=User'} alt={review.name} className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover mb-4 border-2 border-rose-200"/>
                                  <div className="flex mb-4 text-yellow-400">
                                      {[...Array(5)].map((_, i) => (
                                          <svg key={i} className={`w-4 h-4 md:w-5 md:h-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                      ))}
                                  </div>
                                  <p className="text-sm md:text-base text-gray-600 italic mb-4 md:mb-6 leading-relaxed">"{review.comment}"</p>
                                  <h4 className="font-bold text-gray-900">{review.name}</h4>
                                  <span className="text-xs text-gray-400 uppercase tracking-wide mt-1">{review.role}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* NEWSLETTER */}
          <div className="bg-gray-900 py-16 md:py-20">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                  <h2 className="text-2xl md:text-4xl font-serif font-bold text-white mb-4 md:mb-6">Join the Smart Choice Club</h2>
                  <p className="text-gray-300 text-sm md:text-lg mb-8">Subscribe to our newsletter and get 10% off your first purchase.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
                      <input type="email" placeholder="Enter your email address" className="w-full px-5 py-3.5 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"/>
                      <button className="w-full sm:w-auto px-8 py-3.5 rounded-md font-bold text-white transition-colors bg-rose-600 hover:bg-rose-700">Subscribe</button>
                  </div>
              </div>
          </div>

          {/* --- Full Screen Video Modal --- */}
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
                      
                      {/* Overlay Content */}
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
      <Footer />
    </div>
  );
};

export default HomePage;
