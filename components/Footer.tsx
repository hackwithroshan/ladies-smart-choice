
import React, { useState } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { Link } = ReactRouterDom as any;
import { useSiteData } from '../contexts/SiteDataContext';
import { InstagramIcon, FacebookIcon, YoutubeIcon, XIcon } from './Icons';
import { getApiUrl } from '../utils/apiHelper';

const SocialIcon = ({ platform }: { platform: string }) => {
    const p = platform.toLowerCase();
    const props = { className: "w-5 h-5" };
    if (p === 'instagram') return <InstagramIcon {...props} />;
    if (p === 'facebook') return <FacebookIcon {...props} />;
    if (p === 'youtube') return <YoutubeIcon {...props} />;
    if (p === 'twitter' || p === 'x') return <XIcon {...props} />;
    return <span className="text-[10px] font-bold uppercase">{platform[0]}</span>;
};

const Footer: React.FC = () => {
  const { footerSettings, siteSettings, loading } = useSiteData();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  if (loading) return null;

  const BrandName = siteSettings?.storeName || "Ayushree Ayurveda";
  
  const footerBaseStyle: React.CSSProperties = {
      backgroundColor: footerSettings.backgroundColor || '#16423C',
      position: 'relative',
      minHeight: '400px'
  };

  const bgImageStyle: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      backgroundImage: footerSettings.backgroundImage ? `url(${footerSettings.backgroundImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      zIndex: 0
  };

  const overlayStyle: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      backgroundColor: footerSettings.overlayColor || '#000000',
      opacity: (footerSettings.overlayOpacity || 0) / 100,
      zIndex: 1
  };

  const textStyle = { color: footerSettings.textColor || '#D1D5DB' };
  const headingStyle = { color: footerSettings.headingColor || '#6A9C89' };
  const linkStyle = { color: footerSettings.linkColor || '#9CA3AF' };

  const handleSubscribe = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;
      setStatus('loading');
      try {
          const res = await fetch(getApiUrl('/api/contact/send'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  name: 'Newsletter Subscriber',
                  email,
                  subject: 'New Newsletter Signup',
                  message: `Please add ${email} to the newsletter mailing list.`
              })
          });
          if (res.ok) {
              setStatus('success');
              setEmail('');
              setTimeout(() => setStatus('idle'), 5000);
          } else {
              setStatus('error');
          }
      } catch (e) { setStatus('error'); }
  };

  const NewsletterBox = ({ isColumn = false }: { isColumn?: boolean }) => (
    <div className={`${isColumn ? 'flex flex-col h-full' : 'flex flex-col lg:flex-row justify-between items-center gap-10'}`}>
        <div className={`${isColumn ? 'mb-6' : 'max-w-xl text-center lg:text-left'}`}>
            <h3 className={`${isColumn ? 'text-[10px] font-black tracking-[0.4em]' : 'text-2xl md:text-3xl font-brand font-black italic tracking-tighter'} uppercase mb-4`} style={headingStyle}>
                {footerSettings.newsletterTitle || 'Join Our Journey'}
            </h3>
            <p className={`${isColumn ? 'text-xs leading-relaxed opacity-80' : 'text-sm font-medium leading-relaxed opacity-90'}`} style={textStyle}>
                {footerSettings.newsletterSubtitle || 'Get exclusive updates and herbal tips.'}
            </p>
        </div>
        <div className={`${isColumn ? 'w-full' : 'w-full max-w-md'}`}>
            <form onSubmit={handleSubscribe} className={`flex ${isColumn ? 'flex-col' : 'flex-col sm:flex-row'} gap-3`}>
                <input 
                    type="email" 
                    required 
                    placeholder="Email Address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-5 py-3 text-white placeholder-white/40 focus:ring-1 focus:ring-brand-accent transition-all outline-none text-xs"
                />
                <button 
                    disabled={status === 'loading'}
                    className={`bg-brand-accent text-white font-black uppercase tracking-widest text-[9px] ${isColumn ? 'py-3.5 w-full' : 'px-8 py-3.5'} rounded-xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50`}
                >
                    {status === 'loading' ? '...' : 'Subscribe'}
                </button>
            </form>
            {status === 'success' && <p className="text-[9px] font-black uppercase text-green-400 mt-3 tracking-widest animate-fade-in">✨ Success!</p>}
        </div>
    </div>
  );

  return (
    <footer style={footerBaseStyle} className="overflow-hidden border-t border-gray-100">
      {/* Background Image Layer */}
      <div style={bgImageStyle}></div>
      
      {/* Background Overlay Layer */}
      <div style={overlayStyle}></div>

      {/* Main Content Layer */}
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Newsletter: TOP POSITION (Full Width) */}
        {footerSettings.showNewsletter && footerSettings.newsletterPlacement === 'Top' && (
            <div className="mb-20 pb-16 border-b border-white/10">
                <NewsletterBox />
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 border-b border-white/10 pb-16">
          
          {/* Brand Identity Column (Usually starts at the left) */}
          <div className="col-span-1 lg:col-span-2 space-y-8">
            <Link to="/" className="inline-block">
                {footerSettings.logoUrl ? (
                    <img src={footerSettings.logoUrl} alt={BrandName} className="h-10 md:h-12 w-auto object-contain" />
                ) : (
                    <h2 className="text-3xl font-brand font-black italic tracking-tighter uppercase" style={headingStyle}>{BrandName}</h2>
                )}
            </Link>
            
            <p className="text-sm leading-relaxed font-medium max-w-sm" style={textStyle}>
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
          
          {/* Menu Columns (Rendered in the middle) */}
          {footerSettings.columns.map((col, idx) => (
              <div key={idx} className="col-span-1">
                <h3 className="text-[10px] font-black tracking-[0.4em] uppercase mb-8" style={headingStyle}>{col.title}</h3>
                <ul className="space-y-4">
                    {col.links.map((link, lIdx) => (
                        <li key={lIdx}>
                            <Link to={link.url} className="text-sm hover:text-white transition-colors block font-medium" style={linkStyle}>
                                {link.text}
                            </Link>
                        </li>
                    ))}
                </ul>
              </div>
          ))}

          {/* Newsletter: COLUMN POSITION (Moved here to show at the END / RIGHT) */}
          {footerSettings.showNewsletter && footerSettings.newsletterPlacement === 'InColumn' && (
              <div className="col-span-1">
                  <NewsletterBox isColumn />
              </div>
          )}
        </div>
        
        <div className="mt-10 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-[9px] uppercase tracking-[0.3em] font-bold text-gray-500 text-center md:text-left">
             <p style={textStyle}>{footerSettings.copyrightText || `© ${new Date().getFullYear()} ${BrandName}.`}</p>
             <div className="hidden md:flex gap-6">
                <span className="flex items-center gap-2" style={textStyle}><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></span> SSL SECURE</span>
                <span className="flex items-center gap-2" style={textStyle}><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></span> QUALITY VERIFIED</span>
             </div>
          </div>

          <div className="flex items-center gap-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
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
