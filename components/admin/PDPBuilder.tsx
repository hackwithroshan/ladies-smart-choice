
import React, { useState, useEffect } from 'react';
import { PDPSection, ProductPageLayout, Product, PDPSectionType } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';
import { useSiteData } from '../../contexts/SiteDataContext';
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

const PDPSectionSettings: React.FC<{
    section: PDPSection;
    update: (updates: Partial<PDPSection>) => void;
    token: string | null;
}> = ({ section, update, token }) => {
    const [activeTab, setActiveTab] = useState<'content' | 'design' | 'json'>('content');

    const handleStyleChange = (key: string, val: any) => {
        update({ style: { ...(section.style || {}), [key]: val } });
    };

    const addBlock = () => {
        const currentBlocks = section.content?.blocks || [];
        update({ content: { ...section.content, blocks: [...currentBlocks, { title: 'New Banner Title', text: 'Enter the storytelling subtext here...', img: '' }] } });
    };

    const updateBlock = (idx: number, field: string, val: any) => {
        const currentBlocks = [...(section.content?.blocks || [])];
        currentBlocks[idx] = { ...currentBlocks[idx], [field]: val };
        update({ content: { ...section.content, blocks: currentBlocks } });
    };

    const removeBlock = (idx: number) => {
        const currentBlocks = section.content?.blocks?.filter((_, i) => i !== idx);
        update({ content: { ...section.content, blocks: currentBlocks } });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-100 p-1 text-zinc-500 w-full mb-4 border border-zinc-200 shadow-inner">
                <button onClick={() => setActiveTab('content')} className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'content' ? 'bg-white text-zinc-950 shadow-sm' : 'hover:text-zinc-950'}`}>Content</button>
                <button onClick={() => setActiveTab('design')} className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'design' ? 'bg-white text-zinc-950 shadow-sm' : 'hover:text-zinc-950'}`}>Style</button>
                <button onClick={() => setActiveTab('json')} className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'json' ? 'bg-white text-zinc-950 shadow-sm' : 'hover:text-zinc-950'}`}>JSON</button>
            </div>

            {activeTab === 'content' && (
                <div className="space-y-8">
                    {section.type === 'Hero' && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest leading-tight">Interactive Canvas Mode</p>
                            <p className="text-[11px] text-blue-800 mt-1">Hero section is synchronized with the Product Master. Use "Style" to adjust the container width.</p>
                        </div>
                    )}

                    {section.type === 'A+Content' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b pb-4">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Story Blocks ({section.content?.blocks?.length || 0})</label>
                                <button onClick={addBlock} className="text-[10px] font-black uppercase text-blue-600 hover:underline">+ Add Banner</button>
                            </div>
                            <div className="space-y-6">
                                {(section.content?.blocks || []).map((block: any, idx: number) => (
                                    <div key={idx} className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 space-y-4 shadow-sm group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase italic">Chapter #{idx + 1}</span>
                                            <button onClick={() => removeBlock(idx)} className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2}/></svg></button>
                                        </div>
                                        <div className="space-y-4">
                                            <MediaPicker value={block.img} onChange={v => updateBlock(idx, 'img', v)} type="image" placeholder="Banner Media" />
                                            <input value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} placeholder="Headline (Top)" className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-bold outline-none" />
                                            <textarea value={block.text} onChange={e => updateBlock(idx, 'text', e.target.value)} placeholder="Subtext..." rows={3} className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs outline-none resize-none" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {section.type === 'CustomCode' && (
                        <div className="bg-zinc-900 rounded-2xl overflow-hidden p-1 shadow-2xl">
                            <textarea 
                                value={section.code || ''} 
                                onChange={e => update({ code: e.target.value })}
                                className="w-full bg-zinc-900 text-green-400 font-mono text-[11px] p-6 focus:ring-0 border-none outline-none min-h-[300px] resize-y"
                                placeholder="<!-- HTML/Liquid Injection -->"
                            />
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'design' && (
                <div className="space-y-10 pb-10">
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 bg-zinc-900 rounded-full"></span>
                            Geometry Control
                        </h4>
                        <div className="space-y-6 bg-zinc-50 p-6 rounded-[2rem] border border-zinc-200">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Section Max Width</label>
                                <input 
                                    type="text" 
                                    value={section.style?.containerMaxWidth || '1920px'} 
                                    onChange={e => handleStyleChange('containerMaxWidth', e.target.value)}
                                    className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-zinc-900"
                                    placeholder="e.g. 1920px or 100%"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Minimum Height</label>
                                <input 
                                    type="text" 
                                    value={section.style?.minHeight || 'auto'} 
                                    onChange={e => handleStyleChange('minHeight', e.target.value)}
                                    className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-zinc-900"
                                    placeholder="e.g. 600px or auto"
                                />
                             </div>
                            <div className="grid grid-cols-2 gap-4">
                                <ShadcnSlider label="Top Padding" value={section.style?.paddingTop ?? 40} onChange={v => handleStyleChange('paddingTop', v)} max={200} />
                                <ShadcnSlider label="Bottom Padding" value={section.style?.paddingBottom ?? 80} onChange={v => handleStyleChange('paddingBottom', v)} max={200} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 bg-zinc-900 rounded-full"></span>
                            Visual Architecture
                        </h4>
                        <div className="space-y-6 bg-zinc-50 p-6 rounded-[2rem] border border-zinc-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Background</label>
                                    <input type="color" value={section.style?.backgroundColor || '#FFFFFF'} onChange={e => handleStyleChange('backgroundColor', e.target.value)} className="w-full h-11 rounded-xl border-none p-1 cursor-pointer bg-white shadow-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Text Color</label>
                                    <input type="color" value={section.style?.textColor || '#000000'} onChange={e => handleStyleChange('textColor', e.target.value)} className="w-full h-11 rounded-xl border-none p-1 cursor-pointer bg-white shadow-sm" />
                                </div>
                            </div>
                            <ShadcnSlider label="Layout Rounding" value={section.style?.radius ?? 0} onChange={v => handleStyleChange('radius', v)} max={100} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PDPBuilder: React.FC<{ token: string | null; productId: string }> = ({ token, productId }) => {
    const [layout, setLayout] = useState<ProductPageLayout>({ productId, isGlobal: productId === 'global', sections: [], stickyAtcEnabled: true });
    const [activeSecId, setActiveSecId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

    useEffect(() => {
        const fetchDesignerData = async () => {
            setLoading(true);
            try {
                const lRes = await fetch(getApiUrl(`settings/pdp-layout/${productId}`));
                if (lRes.ok) {
                    const data = await lRes.json();
                    if (data && data.sections) setLayout(prev => ({ ...prev, ...data }));
                }
                const pRes = await fetch(getApiUrl(productId !== 'global' ? `products/${productId}` : 'products/featured'));
                if (pRes.ok) {
                    const pData = await pRes.json();
                    setPreviewProduct(Array.isArray(pData) ? pData[0] : pData);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchDesignerData();
    }, [productId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(getApiUrl(`settings/pdp-layout/${productId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(layout)
            });
            alert('PDP Blueprint Published!');
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const addSection = (type: PDPSectionType) => {
        const newSec: PDPSection = {
            id: `pdp-${type.toLowerCase()}-${Date.now()}`,
            type,
            isActive: true,
            content: { blocks: [], faqs: [] },
            style: { 
                paddingTop: 40, paddingBottom: 80, 
                backgroundColor: '#FFFFFF', textColor: '#000000', 
                radius: 0, 
                containerMaxWidth: '1920px',
                minHeight: 'auto'
            }
        };
        setLayout(prev => ({ ...prev, sections: [...prev.sections, newSec] }));
        setActiveSecId(newSec.id);
    };

    const removeSection = (id: string) => {
        if(!window.confirm("Permanently discard this layout section?")) return;
        setLayout(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== id) }));
        if(activeSecId === id) setActiveSecId(null);
    };

    const updateSection = (id: string, updates: Partial<PDPSection>) => {
        setLayout(prev => ({ ...prev, sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } : s) }));
    };

    const activeSection = layout.sections.find(s => s.id === activeSecId);

    if (loading) return <div className="h-full flex items-center justify-center font-black italic text-zinc-400 animate-pulse tracking-widest uppercase">Booting PDP Engine...</div>;

    return (
        <div className="flex h-[calc(100vh-120px)] bg-zinc-50 -m-6 md:-m-8 overflow-hidden border-t">
            <div className="w-[300px] bg-white border-r flex flex-col shrink-0 shadow-xl relative z-20">
                <div className="p-6 border-b space-y-5 bg-zinc-50/50">
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Page Layers</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {['Hero', 'A+Content', 'FAQ', 'Reviews', 'RelatedProducts', 'CustomCode'].map(t => (
                            <button key={t} onClick={() => addSection(t as any)} className="w-full text-left px-4 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl hover:border-zinc-900 transition-all active:scale-95 shadow-sm">+ {t}</button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 admin-scroll">
                    {layout.sections.map((sec, i) => (
                        <div key={sec.id} onClick={() => setActiveSecId(sec.id)} className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${activeSecId === sec.id ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl' : 'bg-zinc-50 border-zinc-100 hover:border-zinc-300'}`}>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black opacity-50 uppercase tracking-widest">{sec.type}</span>
                                <span className="text-xs font-bold truncate max-w-[120px]">Layer #{i+1}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }} className="p-1.5 hover:bg-rose-500 rounded-lg text-zinc-400 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t bg-zinc-50/50">
                    <button onClick={handleSave} disabled={saving} className="w-full bg-zinc-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic shadow-2xl hover:brightness-110 active:scale-95 transition-all">
                        {saving ? 'Syncing...' : 'Publish Blueprint'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 admin-scroll bg-zinc-200/40">
                <div className="w-full bg-white shadow-2xl rounded-sm min-h-screen mx-auto relative overflow-hidden border">
                    <div className="text-center p-2 bg-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b">1920px Canvas Simulator</div>
                    {layout.sections.map(sec => sec.isActive && (
                        <div 
                            key={sec.id} 
                            style={{ 
                                paddingTop: `${sec.style?.paddingTop}px`, paddingBottom: `${sec.style?.paddingBottom}px`,
                                marginTop: `${sec.style?.marginTop}px`, marginBottom: `${sec.style?.marginBottom}px`,
                                color: sec.style?.textColor,
                                backgroundColor: sec.style?.backgroundColor,
                                width: '100%',
                                minHeight: sec.style?.minHeight || 'auto'
                            }} 
                            className={`relative transition-all ${activeSecId === sec.id ? 'ring-4 ring-blue-500/30 z-10' : ''}`}
                            onClick={() => setActiveSecId(sec.id)}
                        >
                            <div className="mx-auto" style={{ maxWidth: sec.style?.containerMaxWidth || '1920px' }}>
                                {sec.type === 'Hero' && (
                                    <div className="px-10 py-20 bg-zinc-50 border-y border-zinc-100 text-center">
                                        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Product Hero Hub</h2>
                                        <p className="text-xs font-bold text-zinc-400 mt-2">WIDTH: {sec.style?.containerMaxWidth}</p>
                                    </div>
                                )}
                                {sec.type === 'A+Content' && (
                                    <div className="space-y-10 px-10">
                                        <div className="h-6 w-1/3 bg-zinc-100 rounded-full mx-auto" />
                                        <div className="aspect-[21/9] bg-zinc-50 border-4 border-dashed border-zinc-100 flex items-center justify-center text-zinc-300 font-bold uppercase text-xs italic tracking-widest">A+ Stacked Banner View</div>
                                    </div>
                                )}
                                {['FAQ', 'Reviews', 'RelatedProducts', 'CustomCode'].includes(sec.type) && (
                                    <div className="py-20 text-center border-4 border-dashed border-zinc-100 rounded-[3rem] mx-10 bg-zinc-50/50">
                                        <p className="text-zinc-300 font-black uppercase text-xs tracking-[0.4em] italic">{sec.type} LAYER</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-[380px] bg-white border-l flex flex-col shrink-0 shadow-2xl z-30">
                {activeSection ? (
                    <div className="flex flex-col h-full">
                        <div className="p-8 border-b bg-zinc-50/50 flex items-center justify-between">
                            <div>
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Layer Settings</h2>
                                <h3 className="text-lg font-black uppercase italic text-zinc-900">{activeSection.type}</h3>
                            </div>
                            <button onClick={() => updateSection(activeSection.id, { isActive: !activeSection.isActive })} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border transition-all ${activeSection.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-100 text-zinc-400'}`}>{activeSection.isActive ? 'VISIBLE' : 'HIDDEN'}</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 admin-scroll bg-white">
                            <PDPSectionSettings section={activeSection} update={(upd) => updateSection(activeSection.id, upd)} token={token} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center text-zinc-300 gap-4">
                        <div className="w-16 h-16 border-4 border-dashed border-zinc-100 rounded-2xl rotate-12" />
                        <p className="font-black uppercase italic text-[11px] tracking-widest leading-loose">Select a layer to customize<br/>geometry and content</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDPBuilder;
