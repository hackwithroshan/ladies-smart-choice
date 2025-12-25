
import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

const TrackingSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [testCode, setTestCode] = useState('');
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(getApiUrl('/api/settings/site'));
                if (res.ok) setSettings(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (res.ok) setFeedback({ type: 'success', message: 'Tracking settings saved!' });
        } catch (err) { setFeedback({ type: 'error', message: 'Failed to save.' }); }
        finally { setSaving(false); setTimeout(() => setFeedback(null), 3000); }
    };

    const handleTestEvent = async () => {
        if (!testCode) return alert("Enter a test code from Meta Events Manager.");
        setTesting(true);
        try {
            const res = await fetch(getApiUrl('/api/integrations/facebook/test-event'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ testEventCode: testCode })
            });
            const data = await res.json();
            alert(data.message);
        } catch (e) { alert("Failed to send test event."); }
        finally { setTesting(false); }
    };

    if (loading) return <div>Loading...</div>;

    const EventToggle = ({ name, label }: { name: keyof SiteSettings, label: string }) => (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <input 
                type="checkbox" 
                name={name as string} 
                checked={!!settings[name]} 
                onChange={handleChange}
                className="h-4 w-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer" 
            />
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Tracking & Pixels</h3>
                <button onClick={handleSave} disabled={saving} className="bg-[#16423C] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-all">
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {feedback && <div className={`p-4 rounded-lg text-sm font-bold ${feedback.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>{feedback.message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Meta Configuration */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg>
                        </div>
                        <h4 className="font-bold text-gray-800">Meta Pixel & CAPI</h4>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pixel ID</label>
                        <input type="text" name="metaPixelId" value={settings.metaPixelId || ''} onChange={handleChange} className="w-full border rounded-lg p-2.5 text-sm focus:ring-blue-500" placeholder="e.g. 1234567890" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Conversion API Token</label>
                        <input type="password" name="metaAccessToken" value={settings.metaAccessToken || ''} onChange={handleChange} className="w-full border rounded-lg p-2.5 text-sm focus:ring-blue-500" placeholder="EAAB..." />
                        <p className="text-[10px] text-gray-400 mt-1">Required for server-side event tracking.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catalog ID</label>
                        <input type="text" name="metaCatalogId" value={settings.metaCatalogId || ''} onChange={handleChange} className="w-full border rounded-lg p-2.5 text-sm focus:ring-blue-500" placeholder="9876..." />
                    </div>
                </div>

                {/* Event Toggles */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Active Tracked Events</h4>
                    <div className="space-y-2">
                        <EventToggle name="trackPageView" label="PageView" />
                        <EventToggle name="trackViewContent" label="ViewContent (Product)" />
                        <EventToggle name="trackAddToCart" label="AddToCart" />
                        <EventToggle name="trackInitiateCheckout" label="InitiateCheckout" />
                        <EventToggle name="trackPurchase" label="Purchase" />
                    </div>
                </div>
            </div>

            {/* Test Console */}
            <div className="bg-gray-900 text-white p-6 rounded-xl border border-gray-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        CAPI Test Console
                    </h4>
                    <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">v1.0 - Debug Mode</span>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={testCode} 
                        onChange={e => setTestCode(e.target.value)} 
                        placeholder="Enter Meta Test Event Code (TESTXXXXX)" 
                        className="flex-1 bg-black/50 border border-gray-700 rounded-lg p-2.5 text-xs font-mono outline-none focus:border-green-500 transition-colors text-white"
                    />
                    <button 
                        onClick={handleTestEvent}
                        disabled={testing || !settings.metaAccessToken}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 transition-all whitespace-nowrap"
                    >
                        {testing ? 'Sending...' : 'Fire Test Event'}
                    </button>
                </div>
                {!settings.metaAccessToken && <p className="text-[10px] text-red-400">Conversion API Token must be saved to test server-side events.</p>}
                <p className="text-[10px] text-gray-500 italic">Open Meta Events Manager {'>'} Data Sources {'>'} Test Events to see real-time results.</p>
            </div>
        </div>
    );
};

export default TrackingSettings;
