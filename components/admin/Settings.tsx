

import React, { useState, useEffect } from 'react';
import HeaderSettingsComponent from './HeaderSettings';
import FooterSettingsComponent from './FooterSettings';
import HomePageSEOSettings from './HomePageSEOSettings';
import { SiteSettings, SyncLog } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';

type SettingsTab = 'header' | 'footer' | 'homepage-seo' | 'site' | 'tax' | 'shipping' | 'pixels';

// --- Local Helper Components ---

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
}

const EventStatusIndicator: React.FC<{ eventName: string; description: string }> = ({ eventName, description }) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
        <div className="flex items-center">
            <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            </div>
            <div>
                <p className="font-medium text-sm text-gray-800">{eventName}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </div>
        <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">ACTIVE</span>
    </div>
);


const Settings: React.FC<{token: string | null}> = ({token}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('pixels');
    const [siteSettings, setSiteSettings] = useState<SiteSettings | any>({});
    const [loading, setLoading] = useState(false);
    
    // Feeds
    const [feedUrls, setFeedUrls] = useState({ csv: '', xml: '' });
    const [generatingFeed, setGeneratingFeed] = useState(false);
    const [feedFeedback, setFeedFeedback] = useState('');

    // Meta Sync & Test
    const [syncing, setSyncing] = useState(false);
    const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
    const [syncFeedback, setSyncFeedback] = useState('');
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [testEventCode, setTestEventCode] = useState('');
    const [testEventLoading, setTestEventLoading] = useState(false);
    const [testEventFeedback, setTestEventFeedback] = useState('');

    const fetchAllData = async () => {
         setLoading(true);
         try {
             const [siteRes, syncRes, eventsRes] = await Promise.all([
                 fetch(getApiUrl('/api/settings/site')),
                 // FIX: Fetch from the new /api/catalog endpoint
                 fetch(getApiUrl('/api/catalog/sync-logs'), { headers: { 'Authorization': `Bearer ${token}` } }),
                 fetch(getApiUrl('/api/analytics/recent-events'), { headers: { 'Authorization': `Bearer ${token}` } })
             ]);
             if(siteRes.ok) setSiteSettings(await siteRes.json());
             if(syncRes.ok) setSyncLogs(await syncRes.json());
             if(eventsRes.ok) setRecentEvents(await eventsRes.json());
         } catch (err) {
             console.error(err);
         } finally {
             setLoading(false);
         }
    };

    useEffect(() => {
        // FIX: Use window.location.origin for a robust URL that works in both dev (with proxy) and prod.
        const baseUrl = window.location.origin;
        setFeedUrls({
            csv: `${baseUrl}/feeds/facebook/products.csv`,
            xml: `${baseUrl}/feeds/facebook/products.xml`
        });
        fetchAllData();
    }, [activeTab, token]);

    const handleSave = async () => {
        try {
            const res = await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(siteSettings)
            });
            if (res.ok) alert('Settings saved!');
        } catch (err) { console.error(err); }
    };
    
    const handleGenerateFeed = async () => {
        setGeneratingFeed(true);
        setFeedFeedback('Generating...');
        try {
            // FIX: Call the new /api/catalog/generate-feeds endpoint
            const res = await fetch(getApiUrl('/api/catalog/generate-feeds'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setFeedFeedback(data.message);
            fetchAllData(); // Refresh logs
        } catch (err: any) {
            setFeedFeedback(`Error: ${err.message}`);
        } finally {
            setGeneratingFeed(false);
        }
    };

    const handleSyncMetaCatalog = async () => {
        setSyncing(true);
        setSyncFeedback('Starting sync...');
        try {
            // FIX: Call the new /api/catalog/sync endpoint
            const res = await fetch(getApiUrl('/api/catalog/sync'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Sync failed.');
            setSyncFeedback(`Sync complete! ${data.status?.processedCount || 0} products processed.`);
            fetchAllData();
        } catch (err: any) {
            setSyncFeedback(`Error: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleSendTestEvent = async () => {
        if (!testEventCode) return alert('Please enter a Test Event Code.');
        setTestEventLoading(true);
        setTestEventFeedback('');
        try {
            const res = await fetch(getApiUrl('/api/integrations/facebook/test-event'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ testEventCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setTestEventFeedback(data.message);
        } catch (err: any) {
            setTestEventFeedback(`Error: ${err.message}`);
        } finally {
            setTestEventLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setSiteSettings((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    };

    const TabButton: React.FC<{ id: SettingsTab; label: string }> = ({ id, label }) => (
        <button onClick={() => setActiveTab(id)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === id ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
            {label}
        </button>
    );

    const renderContent = () => {
        if (loading) return <div>Loading...</div>;
        
        const isCapiActive = siteSettings.metaAccessToken && siteSettings.metaPixelId;
        const lastFeedGen = syncLogs.find(log => log.service === 'feed-generation');
        const lastMetaSync = syncLogs.find(log => log.service === 'meta-catalog');

        switch (activeTab) {
            case 'header': return <HeaderSettingsComponent token={token} />;
            case 'footer': return <FooterSettingsComponent token={token} />;
            case 'homepage-seo': return <HomePageSEOSettings token={token} />;
            case 'pixels': return (
                <div className="space-y-8">
                    {/* Credentials & Feeds */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* CAPI & Pixel */}
                        <div className="bg-white p-6 rounded-xl shadow-md border">
                             <h4 className="font-bold text-gray-800">Meta Pixel & Conversion API</h4>
                             <p className="text-xs text-gray-500 mb-4">Track events on browser and server for max accuracy.</p>
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Pixel ID</label>
                                    <input type="text" name="metaPixelId" value={siteSettings.metaPixelId || ''} onChange={handleChange} className="w-full text-sm p-2 border rounded focus:ring-rose-500 focus:border-rose-500" placeholder="Used for both CAPI & Browser"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CAPI Access Token</label>
                                    <textarea name="metaAccessToken" rows={3} value={siteSettings.metaAccessToken || ''} onChange={handleChange} className="w-full text-xs p-2 border rounded font-mono focus:ring-rose-500 focus:border-rose-500" placeholder="Paste your token here"></textarea>
                                </div>
                                <div className="text-right">
                                    <button onClick={handleSave} className="text-sm text-white bg-gray-800 px-4 py-2 rounded-md hover:bg-black">Save Credentials</button>
                                </div>
                             </div>
                        </div>

                        {/* Product Feeds */}
                        <div className="bg-white p-6 rounded-xl shadow-md border">
                            <h4 className="font-bold text-gray-800">Product Feeds</h4>
                            <p className="text-xs text-gray-500 mb-4">Auto-syncs hourly. Use these URLs in Meta Commerce Manager.</p>
                             <div className="space-y-4">
                                {['csv', 'xml'].map(format => (
                                    <div key={format}>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">{format} Feed URL</label>
                                        <div className="flex gap-2">
                                            <input type="text" readOnly value={feedUrls[format as 'csv'|'xml']} className="w-full text-xs p-2 border rounded bg-gray-50 font-mono" />
                                            <button onClick={() => navigator.clipboard.writeText(feedUrls[format as 'csv'|'xml'])} className="text-xs bg-gray-100 px-3 rounded hover:bg-gray-200">Copy</button>
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t pt-4">
                                    <button onClick={handleGenerateFeed} disabled={generatingFeed} className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                                        {generatingFeed ? 'Generating...' : 'Generate Feed Now'}
                                    </button>
                                    {feedFeedback && <p className="text-xs text-center mt-2 p-2 bg-blue-50 text-blue-700 rounded">{feedFeedback}</p>}
                                    {lastFeedGen && (
                                        <p className="text-xs text-center mt-2 text-gray-500">Last generated: {timeAgo(lastFeedGen.timestamp)} ({lastFeedGen.processedCount} products)</p>
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    {/* Event Status */}
                    <div className="bg-white p-6 rounded-xl shadow-md border">
                        <h4 className="font-bold text-gray-800">Event Tracking Status</h4>
                        <p className="text-xs text-gray-500 mb-4">Core e-commerce events are tracked automatically across the customer journey.</p>
                        <div className="divide-y divide-gray-100">
                            <EventStatusIndicator eventName="PageView" description="Fires on every page load across the site." />
                            <EventStatusIndicator eventName="ViewContent" description="Fires when a user views a product details page." />
                            <EventStatusIndicator eventName="AddToCart" description="Fires when a product is added to the cart." />
                            <EventStatusIndicator eventName="InitiateCheckout" description="Fires when a user starts the checkout process." />
                            <EventStatusIndicator eventName="Purchase" description="Fires after a successful payment is verified." />
                        </div>
                    </div>
                    
                    {/* Diagnostics: Test Events & Live Feed */}
                    <div className="bg-white p-6 rounded-xl shadow-md border">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:divide-x lg:divide-gray-200">
                             <div>
                                 <h4 className="font-bold text-gray-800">Test Server Events</h4>
                                 <p className="text-sm text-gray-500 mt-1 mb-4">Validate your CAPI setup. Get code from Events Manager {'>'} Test Events.</p>
                                 <div className="flex flex-col sm:flex-row gap-3">
                                     <input type="text" value={testEventCode} onChange={(e) => setTestEventCode(e.target.value)} className="flex-1 border p-2 rounded text-sm font-mono" placeholder="TEST..."/>
                                     <button onClick={handleSendTestEvent} disabled={testEventLoading || !isCapiActive} className="bg-green-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                                         {testEventLoading ? 'Sending...' : 'Send Test'}
                                     </button>
                                 </div>
                                 {testEventFeedback && <p className={`text-xs mt-3 p-2 rounded ${testEventFeedback.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{testEventFeedback}</p>}
                             </div>
                             <div className="lg:pl-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-gray-800">Live Server Event Feed</h4>
                                    <button onClick={fetchAllData} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100" title="Refresh Feed">
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5"/></svg>
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {recentEvents.length > 0 ? recentEvents.map(event => (
                                        <div key={event._id} className="text-xs border-b border-gray-100 pb-2 last:border-0">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{event.eventType}</span>
                                                <span className="text-gray-400">{timeAgo(event.createdAt)}</span>
                                            </div>
                                            <p className="text-gray-600 truncate font-mono mt-1 text-[11px]">{event.path}</p>
                                        </div>
                                    )) : <p className="text-xs text-gray-400 text-center py-8">No recent server events...</p>}
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Catalog Sync */}
                    <div className="bg-white p-6 rounded-xl shadow-md border">
                        <h4 className="font-bold text-gray-800">Meta Catalog (Realtime Sync)</h4>
                        <p className="text-xs text-gray-500 mb-4">Push product updates directly to Meta. Slower but more immediate than feed sync.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Catalog ID</label>
                                <input type="text" name="metaCatalogId" value={siteSettings.metaCatalogId || ''} onChange={handleChange} className="w-full text-sm p-2 border rounded" placeholder="Your catalog number"/>
                            </div>
                            <div className="text-right">
                                <button onClick={handleSave} className="text-sm text-white bg-gray-800 px-4 py-2 rounded-md hover:bg-black">Save Catalog ID</button>
                            </div>
                            <div className="border-t pt-4">
                                 <button onClick={handleSyncMetaCatalog} disabled={syncing || !siteSettings.metaCatalogId} className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                                    {syncing ? 'Syncing...' : 'Force Sync via API'}
                                </button>
                                {syncFeedback && <p className="text-xs text-center mt-2 p-2 bg-purple-50 text-purple-700 rounded">{syncFeedback}</p>}
                                {lastMetaSync && <p className="text-xs text-center mt-2 text-gray-500">Last API sync: {timeAgo(lastMetaSync.timestamp)}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'tax': return <div>Tax Settings</div>;
            case 'shipping': return <div>Shipping Settings</div>;
            case 'site': return <div>Site Settings</div>;
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