
import React, { useState, useEffect } from 'react';
import { MediaItem } from '../../types';
import { COLORS, CLOUDINARY } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';
// Add missing Trash2 import
import { Trash2 } from '../Icons';

const MediaLibrary: React.FC<{ token: string | null }> = ({ token }) => {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const fetchMedia = async () => {
        try {
            // Corrected: Removed redundant /api prefix
            const res = await fetch(getApiUrl('media'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setMedia(data);
        } catch (error) {
            console.error("Failed to fetch media", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, [token]);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        const uploads = Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY.UPLOAD_PRESET);
            formData.append('api_key', CLOUDINARY.API_KEY);

            try {
                const res = await fetch(CLOUDINARY.UPLOAD_URL, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.secure_url) {
                    const mediaData = {
                        url: data.secure_url,
                        public_id: data.public_id,
                        format: data.format,
                        type: data.resource_type 
                    };

                    // Corrected: Removed redundant /api prefix
                    await fetch(getApiUrl('media'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(mediaData)
                    });
                }
            } catch (error) {
                console.error("Upload failed for file", file.name, error);
            }
        });

        await Promise.all(uploads);
        setUploading(false);
        fetchMedia();
    };

    const deleteMedia = async (id: string) => {
        if (!window.confirm("Delete this file from library?")) return;
        try {
            // Corrected: Removed redundant /api prefix
            await fetch(getApiUrl(`media/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMedia(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopyFeedback(url);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    if (loading) return <div className="p-20 text-center font-black uppercase text-zinc-300 italic tracking-widest">Indexing Assets...</div>;

    return (
        <div className="h-full flex flex-col space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex flex-col">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Cloud Media Matrix</h2>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Manage global image and video assets for the storefront</p>
                </div>
                <div className="relative">
                    <input 
                        type="file" 
                        multiple 
                        onChange={(e) => handleUpload(e.target.files)} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*,video/*"
                    />
                    <button className="px-8 py-3 bg-[#16423C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all">
                        + Inject Assets
                    </button>
                </div>
            </div>

            <div 
                className={`relative border-2 border-dashed rounded-[2.5rem] p-12 transition-all flex flex-col items-center justify-center text-center ${dragActive ? 'border-[#16423C] bg-emerald-50 scale-[1.01]' : 'border-zinc-200 bg-white'}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload(e.dataTransfer.files); }}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#16423C] rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase text-[#16423C] tracking-widest animate-pulse">Syncing with Cloudinary...</p>
                    </div>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Relay media nodes here for injection</p>
                    </>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-20">
                {media.map((item) => (
                    <div key={item.id} className="group relative bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden aspect-square hover:shadow-2xl transition-all">
                        {item.type === 'video' ? (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative">
                                <video src={item.url} className="w-full h-full object-cover opacity-80" muted />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <img src={item.url} alt="" className="w-full h-full object-cover bg-zinc-50" />
                        )}
                        
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => copyToClipboard(item.url)}
                                    className="flex-1 bg-white text-zinc-900 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
                                >
                                    {copyFeedback === item.url ? 'Copied' : 'Link'}
                                </button>
                                <button 
                                    onClick={() => deleteMedia(item.id)}
                                    className="bg-rose-500 text-white w-9 h-9 rounded-xl flex items-center justify-center hover:bg-rose-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MediaLibrary;
