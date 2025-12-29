
import React, { useState, useEffect, useRef } from 'react';
import { FooterSettings, FooterColumn, FooterLink, SocialLink, Product, BlogPost, ContentPage } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';
import { useSiteData } from '../../contexts/SiteDataContext';

const initialSettings: FooterSettings = {
    logoUrl: '',
    brandDescription: '',
    copyrightText: '',
    socialLinks: [],
    columns: [],
    backgroundColor: '#16423C',
    backgroundImage: '',
    overlayColor: '#000000',
    overlayOpacity: 0,
    textColor: '#D1D5DB',
    headingColor: '#6A9C89',
    linkColor: '#9CA3AF',
    showNewsletter: true,
    newsletterTitle: 'Subscribe to our Wellness Journey',
    newsletterSubtitle: 'Get the latest Ayurvedic tips and early access to pure herbal launches.',
    newsletterPlacement: 'Top'
};

// --- Link Picker Component ---
interface LinkPickerProps {
    value: string;
    onChange: (value: string) => void;
    data: { products: Product[]; blogs: BlogPost[]; pages: ContentPage[]; };
    className?: string;
}

const LinkPicker: React.FC<LinkPickerProps> = ({ value, onChange, data, className }) => {
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

    const handleSelect = (url: string) => {
        onChange(url);
        setIsOpen(false);
        setView('root');
        setSearchTerm('');
    };

    const filterItems = (items: any[], key: string) => {
        return items.filter(item => 
            item.slug && 
            item[key] && 
            typeof item[key] === 'string' && 
            item[key].toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const renderContent = () => {
        const itemClass = "px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center";

        if (view === 'root') {
            return (
                <div className="py-1">
                    <div className={itemClass} onClick={() => setView('pages')}>
                        <span>Pages</span>
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <div className={itemClass} onClick={() => setView('blogs')}>
                        <span>Blogs</span>
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <div className={itemClass} onClick={() => setView('products')}>
                        <span>Products</span>
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                </div>
            );
        }

        let title = "";
        let items: any[] = [];
        let linkPrefix = "";
        let nameKey = "";

        if (view === 'products') {
            title = "Products";
            items = data.products;
            linkPrefix = "/product/";
            nameKey = "name";
        } else if (view === 'blogs') {
            title = "Blogs";
            items = data.blogs;
            linkPrefix = "/blogs/";
            nameKey = "title";
        } else if (view === 'pages') {
            title = "Pages";
            items = data.pages;
            linkPrefix = "/pages/";
            nameKey = "title";
        }

        const Header = () => (
            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b flex items-center cursor-pointer hover:bg-gray-100" onClick={() => { setView('root'); setSearchTerm(''); }}>
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back
            </div>
        );

        const Search = () => (
            <div className="p-2 border-b">
                <input 
                    type="text" 
                    autoFocus
                    placeholder={`Search ${title}...`}
                    className="w-full border-gray-200 rounded-md text-xs p-1 focus:ring-0 focus:border-blue-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        );

        const filtered = filterItems(items, nameKey);

        return (
            <>
                <Header />
                <Search />
                <div className="max-h-48 overflow-y-auto">
                    {filtered.length > 0 ? filtered.map((item: any) => (
                        <div 
                            key={item.id || item._id} 
                            className={itemClass}
                            onClick={() => handleSelect(`${linkPrefix}${item.slug}`)}
                        >
                            <span className="truncate pr-2">{item[nameKey]}</span>
                        </div>
                    )) : (
                        <div className="px-4 py-3 text-xs text-gray-500 text-center">No items found</div>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className={`relative w-full ${className}`} ref={wrapperRef}>
            <div className="flex">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className="flex-1 min-w-0 block w-full px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded-l focus:outline-none focus:border-blue-500"
                    placeholder="Select Link..."
                />
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center px-2 py-1 border border-l-0 border-gray-300 rounded-r bg-gray-50 text-gray-500 hover:bg-gray-100"
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
            {isOpen && (
                <div className="absolute z-20 mt-1 w-64 bg-white shadow-xl rounded-md border border-gray-200 animate-fade-in-up left-0">
                    {renderContent()}
                </div>
            )}
        </div>
    );
};


const FooterSettingsComponent: React.FC<{ token: string | null }> = ({ token }) => {
    const { refreshSiteData } = useSiteData();
    const [settings, setSettings] = useState<FooterSettings>(initialSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [pickerData, setPickerData] = useState<{products: Product[], blogs: BlogPost[], pages: ContentPage[]}>({
        products: [], blogs: [], pages: []
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [settingsRes, productsRes, blogsRes, pagesRes] = await Promise.all([
                    fetch(getApiUrl('/api/settings/footer')),
                    fetch(getApiUrl('/api/products')),
                    fetch(getApiUrl('/api/blogs'), { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(getApiUrl('/api/pages'), { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (settingsRes.ok) {
                    const fetchedSettings = await settingsRes.json();
                    setSettings({ ...initialSettings, ...fetchedSettings });
                }
                setPickerData({
                    products: productsRes.ok ? await productsRes.json() : [],
                    blogs: blogsRes.ok ? await blogsRes.json() : [],
                    pages: pagesRes.ok ? await pagesRes.json() : []
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setSettings(prev => ({ ...prev, [name]: val }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(getApiUrl('/api/settings/footer'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (!response.ok) throw new Error('Failed to save settings.');
            
            // CRITICAL: Refresh the Global Context data so Footer.tsx sees the new data
            await refreshSiteData();
            
            setSuccess('Footer designer updated! Changes are now live.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
            setTimeout(() => { setSuccess(null); setError(null); }, 3000);
        }
    };

    const addColumn = () => setSettings(prev => ({ ...prev, columns: [...prev.columns, { title: 'New Column', links: [] }] }));
    const removeColumn = (index: number) => { if(!window.confirm('Delete this entire column?')) return; setSettings(prev => ({ ...prev, columns: prev.columns.filter((_, i) => i !== index) })); };
    const updateColumnTitle = (index: number, value: string) => { const newColumns = [...settings.columns]; newColumns[index].title = value; setSettings(prev => ({ ...prev, columns: newColumns })); };
    const addLinkToColumn = (colIndex: number) => { const newColumns = [...settings.columns]; newColumns[colIndex].links.push({ text: 'New Link', url: '#' }); setSettings(prev => ({ ...prev, columns: newColumns })); };
    const removeLinkFromColumn = (colIndex: number, linkIndex: number) => { const newColumns = [...settings.columns]; newColumns[colIndex].links = newColumns[colIndex].links.filter((_, i) => i !== linkIndex); setSettings(prev => ({ ...prev, columns: newColumns })); };
    const updateLink = (colIndex: number, linkIndex: number, field: keyof FooterLink, value: string) => { const newColumns = [...settings.columns]; newColumns[colIndex].links[linkIndex] = { ...newColumns[colIndex].links[linkIndex], [field]: value }; setSettings(prev => ({ ...prev, columns: newColumns })); };
    const addSocial = () => setSettings(prev => ({ ...prev, socialLinks: [...prev.socialLinks, { platform: 'Instagram', url: '' }] }));
    const removeSocial = (index: number) => setSettings(prev => ({ ...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== index) }));
    const updateSocial = (index: number, field: keyof SocialLink, value: string) => { const newSocials = [...settings.socialLinks]; newSocials[index] = { ...newSocials[index], [field]: value }; setSettings(prev => ({ ...prev, socialLinks: newSocials })); };

    if (loading) return <div className="p-20 text-center">Loading Footer Settings...</div>;

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">Footer Visual Designer</h2>
                    <p className="text-sm text-gray-500 font-medium">Customize colors, layouts, and newsletter placement.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-2.5 bg-[#16423C] text-white rounded-xl font-bold shadow-xl hover:opacity-90 transition-all transform active:scale-95 disabled:opacity-50"
                >
                    {saving ? 'Publishing...' : 'Publish Footer'}
                </button>
            </div>

            {error && <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-xl border border-red-200">{error}</div>}
            {success && <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-xl border border-green-200">{success}</div>}

            <div className="space-y-10">
                {/* 1. Global Styling & Color Controls */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-black text-gray-800 mb-8 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-[#16423C] rounded-full"></div>
                        Global Styling & Live Colors
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                        {[
                            { label: 'Background', name: 'backgroundColor', color: settings.backgroundColor },
                            { label: 'Headings', name: 'headingColor', color: settings.headingColor },
                            { label: 'Body Text', name: 'textColor', color: settings.textColor },
                            { label: 'Menu Links', name: 'linkColor', color: settings.linkColor },
                        ].map((c) => (
                            <div key={c.name} className="space-y-3">
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">{c.label} Color</label>
                                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                    <input type="color" name={c.name} value={c.color || '#000000'} onChange={handleInputChange} className="h-10 w-10 rounded-lg cursor-pointer border-none p-1 bg-white shadow-sm" />
                                    <input type="text" name={c.name} value={c.color || ''} onChange={handleInputChange} className="flex-1 bg-transparent text-sm font-mono uppercase font-bold outline-none" placeholder="#HEXCODE" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Background Image Overlay</label>
                            <MediaPicker 
                                type="image" 
                                value={settings.backgroundImage || ''} 
                                onChange={url => setSettings(prev => ({...prev, backgroundImage: url}))}
                                placeholder="Select pattern or image..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Overlay Hue</label>
                                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                    <input type="color" name="overlayColor" value={settings.overlayColor || '#000000'} onChange={handleInputChange} className="h-10 w-10 rounded-lg cursor-pointer border-none p-1 bg-white shadow-sm" />
                                    <input type="text" name="overlayColor" value={settings.overlayColor || '#000000'} onChange={handleInputChange} className="flex-1 bg-transparent text-sm font-mono uppercase font-bold outline-none" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Opacity</label>
                                    <span className="text-[10px] font-black text-[#16423C] bg-green-50 px-2 py-0.5 rounded-full">{settings.overlayOpacity}%</span>
                                </div>
                                <input type="range" min="0" max="100" name="overlayOpacity" value={settings.overlayOpacity || 0} onChange={handleInputChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#16423C]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Newsletter Subscription Logic */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#6A9C89] rounded-full"></div>
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Newsletter Strategy</h3>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border">
                            <span className="text-[10px] font-black uppercase text-gray-500">{settings.showNewsletter ? 'Active' : 'Disabled'}</span>
                            <button
                                type="button"
                                onClick={() => setSettings(prev => ({ ...prev, showNewsletter: !prev.showNewsletter }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showNewsletter ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showNewsletter ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {settings.showNewsletter && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <p className="text-sm font-bold text-orange-800">Placement Control</p>
                                    <p className="text-xs text-orange-600">Decide if the subscribe box is a full-width header or a sidebar column.</p>
                                </div>
                                <div className="flex gap-2 p-1 bg-white rounded-lg border border-orange-200">
                                    <button 
                                        onClick={() => setSettings(prev => ({...prev, newsletterPlacement: 'Top'}))}
                                        className={`px-4 py-2 text-[10px] font-black uppercase rounded-md transition-all ${settings.newsletterPlacement === 'Top' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-orange-500'}`}
                                    >
                                        Full Width Top
                                    </button>
                                    <button 
                                        onClick={() => setSettings(prev => ({...prev, newsletterPlacement: 'InColumn'}))}
                                        className={`px-4 py-2 text-[10px] font-black uppercase rounded-md transition-all ${settings.newsletterPlacement === 'InColumn' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-orange-500'}`}
                                    >
                                        Inside Link Column
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Catchy Title</label>
                                    <input type="text" name="newsletterTitle" value={settings.newsletterTitle || ''} onChange={handleInputChange} className="w-full border-gray-200 border rounded-xl p-3 text-sm font-bold focus:ring-1 focus:ring-[#16423C]" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Persuasive Subtext</label>
                                    <textarea name="newsletterSubtitle" value={settings.newsletterSubtitle || ''} onChange={handleInputChange} rows={2} className="w-full border-gray-200 border rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#16423C]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Columns & Menus */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-gray-800 rounded-full"></div>
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Link Columns</h3>
                        </div>
                        <button onClick={addColumn} className="px-6 py-2.5 bg-gray-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all shadow-lg">+ Add Menu Column</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {settings.columns.map((col, colIdx) => (
                            <div key={colIdx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full hover:shadow-md transition-all group/card">
                                <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-50">
                                    <input type="text" value={col.title} onChange={(e) => updateColumnTitle(colIdx, e.target.value)} className="font-black text-gray-800 bg-transparent border-none focus:ring-0 w-full uppercase tracking-[0.2em] text-xs" placeholder="COLUMN TITLE" />
                                    <button onClick={() => removeColumn(colIdx)} className="text-red-300 hover:text-red-600 transition-colors opacity-0 group-hover/card:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                                <div className="flex-1 space-y-3 mb-6 overflow-y-auto max-h-[300px] pr-1 scrollbar-hide">
                                    {col.links.map((link, linkIdx) => (
                                        <div key={linkIdx} className="bg-gray-50 p-2 rounded-xl border border-gray-100 group/link">
                                            <div className="flex justify-between mb-1">
                                                <input type="text" value={link.text} onChange={(e) => updateLink(colIdx, linkIdx, 'text', e.target.value)} className="text-[9px] font-black uppercase bg-transparent border-none p-0 focus:ring-0 text-gray-500 w-full" placeholder="LINK LABEL" />
                                                <button onClick={() => removeLinkFromColumn(colIdx, linkIdx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/link:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                            <LinkPicker value={link.url} onChange={(val) => updateLink(colIdx, linkIdx, 'url', val)} data={pickerData} />
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => addLinkToColumn(colIdx)} className="mt-auto w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 text-[10px] font-black uppercase rounded-xl hover:bg-gray-50 hover:text-[#16423C] hover:border-[#16423C] transition-all">+ Add Link</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Branding & Social */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-8">
                         <div className="flex items-center gap-3 border-b pb-4">
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Brand Voice</h3>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">White Logo (For dark bg)</label>
                            <MediaPicker type="image" value={settings.logoUrl || ''} onChange={url => setSettings(prev => ({...prev, logoUrl: url}))} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Mini About Us</label>
                            <textarea name="brandDescription" value={settings.brandDescription} onChange={handleInputChange} rows={3} className="w-full border-gray-200 border rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#16423C]" placeholder="Crafted with love..." />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Copyright Signature</label>
                            <input type="text" name="copyrightText" value={settings.copyrightText} onChange={handleInputChange} className="w-full border-gray-200 border rounded-xl p-3 text-sm font-bold" placeholder="© 2024 Your Brand" />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-8">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Social Network</h3>
                            </div>
                            <button onClick={addSocial} className="text-[10px] font-black uppercase text-blue-600 hover:underline">+ Link Platform</button>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {settings.socialLinks.map((link, idx) => (
                                <div key={idx} className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 group/social">
                                    <div className="bg-white p-2 rounded-xl shadow-sm border">
                                        <select value={link.platform} onChange={(e) => updateSocial(idx, 'platform', e.target.value)} className="border-none bg-transparent text-xs font-black uppercase outline-none focus:ring-0 p-0 pr-6">
                                            <option value="Facebook">Facebook</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="Twitter">X / Twitter</option>
                                            <option value="LinkedIn">LinkedIn</option>
                                            <option value="YouTube">YouTube</option>
                                        </select>
                                    </div>
                                    <input type="text" value={link.url} onChange={(e) => updateSocial(idx, 'url', e.target.value)} className="flex-1 bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500" placeholder="Paste link..." />
                                    <button onClick={() => removeSocial(idx)} className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover/social:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FooterSettingsComponent;
