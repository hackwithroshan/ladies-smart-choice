
import React, { useState, useEffect } from 'react';
import HeaderSettingsComponent from './HeaderSettings';
import FooterSettingsComponent from './FooterSettings';
import HomePageSEOSettings from './HomePageSEOSettings';
import { SiteSettings, SyncLog } from '../../types';

type SettingsTab = 'header' | 'footer' | 'homepage-seo' | 'site' | 'tax' | 'shipping' | 'pixels';

const Settings: React.FC<{token: string | null}> = ({token}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('pixels'); // Default to pixels
    const [siteSettings, setSiteSettings] = useState<SiteSettings | any>({});
    const [loading, setLoading] = useState(false);
    const [feedUrl, setFeedUrl] = useState('');

    // State for Meta Sync
    const [syncing, setSyncing] = useState(false);
    const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
    const [syncFeedback, setSyncFeedback] = useState('');

    useEffect(() => {
        // Calculate Feed URL based on current window location
        const protocol = window.location.protocol;
        const host = window.location.host;
        setFeedUrl(`${protocol}//${host}/api/feed/facebook.csv`);

        const fetchAllSettings = async () => {
             setLoading(true);
             try {
                 const [siteRes, syncRes] = await Promise.all([
                     fetch('/api/settings/site'),
                     fetch('/api/feed/sync-logs', { headers: { 'Authorization': `Bearer ${token}` } })
                 ]);
                 if(siteRes.ok) setSiteSettings(await siteRes.json());
                 if(syncRes.ok) setSyncLogs(await syncRes.json());
             } catch (err) {
                 console.error(err);
             } finally {
                 setLoading(false);
             }
        };
        fetchAllSettings();
    }, [activeTab, token]);

    const handleSave = async () => {
        try {
            const res = await fetch('/api/settings/site', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(siteSettings)
            });
            if (res.ok) alert('Settings saved!');
        } catch (err) {
            console.error(err);
        }
    };

    const handleSyncMetaCatalog = async () => {
        setSyncing(true);
        setSyncFeedback('Starting sync...');
        try {
            const res = await fetch('/api/feed/sync-meta-catalog', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Sync failed.');
            setSyncFeedback(`Sync complete! ${data.status?.processedCount || 0} products processed.`);
            // Refresh logs
            const syncRes = await fetch('/api/feed/sync-logs', { headers: { 'Authorization': `Bearer ${token}` } });
            if(syncRes.ok) setSyncLogs(await syncRes.json());
        } catch (err: any) {
            setSyncFeedback(`Error: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setSiteSettings((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const TabButton: React.FC<{ id: SettingsTab; label: string }> = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === id 
                ? 'bg-gray-800 text-white shadow-sm' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'
            }`}
        >
            {label}
        </button>
    );

    const renderContent = () => {
        if (loading) return <div>Loading...</div>;
        const lastSync = syncLogs[0];

        switch (activeTab) {
            case 'header':
                return <HeaderSettingsComponent token={token} />;
            case 'footer':
                return <FooterSettingsComponent token={token} />;
            case 'homepage-seo':
                return <HomePageSEOSettings token={token} />;
            case 'pixels':
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Tracking & Catalogs</h3>
                        <div className="space-y-8">
                            
                            {/* --- Meta Catalog API Sync --- */}
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                <h4 className="font-bold text-gray-800 mb-2">Meta Catalog API & Server-Side Events</h4>
                                <p className="text-xs text-gray-500 mb-4">Automatically push your catalog and send purchase events directly from the server for maximum accuracy. Requires a long-lived Access Token and your Catalog ID.</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Meta Access Token</label>
                                        <textarea name="metaAccessToken" rows={2} value={siteSettings.metaAccessToken || ''} onChange={handleChange} className="w-full text-xs p-2 border rounded font-mono" placeholder="Paste your token here"></textarea>
                                        <p className="text-xs text-gray-500 mt-1">This token enables both Catalog Sync and Server-Side Events (Conversions API).</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Meta Catalog ID</label>
                                        <input type="text" name="metaCatalogId" value={siteSettings.metaCatalogId || ''} onChange={handleChange} className="w-full text-xs p-2 border rounded" placeholder="Your catalog number"/>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <button onClick={handleSyncMetaCatalog} disabled={syncing} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                                            {syncing ? 'Syncing...' : 'Sync Products with Meta'}
                                        </button>
                                        <button onClick={handleSave} className="text-sm text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Save Credentials</button>
                                    </div>
                                    {syncFeedback && <p className="text-xs text-center mt-2 p-2 bg-blue-50 text-blue-700 rounded">{syncFeedback}</p>}
                                    {lastSync && (
                                        <div className={`text-xs text-center mt-2 p-2 rounded ${lastSync.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            Last Sync: {new Date(lastSync.timestamp).toLocaleString()} - <strong>{lastSync.status.toUpperCase()}</strong> ({lastSync.processedCount} items)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- CSV Feed --- */}
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                                <h4 className="text-sm font-bold text-blue-800 mb-2">Facebook Product Catalog Feed (CSV)</h4>
                                <p className="text-xs text-blue-600 mb-2">As an alternative to the API, you can use this URL for a scheduled feed in Meta Commerce Manager.</p>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={feedUrl} className="flex-1 text-xs p-2 border rounded bg-white text-gray-600"/>
                                    <button onClick={() => navigator.clipboard.writeText(feedUrl)} className="bg-blue-600 text-white text-xs px-3 rounded">Copy</button>
                                </div>
                            </div>
                            
                            {/* --- Pixels --- */}
                            <div className="pt-4 border-t">
                                <h4 className="font-bold text-gray-800 mb-4">Browser Pixels</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Facebook Pixel ID</label>
                                    <input type="text" name="facebookPixelId" value={siteSettings.facebookPixelId || ''} onChange={handleChange} className="mt-1 flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300" placeholder="xxxxxxxxxxxxxxx" />
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700">Google Analytics 4 Measurement ID</label>
                                    <input type="text" name="googlePixelId" value={siteSettings.googlePixelId || ''} onChange={handleChange} className="mt-1 flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300" placeholder="G-XXXXXXXXXX" />
                                </div>
                                <button onClick={handleSave} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md">Save Pixel IDs</button>
                            </div>
                        </div>
                    </div>
                );
            case 'tax':
                 return (
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Tax & GST Configuration</h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input type="checkbox" name="taxIncluded" checked={siteSettings.taxIncluded || false} onChange={handleChange} className="h-4 w-4 text-orange-600 border-gray-300 rounded"/>
                                <label className="ml-2 block text-sm text-gray-900">All prices include tax</label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Default Tax Rate (%)</label>
                                <input type="number" name="taxRate" value={siteSettings.taxRate || 0} onChange={handleChange} className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-md"/>
                            </div>
                             <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md">Save Tax Settings</button>
                        </div>
                    </div>
                 );
            case 'shipping':
                 return (
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Shipping Zones</h3>
                        <p className="text-gray-500 mb-4">Configured in DB (UI implementation simplified)</p>
                        <div className="space-y-4">
                             <div className="border p-4 rounded-md flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium">Standard Shipping</h4>
                                </div>
                                <span className="font-bold">₹15.00</span>
                            </div>
                            <button className="text-sm text-blue-600 font-medium">+ Add Shipping Zone</button>
                        </div>
                    </div>
                 );
            case 'site': 
            default:
                 return (
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">General Site Settings</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                                <div>
                                    <h4 className="font-medium text-gray-900">Homepage Video Autoplay</h4>
                                    <p className="text-xs text-gray-500">Automatically play 'Shop from Video' reels without sound.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="videoAutoplay" checked={siteSettings.videoAutoplay || false} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Store Currency</label>
                                <input type="text" name="currency" value={siteSettings.currency || 'INR'} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                            </div>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md">Save General Settings</button>
                        </div>
                    </div>
                 );
        }
    };

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-gray-800">Store Settings</h2>
             <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
                <TabButton id="pixels" label="Tracking & Catalogs" />
                <TabButton id="header" label="Header & Menu" />
                <TabButton id="footer" label="Footer" />
                <TabButton id="homepage-seo" label="Home Page SEO" />
                <TabButton id="site" label="General & Media" />
                <TabButton id="tax" label="Taxes" />
                <TabButton id="shipping" label="Shipping" />
             </div>
             <div>
                 {renderContent()}
             </div>
        </div>
    );
}

export default Settings;
