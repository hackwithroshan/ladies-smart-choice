
import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { useToast } from '../../contexts/ToastContext';
import StoreDetailsSettings from './StoreDetailsSettings';

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

    const updateMode = async (mode: 'standard' | 'magic') => {
        if (saving) return;
        setSaving(true);
        
        const updatedData = { ...settings, checkoutMode: mode };
        
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
                showToast(`Checkout strategy set to ${mode === 'magic' ? 'Magic (1-Click)' : 'Standard'}`, 'success');
            } else {
                throw new Error("Failed to save");
            }
        } catch (e) { 
            showToast("Failed to update checkout strategy", "error"); 
        } finally { 
            setSaving(false); 
        }
    };

    const toggleMaintenance = async () => {
        const updated = { ...settings, isMaintenanceMode: !settings.isMaintenanceMode };
        try {
            const res = await fetch(getApiUrl('settings/site'), {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(updated)
            });
            if (res.ok) {
                setSettings(await res.json());
                showToast("Store status updated", "success");
            }
        } catch (e) {
            showToast("Failed to update store status", "error");
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
                {/* CHECKOUT STRATEGY SELECTOR */}
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-xl space-y-6">
                    <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-zinc-900 rounded-full"></div> Checkout Engine
                    </h3>
                    
                    <div className="space-y-4">
                        <button 
                            disabled={saving}
                            onClick={() => updateMode('standard')}
                            className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between text-left group ${settings.checkoutMode === 'standard' ? 'border-[#16423C] bg-[#16423C]/5' : 'border-zinc-100 hover:border-zinc-200'}`}
                        >
                            <div>
                                <p className={`font-black uppercase tracking-tighter italic text-lg ${settings.checkoutMode === 'standard' ? 'text-[#16423C]' : 'text-zinc-400'}`}>Standard Protocol</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mt-1">Address forms on website. Full control.</p>
                            </div>
                            {settings.checkoutMode === 'standard' && <div className="w-6 h-6 bg-[#16423C] rounded-full flex items-center justify-center shadow-lg"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg></div>}
                        </button>

                        <button 
                            disabled={saving}
                            onClick={() => updateMode('magic')}
                            className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between text-left group ${settings.checkoutMode === 'magic' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100 hover:border-zinc-200'}`}
                        >
                            <div>
                                <p className={`font-black uppercase tracking-tighter italic text-lg ${settings.checkoutMode === 'magic' ? 'text-blue-700' : 'text-zinc-400'}`}>Magic Checkout ✨</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mt-1">1-Click Express. No forms. Identity mapping.</p>
                            </div>
                            {settings.checkoutMode === 'magic' && <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg></div>}
                        </button>
                    </div>

                    <div className="mt-8 p-5 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4">
                        <svg className="w-6 h-6 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="text-[10px] text-amber-800 leading-relaxed font-black uppercase tracking-tight">
                            Critical: In Magic mode, checkout page is bypassed. Ensure Razorpay "Magic" is enabled in your Razorpay Dashboard Settings.
                        </p>
                    </div>
                </div>

                {/* STATUS & ACTIONS */}
                <div className="space-y-6">
                    <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-200 space-y-6">
                        <div className="flex items-center justify-between">
                             <div className="flex flex-col">
                                <h4 className="font-black text-zinc-900 uppercase italic text-sm tracking-tight">Store Status</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Toggle visibility for users</p>
                             </div>
                            <button
                                onClick={toggleMaintenance}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all shadow-inner ${settings.isMaintenanceMode ? 'bg-amber-600' : 'bg-emerald-500'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${settings.isMaintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="pt-4 border-t border-zinc-200 flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${settings.isMaintenanceMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                             <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-600">
                                {settings.isMaintenanceMode ? 'Currently in Maintenance Mode' : 'Storefront is Live and Accepting Orders'}
                             </span>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsStoreModalOpen(true)} className="w-full py-5 bg-white hover:bg-zinc-50 text-zinc-900 font-black uppercase tracking-[0.2em] text-xs rounded-[2rem] border-2 border-zinc-100 shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        Business Registry Details
                    </button>
                </div>
            </div>

            {isStoreModalOpen && <StoreDetailsSettings token={token} onClose={() => setIsStoreModalOpen(false)} />}
        </div>
    );
};

export default GeneralSettings;
