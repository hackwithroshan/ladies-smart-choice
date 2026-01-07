
import React, { useState, useEffect } from 'react';
import { SiteSettings, SyncLog } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { Button } from '../ui/button';
import { Megaphone, Activity, Package } from '../Icons';

const TrackingSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);

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

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            alert('Meta Integration Live! All domains linked to this database will now fire events.');
        } catch (err) { alert('Save failed.'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="p-10 text-center">Configuring Multi-Domain Tracking...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-6">
                <div>
                    <h3 className="text-2xl font-black text-zinc-900 italic">Dynamic Meta Engine</h3>
                    <p className="text-sm text-zinc-500 font-medium">Domain Detect: <span className="font-bold text-blue-600">{window.location.hostname}</span></p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-zinc-900 text-white rounded-xl px-10">
                    {saving ? 'Activating...' : 'Activate Sync'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Megaphone className="w-5 h-5" /></div>
                        <h4 className="font-bold">Real-time CAPI Keys</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-zinc-400">Meta Pixel ID</label>
                            <input type="text" value={settings.metaPixelId || ''} onChange={e => setSettings({...settings, metaPixelId: e.target.value})} className="w-full border rounded-xl p-3 text-sm font-bold" placeholder="Pixel ID" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-zinc-400">CAPI Access Token</label>
                            <input type="password" value={settings.metaAccessToken || ''} onChange={e => setSettings({...settings, metaAccessToken: e.target.value})} className="w-full border rounded-xl p-3 text-sm font-mono" placeholder="EAAB..." />
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mt-1"></div>
                            <p className="text-[10px] text-emerald-800 font-bold leading-relaxed">
                                SERVER BRIDGE ACTIVE: Events will now bypass IOS 14 blocks and AdBlockers by sending data directly from {window.location.hostname} to Meta.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 bg-zinc-50 text-zinc-600 rounded-lg"><Package className="w-5 h-5" /></div>
                        <h4 className="font-bold">Product Catalog Sync</h4>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-400">Meta Catalog ID</label>
                        <input type="text" value={settings.metaCatalogId || ''} onChange={e => setSettings({...settings, metaCatalogId: e.target.value})} className="w-full border rounded-xl p-3 text-sm font-bold" placeholder="Catalog ID" />
                    </div>
                    <div className="bg-zinc-50 p-4 rounded-xl border">
                        <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Your Live Data Feed</p>
                        <code className="text-[10px] block break-all text-blue-600 font-bold">{window.location.origin}/feeds/meta-products.xml</code>
                    </div>
                    <p className="text-[10px] text-zinc-400 italic">This feed is dynamically generated. Meta Commerce Manager will use this URL to pull real-time inventory from any domain you point here.</p>
                </div>
            </div>
        </div>
    );
};

export default TrackingSettings;
