import React, { useState, useEffect } from 'react';
import { SiteSettings, SyncLog } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { Button } from '../ui/button';
// Added missing Badge import
import { Badge } from '../ui/badge';
import { Megaphone, Activity, Package, ArrowUpDown, Wand2, Store, SearchIcon } from '../Icons';
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
            if (sRes.ok) setSettings(await res.json());
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
            const res = await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if(res.ok) alert('Meta Integration settings saved!');
        } catch (err) { alert('Save failed.'); }
        finally { setSaving(false); }
    };

    const handleSyncNow = async () => {
        if (!settings.metaAccessToken || !settings.metaCatalogId) {
            alert("Configuration Missing: Please ensure both Access Token and Catalog ID are saved.");
            return;
        }
        setSyncing(true);
        try {
            const res = await fetch(getApiUrl('/api/catalog/sync'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok) {
                alert(`Success: ${data.processed} products synced to Meta Catalog.`);
            } else {
                // Specific error handling for the "Object ID not found" error
                if (data.message?.includes('Object with ID')) {
                    alert("META ERROR: The Catalog ID you entered is invalid or your Token doesn't have permission to access it. Please verify the ID in Commerce Manager.");
                } else {
                    alert(`Sync Failed: ${data.message}`);
                }
            }
            fetchAll();
        } catch (e) {
            alert("Network request failed. Check server logs.");
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

    if (loading) return (
        <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
            <p className="font-black uppercase italic text-zinc-400 tracking-widest text-[10px]">Initializing Meta Bridge...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-6">
                <div>
                    <h3 className="text-2xl font-black text-zinc-900 italic uppercase tracking-tighter leading-none">Meta Commerce Engine</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-2">Active Domain Mapping: <span className="font-bold text-[#16423C]">{window.location.hostname}</span></p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving} variant="outline" className="border-zinc-200 font-black text-[10px] uppercase rounded-xl px-6 h-11">
                        {saving ? 'Syncing DB...' : 'Save Config'}
                    </Button>
                    <Button onClick={handleSyncNow} disabled={syncing} className="bg-[#16423C] text-white font-black text-[10px] uppercase rounded-xl shadow-xl px-8 h-11 border-none hover:brightness-110">
                        {syncing ? 'Pushing to Meta...' : 'Sync Products Now'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Credentials */}
                <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-8 flex flex-col h-full">
                    <div className="flex items-center gap-4 border-b border-zinc-50 pb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shadow-sm"><Megaphone className="w-5 h-5" /></div>
                        <div>
                            <h4 className="font-black uppercase italic text-sm tracking-tight">API Infrastructure</h4>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Pixel & Conversion API (CAPI)</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6 flex-1">
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block group-focus-within:text-zinc-900 transition-colors">Meta Pixel ID</label>
                            <input type="text" value={settings.metaPixelId || ''} onChange={e => setSettings({...settings, metaPixelId: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100 transition-all" placeholder="Enter Pixel ID" />
                        </div>
                        
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block group-focus-within:text-zinc-900 transition-colors">Meta Catalog ID</label>
                            <input type="text" value={settings.metaCatalogId || ''} onChange={e => setSettings({...settings, metaCatalogId: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3.5 text-sm font-black font-mono outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100 transition-all bg-zinc-50/30" placeholder="Required for Catalog Sync" />
                            <p className="text-[9px] text-zinc-400 mt-2 italic font-medium leading-relaxed uppercase">
                                Find this in Meta Commerce Manager Settings. Ensure your ID matches the Catalog and NOT the Business ID.
                            </p>
                        </div>

                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block group-focus-within:text-zinc-900 transition-colors">Permanent Access Token</label>
                            <input type="password" value={settings.metaAccessToken || ''} onChange={e => setSettings({...settings, metaAccessToken: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3.5 text-xs font-mono outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100 transition-all bg-zinc-50/30" placeholder="EAAB..." />
                        </div>

                        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4 mt-4">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse mt-1 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <p className="text-[10px] text-emerald-800 font-bold leading-relaxed uppercase italic">
                                Domain auto-validation is active. CAPI events will fire with high matching scores using browser first-party cookies (_fbp, _fbc).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Developer Tools / Troubleshooting */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl space-y-6 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                            <Wand2 className="w-40 h-40" />
                        </div>
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4 relative z-10">
                            <div className="p-3 bg-white text-zinc-900 rounded-2xl shadow-sm"><Activity className="w-5 h-5" /></div>
                            <div>
                                <h4 className="font-black uppercase italic text-sm tracking-tight">Signal Debugger</h4>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Real-time CAPI Validation</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                            <p className="text-[11px] text-zinc-400 font-bold uppercase leading-relaxed tracking-wide">
                                1. Go to Meta Events Manager<br/>
                                2. Select <span className="text-white">"Test Events"</span> tab<br/>
                                3. Copy <span className="text-emerald-400">"Test Event Code"</span> and paste below
                            </p>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={testCode}
                                    onChange={e => setTestCode(e.target.value.toUpperCase())}
                                    className="flex-1 border border-white/10 rounded-xl p-4 text-sm font-black tracking-widest uppercase outline-none focus:bg-white/5 bg-white/5 text-white transition-all" 
                                    placeholder="e.g. TEST12345" 
                                />
                                <Button 
                                    onClick={runServerTest} 
                                    disabled={testLoading || !testCode}
                                    className="bg-white text-zinc-900 font-black text-[10px] uppercase rounded-xl h-auto px-8 border-none hover:bg-zinc-200"
                                >
                                    {testLoading ? 'Sending...' : 'Trigger'}
                                </Button>
                            </div>

                            {testResult && (
                                <div className={cn(
                                    "p-4 rounded-2xl border text-[10px] font-black uppercase tracking-tight animate-in fade-in slide-in-from-top-2",
                                    testResult.status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                )}>
                                    {testResult.message}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Guide Card */}
                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                        <div className="p-2 bg-blue-100 rounded-xl h-fit text-blue-600 shrink-0"><Store className="w-4 h-4" /></div>
                        <div>
                            <h5 className="text-[11px] font-black uppercase text-blue-900 italic tracking-tight mb-1">Permission Requirements</h5>
                            <p className="text-[10px] text-blue-800 leading-relaxed font-medium uppercase opacity-70">
                                Ensure your Access Token belongs to a System User with 'Admin' access to the Catalog. Regular user tokens may result in "Object not found" errors.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sync Activity Monitor */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-zinc-400" />
                        <h4 className="font-black uppercase italic text-xs text-zinc-900 tracking-widest">Catalog Sync Pulse</h4>
                    </div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Last 5 Attempts</span>
                </div>
                <div className="divide-y divide-zinc-50">
                    {logs.length > 0 ? logs.map((log, i) => (
                        <div key={i} className="px-8 py-5 flex items-center justify-between group hover:bg-zinc-50/50 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-3 h-3 rounded-full border-2", 
                                    log.status === 'success' ? 'bg-emerald-500 border-emerald-100' : 'bg-rose-500 border-rose-100'
                                )} />
                                <div>
                                    <p className="text-xs font-black uppercase text-zinc-900 italic">Push Request: {log.processedCount} SKUs</p>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Processed: {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {log.status === 'success' ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-black uppercase px-2 py-0.5">Verified</Badge>
                                ) : (
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-100 text-[9px] font-black uppercase px-2 py-0.5">Rejected</Badge>
                                        <p className="text-[9px] font-black text-rose-500 uppercase italic max-w-[250px] truncate">{log.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center flex flex-col items-center gap-3">
                            <SearchIcon className="w-8 h-8 text-zinc-200" />
                            <p className="text-[10px] font-black uppercase text-zinc-300 italic tracking-widest">No sync transactions found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingSettings;