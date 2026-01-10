
import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { useToast } from '../../contexts/ToastContext';
import StoreDetailsSettings from './StoreDetailsSettings';
import { Badge } from '../ui/badge';
import { cn } from '../../utils/utils';

const GeneralSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(getApiUrl('settings/site'));
                if (res.ok) setSettings(await res.json());
            } catch (e) { 
                console.error(e); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchSettings();
    }, []);

    const updateSetting = async (key: keyof SiteSettings, value: any) => {
        setSaving(true);
        const updatedData = { ...settings, [key]: value };
        try {
            const res = await fetch(getApiUrl('settings/site'), {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(updatedData)
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                showToast(`Setting updated successfully`, 'success');
            }
        } catch (e) { 
            showToast("Failed to update settings", "error"); 
        } finally { 
            setSaving(false); 
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-zinc-400 font-bold uppercase tracking-widest">Loading Configuration...</div>;

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">System Configuration</h2>
                {saving && <span className="text-[10px] font-black text-blue-600 animate-pulse uppercase tracking-widest italic">Synchronizing...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* LEFT COLUMN: CORE CHECKOUT & POPUP */}
                <div className="space-y-10">
                    <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-xl space-y-6">
                        <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-zinc-900 rounded-full"></div> Checkout Engine
                        </h3>
                        
                        <div className="space-y-4">
                            <button 
                                disabled={saving}
                                onClick={() => updateSetting('checkoutMode', 'standard')}
                                className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between text-left group ${settings.checkoutMode === 'standard' ? 'border-[#16423C] bg-[#16423C]/5' : 'border-zinc-100 hover:border-zinc-200'}`}
                            >
                                <div>
                                    <p className={`font-black uppercase tracking-tighter italic text-lg ${settings.checkoutMode === 'standard' ? 'text-[#16423C]' : 'text-zinc-400'}`}>Standard Protocol</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mt-1">Direct website address collection.</p>
                                </div>
                                {settings.checkoutMode === 'standard' && <div className="w-6 h-6 bg-[#16423C] rounded-full flex items-center justify-center shadow-lg"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg></div>}
                            </button>

                            <button 
                                disabled={saving}
                                onClick={() => updateSetting('checkoutMode', 'magic')}
                                className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between text-left group ${settings.checkoutMode === 'magic' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100 hover:border-zinc-200'}`}
                            >
                                <div>
                                    <p className={`font-black uppercase tracking-tighter italic text-lg ${settings.checkoutMode === 'magic' ? 'text-blue-700' : 'text-zinc-400'}`}>Magic Checkout ✨</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mt-1">1-Click Express Identity Mapping.</p>
                                </div>
                                {settings.checkoutMode === 'magic' && <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg></div>}
                            </button>
                        </div>
                    </div>

                    {/* NEW MARKETING POPUP CONTROL */}
                    <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-xl space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div> Marketing Logic
                                </h3>
                                <h4 className="font-black text-zinc-900 uppercase italic text-sm tracking-tight mt-2">Conversion Popup</h4>
                            </div>
                            <button
                                onClick={() => updateSetting('showSmartPopup', !settings.showSmartPopup)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all shadow-inner ${settings.showSmartPopup ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${settings.showSmartPopup ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-zinc-50">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Popup Delay (Seconds)</label>
                                <span className="text-xs font-black text-indigo-600">{settings.popupDelay || 15}s</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="120" 
                                value={settings.popupDelay || 15} 
                                onChange={(e) => updateSetting('popupDelay', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <p className="text-[9px] text-zinc-400 font-medium leading-relaxed italic">
                                The "Ladies Choice" popup captures leads by offering a 10% discount. 
                                Default is disabled. Enable to activate the lead generation engine.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: MAINTENANCE & REGISTRY */}
                <div className="space-y-10">
                    {/* MAINTENANCE MODE */}
                    <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 shadow-2xl space-y-6 text-white">
                        <div className="flex items-center justify-between">
                             <div className="flex flex-col">
                                <h4 className="font-black text-white uppercase italic text-sm tracking-tight">Store Visibility</h4>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase">Toggle Global Access</p>
                             </div>
                            <button
                                onClick={() => updateSetting('isMaintenanceMode', !settings.isMaintenanceMode)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all shadow-inner ${settings.isMaintenanceMode ? 'bg-amber-600' : 'bg-emerald-500'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${settings.isMaintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${settings.isMaintenanceMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                             <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">
                                {settings.isMaintenanceMode ? 'System Offline (Admin only)' : 'Storefront is Live'}
                             </span>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsStoreModalOpen(true)} className="w-full py-8 bg-white hover:bg-zinc-50 text-zinc-900 font-black uppercase tracking-[0.3em] text-[10px] rounded-[2rem] border-2 border-zinc-100 shadow-xl transition-all transform active:scale-[0.98] flex flex-col items-center gap-4 group">
                        <div className="p-4 bg-zinc-50 rounded-full group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        Official Business Registry
                    </button>
                </div>
            </div>

            {isStoreModalOpen && <StoreDetailsSettings token={token} onClose={() => setIsStoreModalOpen(false)} />}
        </div>
    );
};

export default GeneralSettings;
