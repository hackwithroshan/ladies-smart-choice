
import React, { useState, useEffect, useRef } from 'react';
import { HomeSection, HomepageLayout, Collection } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { COLORS } from '../../constants';

const HomepageEditor: React.FC<{ token: string | null }> = ({ token }) => {
    const [layout, setLayout] = useState<HomepageLayout>({ sections: [] });
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [activeEditId, setActiveEditId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'item' | 'json'>('content');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const addMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const [lRes, cRes] = await Promise.all([
                    fetch(getApiUrl('/api/settings/layout')),
                    fetch(getApiUrl('/api/collections'))
                ]);
                if (lRes.ok) setLayout(await lRes.json());
                if (cRes.ok) setCollections(await cRes.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchLayout();

        const handleClickOutside = (e: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = async () => {
        if (jsonError) {
            alert('Cannot save. Please fix the JSON syntax errors first.');
            return;
        }
        setSaving(true);
        try {
            await fetch(getApiUrl('/api/settings/layout'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(layout)
            });
            alert('Storefront Settings Published!');
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleJsonChange = (id: string, value: string) => {
        try {
            if (value.trim()) JSON.parse(value);
            setJsonError(null);
        } catch (e: any) {
            setJsonError(e.message);
        }
        updateSection(id, { settingsJson: value });
    };

    const addSection = (type: HomeSection['type']) => {
        const newSection: HomeSection = {
            id: `sec-${Date.now()}`,
            type,
            isActive: true,
            title: `New ${type} Section`,
            code: type === 'CustomCode' ? '<div class="p-10 text-center"><h2 id="custom-title"></h2></div><script>document.getElementById("custom-title").innerText = sectionContext.title;</script>' : '',
            settingsJson: type === 'CustomCode' ? '{\n  "title": "Welcome to Custom Section",\n  "color": "#16423C"\n}' : '',
            settings: { paddingTop: 60, paddingBottom: 60, backgroundColor: '#FFFFFF' }
        };
        setLayout({ ...layout, sections: [...layout.sections, newSection] });
        setIsAddMenuOpen(false);
        setActiveEditId(newSection.id);
        setActiveTab('content');
    };

    const removeSection = (id: string) => {
        if (!window.confirm("Delete this section?")) return;
        setLayout({ ...layout, sections: layout.sections.filter(s => s.id !== id) });
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...layout.sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        setLayout({ ...layout, sections: newSections });
    };

    const updateSection = (id: string, updates: Partial<HomeSection>) => {
        setLayout({
            ...layout,
            sections: layout.sections.map(s => s.id === id ? { ...s, ...updates } : s)
        });
    };

    const updateSectionSettings = (id: string, key: string, value: any) => {
        setLayout({
            ...layout,
            sections: layout.sections.map(s => {
                if (s.id === id) {
                    return { ...s, settings: { ...(s.settings || {}), [key]: value } };
                }
                return s;
            })
        });
    };

    if (loading) return <div className="p-20 text-center font-bold italic text-gray-400">Loading Builder Core...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-0 z-[60]">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Visual Storefront Builder</h3>
                    <p className="text-xs text-gray-500 font-medium italic">Craft your premium homepage experience.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative" ref={addMenuRef}>
                        <button
                            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                            className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl font-bold border border-gray-200 hover:bg-gray-200 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Add Section
                        </button>
                        {isAddMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-2xl rounded-2xl border border-gray-100 z-[70] overflow-hidden animate-fade-in-up p-1">
                                {['Hero', 'Collections', 'NewArrivals', 'BestSellers', 'Videos', 'Newsletter', 'CustomCode'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => addSection(t as any)}
                                        className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors rounded-xl"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={handleSave} disabled={saving} className="bg-[#16423C] text-white px-8 py-2.5 rounded-xl font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all transform active:scale-95">
                        {saving ? 'Publishing...' : 'Publish Homepage'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {layout.sections.map((section, index) => (
                    <div key={section.id} className={`bg-white border-2 rounded-2xl shadow-sm overflow-hidden transition-all ${section.isActive ? 'border-gray-200 shadow-md' : 'border-dashed border-gray-300 opacity-60'}`}>
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => moveSection(index, 'up')} className="text-gray-400 hover:text-[#16423C] disabled:opacity-20" disabled={index === 0}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" /></svg></button>
                                    <button onClick={() => moveSection(index, 'down')} className="text-gray-400 hover:text-[#16423C] disabled:opacity-20" disabled={index === layout.sections.length - 1}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg></button>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-[#6A9C89]/20 text-[#16423C] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{section.type}</span>
                                        <button onClick={() => { setActiveEditId(activeEditId === section.id ? null : section.id); setActiveTab('content'); }} className="text-[10px] font-black uppercase text-blue-600 underline hover:text-blue-800">
                                            {activeEditId === section.id ? 'Close Settings' : 'Modify Settings'}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={section.title || ''}
                                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                        className="font-black text-gray-800 bg-transparent border-none focus:ring-0 p-0 text-lg placeholder-gray-300 w-full md:w-96"
                                        placeholder="Section Heading"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-gray-400">Visibility</p>
                                        <p className="text-xs font-bold text-gray-600">{section.isActive ? 'SHOWN' : 'HIDDEN'}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={section.isActive}
                                        onChange={() => updateSection(section.id, { isActive: !section.isActive })}
                                        className="w-5 h-5 text-green-600 rounded-lg border-gray-300"
                                    />
                                </label>
                                <button onClick={() => removeSection(section.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>

                        {activeEditId === section.id && (
                            <div className="p-8 bg-white border-t border-gray-100 animate-fade-in">
                                <div className="flex gap-6 mb-8 border-b pb-2">
                                    <button onClick={() => setActiveTab('content')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'content' ? 'border-[#16423C] text-[#16423C]' : 'border-transparent text-gray-400'}`}>Content & Data</button>
                                    {section.type === 'CustomCode' && (
                                        <button onClick={() => setActiveTab('json')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'json' ? 'border-[#16423C] text-[#16423C]' : 'border-transparent text-gray-400'}`}>JSON Configuration</button>
                                    )}
                                    <button onClick={() => setActiveTab('style')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'style' ? 'border-[#16423C] text-[#16423C]' : 'border-transparent text-gray-400'}`}>Spacing & Width</button>
                                </div>

                                {activeTab === 'content' && (
                                    <div className="space-y-8">
                                        {section.type === 'CustomCode' ? (
                                            <div className="space-y-4">
                                                <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                                                    <div className="flex items-center justify-between px-5 py-3 bg-gray-800 border-b border-gray-700">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">custom_homepage_section.html</span>
                                                        <span className="text-[9px] text-blue-400 font-mono">Use sectionContext variable in JS</span>
                                                    </div>
                                                    <textarea
                                                        value={section.code || ''}
                                                        onChange={(e) => updateSection(section.id, { code: e.target.value })}
                                                        className="w-full bg-gray-900 text-green-400 font-mono text-sm p-8 focus:ring-0 border-none outline-none min-h-[400px] resize-y"
                                                        placeholder="<div class='my-section'>...</div>"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Section Subtitle</label>
                                                        <textarea
                                                            value={section.settings?.subtitle || ''}
                                                            onChange={(e) => updateSectionSettings(section.id, 'subtitle', e.target.value)}
                                                            className="w-full border border-gray-300 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#16423C]"
                                                            rows={2}
                                                            placeholder="Describe this section..."
                                                        />
                                                    </div>

                                                    {['Collections', 'NewArrivals', 'BestSellers'].includes(section.type) && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                                <div className="flex-1">
                                                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Display Layout</label>
                                                                    <div className="flex items-center gap-3">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`slider-${section.id}`}
                                                                            checked={section.settings?.isSlider || false}
                                                                            onChange={(e) => updateSectionSettings(section.id, 'isSlider', e.target.checked)}
                                                                            className="w-5 h-5 text-[#16423C] rounded border-gray-300 focus:ring-[#16423C]"
                                                                        />
                                                                        <label htmlFor={`slider-${section.id}`} className="text-sm font-bold text-gray-700 cursor-pointer">Enable Horizontal Slider</label>
                                                                    </div>
                                                                </div>
                                                                <div className="w-1/4">
                                                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Item Limit</label>
                                                                    <input
                                                                        type="number"
                                                                        value={section.settings?.limit || 8}
                                                                        onChange={(e) => updateSectionSettings(section.id, 'limit', parseInt(e.target.value))}
                                                                        className="w-full border border-gray-300 rounded-xl p-2 text-sm font-bold text-center"
                                                                    />
                                                                </div>
                                                                <div className="w-1/4">
                                                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Columns</label>
                                                                    <input
                                                                        type="number"
                                                                        min="1" max="6"
                                                                        value={section.settings?.itemsPerRow || 4}
                                                                        onChange={(e) => updateSectionSettings(section.id, 'itemsPerRow', parseInt(e.target.value))}
                                                                        className="w-full border border-gray-300 rounded-xl p-2 text-sm font-bold text-center"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Image Aspect Ratio</label>
                                                                <select
                                                                    value={section.settings?.imageAspectRatio || 'aspect-[4/5]'}
                                                                    onChange={(e) => updateSectionSettings(section.id, 'imageAspectRatio', e.target.value)}
                                                                    className="w-full border border-gray-300 rounded-xl p-3 text-xs font-bold bg-white"
                                                                >
                                                                    <option value="aspect-square">Square (1:1)</option>
                                                                    <option value="aspect-[4/5]">Portrait (4:5)</option>
                                                                    <option value="aspect-[3/4]">Portrait (3:4)</option>
                                                                    <option value="aspect-[2/3]">Tall (2:3)</option>
                                                                    <option value="aspect-video">Landscape (16:9)</option>
                                                                    <option value="h-[300px]">Fixed Height (300px)</option>
                                                                    <option value="h-[400px]">Fixed Height (400px)</option>
                                                                    <option value="h-[500px]">Fixed Height (500px)</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-6">
                                                    {['NewArrivals', 'BestSellers'].includes(section.type) && (
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Source Collection (Optional)</label>
                                                            <select
                                                                value={section.settings?.collectionId || 'all'}
                                                                onChange={(e) => updateSectionSettings(section.id, 'collectionId', e.target.value)}
                                                                className="w-full border border-gray-300 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#16423C]"
                                                            >
                                                                <option value="all">Show All Products</option>
                                                                {collections.map(c => (
                                                                    <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>
                                                                ))}
                                                            </select>
                                                            <p className="text-[10px] text-gray-400 mt-2 font-medium">Filter products to show only from a specific collection.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'json' && section.type === 'CustomCode' && (
                                    <div className="space-y-4">
                                        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                                            <div className="flex items-center justify-between px-5 py-3 bg-slate-800 border-b border-slate-700">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">schema_settings.json</span>
                                                {jsonError && <span className="text-[9px] text-red-400 font-bold uppercase animate-pulse">Syntax Error!</span>}
                                            </div>
                                            <textarea
                                                value={section.settingsJson || ''}
                                                onChange={(e) => handleJsonChange(section.id, e.target.value)}
                                                className={`w-full bg-slate-900 text-orange-300 font-mono text-sm p-8 focus:ring-0 border-none outline-none min-h-[300px] resize-y ${jsonError ? 'text-red-300' : ''}`}
                                                placeholder='{ "key": "value" }'
                                            />
                                        </div>
                                        {jsonError && <p className="text-red-500 text-[10px] font-black uppercase px-2 tracking-tighter">ERROR: {jsonError}</p>}
                                        <p className="text-[10px] text-gray-400 italic mt-2 px-2">Admins: The data defined here is parsed into a JavaScript object named <strong>sectionContext</strong> available within your custom scripts.</p>
                                    </div>
                                )}

                                {activeTab === 'style' && (
                                    <div className="space-y-12 max-w-5xl">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-8">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] border-b pb-2 mb-6">Container Sizing</p>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Desktop Max-Width</label>
                                                        <input
                                                            type="text"
                                                            value={section.settings?.desktopWidth || '1280px'}
                                                            onChange={(e) => updateSectionSettings(section.id, 'desktopWidth', e.target.value)}
                                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                                                            placeholder="100% or 1280px"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Mobile Width</label>
                                                        <input
                                                            type="text"
                                                            value={section.settings?.mobileWidth || '100%'}
                                                            onChange={(e) => updateSectionSettings(section.id, 'mobileWidth', e.target.value)}
                                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                                                            placeholder="100%"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {section.type === 'Hero' && (
                                                <div className="space-y-8">
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] border-b pb-2 mb-6">Hero Dimensions</p>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Desktop Height</label>
                                                            <input
                                                                type="text"
                                                                value={section.settings?.desktopHeight || '600px'}
                                                                onChange={(e) => updateSectionSettings(section.id, 'desktopHeight', e.target.value)}
                                                                className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                                                                placeholder="600px or 100vh"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Mobile Height</label>
                                                            <input
                                                                type="text"
                                                                value={section.settings?.mobileHeight || '500px'}
                                                                onChange={(e) => updateSectionSettings(section.id, 'mobileHeight', e.target.value)}
                                                                className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                                                                placeholder="500px"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-8">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] border-b pb-2 mb-6">Section Spacing (PX)</p>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[8px] font-bold text-gray-400 block mb-2 uppercase tracking-widest">Padding</label>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <div>
                                                                <span className="text-[8px] text-gray-400 block mb-1">Top</span>
                                                                <input type="number" value={section.settings?.paddingTop ?? 60} onChange={(e) => updateSectionSettings(section.id, 'paddingTop', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" />
                                                            </div>
                                                            <div>
                                                                <span className="text-[8px] text-gray-400 block mb-1">Bottom</span>
                                                                <input type="number" value={section.settings?.paddingBottom ?? 60} onChange={(e) => updateSectionSettings(section.id, 'paddingBottom', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" />
                                                            </div>
                                                            <div>
                                                                <span className="text-[8px] text-gray-400 block mb-1">Left</span>
                                                                <input type="number" value={section.settings?.paddingLeft ?? 20} onChange={(e) => updateSectionSettings(section.id, 'paddingLeft', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" />
                                                            </div>
                                                            <div>
                                                                <span className="text-[8px] text-gray-400 block mb-1">Right</span>
                                                                <input type="number" value={section.settings?.paddingRight ?? 20} onChange={(e) => updateSectionSettings(section.id, 'paddingRight', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-bold text-gray-400 block mb-2 uppercase tracking-widest">Margin</label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <span className="text-[8px] text-gray-400 block mb-1">Top</span>
                                                                <input type="number" value={section.settings?.marginTop ?? 0} onChange={(e) => updateSectionSettings(section.id, 'marginTop', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" />
                                                            </div>
                                                            <div>
                                                                <span className="text-[8px] text-gray-400 block mb-1">Bottom</span>
                                                                <input type="number" value={section.settings?.marginBottom ?? 0} onChange={(e) => updateSectionSettings(section.id, 'marginBottom', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] border-b pb-2 mb-6">Appearance</p>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Background Color</label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <input
                                                                    type="color"
                                                                    value={section.settings?.backgroundColor || '#ffffff'}
                                                                    onChange={(e) => updateSectionSettings(section.id, 'backgroundColor', e.target.value)}
                                                                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0 overflow-hidden"
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={section.settings?.backgroundColor || ''}
                                                                onChange={(e) => updateSectionSettings(section.id, 'backgroundColor', e.target.value)}
                                                                className="flex-1 w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-[#16423C]"
                                                                placeholder="#FFFFFF"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Text Color</label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <input
                                                                    type="color"
                                                                    value={section.settings?.textColor || '#000000'}
                                                                    onChange={(e) => updateSectionSettings(section.id, 'textColor', e.target.value)}
                                                                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0 overflow-hidden"
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={section.settings?.textColor || ''}
                                                                onChange={(e) => updateSectionSettings(section.id, 'textColor', e.target.value)}
                                                                className="flex-1 w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-[#16423C]"
                                                                placeholder="#000000"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] border-b pb-2 mb-6">Typography & Alignment</p>
                                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Section Title Style</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Size (PX)</span>
                                                            <input type="number" value={section.settings?.titleSize || 32} onChange={(e) => updateSectionSettings(section.id, 'titleSize', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Weight</span>
                                                            <select value={section.settings?.titleWeight || 900} onChange={(e) => updateSectionSettings(section.id, 'titleWeight', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold bg-white">
                                                                <option value="400">Normal</option>
                                                                <option value="700">Bold</option>
                                                                <option value="900">Black</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={section.settings?.titleItalic || false} onChange={(e) => updateSectionSettings(section.id, 'titleItalic', e.target.checked)} className="rounded text-[#16423C] focus:ring-[#16423C]" />
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase">Italic Style</span>
                                                    </label>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Subtitle Style</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Size (PX)</span>
                                                            <input type="number" value={section.settings?.subtitleSize || 14} onChange={(e) => updateSectionSettings(section.id, 'subtitleSize', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Weight</span>
                                                            <select value={section.settings?.subtitleWeight || 500} onChange={(e) => updateSectionSettings(section.id, 'subtitleWeight', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold bg-white">
                                                                <option value="300">Light</option>
                                                                <option value="400">Normal</option>
                                                                <option value="500">Medium</option>
                                                                <option value="700">Bold</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={section.settings?.subtitleItalic || false} onChange={(e) => updateSectionSettings(section.id, 'subtitleItalic', e.target.checked)} className="rounded text-[#16423C] focus:ring-[#16423C]" />
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase">Italic Style</span>
                                                    </label>
                                                </div>

                                                <div className="col-span-2 border-t pt-6 mt-2">
                                                    <label className="text-[9px] font-bold text-gray-500 block mb-3 uppercase tracking-widest">Text & Content Alignment</label>
                                                    <div className="flex gap-2">
                                                        {['left', 'center', 'right'].map((align) => (
                                                            <button
                                                                key={align}
                                                                onClick={() => updateSectionSettings(section.id, 'alignment', align)}
                                                                className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${(section.settings?.alignment || 'center') === align
                                                                    ? 'bg-[#16423C] text-white border-[#16423C] ring-2 ring-[#16423C] ring-offset-2'
                                                                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                                                                    }`}
                                                            >
                                                                {align}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))
                }
            </div >
        </div >
    );
};

export default HomepageEditor;

