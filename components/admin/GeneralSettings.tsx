
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                <h2 className="text-3xl font-bold text-gray-800">General & Media</h2>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-medium text-white rounded-md shadow-sm" style={{ backgroundColor: COLORS.accent }}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
            {feedback && <div className={`p-3 rounded mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback.message}</div>}
            
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6 max-w-2xl">
                {/* Store Details Button */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="font-bold text-blue-800">Store Business Details</h3>
                        <p className="text-xs text-blue-700 mt-1">Manage your store name, address, contact info, and logo for invoices and emails.</p>
                    </div>
                    <button onClick={() => setIsStoreModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap">
                        Edit Store Details
                    </button>
                </div>

                {/* Typography */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Typography</h3>
                    <div>
                        <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700">Google Font Name</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input 
                                type="text" 
                                name="fontFamily" 
                                id="fontFamily" 
                                value={settings.fontFamily || 'Montserrat'} 
                                onChange={handleChange} 
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-rose-500 focus:border-rose-500 sm:text-sm" 
                                placeholder="e.g. Roboto, Open Sans, Poppins" 
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Enter the exact name of a font from <a href="https://fonts.google.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Fonts</a>. 
                            The website will automatically load and apply it.
                        </p>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Localization</h3>
                    <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Store Currency</label>
                        <select id="currency" name="currency" value={settings.currency || 'INR'} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md border">
                            <option>INR</option>
                            <option>USD</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">This is the main currency for your store.</p>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Media Settings</h3>
                    <div className="mt-4 flex items-center">
                        <input id="videoAutoplay" name="videoAutoplay" type="checkbox" checked={settings.videoAutoplay || false} onChange={handleChange} className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500" />
                        <label htmlFor="videoAutoplay" className="ml-3 block text-sm font-medium text-gray-700">
                            Enable Autoplay for Shop Videos
                        </label>
                    </div>
                     <p className="mt-1 text-xs text-gray-500">If enabled, videos on the homepage and product pages will play automatically (muted).</p>
                </div>
            </div>

            {isStoreModalOpen && (
                <StoreDetailsSettings 
                    token={token}
                    onClose={() => setIsStoreModalOpen(false)}
                />
            )}
        </div>
    );
};

export default GeneralSettings;
