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
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'item'>('content');
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
            alert('Storefront Settings Published!');
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const addSection = (type: HomeSection['type']) => {
        const newSection: HomeSection = {
            id: `sec-${Date.now()}`,
            type,
            isActive: true,
            title: `New ${type} Section`,
            code: type === 'CustomCode' ? '<div style="padding: 40px; text-align: center;"><h2>Custom Content</h2></div>' : '',
            settings: {
                subtitle: '',
                alignment: 'center',
                limit: 4,
                desktopColumns: 4,
                mobileColumns: 2,
                isSlider: false,
                collectionId: 'all',
                paddingTop: 60,
                paddingBottom: 60,
                backgroundColor: '#FFFFFF',
                desktopWidth: '1280px',
                mobileWidth: '100%',
                // Item UI Defaults
                itemStyle: 'Standard',
                itemWidth: '280px',
                itemHeight: 'auto',
                itemGap: 24,
                itemBorderRadius: 12,
                itemShadow: true,
                itemBorder: false,
                itemTitleSize: 15,
                itemPriceSize: 16,
                showVariants: true,
                itemVariantStyle: 'TextList',
                showWishlist: true,
                wishlistPosition: 'bottom-right-overlay',
                showBuyButton: false,
                showBadge: true,
                badgeText: 'NEW',
                imageFit: 'cover'
            }
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
                                    <button onClick={() => moveSection(index, 'up')} className="text-gray-400 hover:text-[#16423C] disabled:opacity-20" disabled={index === 0}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg></button>
                                    <button onClick={() => moveSection(index, 'down')} className="text-gray-400 hover:text-[#16423C] disabled:opacity-20" disabled={index === layout.sections.length - 1}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg></button>
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
                                    <button onClick={() => setActiveTab('style')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'style' ? 'border-[#16423C] text-[#16423C]' : 'border-transparent text-gray-400'}`}>Spacing & Width</button>
                                    {['NewArrivals', 'BestSellers', 'Collections'].includes(section.type) && (
                                        <button onClick={() => setActiveTab('item')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'item' ? 'border-[#16423C] text-[#16423C]' : 'border-transparent text-gray-400'}`}>Card Visual Designer</button>
                                    )}
                                </div>

                                {activeTab === 'content' && (
                                    <div className="space-y-8">
                                        {section.type === 'CustomCode' ? (
                                            <div className="space-y-4">
                                                <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                                                    <div className="flex items-center justify-between px-5 py-3 bg-gray-800 border-b border-gray-700">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">custom_homepage_section.html</span>
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
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Data Source</label>
                                                            <select 
                                                                value={section.settings?.collectionId || 'all'} 
                                                                onChange={(e) => updateSectionSettings(section.id, 'collectionId', e.target.value)}
                                                                className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold bg-white"
                                                            >
                                                                <option value="all">Global (All Active Products)</option>
                                                                {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Limit Items</label>
                                                                <input type="number" value={section.settings?.limit || 4} onChange={(e) => updateSectionSettings(section.id, 'limit', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold" />
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-8">
                                                                <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-xl border w-full">
                                                                    <input type="checkbox" checked={!!section.settings?.isSlider} onChange={(e) => updateSectionSettings(section.id, 'isSlider', e.target.checked)} className="h-5 w-5 text-rose-600 rounded" />
                                                                    <span className="text-[10px] font-black uppercase text-gray-700 tracking-wider">Enable Slider</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                                <p className="text-[10px] text-gray-400 mt-2 italic">Set to '100%' for Edge-to-Edge view. Default is 1280px.</p>
                                            </div>

                                            <div className="space-y-8">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] border-b pb-2 mb-6">Section Spacing</p>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Top Padding (PX)</label>
                                                        <input type="number" value={section.settings?.paddingTop ?? 60} onChange={(e) => updateSectionSettings(section.id, 'paddingTop', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 block mb-2 uppercase tracking-widest">Bottom Padding (PX)</label>
                                                        <input type="number" value={section.settings?.paddingBottom ?? 60} onChange={(e) => updateSectionSettings(section.id, 'paddingBottom', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t pt-10">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-6">Background Brand Color</p>
                                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                                    <input type="color" value={section.settings?.backgroundColor || '#FFFFFF'} onChange={(e) => updateSectionSettings(section.id, 'backgroundColor', e.target.value)} className="h-12 w-12 rounded-xl cursor-pointer border-none p-1 bg-white shadow-sm" />
                                                    <input type="text" value={section.settings?.backgroundColor || '#FFFFFF'} onChange={(e) => updateSectionSettings(section.id, 'backgroundColor', e.target.value)} className="flex-1 bg-transparent text-sm font-mono uppercase font-bold" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'item' && (
                                    <div className="space-y-10 animate-fade-in pb-10">
                                        <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                            <div className="flex-1 text-center md:text-left">
                                                <h4 className="text-sm font-black text-rose-800 uppercase tracking-[0.2em] mb-1">Card Viewport Mode</h4>
                                                <p className="text-xs text-rose-600/80">Select "Standard" for a boxed style with background. "Flat Style" shows text on a clean, transparent background. (Text is visible in both modes)</p>
                                            </div>
                                            <div className="flex gap-2 p-1.5 bg-white rounded-xl border border-rose-200 shadow-sm shrink-0">
                                                <button 
                                                    onClick={() => updateSectionSettings(section.id, 'itemStyle', 'Standard')}
                                                    className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${section.settings?.itemStyle !== 'ImageOnly' ? 'bg-[#16423C] text-white shadow-lg' : 'text-gray-400 hover:text-gray-800'}`}
                                                >
                                                    Boxed (Standard)
                                                </button>
                                                <button 
                                                    onClick={() => updateSectionSettings(section.id, 'itemStyle', 'ImageOnly')}
                                                    className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${section.settings?.itemStyle === 'ImageOnly' ? 'bg-[#16423C] text-white shadow-lg' : 'text-gray-400 hover:text-gray-800'}`}
                                                >
                                                    Flat (Minimal)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                            {/* Item Width/Height Group */}
                                            <div className="space-y-6">
                                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Card Sizing</h5>
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 block mb-1 uppercase tracking-widest">Card Item Width</label>
                                                        <input type="text" value={section.settings?.itemWidth || '280px'} onChange={(e) => updateSectionSettings(section.id, 'itemWidth', e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold" placeholder="280px or 100%" />
                                                        <p className="text-[8px] text-gray-400 mt-1 italic">Use '100%' for standard grids, '280px' or higher for sliders.</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 block mb-1 uppercase tracking-widest">Image Fix Height</label>
                                                        <input type="text" value={section.settings?.itemHeight || 'auto'} onChange={(e) => updateSectionSettings(section.id, 'itemHeight', e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold" placeholder="e.g. 400px" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Typography Group */}
                                            <div className="space-y-6">
                                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Typography (PX)</h5>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><label className="text-[9px] font-bold text-gray-500 block mb-1 uppercase tracking-widest">Title Font</label><input type="number" value={section.settings?.itemTitleSize || 15} onChange={(e) => updateSectionSettings(section.id, 'itemTitleSize', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold" /></div>
                                                    <div><label className="text-[9px] font-bold text-gray-500 block mb-1 uppercase tracking-widest">Price Font</label><input type="number" value={section.settings?.itemPriceSize || 16} onChange={(e) => updateSectionSettings(section.id, 'itemPriceSize', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold" /></div>
                                                </div>
                                            </div>

                                            {/* Structure Group */}
                                            <div className="space-y-6">
                                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Card Structure</h5>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Shadows</label><input type="checkbox" checked={!!section.settings?.itemShadow} onChange={(e) => updateSectionSettings(section.id, 'itemShadow', e.target.checked)} className="h-5 w-5 text-rose-600 rounded" /></div>
                                                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Border</label><input type="checkbox" checked={!!section.settings?.itemBorder} onChange={(e) => updateSectionSettings(section.id, 'itemBorder', e.target.checked)} className="h-5 w-5 text-rose-600 rounded" /></div>
                                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                                        <div><label className="text-[8px] text-gray-400 font-black uppercase">Radius</label><input type="number" value={section.settings?.itemBorderRadius ?? 12} onChange={(e) => updateSectionSettings(section.id, 'itemBorderRadius', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" /></div>
                                                        <div><label className="text-[8px] text-gray-400 font-black uppercase">Gap (PX)</label><input type="number" value={section.settings?.itemGap ?? 24} onChange={(e) => updateSectionSettings(section.id, 'itemGap', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold" /></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* UI Element Group */}
                                            <div className="space-y-6">
                                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">UI Elements</h5>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest capitalize">Show Variants</label><input type="checkbox" checked={section.settings?.showVariants !== false} onChange={(e) => updateSectionSettings(section.id, 'showVariants', e.target.checked)} className="h-5 w-5 text-rose-600 rounded" /></div>
                                                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest capitalize">Show Wishlist</label><input type="checkbox" checked={section.settings?.showWishlist !== false} onChange={(e) => updateSectionSettings(section.id, 'showWishlist', e.target.checked)} className="h-5 w-5 text-rose-600 rounded" /></div>
                                                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest capitalize">Show 'NEW' Badge</label><input type="checkbox" checked={section.settings?.showBadge !== false} onChange={(e) => updateSectionSettings(section.id, 'showBadge', e.target.checked)} className="h-5 w-5 text-rose-600 rounded" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {layout.sections.length === 0 && (
                <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                    <p className="text-gray-400 font-medium text-lg italic">The storefront layout is empty. Use the "Add Section" button to start designing.</p>
                </div>
            )}
        </div>
    );
};

export default HomepageEditor;