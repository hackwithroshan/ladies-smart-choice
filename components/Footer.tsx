
import React from 'react';
import { Link } from 'react-router-dom';
import { COLORS } from '../constants';
import { useSiteData } from '../contexts/SiteDataContext';

const Footer: React.FC = () => {
  const { footerSettings, loading } = useSiteData();

  if (loading) return null;

  return (
    <footer style={{ backgroundColor: footerSettings.backgroundColor || COLORS.primary }} className="text-white">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-16">
          <div className="col-span-1 md:col-span-1 space-y-6">
            <h2 className="text-2xl font-serif font-bold italic tracking-tight">Ayushree Ayurveda</h2>
            <p className="text-gray-300/80 text-sm leading-relaxed font-light">
              {footerSettings.brandDescription || "Reviving ancient Ayurvedic secrets for your daily health. Our products are ethically sourced and 100% natural."}
            </p>
            <div className="flex gap-4">
                {footerSettings.socialLinks.map((s, i) => (
                    <a key={i} href={s.url} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold">{s.platform[0]}</span>
                    </a>
                ))}
            </div>
          </div>
          
          {footerSettings.columns.map((col, idx) => (
              <div key={idx}>
                <h3 className="text-xs font-bold text-[#6A9C89] tracking-[0.2em] uppercase mb-6">{col.title}</h3>
                <ul className="space-y-4">
                    {col.links.map((link, lIdx) => (
                        <li key={lIdx}>
                            <Link to={link.url} className="text-sm text-gray-300 hover:text-white transition-colors block">{link.text}</Link>
                        </li>
                    ))}
                </ul>
              </div>
          ))}
        </div>
        
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-gray-500">
          <p>{footerSettings.copyrightText || '© 2024 Ayushree Ayurveda'}</p>
          <div className="mt-4 md:mt-0 flex gap-6">
              <span>Pure Ingredients</span>
              <span>Traditional Methods</span>
              <span>Handcrafted with Love</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
