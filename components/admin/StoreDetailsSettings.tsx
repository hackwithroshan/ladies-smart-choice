
import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';

interface StoreDetails {
    storeName?: string;
    logoUrl?: string;
    faviconUrl?: string;
    shortDescription?: string;
    longDescription?: string;
    businessType?: 'Individual' | 'Company';
    ownerName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    gstin?: string;
    currency?: string;
    timezone?: string;
    language?: string;
}

interface StoreDetailsSettingsProps {
    token: string | null;
    onClose: () => void;
}

const StoreDetailsSettings: React.FC<StoreDetailsSettingsProps> = ({ token, onClose }) => {
    const [details, setDetails] = useState<StoreDetails>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch(getApiUrl('/settings/store-details'));
                if (res.ok) setDetails(await res.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await fetch(getApiUrl('/settings/store-details'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(details)
            });
            if (!res.ok) throw new Error('Failed to save store details.');
            setFeedback({ type: 'success', message: 'Store details saved successfully!' });
            setTimeout(onClose, 1500); // Close modal on success
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setSaving(false);
        }
    };

    const timezones = ['Asia/Kolkata', 'America/New_York', 'Europe/London']; // Example list

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Store Business Details</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {loading ? <p>Loading details...</p> : (
                        <>
                            {/* Branding Section */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-gray-500 uppercase tracking-wider text-sm border-b pb-2">Branding</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField name="storeName" label="Store Name" value={details.storeName || ''} onChange={handleChange} />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
                                        <MediaPicker type="image" value={details.logoUrl || ''} onChange={(url) => setDetails(p => ({ ...p, logoUrl: url }))} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
                                    <MediaPicker type="image" value={details.faviconUrl || ''} onChange={(url) => setDetails(p => ({ ...p, faviconUrl: url }))} />
                                </div>
                            </div>

                            {/* Business Info Section */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-gray-500 uppercase tracking-wider text-sm border-b pb-2">Business Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SelectField name="businessType" label="Business Type" value={details.businessType || 'Individual'} onChange={handleChange} options={['Individual', 'Company']} />
                                    <InputField name="ownerName" label="Owner/Legal Name" value={details.ownerName || ''} onChange={handleChange} />
                                    <InputField name="gstin" label="GST / Tax ID" value={details.gstin || ''} onChange={handleChange} placeholder="e.g., 29ABCDE1234F1Z5" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Business Address</label>
                                    <textarea name="address" value={details.address || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
                                </div>
                            </div>
                            
                            {/* Contact Details Section */}
                             <div className="space-y-6">
                                <h3 className="font-bold text-gray-500 uppercase tracking-wider text-sm border-b pb-2">Contact Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField name="contactEmail" label="Contact Email" type="email" value={details.contactEmail || ''} onChange={handleChange} />
                                    <InputField name="contactPhone" label="Contact Phone" type="tel" value={details.contactPhone || ''} onChange={handleChange} />
                                </div>
                            </div>

                             {/* Localization Section */}
                             <div className="space-y-6">
                                <h3 className="font-bold text-gray-500 uppercase tracking-wider text-sm border-b pb-2">Localization</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <SelectField name="currency" label="Currency" value={details.currency || 'INR'} onChange={handleChange} options={['INR', 'USD']} />
                                    <SelectField name="language" label="Language" value={details.language || 'en-IN'} onChange={handleChange} options={['en-IN', 'en-US']} />
                                    <SelectField name="timezone" label="Timezone" value={details.timezone || 'Asia/Kolkata'} onChange={handleChange} options={timezones} />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                     {feedback && <div className={`text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{feedback.message}</div>}
                     <div className="flex gap-3 ml-auto">
                        <button onClick={onClose} className="px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 shadow-sm disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Details'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper components for form fields
const InputField: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input {...props} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
    </div>
);

const SelectField: React.FC<any> = ({ label, options, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select {...props} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export default StoreDetailsSettings;
