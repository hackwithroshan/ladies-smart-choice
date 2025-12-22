
import React, { useState, useEffect } from 'react';
import HeaderSettingsComponent from './HeaderSettings';
import FooterSettingsComponent from './FooterSettings';
import HomePageSEOSettings from './HomePageSEOSettings';
import GeneralSettings from './GeneralSettings';
import TaxSettings from './TaxSettings';
import ShippingSettings from './ShippingSettings';
import BrandingSettings from './BrandingSettings';
import { SiteSettings, SyncLog } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';

type SettingsTab = 'header' | 'footer' | 'homepage-seo' | 'site' | 'tax' | 'shipping' | 'pixels' | 'branding';

// ... (Other helper components same as before) ...

const Settings: React.FC<{token: string | null}> = ({token}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
    
    // ... (States for Pixels tab same as before) ...

    const TabButton: React.FC<{ id: SettingsTab; label: string }> = ({ id, label }) => (
        <button onClick={() => setActiveTab(id)} className={`px-4 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === id ? 'bg-[#16423C] text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>
            {label}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'branding': return <BrandingSettings token={token} />;
            case 'header': return <HeaderSettingsComponent token={token} />;
            case 'footer': return <FooterSettingsComponent token={token} />;
            case 'homepage-seo': return <HomePageSEOSettings token={token} />;
            case 'site': return <GeneralSettings token={token} />;
            case 'tax': return <TaxSettings token={token} />;
            case 'shipping': return <ShippingSettings token={token} />;
            case 'pixels': return <div>Tracking & Pixels Content...</div>; // Abbreviated
            default: return <BrandingSettings token={token} />;
        }
    };

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
             <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-xl w-fit overflow-x-auto border">
                <TabButton id="branding" label="Rebranding" />
                <TabButton id="site" label="General" />
                <TabButton id="header" label="Header/Menu" />
                <TabButton id="footer" label="Footer" />
                <TabButton id="homepage-seo" label="SEO" />
                <TabButton id="shipping" label="Shipping" />
                <TabButton id="tax" label="Tax" />
                <TabButton id="pixels" label="Tracking" />
             </div>
             <div className="pt-4">
                 {renderContent()}
             </div>
        </div>
    );
}

export default Settings;
