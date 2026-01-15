
import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { X, Save, Search, Globe, Tag } from "lucide-react";


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
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await fetch(getApiUrl('/api/settings/homepage'));
                if (res.ok) {
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
            if (!res.ok) throw new Error('Failed to save settings');
            setFeedback({ type: 'success', message: 'SEO settings saved successfully!' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
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
        setSettings(prev => ({ ...prev, seoKeywords: prev.seoKeywords.filter((_, i) => i !== index) }));
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500 mr-3"></div>
            Loading SEO settings...
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Home Page SEO</h2>
                    <p className="text-zinc-500 mt-1">Optimize your store's home page for search engines and social sharing.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="shadow-md"
                    style={{ backgroundColor: COLORS.accent }}
                >
                    {saving ? (
                        <>Saving...</>
                    ) : (
                        <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                    )}
                </Button>
            </div>

            {feedback && (
                <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    <div className={`p-1 rounded-full ${feedback.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {feedback.type === 'success' ? <div className="w-2 h-2 bg-emerald-600 rounded-full" /> : <X className="w-3 h-3 text-red-600" />}
                    </div>
                    <span className="text-sm font-medium">{feedback.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5 text-zinc-400" />
                                Search Engine Listing
                            </CardTitle>
                            <CardDescription>
                                Preview how your home page might appear in search results.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="seoTitle">Page Title</Label>
                                <Input
                                    id="seoTitle"
                                    value={settings.seoTitle}
                                    onChange={e => setSettings({ ...settings, seoTitle: e.target.value })}
                                    placeholder="e.g. Best Organic Skincare | MyStore"
                                />
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>Recommended: 50-60 characters</span>
                                    <span className={settings.seoTitle.length > 60 ? 'text-red-500' : ''}>{settings.seoTitle.length} chars</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="seoDescription">Meta Description</Label>
                                <Textarea
                                    id="seoDescription"
                                    value={settings.seoDescription}
                                    onChange={e => setSettings({ ...settings, seoDescription: e.target.value })}
                                    placeholder="Brief summary of your store..."
                                    className="min-h-[100px]"
                                />
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>Recommended: 150-160 characters</span>
                                    <span className={settings.seoDescription.length > 160 ? 'text-red-500' : ''}>{settings.seoDescription.length} chars</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="w-5 h-5 text-zinc-400" />
                                Keywords
                            </CardTitle>
                            <CardDescription>
                                Add relevant keywords to help search engines understand your content.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Add Keywords</Label>
                                <Input
                                    value={keywordInput}
                                    onChange={e => setKeywordInput(e.target.value)}
                                    onKeyDown={handleKeywordKeyDown}
                                    placeholder="Type keyword and press Enter..."
                                />
                                <p className="text-xs text-zinc-500">Separate keywords with commas or the Enter key.</p>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100 min-h-[100px]">
                                {settings.seoKeywords.length === 0 && (
                                    <p className="text-sm text-zinc-400 w-full text-center py-4">No keywords added yet.</p>
                                )}
                                {settings.seoKeywords.map((kw, idx) => (
                                    <Badge key={idx} variant="secondary" className="px-3 py-1 text-sm bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors">
                                        {kw}
                                        <button
                                            onClick={() => removeKeyword(idx)}
                                            className="ml-2 text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1">
                    <Card className="bg-zinc-50/50 border-zinc-200 sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center">
                                        <Globe className="w-3 h-3 text-zinc-400" />
                                    </div>
                                    <span className="text-xs text-zinc-500">example.com</span>
                                </div>
                                <h3 className="text-blue-700 text-lg font-medium leading-tight hover:underline cursor-pointer truncate">
                                    {settings.seoTitle || "Your Page Title"}
                                </h3>
                                <p className="text-sm text-zinc-600 mt-1 line-clamp-2">
                                    {settings.seoDescription || "Your page meta description will appear here in search results. Make it catchy!"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default HomePageSEOSettings;
