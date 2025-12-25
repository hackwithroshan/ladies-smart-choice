
import React from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { Link } = ReactRouterDom as any;
import { useSiteData } from '../contexts/SiteDataContext';
import { InstagramIcon, FacebookIcon, YoutubeIcon, XIcon } from './Icons';

const SocialIcon = ({ platform }: { platform: string }) => {
    const p = platform.toLowerCase();
    const props = { className: "w-5 h-5" }; // Optimized to 20x20
    if (p === 'instagram') return <InstagramIcon {...props} />;
    if (p === 'facebook') return <FacebookIcon {...props} />;
    if (p === 'youtube') return <YoutubeIcon {...props} />;
    if (p === 'twitter' || p === 'x') return <XIcon {...props} />;
    return <span className="text-[10px] font-bold uppercase">{platform[0]}</span>;
};

const Footer: React.FC = () => {
  const { footerSettings, siteSettings, loading } = useSiteData();

  if (loading) return null;

  const BrandName = siteSettings?.storeName || "Ayushree Ayurveda";
  const bgStyle: React.CSSProperties = {
      backgroundColor: footerSettings.backgroundColor || '#16423C',
      backgroundImage: footerSettings.backgroundImage ? `url(${footerSettings.backgroundImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
  };

  const overlayStyle: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      backgroundColor: footerSettings.overlayColor || '#000000',
      opacity: (footerSettings.overlayOpacity || 0) / 100,
      zIndex: 1
  };

  return (
    <footer style={bgStyle} className="text-white overflow-hidden">
      <div style={overlayStyle}></div>

      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-white/10 pb-16">
          
          <div className="col-span-1 lg:col-span-1 space-y-8">
            <Link to="/" className="inline-block">
                {footerSettings.logoUrl ? (
                    <img src={footerSettings.logoUrl} alt={BrandName} className="h-10 md:h-12 w-auto object-contain" />
                ) : (
                    <h2 className="text-3xl font-brand font-black italic tracking-tighter uppercase">{BrandName}</h2>
                )}
            </Link>
            
            <p className="text-gray-300/90 text-sm leading-relaxed font-medium max-w-xs">
              {footerSettings.brandDescription || `Reviving ancient secrets for your daily health at ${BrandName}. Our products are ethically sourced and 100% natural.`}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
                {footerSettings.socialLinks.map((s, i) => (
                    <a 
                        key={i} 
                        href={s.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all duration-300 transform hover:-translate-y-1 group shadow-lg"
                        title={s.platform}
                    >
                        <SocialIcon platform={s.platform} />
                    </a>
                ))}
            </div>
          </div>
          
          {footerSettings.columns.map((col, idx) => (
              <div key={idx}>
                <h3 className="text-[10px] font-black text-brand-accent tracking-[0.4em] uppercase mb-8">{col.title}</h3>
                <ul className="space-y-4">
                    {col.links.map((link, lIdx) => (
                        <li key={lIdx}>
                            <Link to={link.url} className="text-sm text-gray-400 hover:text-white transition-colors block font-medium">
                                {link.text}
                            </Link>
                        </li>
                    ))}
                </ul>
              </div>
          ))}
        </div>
        
        <div className="mt-10 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-[9px] uppercase tracking-[0.3em] font-bold text-gray-500 text-center md:text-left">
             <p>{footerSettings.copyrightText || `© ${new Date().getFullYear()} ${BrandName}.`}</p>
             <div className="hidden md:flex gap-6">
                <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green-500"></span> SSL Secure</span>
                <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green-500"></span> Verified Quality</span>
             </div>
          </div>

          <div className="flex items-center gap-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
             <img src="https://cdn-icons-png.flaticon.com/512/349/349221.png" className="h-4" alt="Visa" />
             <img src="https://cdn-icons-png.flaticon.com/512/349/349228.png" className="h-4" alt="Mastercard" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" className="h-2.5" alt="UPI" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
