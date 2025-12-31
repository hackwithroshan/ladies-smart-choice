import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';
import StoreDetailsSettings from './StoreDetailsSettings';

const GeneralSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await fetch(getApiUrl('/api/settings/site'));
                if (res.ok) {
                    setSettings(await res.json());
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setSettings(prev => ({ ...prev, [name]: val }));
    };

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error('Failed to save settings');
            setFeedback({ type: 'success', message: 'General settings saved successfully!' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    if (loading) return <p>Loading general settings...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">General & Checkout</h2>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-all transform hover:scale-105" style={{ backgroundColor: COLORS.accent }}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
            {feedback && <div className={`p-3 rounded mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-800'}`}>{feedback.message}</div>}
            
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6 max-w-2xl border border-gray-100">
                
                {/* Checkout Experience Section */}
                <div className="bg-rose-50 p-5 rounded-xl border border-rose-200 space-y-4">
                    <h3 className="font-bold text-rose-900 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Checkout Experience
                    </h3>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-rose-800">Razorpay Magic Checkout</p>
                            <p className="text-xs text-rose-700">Enable 1-click checkout with automatic address collection.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, isMagicCheckoutEnabled: !prev.isMagicCheckoutEnabled }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isMagicCheckoutEnabled ? 'bg-rose-600' : 'bg-gray-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isMagicCheckoutEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-rose-100">
                        <div>
                            <p className="text-sm font-bold text-rose-800">Cash on Delivery (COD)</p>
                            <p className="text-xs text-rose-700">Allow customers to pay at the time of delivery.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, isCodEnabled: !prev.isCodEnabled }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isCodEnabled ? 'bg-rose-600' : 'bg-gray-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isCodEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Maintenance Mode */}
                <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Maintenance Mode
                            </h3>
                            <p className="text-xs text-amber-700 mt-1">Hide website from public customers while you work.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, isMaintenanceMode: !prev.isMaintenanceMode }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isMaintenanceMode ? 'bg-amber-600' : 'bg-gray-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isMaintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Store Details */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="font-bold text-blue-900">Store Business Details</h3>
                        <p className="text-xs text-blue-700 mt-1">Manage your store name, address, and invoicing details.</p>
                    </div>
                    <button onClick={() => setIsStoreModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap">
                        Edit Details
                    </button>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">WhatsApp Integration</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                            <input type="text" name="whatsappNumber" value={settings.whatsappNumber || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-rose-500" placeholder="e.g. 919876543210"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Welcome Message</label>
                            <input type="text" name="whatsappMessage" value={settings.whatsappMessage || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-rose-500" placeholder="Hi, I have a query..."/>
                        </div>
                    </div>
                </div>
            </div>

            {isStoreModalOpen && <StoreDetailsSettings token={token} onClose={() => setIsStoreModalOpen(false)} />}
        </div>
    );
};

export default GeneralSettings;