import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';

const PopupSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Local state for popup settings
    const [popupConfig, setPopupConfig] = useState<{
        isEnabled: boolean;
        image: string;
        link: string;
        mode: 'standard' | 'image_only';
    }>({
        isEnabled: false,
        image: '',
        link: '',
        mode: 'standard',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(getApiUrl('/api/settings/site'));
                if (res.ok) {
                    const data: SiteSettings = await res.json();
                    setSettings(data);
                    if (data.popupSettings) {
                        setPopupConfig({
                            isEnabled: data.popupSettings.isEnabled ?? false,
                            image: data.popupSettings.image ?? '',
                            link: data.popupSettings.link ?? '',
                            mode: data.popupSettings.mode ?? 'standard',
                        });
                    }
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const updatedSettings = {
                ...settings,
                popupSettings: popupConfig
            };

            const res = await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedSettings)
            });
            if (res.ok) {
                setFeedback({ type: 'success', message: 'Popup settings updated!' });
                setSettings(updatedSettings);
            } else {
                setFeedback({ type: 'error', message: 'Failed to update.' });
            }
        } catch (err) { setFeedback({ type: 'error', message: 'Failed to update.' }); }
        finally { setSaving(false); setTimeout(() => setFeedback(null), 4000); }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Popup Management</h2>
                    <p className="text-sm text-gray-500">Control the homepage popup/modal.</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all">
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
            {feedback && <div className={`p-4 rounded-lg text-sm font-bold ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{feedback.message}</div>}

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">

                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h4 className="font-bold text-gray-800">Enable Popup</h4>
                        <p className="text-sm text-gray-500">Toggle the popup visibility on homepage. (Default Off)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={popupConfig.isEnabled} onChange={e => setPopupConfig({ ...popupConfig, isEnabled: e.target.checked })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
                        <select
                            value={popupConfig.mode}
                            onChange={e => setPopupConfig({ ...popupConfig, mode: e.target.value as any })}
                            className="w-full border rounded-lg p-2.5"
                        >
                            <option value="standard">Standard (Side Image + Form)</option>
                            <option value="image_only">Image Only (No Form)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Standard uses your image on the left side. Image Only replaces the entire popup content.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image Link (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. /collections/clearance"
                            value={popupConfig.link}
                            onChange={e => setPopupConfig({ ...popupConfig, link: e.target.value })}
                            className="w-full border rounded-lg p-2.5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Clicking the image will take the user to this URL.</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Popup Image</label>
                    <MediaPicker
                        value={popupConfig.image}
                        onChange={url => setPopupConfig({ ...popupConfig, image: url })}
                        type="image"
                    />
                    <p className="text-xs text-gray-500 mt-1">Required for Image Only mode. Optional for Standard mode (replaces default green side panel).</p>
                </div>

            </div>
        </div>
    );
};

export default PopupSettings;
