
import React, { useState, useEffect } from 'react';
import { SiteSettings, SyncLog } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';
import { Button } from '../ui/button';
import { IndianRupee, Activity, Wand2, Package, Megaphone } from '../Icons';

const TrackingSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [testCode, setTestCode] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [sRes, lRes] = await Promise.all([
                    fetch(getApiUrl('/api/settings/site')),
                    fetch(getApiUrl('/api/catalog/sync-logs'), { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (sRes.ok) setSettings(await sRes.json());
                if (lRes.ok) setLogs(await lRes.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, [token]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch(getApiUrl('/api/catalog/generate-feeds'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) alert("Catalog Feed Regenerated! Meta will pick it up on the next crawl.");
        } catch (e) { alert("Sync failed."); }
        finally { setSyncing(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (res.ok) setFeedback({ type: 'success', message: 'Advanced Meta Config Saved!' });
        } catch (err) { setFeedback({ type: 'error', message: 'Update failed.' }); }
        finally { setSaving(false); setTimeout(() => setFeedback(null), 3000); }
    };

    const copyFeedUrl = () => {
        const url = `${window.location.origin}/feeds/meta-products.xml`;
        navigator.clipboard.writeText(url);
        alert("Feed URL copied! Use this in Facebook Commerce Manager.");
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Advanced Marketing...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight italic">Meta Ads Center</h3>
                    <p className="text-sm text-zinc-500 font-medium">Configure advanced catalog syncing and server-side tracking.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-zinc-900 text-white rounded-xl px-10 shadow-xl">
                    {saving ? 'Processing...' : 'Save Config'}
                </Button>
            </div>

            {feedback && <div className={`p-4 rounded-xl text-sm font-bold ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{feedback.message}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. API KEYS CARD */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Megaphone className="w-5 h-5" /></div>
                        <h4 className="font-bold text-zinc-900">Advanced API Integration</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Meta Pixel ID</label>
                            <input type="text" value={settings.metaPixelId || ''} onChange={e => setSettings({...settings, metaPixelId: e.target.value})} className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 1234567890" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Catalog ID (For Product Sync)</label>
                            <input type="text" value={settings.metaCatalogId || ''} onChange={e => setSettings({...settings, metaCatalogId: e.target.value})} className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 987654321" />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">CAPI Access Token (Advanced Server Tracking)</label>
                        <input type="password" value={settings.metaAccessToken || ''} onChange={e => setSettings({...settings, metaAccessToken: e.target.value})} className="w-full border rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="EAAB..." />
                        <p className="text-[10px] text-zinc-400 italic">This token enables tracking even when browser pixels are blocked by IOS or AdBlockers.</p>
                    </div>
                </div>

                {/* 2. CATALOG SYNC CARD */}
                <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 border-b pb-4 mb-6">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Package className="w-5 h-5" /></div>
                        <h4 className="font-bold text-zinc-900">Catalog Automations</h4>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                            <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Public XML Feed</p>
                            <button onClick={copyFeedUrl} className="w-full text-left bg-white border border-zinc-200 p-2 rounded text-[11px] font-mono truncate hover:bg-zinc-100 transition-colors">
                                {window.location.origin}/feeds/meta-products.xml
                            </button>
                        </div>

                        <Button 
                            onClick={handleSync} 
                            disabled={syncing} 
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        >
                            {syncing ? 'Generating...' : 'Regenerate Feed Now'}
                        </Button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-dashed">
                        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                            Tip: Setup a "Scheduled Feed" in Meta Commerce Manager using the URL above for 100% automated daily product updates.
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. EVENT DIAGNOSTICS CARD */}
            <div className="bg-zinc-900 text-white p-8 rounded-[2rem] shadow-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                        <h4 className="font-bold uppercase tracking-widest text-sm">CAPI Real-time Diagnostics</h4>
                    </div>
                    <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded">v2.0 ENGINE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">Verify your server-side tracking by entering a Test Event Code from your Meta Events Manager.</p>
                        <div className="flex gap-2">
                            <input type="text" value={testCode} onChange={e => setTestCode(e.target.value.toUpperCase())} className="flex-1 bg-black/50 border border-zinc-700 rounded-xl p-3 text-xs font-mono text-green-400 outline-none focus:border-green-500" placeholder="TEST12345" />
                            <Button className="bg-white text-zinc-900 px-6 rounded-xl font-black text-[10px] uppercase">Fire Test</Button>
                        </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-3">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Recent Sync Activity</p>
                        <div className="space-y-2 max-h-24 overflow-y-auto admin-scroll">
                            {logs.slice(0, 3).map((log, i) => (
                                <div key={i} className="flex justify-between text-[10px]">
                                    <span className="text-zinc-400">{new Date(log.timestamp).toLocaleString()}</span>
                                    <span className={log.status === 'success' ? 'text-green-400 font-bold' : 'text-red-400'}>
                                        {log.status.toUpperCase()} ({log.processedCount} items)
                                    </span>
                                </div>
                            ))}
                            {logs.length === 0 && <p className="text-[10px] text-zinc-600 italic">No sync logs available yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingSettings;
