
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
    const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');
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
        setSaving(true);
        try {
            await fetch(getApiUrl('/api/settings/layout'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(layout)
            });
            alert('Homepage Published Successfully!');
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const addSection = (type: HomeSection['type']) => {
        const newSection: HomeSection = {
            id: `sec-${Date.now()}`,
            type,
            isActive: true,
            title: `New ${type} Section`,
            settings: {
                subtitle: 'Add a captivating subtitle here',
                alignment: 'center',
                titleSize: 32,
                subtitleSize: 14,
                limit: 4,
                desktopColumns: 4,
                mobileColumns: 2,
                isSlider: false,
                collectionId: 'all',
                backgroundColor: type === 'NewArrivals' || type === 'BestSellers' ? '#FBF9F1' : 'transparent',
                ...(type === 'Hero' ? {
                    desktopHeight: '650px',
                    mobileHeight: '400px',
                    desktopWidth: '100%',
                    mobileWidth: '100%',
                    customStyles: ''
                } : {})
            },
            code: type === 'CustomCode' ? '<div class="py-20 text-center bg-gray-100">\n  <h2 class="text-4xl font-bold">Custom Section</h2>\n</div>' : ''
        };
        setLayout({ ...layout, sections: [...layout.sections, newSection] });
        setIsAddMenuOpen(false);
        setActiveEditId(newSection.id);
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

    if (loading) return <div className="p-20 text-center">Initialising Builder...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-0 z-[60]">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Visual Page Builder</h3>
                    <p className="text-xs text-gray-500 font-medium">Draft your perfect homepage layout.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative" ref={addMenuRef}>
                         <button 
                            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                            className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl font-bold border border-gray-200 hover:bg-gray-200 transition-all flex items-center gap-2"
                         >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                        {saving ? 'Publishing...' : 'Publish Home'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {layout.sections.map((section, index) => (
                    <div key={section.id} className={`bg-white border-2 rounded-2xl shadow-sm overflow-hidden transition-all ${section.isActive ? 'border-gray-200 shadow-md' : 'border-dashed border-gray-300 opacity-60'}`}>
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => moveSection(index, 'up')} className="text-gray-400 hover:text-blue-600 disabled:opacity-20" disabled={index === 0}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg></button>
                                    <button onClick={() => moveSection(index, 'down')} className="text-gray-400 hover:text-blue-600 disabled:opacity-20" disabled={index === layout.sections.length - 1}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg></button>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{section.type}</span>
                                        <button onClick={() => setActiveEditId(activeEditId === section.id ? null : section.id)} className="text-[10px] font-black uppercase text-blue-600 underline hover:text-blue-800">
                                            {activeEditId === section.id ? 'Close Settings' : 'Edit Section'}
                                        </button>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={section.title || ''} 
                                        onChange={(e) => updateSection(section.id, { title: e.target.value })} 
                                        className="font-black text-gray-800 bg-transparent border-none focus:ring-0 p-0 text-lg placeholder-gray-300 w-full md:w-96"
                                        placeholder="Enter Section Title"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-gray-400">Visibility</p>
                                        <p className="text-xs font-bold text-gray-600">{section.isActive ? 'Shown' : 'Hidden'}</p>
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
                                <div className="flex gap-4 mb-8 border-b pb-2">
                                    <button onClick={() => setActiveTab('content')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'content' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-400'}`}>Content & Data</button>
                                    <button onClick={() => setActiveTab('style')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'style' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-400'}`}>Typography & Style</button>
                                </div>

                                {activeTab === 'content' ? (
                                    <div className="space-y-8">
                                        {section.type === 'Hero' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                                <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Desktop Height</label><input type="text" value={section.settings?.desktopHeight || '650px'} onChange={(e) => updateSectionSettings(section.id, 'desktopHeight', e.target.value)} className="w-full border rounded-xl p-3 text-sm focus:ring-rose-500" placeholder="e.g. 650px"/></div>
                                                <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mobile Height</label><input type="text" value={section.settings?.mobileHeight || '400px'} onChange={(e) => updateSectionSettings(section.id, 'mobileHeight', e.target.value)} className="w-full border rounded-xl p-3 text-sm focus:ring-rose-500" placeholder="e.g. 400px"/></div>
                                                <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Desktop Width</label><input type="text" value={section.settings?.desktopWidth || '100%'} onChange={(e) => updateSectionSettings(section.id, 'desktopWidth', e.target.value)} className="w-full border rounded-xl p-3 text-sm focus:ring-rose-500" placeholder="e.g. 100%"/></div>
                                                <div className="lg:col-span-1"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Custom CSS</label><input type="text" value={section.settings?.customStyles || ''} onChange={(e) => updateSectionSettings(section.id, 'customStyles', e.target.value)} className="w-full border rounded-xl p-3 text-sm font-mono" placeholder="margin-top: 20px;"/></div>
                                            </div>
                                        )}

                                        {['Collections', 'NewArrivals', 'BestSellers'].includes(section.type) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                                {/* Now allowed for all three types: Collections, NewArrivals, BestSellers */}
                                                <div className="lg:col-span-2">
                                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Source Selection</label>
                                                    <select 
                                                        value={section.settings?.collectionId || 'all'} 
                                                        onChange={(e) => updateSectionSettings(section.id, 'collectionId', e.target.value)}
                                                        className="w-full border rounded-xl p-3 text-sm bg-gray-50 font-bold"
                                                    >
                                                        <option value="all">{section.type === 'Collections' ? 'Show All Active Collections' : 'All Products (Global)'}</option>
                                                        {collections.map(c => <option key={c.id} value={c.id}>Products from: {c.title}</option>)}
                                                    </select>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Product Limit</label>
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        value={section.settings?.limit || 4} 
                                                        onChange={(e) => updateSectionSettings(section.id, 'limit', parseInt(e.target.value))}
                                                        className="w-full border rounded-xl p-3 text-sm font-bold"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Display Mode</label>
                                                    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                                                        <button onClick={() => updateSectionSettings(section.id, 'isSlider', false)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!section.settings?.isSlider ? 'bg-white shadow text-rose-600' : 'text-gray-400'}`}>Grid</button>
                                                        <button onClick={() => updateSectionSettings(section.id, 'isSlider', true)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${section.settings?.isSlider ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Slider</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {section.type === 'CustomCode' && (
                                            <textarea 
                                                value={section.code} 
                                                onChange={(e) => updateSection(section.id, { code: e.target.value })}
                                                className="w-full h-64 font-mono text-xs p-4 bg-gray-900 text-green-400 rounded-2xl"
                                                placeholder="Custom HTML here..."
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-8 max-w-4xl">
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Section Subtitle</label>
                                            <textarea 
                                                value={section.settings?.subtitle || ''} 
                                                onChange={(e) => updateSectionSettings(section.id, 'subtitle', e.target.value)} 
                                                className="w-full border rounded-xl p-3 text-sm italic"
                                                rows={2}
                                                placeholder="Enter a description for this section..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div>
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Text Alignment</label>
                                                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                                                    {['left', 'center', 'right'].map(align => (
                                                        <button 
                                                            key={align}
                                                            onClick={() => updateSectionSettings(section.id, 'alignment', align)} 
                                                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${section.settings?.alignment === align ? 'bg-white shadow text-brand-primary' : 'text-gray-400'}`}
                                                        >
                                                            {align}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Title Font Size (px)</label>
                                                <input 
                                                    type="number" 
                                                    value={section.settings?.titleSize || 32} 
                                                    onChange={(e) => updateSectionSettings(section.id, 'titleSize', parseInt(e.target.value))}
                                                    className="w-full border rounded-xl p-3 text-sm font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Subtitle Font Size (px)</label>
                                                <input 
                                                    type="number" 
                                                    value={section.settings?.subtitleSize || 14} 
                                                    onChange={(e) => updateSectionSettings(section.id, 'subtitleSize', parseInt(e.target.value))}
                                                    className="w-full border rounded-xl p-3 text-sm font-bold"
                                                />
                                            </div>
                                            {['NewArrivals', 'BestSellers'].includes(section.type) && (
                                                <div className="col-span-full">
                                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Background Color</label>
                                                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                                        <input 
                                                            type="color" 
                                                            value={section.settings?.backgroundColor || '#FBF9F1'} 
                                                            onChange={(e) => updateSectionSettings(section.id, 'backgroundColor', e.target.value)}
                                                            className="h-10 w-12 rounded-lg cursor-pointer border border-gray-300"
                                                        />
                                                        <input 
                                                            type="text" 
                                                            value={section.settings?.backgroundColor || '#FBF9F1'} 
                                                            onChange={(e) => updateSectionSettings(section.id, 'backgroundColor', e.target.value)}
                                                            className="flex-1 border rounded-lg p-2 text-sm font-mono uppercase"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomepageEditor;
