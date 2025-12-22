
import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';

const BrandingSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setFeedback({ type: 'success', message: 'Brand Identity updated! Please refresh to see changes.' });
                // --- Fix: Using primaryColor and accentColor directly now that they are in SiteSettings interface ---
                document.documentElement.style.setProperty('--brand-primary', settings.primaryColor || '#16423C');
                document.documentElement.style.setProperty('--brand-accent', settings.accentColor || '#6A9C89');
            }
        } catch (err) { setFeedback({ type: 'error', message: 'Failed to update.' }); }
        finally { setSaving(false); setTimeout(() => setFeedback(null), 4000); }
    };

    if (loading) return <div>Loading Brand settings...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Rebranding Center</h3>
                    <p className="text-sm text-gray-500">Change your brand name, colors, and fonts globally.</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-[#16423C] text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all">
                    {saving ? 'Applying...' : 'Apply Rebranding'}
                </button>
            </div>

            {feedback && <div className={`p-4 rounded-lg text-sm font-bold ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{feedback.message}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Identity */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <h4 className="font-bold text-gray-700 uppercase tracking-widest text-xs border-b pb-2">Visual Identity</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                        {/* --- Fix: Removed any cast from storeName --- */}
                        <input type="text" name="storeName" value={settings.storeName || ''} onChange={handleChange} className="w-full border rounded-lg p-2.5" placeholder="e.g. Ayushree Ayurveda" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Brand Color</label>
                            <div className="flex gap-2">
                                {/* --- Fix: Using primaryColor property from interface --- */}
                                <input type="color" name="primaryColor" value={settings.primaryColor || '#16423C'} onChange={handleChange} className="h-10 w-12 rounded cursor-pointer" />
                                <input type="text" name="primaryColor" value={settings.primaryColor || ''} onChange={handleChange} className="flex-1 border rounded-lg p-2 text-sm font-mono" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                            <div className="flex gap-2">
                                {/* --- Fix: Using accentColor property from interface --- */}
                                <input type="color" name="accentColor" value={settings.accentColor || '#6A9C89'} onChange={handleChange} className="h-10 w-12 rounded cursor-pointer" />
                                <input type="text" name="accentColor" value={settings.accentColor || ''} onChange={handleChange} className="flex-1 border rounded-lg p-2 text-sm font-mono" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Font (Google Font Name)</label>
                        <input type="text" name="fontFamily" value={settings.fontFamily || ''} onChange={handleChange} className="w-full border rounded-lg p-2.5" placeholder="e.g. Playfair Display" />
                        <p className="text-[10px] text-gray-400 mt-1 italic">Type the exact name from fonts.google.com</p>
                    </div>
                </div>

                {/* Assets */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <h4 className="font-bold text-gray-700 uppercase tracking-widest text-xs border-b pb-2">Brand Assets</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Main Logo (Header)</label>
                        {/* --- Fix: Removed any cast from logoUrl --- */}
                        <MediaPicker value={settings.logoUrl || ''} onChange={url => setSettings(prev => ({...prev, logoUrl: url}))} type="image" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Favicon (Browser Icon)</label>
                        {/* --- Fix: Removed any cast from faviconUrl --- */}
                        <MediaPicker value={settings.faviconUrl || ''} onChange={url => setSettings(prev => ({...prev, faviconUrl: url}))} type="image" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandingSettings;
