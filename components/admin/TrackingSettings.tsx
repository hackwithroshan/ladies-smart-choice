
import React, { useState, useEffect } from 'react';
import { SiteSettings, SyncLog } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Megaphone, Activity, Package, ArrowUpDown, Wand2, Store, SearchIcon } from '../Icons';
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
                fetch(getApiUrl('/api/settings/site')),
                fetch(getApiUrl('/api/catalog/sync-logs'), { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (sRes.ok) setSettings(await sRes.json());
            if (lRes.ok) setLogs(await lRes.json());
        } catch (e) { console.error("Fetch Error:", e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchMasterData();
    }, [token]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(settings)
            });
            if(res.ok) {
                alert('Success: Meta credentials saved to database.');
                await fetchMasterData();
            } else {
                const err = await res.json();
                alert(`Save Failed: ${err.message}`);
            }
        } catch (err) { alert('Network connection failed.'); }
        finally { setSaving(false); }
    };

    const handleSyncNow = async () => {
        if (!settings.metaAccessToken || !settings.metaCatalogId) {
            alert("Configuration Error: Please save your Catalog ID and Access Token before syncing.");
            return;
        }
        setSyncing(true);
        try {
            const res = await fetch(getApiUrl('/api/catalog/sync'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                alert(`SYNC COMPLETE: ${data.message}`);
            } else {
                alert(`META ERROR: ${data.message || 'Verification failed. Check your ID and Permissions.'}`);
            }
            await fetchMasterData();
        } catch (e) {
            alert("Request failed. Is the server running?");
        } finally {
            setSyncing(false);
        }
    };

    const runServerTest = async () => {
        if (!testCode) return alert("Please enter the test code from Meta Events Manager.");
        setTestLoading(true);
        setTestResult(null);
        try {
            const res = await fetch(getApiUrl('/api/analytics/track'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'TestEvent',
                    domain: window.location.hostname,
                    path: '/admin/tracking',
                    data: { test_event_code: testCode, note: 'Manual Admin Trigger' }
                })
            });
            if (res.ok) setTestResult({ status: 'success', message: 'Signal successfully dispatched to Meta. Check your Test Events tab.' });
            else setTestResult({ status: 'error', message: 'Failed to send signal. Verify Pixel ID and Token.' });
        } catch (e) { setTestResult({ status: 'error', message: 'Network failure during test signal.' }); }
        finally { setTestLoading(false); }
    };

    if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-zinc-400 tracking-widest italic">Initializing Bridge...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-6">
                <div>
                    <h3 className="text-2xl font-black text-zinc-900 italic uppercase tracking-tighter leading-none">Meta Commerce Integration</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-2 tracking-wide uppercase">Connect with Facebook & Instagram Catalog + Pixel</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving} variant="outline" className="font-black text-[10px] uppercase rounded-xl px-6 h-11 border-zinc-300">
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                    <Button onClick={handleSyncNow} disabled={syncing} className="bg-[#16423C] text-white font-black text-[10px] uppercase rounded-xl shadow-xl px-8 h-11 border-none hover:brightness-110 active:scale-95 transition-all">
                        {syncing ? 'Pushing Data...' : 'Sync Products Now'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-zinc-50 pb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl"><Megaphone className="w-5 h-5" /></div>
                        <h4 className="font-black uppercase italic text-sm tracking-tight text-zinc-800">Connection Keys</h4>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block">Meta Pixel ID</label>
                            <input type="text" value={settings.metaPixelId || ''} onChange={e => setSettings({...settings, metaPixelId: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3.5 text-sm font-bold focus:border-zinc-900 outline-none transition-all" placeholder="Enter Pixel ID" />
                        </div>
                        
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block">Meta Catalog ID</label>
                            <input type="text" value={settings.metaCatalogId || ''} onChange={e => setSettings({...settings, metaCatalogId: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3.5 text-sm font-black font-mono focus:border-zinc-900 outline-none transition-all bg-zinc-50/50" placeholder="Catalog ID from Commerce Manager" />
                            <p className="text-[9px] text-zinc-400 mt-2 italic font-medium leading-relaxed uppercase tracking-tight">Required for product syncing. Ensure this matches your Commerce Manager ID.</p>
                        </div>

                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block">Permanent Access Token</label>
                            <textarea value={settings.metaAccessToken || ''} onChange={e => setSettings({...settings, metaAccessToken: e.target.value})} className="w-full border border-zinc-200 rounded-xl p-3.5 text-xs font-mono focus:border-zinc-900 outline-none transition-all bg-zinc-50/50" rows={4} placeholder="EAAB..." />
                            <p className="text-[9px] text-zinc-400 mt-2 italic font-medium leading-relaxed uppercase tracking-tight">Found in Meta Business Suite &gt; Data Sources &gt; Pixel Settings.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl space-y-6 text-white overflow-hidden relative">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4 relative z-10">
                            <div className="p-3 bg-white text-zinc-900 rounded-2xl"><Activity className="w-5 h-5" /></div>
                            <h4 className="font-black uppercase italic text-sm tracking-tight">Signal Debugger</h4>
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                            <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed tracking-wide">
                                Enter your Meta "Test Event Code" to verify the server-to-server CAPI connection.
                            </p>
                            <div className="flex gap-2">
                                <input type="text" value={testCode} onChange={e => setTestCode(e.target.value.toUpperCase())} className="flex-1 border border-white/10 rounded-xl p-4 text-sm font-black bg-white/5 text-white outline-none tracking-widest uppercase" placeholder="e.g. TEST12345" />
                                <Button onClick={runServerTest} disabled={testLoading || !testCode} className="bg-white text-zinc-900 font-black text-[10px] uppercase rounded-xl h-auto px-6 border-none hover:bg-zinc-200">
                                    {testLoading ? 'Working...' : 'Test Signal'}
                                </Button>
                            </div>
                            {testResult && (
                                <div className={cn("p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest animate-in fade-in", testResult.status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400")}>
                                    {testResult.message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                        <div className="p-2 bg-blue-100 rounded-xl h-fit text-blue-600 shrink-0"><Store className="w-4 h-4" /></div>
                        <div>
                            <h5 className="text-[11px] font-black uppercase text-blue-900 italic mb-1 tracking-tight">Configuration Guide</h5>
                            <p className="text-[9px] text-blue-800 leading-relaxed font-medium uppercase opacity-70">
                                Your Access Token must belong to a "System User" with Admin permissions for the Catalog. If sync fails with "Object not found", check Catalog permissions in Business Suite.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-zinc-400" />
                        <h4 className="font-black uppercase italic text-xs text-zinc-900 tracking-widest">Catalog Sync Pulse</h4>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Last 5 Pushes</span>
                </div>
                <div className="divide-y divide-zinc-50">
                    {logs.length > 0 ? logs.map((log, i) => (
                        <div key={i} className="px-8 py-5 flex items-center justify-between group hover:bg-zinc-50/50 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className={cn("w-3 h-3 rounded-full border-2", log.status === 'success' ? 'bg-emerald-500 border-emerald-100' : 'bg-rose-500 border-rose-100')} />
                                <div>
                                    <p className="text-xs font-black uppercase text-zinc-900 italic">Push Request: {log.processedCount} Assets</p>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Status: {log.status} • {new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {log.status === 'success' ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-black uppercase px-2 py-0.5">Live Sync OK</Badge>
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
                            <p className="text-[10px] font-black uppercase text-zinc-300 italic tracking-widest">No sync transactions recorded in history.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingSettings;
