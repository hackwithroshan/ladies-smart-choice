
import React, { useState } from 'react';
import HomePageSEOSettings from './HomePageSEOSettings';
import GeneralSettings from './GeneralSettings';
import TaxSettings from './TaxSettings';
import ShippingSettings from './ShippingSettings';
import BrandingSettings from './BrandingSettings';

type SettingsTab = 'branding' | 'site' | 'homepage-seo' | 'shipping' | 'tax';

const Settings: React.FC<{token: string | null}> = ({token}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
    
    const tabs: { id: SettingsTab; label: string }[] = [
        { id: 'branding', label: 'Rebranding' },
        { id: 'site', label: 'General' },
        { id: 'homepage-seo', label: 'SEO Strategy' },
        { id: 'shipping', label: 'Logistics' },
        { id: 'tax', label: 'Taxes' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'branding': return <BrandingSettings token={token} />;
            case 'homepage-seo': return <HomePageSEOSettings token={token} />;
            case 'site': return <GeneralSettings token={token} />;
            case 'tax': return <TaxSettings token={token} />;
            case 'shipping': return <ShippingSettings token={token} />;
            default: return <BrandingSettings token={token} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex flex-col">
                <h2 className="text-3xl font-black text-zinc-900 italic uppercase tracking-tighter">System Console</h2>
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-[0.3em] mt-1">Configure global parameters and design tokens</p>
             </div>

             <div className="flex space-x-2 bg-white p-2 rounded-2xl w-fit overflow-x-auto border border-zinc-100 shadow-sm">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)} 
                        className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#16423C] text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}
                    >
                        {tab.label}
                    </button>
                ))}
             </div>

             <div className="pt-4">
                 <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-sm">
                    {renderContent()}
                 </div>
             </div>
        </div>
    );
}

export default Settings;
