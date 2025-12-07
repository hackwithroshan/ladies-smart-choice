import React, { useState, useEffect, useRef } from 'react';
import { HeaderSettings, HeaderLink, Product, BlogPost, ContentPage } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';

const initialSettings: HeaderSettings = {
    logoText: '',
    logoUrl: '',
    brandColor: '#E11D48',
    phoneNumber: '',
    topBarLinks: [],
    mainNavLinks: [],
};

// --- Link Picker Component ---
interface LinkPickerProps {
    value: string;
    onChange: (value: string) => void;
    data: {
        products: Product[];
        blogs: BlogPost[];
        pages: ContentPage[];
    };
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
        // BUG FIX: Ensure item has a slug and the search key before allowing it to be selected.
        return items.filter(item => 
            item.slug && 
            item[key] && 
            typeof item[key] === 'string' && 
            item[key].toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const renderContent = () => {
        const headerClass = "px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b flex items-center cursor-pointer hover:bg-gray-100";
        const listClass = "max-h-48 overflow-y-auto";
        const itemClass = "px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center";

        if (view === 'root') {
            // BUG FIX: Removed redundant "Custom URL" input. The main input is used for this.
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
            <div className={headerClass} onClick={() => { setView('root'); setSearchTerm(''); }}>
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
                <div className={listClass}>
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

const HeaderSettingsComponent: React.FC<{ token: string | null }> = ({ token }) => {
    const [settings, setSettings] = useState<HeaderSettings>(initialSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [pickerData, setPickerData] = useState<{ products: Product[], blogs: BlogPost[], pages: ContentPage[] }>({
        products: [], blogs: [], pages: []
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [settingsRes, productsRes, blogsRes, pagesRes] = await Promise.all([
                    fetch(getApiUrl('/api/settings/header')),
                    fetch(getApiUrl('/api/products')),
                    fetch(getApiUrl('/api/blogs?admin=true'), { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(getApiUrl('/api/pages?admin=true'), { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (settingsRes.ok) {
                    const fetchedSettings = await settingsRes.json();
                    // FIX: Merge with initial settings to prevent crashes if API returns an empty object
                    // or a document without `topBarLinks` or `mainNavLinks`. This ensures they are always arrays.
                    setSettings({ ...initialSettings, ...fetchedSettings });
                }
                setPickerData({
                    products: productsRes.ok ? await productsRes.json() : [],
                    blogs: blogsRes.ok ? await blogsRes.json() : [],
                    pages: pagesRes.ok ? await pagesRes.json() : []
                });
            } catch (err: any) {
                console.error(err);
                setFeedback({ type: 'error', message: err.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const response = await fetch(getApiUrl('/api/settings/header'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (!response.ok) throw new Error('Failed to save header settings.');
            setFeedback({ type: 'success', message: 'Header settings saved!' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    const handleLinkChange = (list: 'topBarLinks' | 'mainNavLinks', index: number, field: keyof HeaderLink, value: string) => {
        const newLinks = [...settings[list]];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setSettings(prev => ({ ...prev, [list]: newLinks }));
    };

    const addLink = (list: 'topBarLinks' | 'mainNavLinks') => {
        setSettings(prev => ({ ...prev, [list]: [...prev[list], { text: 'New Link', url: '#' }] }));
    };

    const removeLink = (list: 'topBarLinks' | 'mainNavLinks', index: number) => {
        setSettings(prev => ({ ...prev, [list]: prev[list].filter((_, i) => i !== index) }));
    };

    if (loading) return <div>Loading header settings...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Header & Navigation</h2>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-medium text-white rounded-md shadow-sm" style={{ backgroundColor: COLORS.accent }}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
            {feedback && <div className={`p-3 rounded mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback.message}</div>}

            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4">Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Logo Text</label>
                            <input type="text" value={settings.logoText} onChange={e => setSettings({ ...settings, logoText: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Brand Color</label>
                            <input type="color" value={settings.brandColor} onChange={e => setSettings({ ...settings, brandColor: e.target.value })} className="mt-1 w-full h-10 border border-gray-300 rounded-md" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image</label>
                            <MediaPicker value={settings.logoUrl || ''} onChange={url => setSettings({ ...settings, logoUrl: url })} type="image" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4">Contact Info</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input type="text" value={settings.phoneNumber} onChange={e => setSettings({ ...settings, phoneNumber: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                    </div>
                </div>

                {['topBarLinks', 'mainNavLinks'].map(listKey => (
                    <div key={listKey} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{listKey === 'topBarLinks' ? 'Top Bar Links' : 'Main Navigation'}</h3>
                            <button onClick={() => addLink(listKey as any)} className="text-sm text-blue-600 font-medium">+ Add Link</button>
                        </div>
                        <div className="space-y-3">
                            {settings[listKey as 'topBarLinks' | 'mainNavLinks'].map((link, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-gray-50 p-3 rounded-md border">
                                    <input type="text" value={link.text} onChange={e => handleLinkChange(listKey as any, idx, 'text', e.target.value)} placeholder="Link Text" className="w-1/3 border p-2 rounded text-sm" />
                                    <LinkPicker value={link.url} onChange={val => handleLinkChange(listKey as any, idx, 'url', val)} data={pickerData} className="flex-1" />
                                    <button onClick={() => removeLink(listKey as any, idx)} className="text-red-500">Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeaderSettingsComponent;