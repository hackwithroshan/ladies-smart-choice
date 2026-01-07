import React, { useState, useEffect, useRef } from 'react';
import { HomeSection, HomepageLayout, Collection } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { COLORS } from '../../constants';

const ShadcnSlider: React.FC<{ label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }> = ({ label, value, onChange, min = 0, max = 100, unit = 'px' }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</label>
            <span className="text-[10px] font-mono font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">{value}{unit}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
        />
    </div>
);

const HomepageEditor: React.FC<{ token: string | null }> = ({ token }) => {
    const [layout, setLayout] = useState<HomepageLayout>({ sections: [] });
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [activeEditId, setActiveEditId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'json'>('content');
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
            alert('Fix JSON syntax errors before saving.');
            return;
        }
        setSaving(true);
        try {
            await fetch(getApiUrl('/api/settings/layout'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(layout)
            });
            alert('Storefront Published!');
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const addSection = (type: HomeSection['type']) => {
        const newSection: HomeSection = {
            id: `sec-${Date.now()}`,
            type,
            isActive: true,
            title: `New ${type} Section`,
            code: type === 'CustomCode' ? '<div class="p-20 text-center"><h2 style="color: {{color}}">{{title}}</h2></div>' : '',
            settingsJson: type === 'CustomCode' ? '{\n  "title": "Enter Title",\n  "color": "#16423C"\n}' : '',
            settings: { 
                paddingTop: 80, 
                paddingBottom: 80, 
                paddingLeft: 0,
                paddingRight: 0,
                marginTop: 0,
                marginBottom: 0,
                backgroundColor: '#FFFFFF',
                textColor: '#000000',
                desktopWidth: '1400px',
                mobileWidth: '100%',
                alignment: 'center',
                limit: 8,
                isSlider: true,
                textAlign: 'center'
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

    const handleJsonChange = (id: string, value: string) => {
        updateSection(id, { settingsJson: value });
        if (!value.trim()) {
            setJsonError(null);
            return;
        }
        try {
            JSON.parse(value);
            setJsonError(null);
        } catch (e: any) {
            setJsonError(e.message);
        }
    };

    if (loading) return <div className="p-20 text-center font-black italic text-zinc-400 animate-pulse">Syncing Layout Engine...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-xl border border-zinc-100 sticky top-0 z-[60]">
                <div className="flex flex-col">
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tighter italic">Live Designer</h3>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em] mt-1">Homepage Visual Control</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative" ref={addMenuRef}>
                         <button 
                            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                            className="bg-zinc-50 text-zinc-800 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-zinc-200 hover:bg-zinc-100 transition-all flex items-center gap-3 shadow-sm"
                         >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={3}/></svg>
                             Add Block
                         </button>
                         {isAddMenuOpen && (
                            <div className="absolute right-0 top-full mt-3 w-64 bg-white shadow-2xl rounded-3xl border border-zinc-100 z-[70] overflow-hidden animate-fade-in-up p-1.5">
                                {['Hero', 'Collections', 'NewArrivals', 'BestSellers', 'Videos', 'Newsletter', 'CustomCode'].map(t => (
                                    <button 
                                        key={t} 
                                        onClick={() => addSection(t as any)} 
                                        className="w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-zinc-500 hover:bg-[#16423C] hover:text-white transition-all rounded-2xl"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                         )}
                    </div>
                    <button onClick={handleSave} disabled={saving} className="bg-[#16423C] text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] italic shadow-[0_15px_30px_-5px_rgba(22,66,60,0.4)] hover:brightness-110 disabled:opacity-50 transition-all transform active:scale-95">
                        {saving ? 'Syncing...' : 'Save & Publish'}
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {layout.sections.map((section, index) => (
                    <div key={section.id} className={`bg-white border-2 rounded-[2.5rem] shadow-sm overflow-hidden transition-all duration-500 ${section.isActive ? 'border-zinc-200 shadow-xl' : 'border-dashed border-zinc-300 opacity-60'}`}>
                        <div className="bg-zinc-50/80 px-8 py-6 border-b flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <button onClick={() => moveSection(index, 'up')} className="text-zinc-300 hover:text-zinc-900 transition-colors" disabled={index === 0}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg></button>
                                    <button onClick={() => moveSection(index, 'down')} className="text-zinc-300 hover:text-zinc-900 transition-colors" disabled={index === layout.sections.length - 1}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg></button>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-[#6A9C89]/10 text-[#16423C] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#16423C]/10">{section.type} Block</span>
                                        <button onClick={() => { setActiveEditId(activeEditId === section.id ? null : section.id); setActiveTab('content'); }} className="text-[9px] font-black uppercase text-blue-600 underline tracking-widest hover:text-blue-800">
                                            {activeEditId === section.id ? 'CLOSE EDITOR' : 'EDIT SETTINGS'}
                                        </button>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={section.title || ''} 
                                        onChange={(e) => updateSection(section.id, { title: e.target.value })} 
                                        className="font-black text-zinc-900 bg-transparent border-none focus:ring-0 p-0 text-xl placeholder-zinc-200 w-full md:w-96 italic uppercase tracking-tighter"
                                        placeholder="Enter Section Headline"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Visibility</p>
                                        <p className={`text-[10px] font-black tracking-widest ${section.isActive ? 'text-emerald-500' : 'text-zinc-300'}`}>{section.isActive ? 'ACTIVE' : 'HIDDEN'}</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={section.isActive} 
                                        onChange={() => updateSection(section.id, { isActive: !section.isActive })}
                                        className="w-6 h-6 text-[#16423C] rounded-xl border-zinc-200 focus:ring-[#16423C]"
                                    />
                                </label>
                                <button onClick={() => removeSection(section.id)} className="text-zinc-300 hover:text-rose-500 p-2 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
                                </button>
                            </div>
                        </div>

                        {activeEditId === section.id && (
                            <div className="p-10 bg-white border-t border-zinc-50 animate-fade-in">
                                <div className="flex gap-10 mb-10 border-b border-zinc-100 pb-2">
                                    <button onClick={() => setActiveTab('content')} className={`text-[10px] font-black uppercase tracking-[0.25em] pb-3 border-b-2 transition-all ${activeTab === 'content' ? 'border-[#16423C] text-[#16423C]' : 'border-transparent text-zinc-300'}`}>Block Content</button>
                                    <button onClick={() => setActiveTab('style')} className={`text-[10px] font-black uppercase tracking-[0.25em] pb-3 border-b-2 transition-all ${activeTab === 'style' ? 'border-[#16423C] text-[#16423C]' : 'border-transparent text-zinc-300'}`}>Visual Control</button>
                                    {section.type === 'CustomCode' && (
                                        <button onClick={() => setActiveTab('json')} className={`text-[10px] font-black uppercase tracking-[0.25em] pb-3 border-b-2 transition-all ${activeTab === 'json' ? 'border-[#16423C] text-[#16423C]' : 'border-transparent text-zinc-300'}`}>Context Variables</button>
                                    )}
                                </div>

                                {activeTab === 'content' && (
                                    <div className="space-y-8 animate-fade-in">
                                        {section.type === 'CustomCode' ? (
                                            <div className="bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-800">
                                                <div className="flex items-center justify-between px-8 py-4 bg-zinc-800/50 border-b border-zinc-800">
                                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Master HTML/CSS/JS Sandbox</span>
                                                </div>
                                                <textarea 
                                                    value={section.code || ''} 
                                                    onChange={(e) => updateSection(section.id, { code: e.target.value })}
                                                    className="w-full bg-zinc-900 text-emerald-400 font-mono text-[11px] p-10 focus:ring-0 border-none outline-none min-h-[450px] resize-y"
                                                    placeholder="<div class='custom-block'>...</div>"
                                                />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl">
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest">Supporting Subheadline</label>
                                                    <textarea 
                                                        value={section.settings?.subtitle || ''} 
                                                        onChange={(e) => updateSectionSettings(section.id, 'subtitle', e.target.value)}
                                                        className="w-full border border-zinc-200 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-[#16423C] outline-none bg-zinc-50/50"
                                                        rows={3}
                                                        placeholder="Add secondary text for this section..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest">Entry Limit</label>
                                                        <input type="number" value={section.settings?.limit || 8} onChange={(e) => updateSectionSettings(section.id, 'limit', parseInt(e.target.value))} className="w-full border border-zinc-200 rounded-xl p-4 text-sm font-bold bg-zinc-50/50" />
                                                    </div>
                                                    <div className="flex flex-col justify-center gap-2">
                                                        <label className="text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest">Layout Engine</label>
                                                        <button 
                                                            onClick={() => updateSectionSettings(section.id, 'isSlider', !section.settings?.isSlider)}
                                                            className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${section.settings?.isSlider ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-900 hover:text-zinc-900'}`}
                                                        >
                                                            {section.settings?.isSlider ? 'SLIDER MODE' : 'GRID MODE'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'style' && (
                                    <div className="space-y-12 max-w-6xl animate-fade-in">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                            <div className="space-y-8">
                                                <p className="text-[10px] font-black uppercase text-zinc-950 tracking-[0.3em] flex items-center gap-3">
                                                    <span className="w-4 h-0.5 bg-[#16423C]"></span> Box Model & Geometry
                                                </p>
                                                <div className="grid grid-cols-2 gap-8 bg-zinc-50/50 p-8 rounded-[2rem] border border-zinc-100">
                                                    <ShadcnSlider label="Vertical Padding" value={section.settings?.paddingTop ?? 80} onChange={v => { updateSectionSettings(section.id, 'paddingTop', v); updateSectionSettings(section.id, 'paddingBottom', v); }} max={400} />
                                                    <ShadcnSlider label="Bottom Spacing" value={section.settings?.marginBottom ?? 0} onChange={v => updateSectionSettings(section.id, 'marginBottom', v)} max={200} />
                                                    <div className="col-span-2 space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-zinc-400 block mb-1 uppercase tracking-widest">Desktop Canvas Width</label>
                                                            <input type="text" value={section.settings?.desktopWidth || '1400px'} onChange={(e) => updateSectionSettings(section.id, 'desktopWidth', e.target.value)} className="w-full border border-zinc-200 rounded-xl p-4 text-xs font-mono bg-white shadow-sm" placeholder="1400px" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <p className="text-[10px] font-black uppercase text-zinc-950 tracking-[0.3em] flex items-center gap-3">
                                                    <span className="w-4 h-0.5 bg-[#16423C]"></span> Color & Typography
                                                </p>
                                                <div className="space-y-8 bg-zinc-50/50 p-8 rounded-[2rem] border border-zinc-100">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-zinc-400 block mb-2 uppercase tracking-widest">Base Background</label>
                                                            <div className="flex gap-3 items-center bg-white p-2 rounded-xl border border-zinc-200">
                                                                <input type="color" value={section.settings?.backgroundColor || '#FFFFFF'} onChange={(e) => updateSectionSettings(section.id, 'backgroundColor', e.target.value)} className="h-10 w-10 rounded-lg cursor-pointer border-none p-1 shadow-sm" />
                                                                <span className="text-[10px] font-mono font-bold uppercase">{section.settings?.backgroundColor || '#FFFFFF'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-zinc-400 block mb-2 uppercase tracking-widest">Content Alignment</label>
                                                            <div className="flex p-1 bg-white rounded-xl border border-zinc-200 shadow-sm">
                                                                {['left', 'center', 'right'].map(align => (
                                                                    <button 
                                                                        key={align}
                                                                        onClick={() => updateSectionSettings(section.id, 'alignment', align)}
                                                                        className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${section.settings?.alignment === align ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-50'}`}
                                                                    >
                                                                        {align}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'json' && (
                                    <div className="space-y-6 animate-fade-in max-w-4xl">
                                        <div className="p-6 bg-[#16423C] text-white rounded-3xl shadow-xl flex items-center gap-6">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black italic">!</div>
                                            <div>
                                                <p className="font-black uppercase tracking-widest text-xs italic">Developer Mode Active</p>
                                                <p className="text-[11px] opacity-70 mt-1">Use this JSON object to pass custom variables into your SafeCustomCode blocks. Syntax: <code>{"{{variable_name}}"}</code></p>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-800">
                                            <div className="flex items-center justify-between px-8 py-4 bg-zinc-800/50 border-b border-zinc-800">
                                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Context Definition (JSON)</span>
                                                {jsonError && <span className="text-[9px] text-rose-500 font-black uppercase animate-pulse italic">Syntax Error Detected</span>}
                                            </div>
                                            <textarea 
                                                value={section.settingsJson || ''} 
                                                onChange={(e) => handleJsonChange(section.id, e.target.value)}
                                                className={`w-full bg-zinc-900 text-orange-200 font-mono text-[11px] p-10 focus:ring-0 border-none outline-none min-h-[350px] resize-y ${jsonError ? 'text-rose-200' : ''}`}
                                                placeholder='{ "custom_title": "World Class", "theme_hue": "#16423C" }'
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {layout.sections.length === 0 && (
                <div className="py-40 text-center bg-zinc-50 rounded-[4rem] border-4 border-dashed border-zinc-100">
                    <div className="flex flex-col items-center gap-6">
                        <span className="text-5xl grayscale opacity-20">🏗️</span>
                        <p className="text-zinc-300 font-black uppercase tracking-[0.4em] text-xs italic">Storefront Blueprint Empty</p>
                        <button onClick={() => setIsAddMenuOpen(true)} className="text-[#16423C] font-black text-[10px] uppercase tracking-widest underline hover:opacity-70 transition-opacity">Launch Block Selector</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomepageEditor;