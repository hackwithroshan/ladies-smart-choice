
import React, { useState, useEffect, useRef } from 'react';
import { HomeSection, HomepageLayout, Collection } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { COLORS } from '../../constants';
import { useSiteData } from '../../contexts/SiteDataContext';
import { cn } from '../../utils/utils';

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
    const { refreshSiteData } = useSiteData();
    const [layout, setLayout] = useState<HomepageLayout>({ sections: [] });
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [activeEditId, setActiveEditId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'json'>('content');
    const addMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const [lRes, cRes] = await Promise.all([
                    fetch(getApiUrl('settings/layout')),
                    fetch(getApiUrl('collections/admin/all'), { headers: { 'Authorization': `Bearer ${token}` } })
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
    }, [token]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(getApiUrl('settings/layout'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(layout)
            });
            if (response.ok) {
                await refreshSiteData();
                alert('Layout Published Successfully!');
            }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const addSection = (type: HomeSection['type']) => {
        const newSection: HomeSection = {
            id: `sec-${Date.now()}`,
            type,
            isActive: true,
            title: `New ${type}`,
            settings: { 
                paddingTop: 60, paddingBottom: 60, paddingLeft: 20, paddingRight: 20,
                marginTop: 0, marginBottom: 0,
                backgroundColor: '#FFFFFF', textColor: '#111827',
                titleSize: 32, titleWeight: 900, titleItalic: false,
                subtitleSize: 14, subtitleWeight: 500, subtitleItalic: false,
                alignment: 'center', limit: 8, isSlider: true
            }
        };
        setLayout({ ...layout, sections: [...layout.sections, newSection] });
        setIsAddMenuOpen(false);
        setActiveEditId(newSection.id);
    };

    const updateSectionSettings = (id: string, key: string, value: any) => {
        setLayout({
            ...layout,
            sections: layout.sections.map(s => s.id === id ? { ...s, settings: { ...(s.settings || {}), [key]: value } } : s)
        });
    };

    const updateSection = (id: string, updates: Partial<HomeSection>) => {
        setLayout({
            ...layout,
            sections: layout.sections.map(s => s.id === id ? { ...s, ...updates } : s)
        });
    };

    if (loading) return <div className="p-20 text-center font-black uppercase text-zinc-300 italic">Syncing Layout...</div>;

    return (
        <div className="space-y-8 pb-40">
            <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-xl border border-zinc-100 sticky top-0 z-[60]">
                <div className="flex flex-col">
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tighter italic leading-none">Layout Designer</h3>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em] mt-1">Homepage Visual Architecture</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative" ref={addMenuRef}>
                         <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className="bg-zinc-50 text-zinc-800 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-zinc-200 hover:bg-zinc-100 transition-all flex items-center gap-3">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={3}/></svg> Add Block
                         </button>
                         {isAddMenuOpen && (
                            <div className="absolute right-0 top-full mt-3 w-64 bg-white shadow-2xl rounded-3xl border border-zinc-100 z-[70] overflow-hidden p-1.5 animate-in fade-in zoom-in-95">
                                {['Hero', 'Collections', 'NewArrivals', 'BestSellers', 'Videos', 'Newsletter', 'CustomCode'].map(t => (
                                    <button key={t} onClick={() => addSection(t as any)} className="w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-zinc-500 hover:bg-[#16423C] hover:text-white transition-all rounded-2xl">{t}</button>
                                ))}
                            </div>
                         )}
                    </div>
                    <button onClick={handleSave} disabled={saving} className="bg-[#16423C] text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:brightness-110 disabled:opacity-50">
                        {saving ? 'Publishing...' : 'Save & Publish'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {layout.sections.map((section, idx) => (
                    <div key={section.id} className={cn("bg-white border-2 rounded-[2.5rem] shadow-sm overflow-hidden transition-all duration-500", activeEditId === section.id ? "border-zinc-900 ring-4 ring-zinc-100" : "border-zinc-100")}>
                        <div className="px-8 py-6 flex justify-between items-center border-b">
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-[9px] font-black uppercase text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">{section.type}</span>
                                    <input value={section.title || ''} onChange={(e) => updateSection(section.id, { title: e.target.value })} className="font-black text-xl bg-transparent border-none p-0 outline-none uppercase italic tracking-tighter w-full max-w-sm mt-1" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveEditId(activeEditId === section.id ? null : section.id)} className="text-[10px] font-black text-blue-600 underline uppercase tracking-widest">
                                    {activeEditId === section.id ? 'Close' : 'Design Style'}
                                </button>
                                <input type="checkbox" checked={section.isActive} onChange={() => updateSection(section.id, { isActive: !section.isActive })} className="w-5 h-5 text-[#16423C] rounded-lg border-zinc-200" />
                            </div>
                        </div>

                        {activeEditId === section.id && (
                            <div className="p-10 animate-in fade-in duration-300">
                                <div className="flex gap-8 mb-10 border-b pb-2">
                                    {['content', 'style'].map(tab => (
                                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("text-[11px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all", activeTab === tab ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-300")}>{tab}</button>
                                    ))}
                                </div>

                                {activeTab === 'content' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Headline</label><input value={section.title || ''} onChange={e => updateSection(section.id, { title: e.target.value })} className="w-full border rounded-xl p-3 text-sm font-bold" /></div>
                                            <div><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Subtitle</label><textarea value={section.settings?.subtitle || ''} onChange={e => updateSectionSettings(section.id, 'subtitle', e.target.value)} className="w-full border rounded-xl p-3 text-sm font-medium" rows={3} /></div>
                                        </div>
                                        <div className="bg-zinc-50 p-6 rounded-3xl border space-y-6 flex flex-col justify-center">
                                            <div className="flex gap-4">
                                                <div className="flex-1"><label className="text-[10px] font-black text-zinc-400 uppercase mb-2 block">Display Limit</label><input type="number" value={section.settings?.limit || 8} onChange={e => updateSectionSettings(section.id, 'limit', parseInt(e.target.value))} className="w-full border rounded-xl p-3 text-sm font-bold" /></div>
                                                <div className="flex flex-col justify-end"><button onClick={() => updateSectionSettings(section.id, 'isSlider', !section.settings?.isSlider)} className={cn("h-[46px] px-6 rounded-xl text-[10px] font-black uppercase border transition-all", section.settings?.isSlider ? "bg-zinc-900 text-white shadow-lg" : "bg-white text-zinc-400")}>{section.settings?.isSlider ? 'Slider Active' : 'Grid Active'}</button></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'style' && (
                                    <div className="space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-8">
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2"><div className="w-1.5 h-4 bg-[#16423C] rounded-full"></div> Geometry & Spacing</h4>
                                                <div className="bg-zinc-50 p-8 rounded-[2rem] border space-y-6">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <ShadcnSlider label="Margin Top" value={section.settings?.marginTop ?? 0} onChange={v => updateSectionSettings(section.id, 'marginTop', v)} max={150} />
                                                        <ShadcnSlider label="Margin Bottom" value={section.settings?.marginBottom ?? 0} onChange={v => updateSectionSettings(section.id, 'marginBottom', v)} max={150} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-200">
                                                        <ShadcnSlider label="Padding Top" value={section.settings?.paddingTop ?? 60} onChange={v => updateSectionSettings(section.id, 'paddingTop', v)} max={200} />
                                                        <ShadcnSlider label="Padding Bottom" value={section.settings?.paddingBottom ?? 60} onChange={v => updateSectionSettings(section.id, 'paddingBottom', v)} max={200} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <ShadcnSlider label="Padding Left" value={section.settings?.paddingLeft ?? 20} onChange={v => updateSectionSettings(section.id, 'paddingLeft', v)} max={100} />
                                                        <ShadcnSlider label="Padding Right" value={section.settings?.paddingRight ?? 20} onChange={v => updateSectionSettings(section.id, 'paddingRight', v)} max={100} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2"><div className="w-1.5 h-4 bg-zinc-900 rounded-full"></div> Typography Engine</h4>
                                                <div className="bg-zinc-900 p-8 rounded-[2rem] text-white space-y-8 shadow-2xl">
                                                    <div className="space-y-6 border-b border-white/10 pb-6">
                                                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Headline Styles</p>
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex-1"><ShadcnSlider label="Size" value={section.settings?.titleSize ?? 32} onChange={v => updateSectionSettings(section.id, 'titleSize', v)} min={14} max={100} /></div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => updateSectionSettings(section.id, 'titleItalic', !section.settings?.titleItalic)} className={cn("w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center font-serif italic text-sm", section.settings?.titleItalic ? "bg-white text-zinc-900" : "hover:bg-white/10")}>I</button>
                                                                <select value={section.settings?.titleWeight || 900} onChange={e => updateSectionSettings(section.id, 'titleWeight', parseInt(e.target.value))} className="bg-zinc-800 border-white/10 rounded-xl text-[10px] font-black p-2 outline-none">
                                                                    {[100, 300, 400, 500, 700, 900].map(w => <option key={w} value={w}>{w}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-6">
                                                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Subtitle Narrative</p>
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex-1"><ShadcnSlider label="Size" value={section.settings?.subtitleSize ?? 14} onChange={v => updateSectionSettings(section.id, 'subtitleSize', v)} min={10} max={32} /></div>
                                                            <button onClick={() => updateSectionSettings(section.id, 'subtitleItalic', !section.settings?.subtitleItalic)} className={cn("w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center font-serif italic text-sm", section.settings?.subtitleItalic ? "bg-white text-zinc-900" : "hover:bg-white/10")}>I</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-zinc-50 p-8 rounded-[2rem] border">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Background</label>
                                                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border shadow-sm"><input type="color" value={section.settings?.backgroundColor || '#FFFFFF'} onChange={e => updateSectionSettings(section.id, 'backgroundColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-none" /><span className="text-[10px] font-mono font-bold uppercase">{section.settings?.backgroundColor}</span></div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Global Text</label>
                                                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border shadow-sm"><input type="color" value={section.settings?.textColor || '#000000'} onChange={e => updateSectionSettings(section.id, 'textColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-none" /><span className="text-[10px] font-mono font-bold uppercase">{section.settings?.textColor}</span></div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Alignment</label>
                                                <div className="flex p-1 bg-white rounded-xl border shadow-sm">
                                                    {['left', 'center', 'right'].map(a => <button key={a} onClick={() => updateSectionSettings(section.id, 'alignment', a)} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", section.settings?.alignment === a ? "bg-zinc-900 text-white shadow-md" : "text-zinc-400")}>{a}</button>)}
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
        </div>
    );
};

export default HomepageEditor;
