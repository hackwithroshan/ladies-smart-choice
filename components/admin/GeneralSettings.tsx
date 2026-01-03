
import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import StoreDetailsSettings from './StoreDetailsSettings';

const GeneralSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

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

    const updateMode = async (mode: 'standard' | 'magic') => {
        setSaving(true);
        const updated = { ...settings, checkoutMode: mode };
        setSettings(updated);
        try {
            await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updated)
            });
        } catch (e) { alert("Failed to save mode."); }
        finally { setSaving(false); }
    };

    if (loading) return <p>Loading Settings...</p>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">System Configuration</h2>
                {saving && <span className="text-xs font-bold text-blue-600 animate-pulse uppercase">Saving...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CHECKOUT STRATEGY SELECTOR */}
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Checkout Strategy</h3>
                    
                    <div className="space-y-4">
                        <button 
                            onClick={() => updateMode('standard')}
                            className={`w-full p-5 rounded-xl border-2 transition-all flex items-center justify-between text-left ${settings.checkoutMode === 'standard' ? 'border-[#16423C] bg-[#16423C]/5' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                            <div>
                                <p className="font-black text-gray-900">Standard Checkout</p>
                                <p className="text-xs text-gray-500 mt-1">Full control. Custom address form on your website.</p>
                            </div>
                            {settings.checkoutMode === 'standard' && <div className="w-5 h-5 bg-[#16423C] rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                        </button>

                        <button 
                            onClick={() => updateMode('magic')}
                            className={`w-full p-5 rounded-xl border-2 transition-all flex items-center justify-between text-left ${settings.checkoutMode === 'magic' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                            <div>
                                <p className="font-black text-gray-900">Razorpay Magic (Express)</p>
                                <p className="text-xs text-gray-500 mt-1">1-Click Checkout. No form on your website.</p>
                            </div>
                            {settings.checkoutMode === 'magic' && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
                        <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                            NOTE: In Magic Checkout mode, customer address and contact details are collected by Razorpay. These details may not be available for all transactions if the user skips them or uses an guest profile.
                        </p>
                    </div>
                </div>

                {/* OTHER SETTINGS */}
                <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-2">Store Status</h4>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Maintenance Mode</span>
                            <button
                                onClick={() => updateMode(settings.checkoutMode as any)} // Placeholder for general save
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isMaintenanceMode ? 'bg-amber-600' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isMaintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setIsStoreModalOpen(true)} className="w-full py-4 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-2xl border-2 border-gray-100 transition-all">
                        Edit Business Details
                    </button>
                </div>
            </div>

            {isStoreModalOpen && <StoreDetailsSettings token={token} onClose={() => setIsStoreModalOpen(false)} />}
        </div>
    );
};

export default GeneralSettings;
