
import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

interface SEOSettings {
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
}

const HomePageSEOSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<SEOSettings>({ seoTitle: '', seoDescription: '', seoKeywords: [] });
    const [keywordInput, setKeywordInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await fetch(getApiUrl('/api/settings/homepage'));
                if(res.ok) {
                    const data = await res.json();
                    // Ensure keywords is always an array
                    setSettings({ ...data, seoKeywords: data.seoKeywords || [] });
                }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await fetch(getApiUrl('/api/settings/homepage'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if(!res.ok) throw new Error('Failed to save settings');
            setFeedback({type: 'success', message: 'SEO settings saved successfully!'});
        } catch (err: any) {
            setFeedback({type: 'error', message: err.message});
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    };
    
    const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
         if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (keywordInput.trim() && !settings.seoKeywords.includes(keywordInput.trim())) {
                setSettings(prev => ({ ...prev, seoKeywords: [...prev.seoKeywords, keywordInput.trim()] }));
            }
            setKeywordInput('');
        }
    };
    const removeKeyword = (index: number) => {
        setSettings(prev => ({...prev, seoKeywords: prev.seoKeywords.filter((_, i) => i !== index)}));
    };

    if(loading) return <p>Loading SEO settings...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Home Page SEO</h2>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-medium text-white rounded-md shadow-sm" style={{ backgroundColor: COLORS.accent }}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
            {feedback && <div className={`p-3 rounded mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback.message}</div>}
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6 max-w-3xl">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                    <input type="text" value={settings.seoTitle} onChange={e => setSettings({...settings, seoTitle: e.target.value})} className="w-full border p-2 rounded border-gray-300" />
                    <p className="text-xs text-gray-500 mt-1">Appears in the browser tab and search results. Aim for 50-60 characters.</p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea value={settings.seoDescription} onChange={e => setSettings({...settings, seoDescription: e.target.value})} className="w-full border p-2 rounded border-gray-300" rows={3}></textarea>
                    <p className="text-xs text-gray-500 mt-1">Brief summary for search engines. Aim for 150-160 characters.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                    <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={handleKeywordKeyDown} className="w-full border p-2 rounded border-gray-300" placeholder="Type a keyword and press Enter" />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {settings.seoKeywords.map((kw, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs flex items-center border border-gray-200">
                              {kw}
                              <button onClick={() => removeKeyword(idx)} className="ml-2 text-gray-400 hover:text-red-500 font-bold text-sm">×</button>
                          </span>
                      ))}
                    </div>
                     <p className="text-xs text-gray-500 mt-1">Keywords help search engines understand your page content.</p>
                </div>
            </div>
        </div>
    );
};

export default HomePageSEOSettings;
