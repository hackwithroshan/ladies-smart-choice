
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
            title: `My ${type} Section`,
            settings: type === 'Hero' ? {
                desktopHeight: '650px',
                mobileHeight: '400px',
                desktopWidth: '100%',
                mobileWidth: '100%',
                customStyles: ''
            } : {
                limit: 4,
                desktopColumns: 4,
                mobileColumns: 2,
                isSlider: false
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
                        {/* Row Header */}
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
                                        className="font-black text-gray-800 bg-transparent border-none focus:ring-0 p-0 text-lg placeholder-gray-300"
                                        placeholder="Enter Section Title..."
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

                        {/* Expandable Settings Content */}
                        {activeEditId === section.id && (
                            <div className="p-8 bg-white border-t border-gray-100 animate-fade-in">
                                {section.type === 'Hero' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Desktop Height</label><input type="text" value={section.settings?.desktopHeight || '650px'} onChange={(e) => updateSectionSettings(section.id, 'desktopHeight', e.target.value)} className="w-full border rounded-xl p-3 text-sm focus:ring-rose-500" placeholder="e.g. 650px"/></div>
                                        <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mobile Height</label><input type="text" value={section.settings?.mobileHeight || '400px'} onChange={(e) => updateSectionSettings(section.id, 'mobileHeight', e.target.value)} className="w-full border rounded-xl p-3 text-sm focus:ring-rose-500" placeholder="e.g. 400px"/></div>
                                        <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Desktop Width</label><input type="text" value={section.settings?.desktopWidth || '100%'} onChange={(e) => updateSectionSettings(section.id, 'desktopWidth', e.target.value)} className="w-full border rounded-xl p-3 text-sm focus:ring-rose-500" placeholder="e.g. 100%"/></div>
                                        <div className="lg:col-span-1"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Custom CSS</label><input type="text" value={section.settings?.customStyles || ''} onChange={(e) => updateSectionSettings(section.id, 'customStyles', e.target.value)} className="w-full border rounded-xl p-3 text-sm font-mono" placeholder="margin-top: 20px;"/></div>
                                    </div>
                                )}

                                {['Collections', 'NewArrivals', 'BestSellers'].includes(section.type) && (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                            {section.type === 'Collections' && (
                                                <div className="lg:col-span-2">
                                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Select Target Collection</label>
                                                    <select 
                                                        value={section.settings?.collectionId || 'all'} 
                                                        onChange={(e) => updateSectionSettings(section.id, 'collectionId', e.target.value)}
                                                        className="w-full border rounded-xl p-3 text-sm bg-gray-50 font-bold"
                                                    >
                                                        <option value="all">Show All Categories</option>
                                                        {collections.map(c => <option key={c.id} value={c.id}>Products from: {c.title}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            
                                            <div>
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Product Limit</label>
                                                <input 
                                                    type="number" 
                                                    min={1} 
                                                    max={24}
                                                    value={section.settings?.limit || 4} 
                                                    onChange={(e) => updateSectionSettings(section.id, 'limit', parseInt(e.target.value))}
                                                    className="w-full border rounded-xl p-3 text-sm font-bold"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Layout View</label>
                                                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                                                    <button onClick={() => updateSectionSettings(section.id, 'isSlider', false)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!section.settings?.isSlider ? 'bg-white shadow text-rose-600' : 'text-gray-400'}`}>Grid</button>
                                                    <button onClick={() => updateSectionSettings(section.id, 'isSlider', true)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${section.settings?.isSlider ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Slider</button>
                                                </div>
                                            </div>

                                            {!section.settings?.isSlider && (
                                                <div>
                                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Items Per Row (Desktop)</label>
                                                    <select 
                                                        value={section.settings?.desktopColumns || 4} 
                                                        onChange={(e) => updateSectionSettings(section.id, 'desktopColumns', parseInt(e.target.value))}
                                                        className="w-full border rounded-xl p-3 text-sm font-bold"
                                                    >
                                                        {[2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num} Columns</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                                             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2}/></svg>
                                             </div>
                                             <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                                 These settings control how the {section.type} appear on your homepage. <strong>Slider</strong> mode enables horizontal swiping, perfect for mobile users.
                                             </p>
                                        </div>
                                    </div>
                                )}

                                {section.type === 'CustomCode' && (
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">HTML / Tailwind Source</label>
                                        <textarea 
                                            value={section.code} 
                                            onChange={(e) => updateSection(section.id, { code: e.target.value })}
                                            className="w-full h-64 font-mono text-xs p-4 bg-gray-900 text-green-400 rounded-2xl shadow-inner outline-none focus:ring-2 focus:ring-green-500/30"
                                            placeholder="<div class='bg-red-500 p-10'>Custom HTML</div>"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                
                {layout.sections.length === 0 && (
                    <div className="text-center py-32 bg-white rounded-3xl border-4 border-dashed border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <p className="text-gray-400 font-bold text-lg">Your canvas is blank.</p>
                        <p className="text-gray-300 text-sm mt-1">Click "+ Add Section" to build your storefront.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomepageEditor;
