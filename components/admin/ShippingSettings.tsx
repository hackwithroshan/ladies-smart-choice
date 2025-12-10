
import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

const ShippingSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
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
            setFeedback({ type: 'success', message: 'Shipping settings saved successfully!' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    };
    
    if (loading) return <p>Loading shipping settings...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Shipping Settings</h2>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-medium text-white rounded-md shadow-sm" style={{ backgroundColor: COLORS.accent }}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
            {feedback && <div className={`p-3 rounded mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback.message}</div>}
            
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6 max-w-2xl">
                <div>
                    <label htmlFor="shippingCharge" className="block text-sm font-medium text-gray-700">Default Shipping Charge (Flat Rate)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input type="number" name="shippingCharge" id="shippingCharge" value={settings.shippingCharge || 0} onChange={handleChange} className="focus:ring-rose-500 focus:border-rose-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md border p-2" placeholder="0.00" />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Set a flat shipping rate for all orders. Set to 0 for free shipping.</p>
                </div>
            </div>
        </div>
    );
};

export default ShippingSettings;
