
import React, { useState, useEffect, useMemo } from 'react';
import { COLORS } from '../../constants';
import MediaPicker from './MediaPicker';
import { Product, ShoppableVideo } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { Video, Trash2, EditPencil, Plus, PlayIcon, Package, Search } from '../Icons';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { cn } from '../../utils/utils';

interface VideoTarget {
    type: 'product' | 'category' | 'custom';
    id: string;
    name: string;
}

const VideoSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [videos, setVideos] = useState<ShoppableVideo[]>([]);
    const [editingVideo, setEditingVideo] = useState<Partial<ShoppableVideo> | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'targeting' | 'preview'>('general');
    
    const [products, setProducts] = useState<Product[]>([]);
    const [linkSearch, setLinkSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchVideos = async () => {
        try {
            const res = await fetch(getApiUrl('content/videos'));
            if (res.ok) setVideos(await res.json());
        } catch (e) { console.error("Fetch videos failed", e); }
    };

    const fetchData = async () => {
        try {
            const prodRes = await fetch(getApiUrl('products/all'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (prodRes.ok) setProducts(await prodRes.json());
        } catch (e) { console.error("Failed to fetch products"); }
        finally { setLoading(false); }
    };

    useEffect(() => { 
        fetchVideos(); 
        fetchData();
    }, [token]);

    const handleCreate = () => {
        setEditingVideo({ title: '', videoUrl: '', thumbnailUrl: '', price: '', targets: [], sortOrder: 0 });
        setActiveTab('general');
    };

    const handleEdit = (video: ShoppableVideo) => {
        setEditingVideo({ ...video });
        setActiveTab('general');
    };

    const handleSaveVideo = async () => {
        if (!editingVideo?.title || !editingVideo?.videoUrl) {
            return alert("Title and Video source are mandatory.");
        }

        setIsSaving(true);
        const videoId = editingVideo.id || (editingVideo as any)._id;
        const isEditing = !!videoId;
        const url = isEditing ? getApiUrl(`content/videos/${videoId}`) : getApiUrl('content/videos');
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editingVideo)
            });
            
            if(res.ok) { 
                await fetchVideos(); 
                setEditingVideo(null); 
            } else {
                const err = await res.json();
                alert(err.message || "Save failed");
            }
        } catch (e) {
            alert("Network synchronization error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(!window.confirm("Purge this video asset from the store?")) return;
        try {
            const res = await fetch(getApiUrl(`content/videos/${id}`), { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchVideos();
        } catch (e) { console.error(e); }
    };

    const addTarget = (target: VideoTarget) => {
        if (!editingVideo) return;
        const currentTargets = editingVideo.targets || [];
        if (currentTargets.some(t => t.id === target.id)) return;

        setEditingVideo({
            ...editingVideo,
            targets: [...currentTargets, target]
        });
        setLinkSearch('');
    };

    const removeTarget = (id: string) => {
        if (!editingVideo) return;
        setEditingVideo({
            ...editingVideo,
            targets: editingVideo.targets?.filter(t => t.id !== id)
        });
    };

    const filteredTargets = useMemo(() => {
        if (!linkSearch) return [];
        return products.filter(p => p.name.toLowerCase().includes(linkSearch.toLowerCase())).slice(0, 5);
    }, [products, linkSearch]);

    if (loading) return <div className="p-20 text-center font-black uppercase text-zinc-300 italic tracking-[0.4em]">Booting Video Engine...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Shoppable Experience</h1>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Configure interactive video layers for Product Detail Pages and Home Discovery</p>
                </div>
                <Button onClick={handleCreate} className="bg-[#16423C] text-white font-black uppercase tracking-widest text-[10px] rounded-xl px-8 shadow-xl">
                    + Inject Video
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {videos.map(vid => {
                    const id = (vid as any)._id || vid.id;
                    return (
                        <div key={id} className="group relative bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-2xl transition-all duration-500 group">
                            <div className="aspect-[9/16] relative bg-zinc-900">
                                {vid.thumbnailUrl ? (
                                    <img src={vid.thumbnailUrl} className="w-full h-full object-cover opacity-80" alt={vid.title} />
                                ) : (
                                    <video src={vid.videoUrl} className="w-full h-full object-cover opacity-60" muted />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-transform group-hover:scale-110">
                                        <PlayIcon className="w-4 h-4 text-white fill-current ml-1" />
                                    </div>
                                </div>
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                                    {vid.targets && vid.targets.length > 0 && (
                                        <Badge className="bg-zinc-900/80 text-white border-none text-[8px] font-black uppercase px-2">
                                            {vid.targets.length} Linked
                                        </Badge>
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-xs font-black text-white uppercase truncate">{vid.title}</p>
                                    <p className="text-[10px] font-bold text-emerald-400 mt-1 italic">{vid.price || 'Collection Teaser'}</p>
                                </div>
                                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <button onClick={() => handleEdit(vid)} className="p-2 bg-white rounded-xl text-zinc-900 shadow-xl hover:bg-zinc-50 transition-colors">
                                        <EditPencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(id)} className="p-2 bg-rose-50 rounded-xl text-white shadow-xl hover:bg-rose-600 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button 
                    onClick={handleCreate}
                    className="aspect-[9/16] rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-3 text-zinc-300 hover:border-[#16423C] hover:text-[#16423C] hover:bg-zinc-50 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Inject Video</span>
                </button>
            </div>

            <Drawer isOpen={!!editingVideo} onClose={() => setEditingVideo(null)} title={editingVideo?.id || (editingVideo as any)?._id ? "Update Experience" : "New Experience"}>
                {editingVideo && (
                    <div className="flex flex-col h-full">
                        <div className="p-6">
                            <DrawerHeader>
                                <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shadow-inner mb-6">
                                    {['general', 'targeting', 'preview'].map(tab => (
                                        <button 
                                            key={tab} 
                                            onClick={() => setActiveTab(tab as any)}
                                            className={cn("flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all", activeTab === tab ? "bg-white text-zinc-900 shadow-md" : "text-zinc-400 hover:text-zinc-600")}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </DrawerHeader>
                        </div>

                        <DrawerContent>
                            <div className="space-y-8 px-6 pb-10">
                                {activeTab === 'general' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Internal Title</label>
                                            <Input 
                                                value={editingVideo.title || ''} 
                                                onChange={e => setEditingVideo({...editingVideo, title: e.target.value})}
                                                className="font-black text-sm h-12 rounded-xl border-zinc-200 italic"
                                                placeholder="e.g. Summer Silk Saree Teaser"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Display Price / Badge</label>
                                            <Input 
                                                value={editingVideo.price || ''} 
                                                onChange={e => setEditingVideo({...editingVideo, price: e.target.value})}
                                                className="font-black text-sm h-12 rounded-xl border-zinc-200 italic"
                                                placeholder="e.g. ₹2,499 or New"
                                            />
                                        </div>
                                        <div className="space-y-4 pt-4 border-t border-zinc-100">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Video Source (MP4 URL)</label>
                                            <MediaPicker value={editingVideo.videoUrl || ''} onChange={url => setEditingVideo({...editingVideo, videoUrl: url})} type="video" />
                                        </div>
                                        <div className="space-y-4 pt-4 border-t border-zinc-100">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Thumbnail Visual</label>
                                            <MediaPicker value={editingVideo.thumbnailUrl || ''} onChange={url => setEditingVideo({...editingVideo, thumbnailUrl: url})} type="image" />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'targeting' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-2">
                                        <div className="bg-zinc-900 rounded-[2rem] p-8 text-white shadow-2xl space-y-6">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">Mapping Engine</h4>
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                    <Input 
                                                        placeholder="Search master catalog..." 
                                                        value={linkSearch}
                                                        onChange={e => setLinkSearch(e.target.value)}
                                                        className="bg-white/5 border-white/10 text-white h-12 pl-12 rounded-xl text-xs font-bold"
                                                    />
                                                </div>
                                                {linkSearch && (
                                                    <div className="bg-zinc-800 rounded-2xl border border-white/10 overflow-hidden">
                                                        {filteredTargets.map(p => (
                                                            <button 
                                                                key={p.id} 
                                                                onClick={() => addTarget({ type: 'product', id: p.slug, name: p.name })}
                                                                className="w-full text-left px-5 py-3 text-[10px] font-bold uppercase hover:bg-white/10 border-b border-white/5 last:border-0 flex items-center justify-between group"
                                                            >
                                                                <span>{p.name}</span>
                                                                <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block border-b pb-2">Active Targets ({editingVideo.targets?.length || 0})</label>
                                            <div className="space-y-2">
                                                {editingVideo.targets?.map((t, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm group">
                                                        <div className="flex items-center gap-3">
                                                            <Package className="w-4 h-4 text-[#16423C]" />
                                                            <span className="text-xs font-bold uppercase text-zinc-700">{t.name}</span>
                                                        </div>
                                                        <button onClick={() => removeTarget(t.id)} className="text-zinc-300 hover:text-rose-500 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!editingVideo.targets || editingVideo.targets.length === 0) && (
                                                    <p className="text-[10px] font-black text-zinc-300 uppercase italic py-4 text-center">No catalog assets linked</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'preview' && (
                                    <div className="flex flex-col items-center justify-center py-10 animate-in fade-in slide-in-from-right-2">
                                        <div className="relative w-64 aspect-[9/16] bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-zinc-100 ring-1 ring-zinc-200">
                                            {editingVideo.videoUrl ? (
                                                <video 
                                                    src={editingVideo.videoUrl} 
                                                    className="w-full h-full object-cover" 
                                                    autoPlay 
                                                    muted 
                                                    loop 
                                                    playsInline
                                                />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center px-6">
                                                    No source data available for preview
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                                                <p className="text-white text-xs font-black uppercase italic">{editingVideo.title || 'Internal Name'}</p>
                                                <p className="text-emerald-400 text-[10px] font-bold uppercase mt-1 tracking-tighter">{editingVideo.price || 'Price Tag'}</p>
                                                <button className="w-full bg-white text-zinc-900 py-2.5 rounded-full mt-4 text-[9px] font-black uppercase tracking-widest shadow-xl">
                                                    Shop Collection
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mt-8 italic">Device Simulator v1.0</p>
                                    </div>
                                )}
                            </div>
                        </DrawerContent>

                        <DrawerFooter className="mt-auto">
                            <Button variant="ghost" className="flex-1 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-900" onClick={() => setEditingVideo(null)}>Discard</Button>
                            <Button 
                                className="flex-1 bg-[#16423C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:brightness-110 disabled:opacity-50" 
                                onClick={handleSaveVideo}
                                disabled={isSaving}
                            >
                                {isSaving ? "Syncing..." : "Publish Asset"}
                            </Button>
                        </DrawerFooter>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default VideoSettings;
