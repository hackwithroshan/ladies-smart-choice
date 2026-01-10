import React, { useState, useEffect } from 'react';
import { SiteSettings, SyncLog } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Megaphone, Activity, Store, SearchIcon, IndianRupee, ShoppingCart, Zap, Eye } from '../Icons';
import { cn } from '../../utils/utils';

const TrackingSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    
    const [testCode, setTestCode] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<{status: string, message: string} | null>(null);

    const fetchMasterData = async () => {
        try {
            const [sRes, lRes] = await Promise.all([
                fetch(getApiUrl('settings/site')),
                fetch(getApiUrl('catalog/sync-logs'), { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (sRes.ok) setSettings(await sRes.json());
            if (lRes.ok) setLogs(await lRes.json());
        } catch (e) { console.error("Fetch Error:", e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchMasterData();
    }, [token]);

    const handleToggle = (key: keyof SiteSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(getApiUrl('settings/site'), {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(settings)
            });
            if(res.ok) {
                alert('Success: Tracking configuration updated.');
                await fetchMasterData();
            }
        } catch (err) { alert('Network connection failed.'); }
        finally { setSaving(false); }
    };

    const handleSyncNow = async () => {
        if (!settings.metaAccessToken || !settings.metaCatalogId) {
            alert("Configuration Error: Please save your Catalog ID and Access Token first.");
            return;
        }
        setSyncing(true);
        try {
            const res = await fetch(getApiUrl('catalog/sync'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) alert(`SYNC COMPLETE: ${data.message}`);
            else alert(`META ERROR: ${data.message}`);
            await fetchMasterData();
        } catch (e) { alert("Request failed."); }
        finally { setSyncing(false); }
    };

    const runServerTest = async () => {
        if (!testCode) return alert("Enter test code from Events Manager.");
        setTestLoading(true);
        setTestResult(null);
        try {
            const res = await fetch(getApiUrl('analytics/track'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'TestEvent',
                    domain: window.location.hostname,
                    path: '/admin/tracking',
                    data: { test_event_code: testCode, note: 'Manual Admin Trigger' }
                })
            });
            if (res.ok) setTestResult({ status: 'success', message: 'Signal successfully dispatched to Meta.' });
            else setTestResult({ status: 'error', message: 'Failed to send signal.' });
        } catch (e) { setTestResult({ status: 'error', message: 'Network failure.' }); }
        finally { setTestLoading(false); }
    };

    if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-zinc-400">Initializing...</div>;

    const EventToggle = ({ label, icon: Icon, settingKey, description }: any) => (
        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
            <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-lg transition-colors", settings[settingKey] ? "bg-white text-zinc-900 shadow-sm" : "bg-zinc-200/50 text-zinc-400")}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-[11px] font-black uppercase text-zinc-900 tracking-tight">{label}</p>
                    <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">{description}</p>
                </div>
            </div>
            <button
                onClick={() => handleToggle(settingKey)}
                className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-all",
                    settings[settingKey] ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-zinc-300"
                )}
            >
                <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings[settingKey] ? "translate-x-5" : "translate-x-1")} />
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-6">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black text-zinc-900 italic uppercase tracking-tighter leading-none">Meta Performance Hub</h3>
                    <p className="text-[10px] text-zinc-500 font-bold mt-2 tracking-[0.2em] uppercase">Browser Pixel + Server-Side CAPI + Catalog Sync</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving} variant="outline" className="font-black text-[10px] uppercase rounded-xl h-11 px-6 border-zinc-200">
                        {saving ? 'Syncing Config...' : 'Update Settings'}
                    </Button>
                    <Button onClick={handleSyncNow} disabled={syncing} className="bg-[#16423C] text-white font-black text-[10px] uppercase rounded-xl shadow-xl px-8 h-11">
                        {syncing ? 'Pushing Data...' : 'Sync Catalog Now'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SETTINGS COLUMN */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 border-b border-zinc-50 pb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl"><Megaphone className="w-5 h-5" /></div>
                            <h4 className="font-black uppercase italic text-sm tracking-tight text-zinc-800">Connection Engine</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest ml-1">Meta Pixel ID</label>
                                <input type="text" value={settings.metaPixelId || ''} onChange={e => setSettings({...settings, metaPixelId: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3.5 text-sm font-bold focus:border-zinc-900 outline-none" placeholder="Pixel ID" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest ml-1">Catalog ID</label>
                                <input type="text" value={settings.metaCatalogId || ''} onChange={e => setSettings({...settings, metaCatalogId: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3.5 text-sm font-black font-mono focus:border-zinc-900 outline-none bg-zinc-50/50" placeholder="Catalog ID" />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest ml-1">Conversion API Access Token</label>
                                <textarea value={settings.metaAccessToken || ''} onChange={e => setSettings({...settings, metaAccessToken: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3.5 text-xs font-mono focus:border-zinc-900 outline-none bg-zinc-50/50" rows={3} placeholder="EAAB..." />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-4 border-b border-zinc-50 pb-4">
                            <div className="p-3 bg-zinc-900 text-white rounded-2xl"><Zap className="w-5 h-5" /></div>
                            <h4 className="font-black uppercase italic text-sm tracking-tight text-zinc-800">Managed Active Signals</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <EventToggle label="PageView" icon={Eye} settingKey="trackPageView" description="Universal Traffic" />
                            <EventToggle label="ViewContent" icon={Zap} settingKey="trackViewContent" description="PDP Impressions" />
                            <EventToggle label="AddToCart" icon={ShoppingCart} settingKey="trackAddToCart" description="Intent Signals" />
                            <EventToggle label="InitiateCheckout" icon={ IndianRupee } settingKey="trackInitiateCheckout" description="Payment Starts" />
                            {/* Fixed typo: changed indianRupee to IndianRupee */}
                            <EventToggle label="Purchase" icon={IndianRupee} settingKey="trackPurchase" description="Successful Revenue" />
                        </div>
                    </div>
                </div>

                {/* DEBUGGER COLUMN */}
                <div className="space-y-8">
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl space-y-6 text-white">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                            <div className="p-3 bg-white text-zinc-900 rounded-2xl"><Activity className="w-5 h-5" /></div>
                            <h4 className="font-black uppercase italic text-sm tracking-tight">Signal Debugger</h4>
                        </div>
                        <div className="space-y-6">
                            <input type="text" value={testCode} onChange={e => setTestCode(e.target.value.toUpperCase())} className="w-full border border-white/10 rounded-xl p-4 text-sm font-black bg-white/5 text-white outline-none tracking-widest uppercase" placeholder="TEST EVENT CODE" />
                            <Button onClick={runServerTest} disabled={testLoading || !testCode} className="w-full bg-white text-zinc-900 font-black text-[10px] uppercase rounded-xl h-12 shadow-xl border-none">
                                {testLoading ? 'Dispatched...' : 'Send Test Signal'}
                            </Button>
                            {testResult && (
                                <div className={cn("p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest", testResult.status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400")}>
                                    {testResult.message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
                        <h5 className="text-[10px] font-black uppercase text-zinc-900 mb-4 tracking-widest">Recent Activity Logs</h5>
                        <div className="space-y-4">
                            {logs.slice(0, 3).map((log, i) => (
                                <div key={i} className="flex gap-3 items-start border-l-2 border-zinc-200 pl-4 py-1">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-zinc-800">{log.service}</p>
                                        <p className="text-[9px] font-bold text-zinc-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                    <Badge variant="outline" className={cn("ml-auto text-[8px] font-black", log.status === 'success' ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50")}>{log.status}</Badge>
                                </div>
                            ))}
                            {logs.length === 0 && <p className="text-[9px] font-bold text-zinc-400 italic">No activity recorded.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingSettings;