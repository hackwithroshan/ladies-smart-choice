
import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

// Cloudinary config
const CLOUDINARY_UPLOAD_PRESET = 'ladiesh';
const CLOUDINARY_CLOUD_NAME = 'djbv48acj';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

interface MediaPickerProps {
    value: string;
    onChange: (url: string) => void;
    type?: 'image' | 'video' | 'any';
    placeholder?: string;
    renderTrigger?: (open: () => void) => React.ReactNode; // NEW: Custom trigger prop
}

const MediaPicker: React.FC<MediaPickerProps> = ({ value, onChange, type = 'any', placeholder = "Select Media", renderTrigger }) => {
    const [isOpen, setIsOpen] = useState(false);
    const token = localStorage.getItem('token');

    // Modal state
    const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch media for the library tab when the modal opens and that tab is active
    useEffect(() => {
        if (isOpen && activeTab === 'library') {
            const fetchMedia = async () => {
                setLoading(true);
                try {
                    const res = await fetch(getApiUrl('/api/media'), {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setMedia(data);
                    }
                } catch (error) {
                    console.error("Failed to fetch media", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchMedia();
        }
    }, [isOpen, activeTab, token]);

    const handleSelect = (url: string) => {
        onChange(url);
        setIsOpen(false);
    };

    // --- Upload Logic ---
    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        let firstUrl: string | null = null;

        const uploads = Array.from(files).map(async (file, index) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            try {
                const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
                const data = await res.json();

                if (data.secure_url) {
                    if (index === 0) firstUrl = data.secure_url;

                    await fetch(getApiUrl('/api/media'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            url: data.secure_url,
                            public_id: data.public_id,
                            format: data.format,
                            type: data.resource_type
                        })
                    });
                } else {
                    console.error("Cloudinary upload error:", data);
                    alert(`Upload failed for ${file.name}: ${data.error?.message || "Unknown error"}`);
                }
            } catch (error) {
                console.error("Upload failed for file", file.name, error);
            }
        });

        await Promise.all(uploads);
        setUploading(false);

        // If an upload was successful, select the first one and close modal for a seamless workflow
        if (firstUrl) {
            handleSelect(firstUrl);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    };

    const TabButton = ({ id, label }: { id: 'upload' | 'library', label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === id
                    ? 'bg-white text-rose-600 shadow'
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            {/* Render Custom Trigger if provided, else Default Input UI */}
            {renderTrigger ? (
                renderTrigger(() => { setIsOpen(true); setActiveTab('library'); })
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="block w-full border-gray-300 rounded-l-lg shadow-sm p-2.5 border text-sm focus:ring-rose-500 focus:border-rose-500"
                                placeholder={placeholder || "https://..."}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => { setIsOpen(true); setActiveTab('upload'); }}
                            className="px-4 py-2.5 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 text-sm font-medium text-gray-700"
                        >
                            Choose
                        </button>
                    </div>

                    {value && (
                        <div className="mt-2 w-20 h-20 rounded-md border border-gray-200 overflow-hidden relative bg-gray-50">
                            {value.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video src={value} className="w-full h-full object-cover" />
                            ) : (
                                <img src={value} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <button type="button" onClick={() => onChange('')} className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl hover:bg-red-600">×</button>
                        </div>
                    )}
                </>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50/70">
                            <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
                                <TabButton id="upload" label="Upload Files" />
                                <TabButton id="library" label="Library" />
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'upload' ? (
                                <div className="p-4 h-full" onDragEnter={handleDrag}>
                                    <div
                                        className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 ${dragActive ? 'border-rose-500 bg-rose-50 scale-[1.02]' : 'border-gray-300 bg-gray-50'}`}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} accept="image/*,video/*" />
                                        {uploading ? (
                                            <>
                                                <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-4"></div>
                                                <p className="font-semibold text-rose-700">Uploading to cloud...</p>
                                                <p className="text-xs text-gray-500 mt-1">Please wait, this may take a moment.</p>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                <p className="text-lg font-semibold text-gray-700">Drag & drop your files here</p>
                                                <p className="text-gray-500 mt-2">or</p>
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 px-6 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 shadow-sm">
                                                    Browse Computer
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4">
                                    {loading ? <div className="text-center py-8">Loading Library...</div> : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                            {media.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleSelect(item.url)}
                                                    className="cursor-pointer group relative bg-white rounded-lg border border-gray-200 overflow-hidden aspect-square hover:border-rose-500 hover:ring-2 hover:ring-rose-200 transition-all"
                                                >
                                                    {item.type === 'video' ? (
                                                        <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                                                            <video src={item.url} className="w-full h-full object-cover opacity-80" />
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white absolute" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                                        </div>
                                                    ) : (
                                                        <img src={item.url} alt="Media" className="w-full h-full object-cover" />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                                </div>
                                            ))}
                                            {media.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No media found. Upload something!</div>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaPicker;
