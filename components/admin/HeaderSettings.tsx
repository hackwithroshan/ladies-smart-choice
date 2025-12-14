
import React, { useState, useEffect, useRef } from 'react';
import { HeaderSettings, HeaderLink, Product, BlogPost, ContentPage, MegaMenuColumn, SubLink } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';

// --- INITIAL STATE ---
const initialSettings: HeaderSettings = {
    logoText: '',
    logoUrl: '',
    brandColor: '#E11D48',
    phoneNumber: '',
    announcementMessage: '',
    announcementMessages: [],
    announcementBgColor: '#E1B346',
    announcementTextColor: '#FFFFFF',
    topBarLinks: [],
    mainNavLinks: [],
};

// --- LINK PICKER COMPONENT ---
interface LinkPickerProps {
    value: string;
    onChange: (value: string) => void;
    data: { products: Product[]; blogs: BlogPost[]; pages: ContentPage[]; };
    className?: string;
    placeholder?: string;
}

const LinkPicker: React.FC<LinkPickerProps> = ({ value, onChange, data, className, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'root' | 'products' | 'blogs' | 'pages'>('root');
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setView('root');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filterItems = (items: any[], key: string) => {
        return items.filter(item => 
            item.slug && item[key] && item[key].toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const renderContent = () => {
        const itemClass = "px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center transition-colors";
        
        if (view === 'root') {
            return (
                <div className="py-1">
                    {['Pages', 'Blogs', 'Products'].map((type) => (
                        <div key={type} className={itemClass} onClick={() => setView(type.toLowerCase() as any)}>
                            <span>{type}</span>
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    ))}
                </div>
            );
        }

        let items: any[] = [];
        let prefix = "";
        let key = "";

        if (view === 'products') { items = data.products; prefix = "/product/"; key = "name"; }
        if (view === 'blogs') { items = data.blogs; prefix = "/blogs/"; key = "title"; }
        if (view === 'pages') { items = data.pages; prefix = "/pages/"; key = "title"; }

        const filtered = filterItems(items, key);

        return (
            <>
                <div className="px-3 py-2 text-xs font-bold text-gray-500 bg-gray-50 border-b flex items-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => { setView('root'); setSearchTerm(''); }}>
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
                </div>
                <div className="p-2 border-b"><input type="text" autoFocus placeholder="Search..." className="w-full border-gray-200 rounded text-xs p-1 focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {filtered.length > 0 ? filtered.map((item: any) => (
                        <div key={item.id || item._id} className={itemClass} onClick={() => { onChange(`${prefix}${item.slug}`); setIsOpen(false); }}>
                            <span className="truncate">{item[key]}</span>
                        </div>
                    )) : <div className="px-4 py-2 text-xs text-gray-500">No items found</div>}
                </div>
            </>
        );
    };

    return (
        <div className={`relative w-full ${className}`} ref={wrapperRef}>
            <div className="flex group">
                <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setIsOpen(true)} className="flex-1 min-w-0 block w-full px-3 py-2 text-xs border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 transition-shadow" placeholder={placeholder || "https://..."} />
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>
            {isOpen && <div className="absolute z-50 mt-1 w-full min-w-[240px] bg-white shadow-xl rounded-md border border-gray-200 right-0">{renderContent()}</div>}
        </div>
    );
};

// --- SUB MENU / MEGA MENU EDITOR ---
const NavigationEditor: React.FC<{ 
    link: HeaderLink; 
    onChange: (updated: HeaderLink) => void;
    pickerData: any;
}> = ({ link, onChange, pickerData }) => {
    
    // Helper to update specific sub-links
    const updateSubLink = (idx: number, field: keyof SubLink, val: string) => {
        const newLinks = [...(link.subLinks || [])];
        newLinks[idx] = { ...newLinks[idx], [field]: val };
        onChange({ ...link, subLinks: newLinks });
    };

    // Helper to update mega columns
    const updateMegaColumn = (colIdx: number, field: keyof MegaMenuColumn, val: any) => {
        const newCols = [...(link.megaColumns || [])];
        newCols[colIdx] = { ...newCols[colIdx], [field]: val };
        onChange({ ...link, megaColumns: newCols });
    };

    const addMegaLink = (colIdx: number) => {
        const newCols = [...(link.megaColumns || [])];
        newCols[colIdx].links = [...(newCols[colIdx].links || []), { text: 'New Link', url: '#' }];
        onChange({ ...link, megaColumns: newCols });
    };

    const updateMegaLink = (colIdx: number, linkIdx: number, field: keyof SubLink, val: string) => {
        const newCols = [...(link.megaColumns || [])];
        newCols[colIdx].links[linkIdx] = { ...newCols[colIdx].links[linkIdx], [field]: val };
        onChange({ ...link, megaColumns: newCols });
    };

    const removeMegaLink = (colIdx: number, linkIdx: number) => {
        const newCols = [...(link.megaColumns || [])];
        newCols[colIdx].links = newCols[colIdx].links.filter((_, i) => i !== linkIdx);
        onChange({ ...link, megaColumns: newCols });
    };

    return (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-6 animate-fade-in shadow-inner">
            {/* Mega Menu Toggle */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <div>
                    <h4 className="text-sm font-bold text-gray-800">Menu Type Configuration</h4>
                    <p className="text-xs text-gray-500 mt-1">Choose "Mega Menu" to display a full-width multi-column dropdown.</p>
                </div>
                <div className="flex items-center bg-white rounded-lg p-1 border border-gray-300 shadow-sm">
                    <button 
                        onClick={() => onChange({ ...link, isMegaMenu: false })}
                        className={`px-5 py-2 text-xs font-bold rounded-md transition-all ${!link.isMegaMenu ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Standard Dropdown
                    </button>
                    <button 
                        onClick={() => onChange({ ...link, isMegaMenu: true })}
                        className={`px-5 py-2 text-xs font-bold rounded-md transition-all ${link.isMegaMenu ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Mega Menu
                    </button>
                </div>
            </div>

            {/* Standard Menu Editor */}
            {!link.isMegaMenu && (
                <div className="max-w-3xl">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sub-Links List</label>
                        <button 
                            onClick={() => onChange({ ...link, subLinks: [...(link.subLinks || []), { text: '', url: '' }] })}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                        >
                            <span>+ Add Sub Link</span>
                        </button>
                    </div>
                    <div className="space-y-3">
                        {link.subLinks?.map((sub, idx) => (
                            <div key={idx} className="flex gap-3 items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                <span className="text-gray-400 text-xs font-mono w-6 text-center">{idx + 1}</span>
                                <input type="text" value={sub.text} onChange={e => updateSubLink(idx, 'text', e.target.value)} placeholder="Link Label" className="w-1/3 border-gray-300 rounded text-xs p-2 focus:ring-blue-500 focus:border-blue-500" />
                                <LinkPicker value={sub.url} onChange={val => updateSubLink(idx, 'url', val)} data={pickerData} className="flex-1" />
                                <button onClick={() => onChange({ ...link, subLinks: link.subLinks?.filter((_, i) => i !== idx) })} className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        {(!link.subLinks || link.subLinks.length === 0) && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                                <p className="text-xs text-gray-500 italic">No sub-links. This item will act as a direct link.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mega Menu Editor */}
            {link.isMegaMenu && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mega Menu Columns</label>
                        <button 
                            onClick={() => onChange({ ...link, megaColumns: [...(link.megaColumns || []), { title: 'New Column', links: [] }] })}
                            className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-100 font-bold text-gray-700 shadow-sm transition-colors"
                        >
                            + Add Column
                        </button>
                    </div>
                    
                    {/* Grid for Columns - Full Width Usage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {link.megaColumns?.map((col, colIdx) => (
                            <div key={colIdx} className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                                <div className="p-3 border-b border-gray-100 bg-gray-50/50 rounded-t-lg flex justify-between items-center">
                                    <input 
                                        type="text" 
                                        value={col.title} 
                                        onChange={e => updateMegaColumn(colIdx, 'title', e.target.value)} 
                                        className="font-bold text-sm text-gray-800 bg-transparent border-none p-0 focus:ring-0 w-full placeholder-gray-400"
                                        placeholder="Column Title"
                                    />
                                    <button onClick={() => onChange({ ...link, megaColumns: link.megaColumns?.filter((_, i) => i !== colIdx) })} className="text-gray-400 hover:text-red-500">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                                <div className="p-3 flex-1 flex flex-col min-h-[150px]">
                                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[250px] custom-scrollbar pr-1">
                                        {col.links?.map((lnk, lnkIdx) => (
                                            <div key={lnkIdx} className="flex gap-1 items-center group">
                                                <input type="text" value={lnk.text} onChange={e => updateMegaLink(colIdx, lnkIdx, 'text', e.target.value)} placeholder="Link Name" className="w-1/2 border-gray-200 rounded text-[11px] px-2 py-1 bg-gray-50 focus:bg-white focus:border-blue-400 transition-colors" />
                                                <div className="flex-1 min-w-0">
                                                    <input type="text" value={lnk.url} onChange={e => updateMegaLink(colIdx, lnkIdx, 'url', e.target.value)} placeholder="URL" className="w-full border-gray-200 rounded text-[11px] px-2 py-1 bg-gray-50 focus:bg-white focus:border-blue-400 transition-colors" />
                                                </div>
                                                <button onClick={() => removeMegaLink(colIdx, lnkIdx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => addMegaLink(colIdx)} className="w-full mt-3 text-[11px] font-bold text-blue-600 py-1.5 hover:bg-blue-50 rounded border border-dashed border-blue-200 transition-colors">
                                        + Add Link
                                    </button>
                                </div>
                            </div>
                        ))}
                        {/* Empty State / Call to Action */}
                        {(!link.megaColumns || link.megaColumns.length === 0) && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                <p className="text-sm text-gray-500 font-medium">Start building your Mega Menu</p>
                                <button onClick={() => onChange({ ...link, megaColumns: [...(link.megaColumns || []), { title: 'First Column', links: [] }] })} className="mt-3 text-blue-600 text-xs font-bold hover:underline">Add First Column</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
const HeaderSettingsComponent: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<HeaderSettings>(initialSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [expandedItem, setExpandedItem] = useState<number | null>(null);
    const [pickerData, setPickerData] = useState<{ products: Product[], blogs: BlogPost[], pages: ContentPage[] }>({ products: [], blogs: [], pages: [] });

    const [newMsg, setNewMsg] = useState('');

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [sRes, pRes, bRes, pgRes] = await Promise.all([
                    fetch(getApiUrl('/api/settings/header')),
                    fetch(getApiUrl('/api/products')),
                    fetch(getApiUrl('/api/blogs?admin=true'), { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(getApiUrl('/api/pages?admin=true'), { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (sRes.ok) {
                    const data = await sRes.json();
                    data.announcementMessages = data.announcementMessages || [];
                    if(data.announcementMessages.length === 0 && data.announcementMessage) {
                        data.announcementMessages.push(data.announcementMessage);
                    }
                    setSettings({ ...initialSettings, ...data });
                }
                
                setPickerData({
                    products: pRes.ok ? await pRes.json() : [],
                    blogs: bRes.ok ? await bRes.json() : [],
                    pages: pgRes.ok ? await pgRes.json() : []
                });
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        init();
    }, [token]);

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await fetch(getApiUrl('/api/settings/header'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error("Failed to save");
            setFeedback({ type: 'success', message: 'Navigation settings updated successfully.' });
        } catch (e: any) { setFeedback({ type: 'error', message: e.message }); }
        finally { setSaving(false); setTimeout(() => setFeedback(null), 3000); }
    };

    const updateNavItem = (idx: number, updated: HeaderLink) => {
        const newLinks = [...settings.mainNavLinks];
        newLinks[idx] = updated;
        setSettings({ ...settings, mainNavLinks: newLinks });
    };

    const removeNavItem = (idx: number) => {
        setSettings({ ...settings, mainNavLinks: settings.mainNavLinks.filter((_, i) => i !== idx) });
        if (expandedItem === idx) setExpandedItem(null);
    };

    const addNavItem = () => {
        setSettings({ 
            ...settings, 
            mainNavLinks: [...settings.mainNavLinks, { text: 'New Menu Item', url: '#', isMegaMenu: false, subLinks: [], megaColumns: [] }] 
        });
        setExpandedItem(settings.mainNavLinks.length); // Auto-expand new item
    };

    const moveItem = (idx: number, dir: -1 | 1) => {
        if ((idx === 0 && dir === -1) || (idx === settings.mainNavLinks.length - 1 && dir === 1)) return;
        const newLinks = [...settings.mainNavLinks];
        const temp = newLinks[idx];
        newLinks[idx] = newLinks[idx + dir];
        newLinks[idx + dir] = temp;
        setSettings({ ...settings, mainNavLinks: newLinks });
        if (expandedItem === idx) setExpandedItem(idx + dir);
        else if (expandedItem === idx + dir) setExpandedItem(idx);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mr-3"></div>
            Loading Navigation Settings...
        </div>
    );

    return (
        <div className="w-full max-w-[1600px] mx-auto pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Header & Navigation</h2>
                    <p className="text-sm text-gray-500 mt-1">Customize your store's branding, menu structure, and promotional banners.</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 text-sm font-bold text-white rounded-lg shadow-md transition-all hover:opacity-90 disabled:opacity-50 transform hover:scale-105 active:scale-95" style={{ backgroundColor: COLORS.accent }}>
                    {saving ? 'Saving Changes...' : 'Save Configuration'}
                </button>
            </div>
            
            {feedback && <div className={`p-4 rounded-lg mb-6 text-sm font-medium shadow-sm border ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{feedback.message}</div>}

            <div className="space-y-8">
                
                {/* 1. BRANDING & ANNOUNCEMENT GRID */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    
                    {/* Branding Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="font-bold text-lg text-gray-800">Visual Identity</h3>
                        </div>
                        
                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Logo Image</label>
                                <MediaPicker value={settings.logoUrl || ''} onChange={url => setSettings({ ...settings, logoUrl: url })} type="image" />
                                <p className="text-[10px] text-gray-400 mt-1">Recommended height: 80px. Transparent PNG preferred.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo Text (Alt)</label>
                                    <input type="text" value={settings.logoText} onChange={e => setSettings({...settings, logoText: e.target.value})} className="w-full border-gray-300 rounded-lg text-sm p-2.5 focus:ring-rose-500 focus:border-rose-500" placeholder="Store Name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={settings.brandColor} onChange={e => setSettings({...settings, brandColor: e.target.value})} className="h-10 w-12 rounded-lg border border-gray-300 cursor-pointer p-1" />
                                        <input type="text" value={settings.brandColor} onChange={e => setSettings({...settings, brandColor: e.target.value})} className="flex-1 border-gray-300 rounded-lg text-sm p-2.5 uppercase font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Announcement Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                            </div>
                            <h3 className="font-bold text-lg text-gray-800">Announcement Bar</h3>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Messages (Rotating)</label>
                                <div className="flex gap-2 mb-3">
                                    <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="e.g. Free Shipping over ₹999" className="flex-1 border-gray-300 rounded-lg text-sm p-2.5 focus:ring-yellow-500 focus:border-yellow-500" onKeyDown={e => e.key === 'Enter' && newMsg && (setSettings({...settings, announcementMessages: [...(settings.announcementMessages || []), newMsg]}), setNewMsg(''))} />
                                    <button onClick={() => { if(newMsg) { setSettings({...settings, announcementMessages: [...(settings.announcementMessages || []), newMsg]}); setNewMsg(''); } }} className="bg-gray-900 hover:bg-black text-white px-5 rounded-lg text-sm font-bold transition-colors">Add</button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar border border-gray-100 rounded-lg p-2 bg-gray-50">
                                    {settings.announcementMessages?.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No messages added.</p>}
                                    {settings.announcementMessages?.map((msg, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-gray-100 text-sm text-gray-700 group">
                                            <span>{msg}</span>
                                            <button onClick={() => setSettings({...settings, announcementMessages: settings.announcementMessages?.filter((_, idx) => idx !== i)})} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bg Color</label>
                                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                        <input type="color" value={settings.announcementBgColor} onChange={e => setSettings({...settings, announcementBgColor: e.target.value})} className="h-8 w-8 rounded cursor-pointer border-none" />
                                        <span className="text-xs font-mono text-gray-600">{settings.announcementBgColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Text Color</label>
                                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                        <input type="color" value={settings.announcementTextColor} onChange={e => setSettings({...settings, announcementTextColor: e.target.value})} className="h-8 w-8 rounded cursor-pointer border-none" />
                                        <span className="text-xs font-mono text-gray-600">{settings.announcementTextColor}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN NAVIGATION EDITOR */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-100 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Main Menu Builder</h3>
                                <p className="text-sm text-gray-500">Configure your store's primary navigation hierarchy.</p>
                            </div>
                        </div>
                        <button onClick={addNavItem} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> 
                            Add Top-Level Menu
                        </button>
                    </div>

                    <div className="space-y-4">
                        {settings.mainNavLinks.map((link, idx) => (
                            <div key={idx} className={`border rounded-xl transition-all duration-300 ${expandedItem === idx ? 'border-blue-400 ring-2 ring-blue-50 shadow-lg bg-white relative z-10' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
                                {/* Header Row */}
                                <div className={`flex items-center p-4 gap-4 ${expandedItem === idx ? 'bg-blue-50/30 border-b border-blue-100 rounded-t-xl' : 'rounded-xl'}`}>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-20 p-1 rounded hover:bg-gray-100"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg></button>
                                        <button onClick={() => moveItem(idx, 1)} disabled={idx === settings.mainNavLinks.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-20 p-1 rounded hover:bg-gray-100"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7 7" /></svg></button>
                                    </div>
                                    
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <div className="col-span-1">
                                            <input 
                                                type="text" 
                                                value={link.text} 
                                                onChange={e => updateNavItem(idx, { ...link, text: e.target.value })} 
                                                className="font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full px-2 py-1 transition-colors text-lg"
                                                placeholder="Menu Name"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <LinkPicker value={link.url} onChange={val => updateNavItem(idx, { ...link, url: val })} data={pickerData} placeholder="Destination URL (e.g. /collections/summer)" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                                        <div className="flex items-center gap-2" title="Highlight this item with a 'HOT' or 'NEW' badge">
                                            <input type="checkbox" id={`special-${idx}`} checked={link.isSpecial} onChange={e => updateNavItem(idx, { ...link, isSpecial: e.target.checked })} className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer" />
                                            <label htmlFor={`special-${idx}`} className="text-xs font-bold text-rose-600 uppercase cursor-pointer select-none">Hot</label>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                                            className={`text-sm font-bold px-4 py-2 rounded-lg transition-all border ${expandedItem === idx ? 'bg-white border-gray-300 text-gray-700' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {expandedItem === idx ? 'Done' : 'Edit Submenu'}
                                        </button>
                                        
                                        <button onClick={() => removeNavItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50" title="Delete Menu Item">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedItem === idx && (
                                    <div className="p-6 bg-white rounded-b-xl border-t border-gray-100">
                                        <NavigationEditor 
                                            link={link} 
                                            onChange={(updated) => updateNavItem(idx, updated)}
                                            pickerData={pickerData}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {settings.mainNavLinks.length === 0 && (
                            <div className="text-center py-16 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                                <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                </div>
                                <h4 className="text-gray-600 font-bold mb-1">No Menu Items Configured</h4>
                                <p className="text-gray-500 text-sm mb-4">Start building your navigation by adding a top-level menu item.</p>
                                <button onClick={addNavItem} className="text-blue-600 font-bold hover:underline">Add First Menu Item</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. SECONDARY LINKS */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">Secondary Navigation</h3>
                            <p className="text-xs text-gray-500">Links appearing in the top bar or mobile drawer (e.g. About, Contact).</p>
                        </div>
                    </div>
                    
                    <div className="space-y-3 max-w-4xl">
                        {settings.topBarLinks.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:border-gray-300 transition-colors">
                                <span className="text-gray-400 font-mono text-xs w-6 text-center">{idx + 1}</span>
                                <input type="text" value={link.text} onChange={e => { const n = [...settings.topBarLinks]; n[idx].text = e.target.value; setSettings({...settings, topBarLinks: n}); }} className="w-1/3 text-sm border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Label" />
                                <LinkPicker value={link.url} onChange={val => { const n = [...settings.topBarLinks]; n[idx].url = val; setSettings({...settings, topBarLinks: n}); }} data={pickerData} className="flex-1" />
                                <button onClick={() => setSettings({...settings, topBarLinks: settings.topBarLinks.filter((_, i) => i !== idx)})} className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        <button onClick={() => setSettings({...settings, topBarLinks: [...settings.topBarLinks, { text: '', url: '#' }]})} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-bold text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Secondary Link
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HeaderSettingsComponent;
