
import React, { useState, useEffect, useRef } from 'react';
import { HeaderSettings, HeaderLink, Product, BlogPost, ContentPage, MegaMenuColumn, SubLink } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';
import {
    ChevronRight, ChevronLeft, ChevronDown, X, Trash2, Plus,
    Palette, Megaphone, Menu, Link as LinkIcon, GripVertical,
    Layout, Type, Image, Search, AlertCircle, ArrowRight
} from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";



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
        const itemClass = "w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 cursor-pointer flex justify-between items-center transition-colors rounded-md";

        if (view === 'root') {
            return (
                <div className="p-1 space-y-1">
                    {['Pages', 'Blogs', 'Products'].map((type) => (
                        <div key={type} className={itemClass} onClick={() => setView(type.toLowerCase() as any)}>
                            <span className="font-medium">{type}</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
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
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 p-2 border-b">
                    <Button variant="ghost" size="sm" onClick={() => { setView('root'); setSearchTerm(''); }} className="h-8 w-8 p-0">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Input
                        autoFocus
                        placeholder="Search..."
                        className="h-8 text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                    {filtered.length > 0 ? filtered.map((item: any) => (
                        <div key={item.id || item._id} className={itemClass} onClick={() => { onChange(`${prefix}${item.slug}`); setIsOpen(false); }}>
                            <span className="truncate text-xs font-medium">{item[key]}</span>
                        </div>
                    )) : <div className="px-4 py-3 text-xs text-zinc-500 text-center">No items found</div>}
                </div>
            </div>
        );
    };

    return (
        <div className={`relative w-full ${className}`} ref={wrapperRef}>
            <div className="flex gap-2">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className="flex-1 text-xs"
                    placeholder={placeholder || "https://..."}
                />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsOpen(!isOpen)}
                    className="shrink-0 text-zinc-500 bg-zinc-50/50"
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>
            {isOpen && (
                <Card className="absolute z-50 mt-1 w-full min-w-[280px] shadow-xl animate-in fade-in-0 zoom-in-95">
                    {renderContent()}
                </Card>
            )}
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
        <Card className="mt-4 animate-fade-in shadow-inner bg-zinc-50/50">
            <CardContent className="p-6">
                {/* Mega Menu Toggle */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-200">
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900">Menu Type Configuration</h4>
                        <p className="text-xs text-zinc-500 mt-1">Choose "Mega Menu" to display a full-width multi-column dropdown.</p>
                    </div>
                    <div className="flex items-center bg-white rounded-lg p-1 border shadow-sm">
                        <Button
                            variant={!link.isMegaMenu ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onChange({ ...link, isMegaMenu: false })}
                            className="text-xs font-bold"
                        >
                            Standard Dropdown
                        </Button>
                        <Button
                            variant={link.isMegaMenu ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onChange({ ...link, isMegaMenu: true })}
                            className="text-xs font-bold"
                        >
                            Mega Menu
                        </Button>
                    </div>
                </div>

                {/* Standard Menu Editor */}
                {!link.isMegaMenu && (
                    <div className="max-w-3xl">
                        <div className="flex justify-between items-center mb-3">
                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sub-Links List</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onChange({ ...link, subLinks: [...(link.subLinks || []), { text: '', url: '' }] })}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 font-bold"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Sub Link
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {link.subLinks?.map((sub, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-white p-2 rounded-md border shadow-sm">
                                    <span className="text-zinc-400 text-xs font-mono w-6 text-center">{idx + 1}</span>
                                    <Input
                                        value={sub.text}
                                        onChange={e => updateSubLink(idx, 'text', e.target.value)}
                                        placeholder="Link Label"
                                        className="w-1/3 h-9 text-xs"
                                    />
                                    <div className="flex-1">
                                        <LinkPicker value={sub.url} onChange={val => updateSubLink(idx, 'url', val)} data={pickerData} />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onChange({ ...link, subLinks: link.subLinks?.filter((_, i) => i !== idx) })}
                                        className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {(!link.subLinks || link.subLinks.length === 0) && (
                                <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
                                    <p className="text-xs text-zinc-500 italic">No sub-links. This item will act as a direct link.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mega Menu Editor */}
                {link.isMegaMenu && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mega Menu Columns</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onChange({ ...link, megaColumns: [...(link.megaColumns || []), { title: 'New Column', links: [] }] })}
                                className="h-8 text-xs font-bold"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Column
                            </Button>
                        </div>

                        {/* Grid for Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {link.megaColumns?.map((col, colIdx) => (
                                <Card key={colIdx} className="flex flex-col h-full hover:shadow-md transition-shadow">
                                    <div className="p-3 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                                        <Input
                                            value={col.title}
                                            onChange={e => updateMegaColumn(colIdx, 'title', e.target.value)}
                                            className="h-8font-bold text-sm bg-transparent border-none p-0 focus-visible:ring-0 w-full placeholder-zinc-400"
                                            placeholder="Column Title"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onChange({ ...link, megaColumns: link.megaColumns?.filter((_, i) => i !== colIdx) })}
                                            className="h-6 w-6 text-zinc-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <CardContent className="p-3 flex-1 flex flex-col min-h-[150px]">
                                        <div className="space-y-2 flex-1 overflow-y-auto max-h-[250px] custom-scrollbar pr-1">
                                            {col.links?.map((lnk, lnkIdx) => (
                                                <div key={lnkIdx} className="flex gap-1 items-center group">
                                                    <Input
                                                        value={lnk.text}
                                                        onChange={e => updateMegaLink(colIdx, lnkIdx, 'text', e.target.value)}
                                                        placeholder="Name"
                                                        className="w-1/2 h-7 text-[11px]"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <Input
                                                            value={lnk.url}
                                                            onChange={e => updateMegaLink(colIdx, lnkIdx, 'url', e.target.value)}
                                                            placeholder="URL"
                                                            className="w-full h-7 text-[11px]"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeMegaLink(colIdx, lnkIdx)}
                                                        className="h-6 w-6 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addMegaLink(colIdx)}
                                            className="w-full mt-3 text-[11px] font-bold text-blue-600 h-7 border border-dashed border-blue-200 hover:bg-blue-50"
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Link
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {(!link.megaColumns || link.megaColumns.length === 0) && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
                                    <Layout className="w-10 h-10 text-zinc-300 mb-2" />
                                    <p className="text-sm text-zinc-500 font-medium">Start building your Mega Menu</p>
                                    <Button variant="link" onClick={() => onChange({ ...link, megaColumns: [...(link.megaColumns || []), { title: 'First Column', links: [] }] })} className="mt-2 text-blue-600 font-bold">
                                        Add First Column
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
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
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const handleReorder = (dragIndex: number, hoverIndex: number) => {
        if (dragIndex === hoverIndex) return;
        const newLinks = [...settings.mainNavLinks];
        const [removed] = newLinks.splice(dragIndex, 1);
        newLinks.splice(hoverIndex, 0, removed);
        setSettings({ ...settings, mainNavLinks: newLinks });

        // Update expanded state if necessary
        if (expandedItem === dragIndex) setExpandedItem(hoverIndex);
        else if (expandedItem === hoverIndex && dragIndex < hoverIndex) setExpandedItem(expandedItem - 1);
        else if (expandedItem === hoverIndex && dragIndex > hoverIndex) setExpandedItem(expandedItem + 1);
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image usually handled by browser, but can be customized
        const element = e.currentTarget as HTMLElement;
        element.style.opacity = '0.5';
    };

    const onDragEnd = (e: React.DragEvent) => {
        setDraggedIdx(null);
        const element = e.currentTarget as HTMLElement;
        element.style.opacity = '1';
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Necessary for onDrop
    };

    const onDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIdx === null) return;
        handleReorder(draggedIdx, dropIndex);
    };

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
                    if (data.announcementMessages.length === 0 && data.announcementMessage) {
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
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Header & Navigation</h2>
                    <p className="text-sm text-gray-500 mt-1">Customize your store's branding, menu structure, and promotional banners.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="shadow-md transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: COLORS.accent }}
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>

            {feedback && <div className={`p-4 rounded-lg mb-6 text-sm font-medium shadow-sm border ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{feedback.message}</div>}

            <div className="space-y-8">

                {/* 1. BRANDING & ANNOUNCEMENT GRID */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* Branding Panel */}
                    <Card className="h-full border-zinc-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-zinc-50/40 border-b border-zinc-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-50 rounded-md text-rose-600 border border-rose-100">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-zinc-800">Visual Identity</CardTitle>
                                    <CardDescription>Upload your logo and set brand colors.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                            <div>
                                <Label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Logo Image</Label>
                                <MediaPicker value={settings.logoUrl || ''} onChange={url => setSettings({ ...settings, logoUrl: url })} type="image" />
                                <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Recommended height: 80px (Transparent PNG)
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase">Logo Text (Alt)</Label>
                                    <Input
                                        type="text"
                                        value={settings.logoText}
                                        onChange={e => setSettings({ ...settings, logoText: e.target.value })}
                                        placeholder="Store Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase">Brand Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-shrink-0">
                                            <Input
                                                type="color"
                                                value={settings.brandColor}
                                                onChange={e => setSettings({ ...settings, brandColor: e.target.value })}
                                                className="h-10 w-12 p-1 cursor-pointer"
                                            />
                                        </div>
                                        <Input
                                            type="text"
                                            value={settings.brandColor}
                                            onChange={e => setSettings({ ...settings, brandColor: e.target.value })}
                                            className="font-mono uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Announcement Panel */}
                    <Card className="h-full border-zinc-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-zinc-50/40 border-b border-zinc-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-md text-amber-600 border border-amber-100">
                                    <Megaphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-zinc-800">Announcement Bar</CardTitle>
                                    <CardDescription>Manage rotating top bar messages.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-zinc-500 uppercase">Messages (Rotating)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={newMsg}
                                        onChange={e => setNewMsg(e.target.value)}
                                        placeholder="e.g. Free Shipping over ₹999"
                                        onKeyDown={e => e.key === 'Enter' && newMsg && (setSettings({ ...settings, announcementMessages: [...(settings.announcementMessages || []), newMsg] }), setNewMsg(''))}
                                    />
                                    <Button
                                        onClick={() => { if (newMsg) { setSettings({ ...settings, announcementMessages: [...(settings.announcementMessages || []), newMsg] }); setNewMsg(''); } }}
                                        className="bg-zinc-900 text-white hover:bg-zinc-800"
                                    >
                                        Add
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar border border-zinc-100 rounded-lg p-2 bg-zinc-50/50">
                                    {settings.announcementMessages?.length === 0 && <p className="text-xs text-zinc-400 text-center py-2">No messages added.</p>}
                                    {settings.announcementMessages?.map((msg, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-md shadow-sm border border-zinc-100 text-sm text-zinc-700 group hover:border-zinc-200 transition-colors">
                                            <span className="truncate pr-2">{msg}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSettings({ ...settings, announcementMessages: settings.announcementMessages?.filter((_, idx) => idx !== i) })}
                                                className="h-6 w-6 text-zinc-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase">Bg Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-shrink-0">
                                            <Input
                                                type="color"
                                                value={settings.announcementBgColor}
                                                onChange={e => setSettings({ ...settings, announcementBgColor: e.target.value })}
                                                className="h-10 w-12 p-1 cursor-pointer"
                                            />
                                        </div>
                                        <Input
                                            value={settings.announcementBgColor}
                                            onChange={e => setSettings({ ...settings, announcementBgColor: e.target.value })}
                                            className="font-mono uppercase text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase">Text Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-shrink-0">
                                            <Input
                                                type="color"
                                                value={settings.announcementTextColor}
                                                onChange={e => setSettings({ ...settings, announcementTextColor: e.target.value })}
                                                className="h-10 w-12 p-1 cursor-pointer"
                                            />
                                        </div>
                                        <Input
                                            value={settings.announcementTextColor}
                                            onChange={e => setSettings({ ...settings, announcementTextColor: e.target.value })}
                                            className="font-mono uppercase text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. MAIN NAVIGATION EDITOR */}
                <Card className="border-zinc-200 shadow-sm">
                    <CardHeader className="bg-white border-b border-zinc-100 pb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                                    <Menu className="w-8 h-8" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-zinc-900">Main Menu Builder</CardTitle>
                                    <CardDescription>Configure your store's primary navigation hierarchy.</CardDescription>
                                </div>
                            </div>
                            <Button
                                onClick={addNavItem}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Top-Level Menu
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-6">
                        {settings.mainNavLinks.map((link, idx) => (
                            <div
                                key={idx}
                                className={`border rounded-xl transition-all duration-200 ${expandedItem === idx ? 'border-blue-400 ring-2 ring-blue-50 shadow-lg bg-white relative z-10' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'}`}
                                draggable="true"
                                onDragStart={(e) => onDragStart(e, idx)}
                                onDragOver={(e) => onDragOver(e, idx)}
                                onDrop={(e) => onDrop(e, idx)}
                                onDragEnd={onDragEnd}
                            >
                                {/* Header Row */}
                                <div className={`flex items-center p-4 gap-4 ${expandedItem === idx ? 'bg-blue-50/30 border-b border-blue-100 rounded-t-xl' : 'rounded-xl'}`}>
                                    {/* Drag Handle */}
                                    <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 p-1">
                                        <GripVertical className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <div className="col-span-1">
                                            <Input
                                                value={link.text}
                                                onChange={e => updateNavItem(idx, { ...link, text: e.target.value })}
                                                className="font-bold text-zinc-800 bg-transparent border-transparent hover:border-zinc-300 focus-visible:ring-0 focus-visible:border-blue-500 text-lg px-2 h-auto py-1 shadow-none"
                                                placeholder="Menu Name"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <LinkPicker value={link.url} onChange={val => updateNavItem(idx, { ...link, url: val })} data={pickerData} placeholder="Destination URL (e.g. /collections/summer)" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pl-4 border-l border-zinc-200">
                                        <div className="flex items-center gap-2" title="Highlight this item with a 'HOT' or 'NEW' badge">
                                            <Switch
                                                id={`special-${idx}`}
                                                checked={link.isSpecial}
                                                onCheckedChange={checked => updateNavItem(idx, { ...link, isSpecial: checked })}
                                            />
                                            <Label htmlFor={`special-${idx}`} className="text-xs font-bold text-rose-600 uppercase cursor-pointer select-none">Hot</Label>
                                        </div>

                                        <Button
                                            variant={expandedItem === idx ? "secondary" : "ghost"}
                                            onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                                            className="text-sm font-bold"
                                        >
                                            {expandedItem === idx ? 'Done' : 'Edit Submenu'}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeNavItem(idx)}
                                            className="text-zinc-400 hover:text-red-600 hover:bg-red-50"
                                            title="Delete Menu Item"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedItem === idx && (
                                    <div className="p-6 bg-white rounded-b-xl border-t border-zinc-100">
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
                            <div className="text-center py-16 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-xl">
                                <div className="mx-auto w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-400 mb-4">
                                    <Menu className="w-8 h-8" />
                                </div>
                                <h4 className="text-zinc-600 font-bold mb-1">No Menu Items Configured</h4>
                                <p className="text-zinc-500 text-sm mb-4">Start building your navigation by adding a top-level menu item.</p>
                                <Button variant="link" onClick={addNavItem} className="text-blue-600 font-bold">Add First Menu Item</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. SECONDARY LINKS */}
                <Card className="border-zinc-200 shadow-sm">
                    <CardHeader className="bg-white border-b border-zinc-100 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 rounded-md text-zinc-600">
                                <LinkIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-zinc-800">Secondary Navigation</CardTitle>
                                <CardDescription>Links appearing in the top bar or mobile drawer (e.g. About, Contact).</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-6 max-w-4xl">
                        {settings.topBarLinks.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200 group hover:border-zinc-300 transition-colors">
                                <span className="text-zinc-400 font-mono text-xs w-6 text-center">{idx + 1}</span>
                                <Input
                                    value={link.text}
                                    onChange={e => { const n = [...settings.topBarLinks]; n[idx].text = e.target.value; setSettings({ ...settings, topBarLinks: n }); }}
                                    className="w-1/3 text-sm"
                                    placeholder="Label"
                                />
                                <div className="flex-1">
                                    <LinkPicker value={link.url} onChange={val => { const n = [...settings.topBarLinks]; n[idx].url = val; setSettings({ ...settings, topBarLinks: n }); }} data={pickerData} />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSettings({ ...settings, topBarLinks: settings.topBarLinks.filter((_, i) => i !== idx) })}
                                    className="text-zinc-400 hover:text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            onClick={() => setSettings({ ...settings, topBarLinks: [...settings.topBarLinks, { text: '', url: '#' }] })}
                            className="w-full py-6 border-2 border-dashed text-zinc-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Secondary Link
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default HeaderSettingsComponent;
