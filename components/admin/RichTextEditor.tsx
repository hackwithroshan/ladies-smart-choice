
import React, { useState, useEffect, useRef } from 'react';
import { CodeIcon } from '../Icons';
import { CLOUDINARY } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
}

interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const [isSourceMode, setIsSourceMode] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Image Modal State
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageTab, setImageTab] = useState<'upload' | 'library'>('upload');
    const [libraryImages, setLibraryImages] = useState<MediaItem[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const contentEditableRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (contentEditableRef.current && !isSourceMode && document.activeElement !== contentEditableRef.current) {
            if (contentEditableRef.current.innerHTML !== value) {
                contentEditableRef.current.innerHTML = value;
            }
        }
    }, [value, isSourceMode]);

    // Fetch Library when tab opens
    useEffect(() => {
        if (showImageModal && imageTab === 'library') {
            fetchLibrary();
        }
    }, [showImageModal, imageTab]);

    const fetchLibrary = async () => {
        setLoadingLibrary(true);
        try {
            const res = await fetch(getApiUrl('/api/media'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter only images
                setLibraryImages(data.filter((item: MediaItem) => item.type === 'image'));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingLibrary(false);
        }
    };

    const execCmd = (command: string, arg: string | undefined = undefined) => {
        document.execCommand(command, false, arg);
        if (contentEditableRef.current) {
            onChange(contentEditableRef.current.innerHTML);
            contentEditableRef.current.focus();
        }
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    // --- Image Handling ---

    const insertImage = (url: string) => {
        // Restore focus
        contentEditableRef.current?.focus();
        document.execCommand('insertImage', false, url);
        if (contentEditableRef.current) {
            onChange(contentEditableRef.current.innerHTML);
        }
        setShowImageModal(false);
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;

                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY.UPLOAD_PRESET);

                const res = await fetch(CLOUDINARY.UPLOAD_URL, { method: 'POST', body: formData });
                const data = await res.json();

                if (data.secure_url) {
                    // Also save to backend media library for future use
                    try {
                        await fetch(getApiUrl('/api/media'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({
                                url: data.secure_url,
                                public_id: data.public_id,
                                format: data.format,
                                type: 'image'
                            })
                        });
                    } catch (err) { console.error("Failed to save to library db", err); }

                    insertImage(data.secure_url);
                }
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Image upload failed.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Drag handlers for Modal
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    // --- Editor Drop Handler (for direct drop on text area) ---
    const handleEditorDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const ToolbarButton = ({ cmd, arg, icon, label, onClick, active }: { cmd?: string, arg?: string, icon?: React.ReactNode, label?: string, onClick?: () => void, active?: boolean }) => (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick || (() => cmd && execCmd(cmd, arg))}
            className={`p-1.5 rounded transition-colors ${active ? 'bg-zinc-200 text-black' : 'text-zinc-600 hover:bg-zinc-100'}`}
            title={label}
        >
            {icon}
        </button>
    );

    return (
        <div className="border border-input rounded-md overflow-hidden shadow-sm transition-all focus-within:ring-1 focus-within:ring-zinc-900 focus-within:border-zinc-900 bg-white">
            <div className="flex items-center gap-1 bg-zinc-50 border-b border-border p-2 flex-wrap">
                <div className="flex gap-1 mr-4 border-r border-zinc-200 pr-4">
                    <button
                        type="button"
                        onClick={() => setIsSourceMode(!isSourceMode)}
                        className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-2 ${isSourceMode ? 'bg-zinc-900 text-white' : 'bg-white border text-zinc-700 hover:bg-zinc-100'}`}
                    >
                        {isSourceMode ? <><span>👁️</span> Visual</> : <><CodeIcon /> HTML</>}
                    </button>
                </div>

                {!isSourceMode && (
                    <>
                        {/* Headings Dropdown */}
                        <div className="relative mr-2">
                            <select
                                onChange={(e) => execCmd('formatBlock', e.target.value)}
                                className="h-8 text-xs border border-input rounded px-2 bg-white text-zinc-700 focus:outline-none hover:bg-zinc-50 cursor-pointer"
                                defaultValue="P"
                            >
                                <option value="P">Paragraph</option>
                                <option value="H1">Heading 1</option>
                                <option value="H2">Heading 2</option>
                                <option value="H3">Heading 3</option>
                                <option value="H4">Heading 4</option>
                                <option value="H5">Heading 5</option>
                                <option value="H6">Heading 6</option>
                            </select>
                        </div>

                        <div className="w-px h-4 bg-zinc-300 mx-1"></div>

                        <ToolbarButton cmd="bold" label="Bold" icon={<span className="font-bold w-4">B</span>} />
                        <ToolbarButton cmd="italic" label="Italic" icon={<span className="italic w-4">I</span>} />
                        <ToolbarButton cmd="underline" label="Underline" icon={<span className="underline w-4">U</span>} />

                        <div className="w-px h-4 bg-zinc-300 mx-1"></div>

                        <ToolbarButton cmd="justifyLeft" label="Align Left" icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z" /></svg>} />
                        <ToolbarButton cmd="justifyCenter" label="Align Center" icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm3 7h12v2H6v-2zm-3 7h18v2H3v-2z" /></svg>} />

                        <div className="w-px h-4 bg-zinc-300 mx-1"></div>

                        <ToolbarButton cmd="insertUnorderedList" label="Bullet List" icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zM8 6h12v2H8V6zm0 5h12v2H8v-2zm0 5h12v2H8v-2zm0 5h12v2H8v-2z" /></svg>} />
                        <ToolbarButton cmd="insertOrderedList" label="Numbered List" icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zM8 6h12v2H8V6zm0 5h12v2H8v-2zm0 5h12v2H8v-2zm0 5h12v2H8v-2z" /></svg>} />

                        <div className="w-px h-4 bg-zinc-300 mx-1"></div>

                        {/* Image Button Triggers Modal */}
                        <ToolbarButton
                            onClick={() => { setShowImageModal(true); setImageTab('upload'); }}
                            label="Insert Image"
                            icon={
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            }
                        />

                        <ToolbarButton cmd="removeFormat" label="Clear Format" icon={<span className="text-xs">Clear</span>} />
                    </>
                )}
            </div>

            <div className="relative min-h-[300px]">
                {/* Uploading Indicator Overlay */}
                {isUploading && (
                    <div className="absolute inset-0 z-10 bg-white/80 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mb-2"></div>
                        <span className="text-sm font-semibold text-zinc-900">Uploading Image...</span>
                    </div>
                )}

                {isSourceMode ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-[300px] p-4 font-mono text-sm text-zinc-800 bg-zinc-50 outline-none resize-y"
                        placeholder="<!-- Paste HTML here -->"
                    />
                ) : (
                    <div
                        ref={contentEditableRef}
                        contentEditable
                        onInput={handleInput}
                        onDrop={handleEditorDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="prose prose-sm max-w-none p-4 min-h-[300px] outline-none focus:outline-none overflow-y-auto"
                        style={{ maxHeight: '600px' }}
                        data-placeholder="Start typing or drag & drop images here..."
                    />
                )}
            </div>
            <div className="bg-zinc-50 px-3 py-1 flex justify-between items-center text-[10px] text-zinc-400 border-t">
                <span>{isSourceMode ? '' : 'Tip: You can drag and drop images directly into the editor.'}</span>
                <span>{isSourceMode ? 'HTML Mode' : 'Rich Text Mode'}</span>
            </div>

            {/* --- Image Selection Modal --- */}
            {showImageModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-zinc-50">
                            <h3 className="font-bold text-zinc-800">Insert Image</h3>
                            <button onClick={() => setShowImageModal(false)} className="text-zinc-400 hover:text-zinc-600">&times;</button>
                        </div>

                        <div className="flex border-b">
                            <button
                                onClick={() => setImageTab('upload')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${imageTab === 'upload' ? 'border-b-2 border-zinc-900 text-zinc-900 bg-zinc-100' : 'text-zinc-600 hover:bg-zinc-50'}`}
                            >
                                Upload (Drag & Drop)
                            </button>
                            <button
                                onClick={() => setImageTab('library')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${imageTab === 'library' ? 'border-b-2 border-zinc-900 text-zinc-900 bg-zinc-100' : 'text-zinc-600 hover:bg-zinc-50'}`}
                            >
                                Media Library
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
                            {imageTab === 'upload' ? (
                                <div
                                    className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all ${dragActive ? 'border-zinc-500 bg-zinc-100' : 'border-zinc-300 bg-white'}`}
                                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                >
                                    <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} accept="image/*" />
                                    <svg className="w-12 h-12 text-zinc-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <p className="text-zinc-700 font-medium">Drag & Drop image here</p>
                                    <p className="text-xs text-zinc-500 mt-1 mb-4">or</p>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 shadow-sm">Browse Files</button>
                                </div>
                            ) : (
                                <div className="h-full">
                                    {loadingLibrary ? <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400"></div></div> : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {libraryImages.length > 0 ? libraryImages.map((img) => (
                                                <div key={img.id} onClick={() => insertImage(img.url)} className="cursor-pointer group relative bg-white rounded-lg border border-zinc-200 overflow-hidden aspect-square hover:ring-2 hover:ring-zinc-900 hover:border-transparent">
                                                    <img src={img.url} className="w-full h-full object-cover" alt="Library" />
                                                </div>
                                            )) : <div className="col-span-full text-center py-10 text-zinc-500">No images in library.</div>}
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

export default RichTextEditor;
