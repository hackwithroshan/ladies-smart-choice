import React, { useState, useEffect } from 'react';
import { SiteSettings, SyncLog } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { Button } from '../ui/button';
import { Megaphone, Activity, Package, ArrowUpDown, Wand2, Store } from '../Icons';
import { cn } from '../../utils/utils';

const TrackingSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    
    // Test Tool State
    const [testCode, setTestCode] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<{status: string, message: string} | null>(null);

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

    useEffect(() => {
        fetchAll();
    }, [token]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            alert('Meta Integration settings saved!');
        } catch (err) { alert('Save failed.'); }
        finally { setSaving(false); }
    };

    const handleSyncNow = async () => {
        if (!settings.metaAccessToken || !settings.metaCatalogId) {
            alert("Please save Meta Access Token and Catalog ID first.");
            return;
        }
        setSyncing(true);
        try {
            const res = await fetch(getApiUrl('/api/catalog/sync'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            alert(data.message);
            fetchAll();
        } catch (e) {
            alert("Sync request failed.");
        } finally {
            setSyncing(false);
        }
    };

    const runServerTest = async () => {
        if (!testCode) return alert("Please enter the Test Event Code from Meta Events Manager.");
        setTestLoading(true);
        setTestResult(null);
        try {
            const res = await fetch(getApiUrl('/api/analytics/track'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'TestEvent',
                    domain: window.location.hostname,
                    path: '/admin/test',
                    eventId: `test_${Date.now()}`,
                    data: { test_event_code: testCode, note: "Admin Manual Test" }
                })
            });
            if (res.ok) {
                setTestResult({ status: 'success', message: 'Test signal dispatched to Meta Server. Check your Events Manager "Test Events" tab.' });
            } else {
                setTestResult({ status: 'error', message: 'Server responded with an error. Check API credentials.' });
            }
        } catch (e) {
            setTestResult({ status: 'error', message: 'Network failure during test trigger.' });
        } finally {
            setTestLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-black uppercase italic text-zinc-400 animate-pulse tracking-widest uppercase">Configuring Meta Bridge...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-6">
                <div>
                    <h3 className="text-2xl font-black text-zinc-900 italic uppercase tracking-tighter">Meta Commerce Engine</h3>
                    <p className="text-sm text-zinc-500 font-medium">Domain Detect: <span className="font-bold text-[#16423C]">{window.location.hostname}</span></p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving} variant="outline" className="border-zinc-200 font-black text-[10px] uppercase rounded-xl">
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                    <Button onClick={handleSyncNow} disabled={syncing} className="bg-[#16423C] text-white font-black text-[10px] uppercase rounded-xl shadow-xl px-8">
                        {syncing ? 'Pushing Data...' : 'Sync Products Now'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Credentials */}
                <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-50 pb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Megaphone className="w-5 h-5" /></div>
                        <h4 className="font-black uppercase italic text-sm">Real-time CAPI & Pixel</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1 block">Meta Pixel ID</label>
                            <input type="text" value={settings.metaPixelId || ''} onChange={e => setSettings({...settings, metaPixelId: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-zinc-900" placeholder="Pixel ID" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1 block">System User Access Token</label>
                            <input type="password" value={settings.metaAccessToken || ''} onChange={e => setSettings({...settings, metaAccessToken: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3 text-sm font-mono outline-none focus:border-zinc-900" placeholder="EAAB..." />
                        </div>
                        
                        {/* New Catalog ID Field */}
                        <div className="pt-2 border-t border-zinc-50">
                            <div className="flex items-center gap-2 mb-1">
                                <Store className="w-3 h-3 text-zinc-400" />
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block">Meta Catalog ID (Shopify/Instagram Store)</label>
                            </div>
                            <input type="text" value={settings.metaCatalogId || ''} onChange={e => setSettings({...settings, metaCatalogId: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3 text-sm font-black font-mono outline-none focus:border-zinc-900 bg-zinc-50/30" placeholder="Catalog ID Number" />
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mt-1"></div>
                            <p className="text-[10px] text-emerald-800 font-bold leading-relaxed uppercase italic">
                                Server-Side CAPI is active. All events from {window.location.hostname} will fire with deduplication ID.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Server Connectivity Test Tool */}
                <div className="bg-[#f8fafc] p-8 rounded-3xl border-2 border-dashed border-zinc-200 shadow-inner space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
                        <div className="p-2 bg-zinc-900 text-white rounded-lg"><Wand2 className="w-5 h-5" /></div>
                        <h4 className="font-black uppercase italic text-sm">CAPI Connectivity Test</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">
                            Verify if your server is talking to Meta. Go to <span className="text-blue-600 underline">Events Manager &gt; Test Events</span>, copy the "TEST CODE" and paste it here.
                        </p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={testCode}
                                onChange={e => setTestCode(e.target.value)}
                                className="flex-1 border border-zinc-300 rounded-xl p-3 text-sm font-black tracking-widest uppercase outline-none focus:border-zinc-900 bg-white" 
                                placeholder="e.g. TEST12345" 
                            />
                            <Button 
                                onClick={runServerTest} 
                                disabled={testLoading || !testCode}
                                className="bg-zinc-900 text-white font-black text-[10px] uppercase rounded-xl h-auto"
                            >
                                {testLoading ? 'Testing...' : 'Trigger Test'}
                            </Button>
                        </div>

                        {testResult && (
                            <div className={cn(
                                "p-4 rounded-2xl border text-[11px] font-bold animate-in fade-in slide-in-from-top-2",
                                testResult.status === 'success' ? "bg-green-50 border-green-100 text-green-700" : "bg-rose-50 border-rose-100 text-rose-700"
                            )}>
                                {testResult.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sync Logs */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
                    <h4 className="font-black uppercase italic text-xs text-zinc-600">Recent Catalog Sync Activity</h4>
                    <Activity className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="divide-y divide-zinc-50">
                    {logs.length > 0 ? logs.map((log, i) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between group hover:bg-zinc-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-2 h-2 rounded-full", log.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]')} />
                                <div>
                                    <p className="text-[11px] font-black uppercase text-zinc-900">Push Attempt: {log.processedCount} Products</p>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            {log.error && <p className="text-[9px] font-black text-rose-500 uppercase italic max-w-[200px] truncate">{log.error}</p>}
                        </div>
                    )) : (
                        <div className="p-10 text-center text-[10px] font-black uppercase text-zinc-300 italic">No sync history recorded.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingSettings;