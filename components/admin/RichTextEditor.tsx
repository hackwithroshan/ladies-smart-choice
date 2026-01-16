
import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';

import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
    Link as LinkIcon, Image as ImageIcon, Code, Type,
    Table as TableIcon, RotateCcw
} from 'lucide-react';

import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { CLOUDINARY } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    // Ensure value is never null/undefined to prevent crashes
    const safeValue = value || '';

    const [isSourceMode, setIsSourceMode] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const token = localStorage.getItem('token');

    // -- File Upload Logic --
    const uploadImage = async (file: File): Promise<string | null> => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY.UPLOAD_PRESET);

            const res = await fetch(CLOUDINARY.UPLOAD_URL, { method: 'POST', body: formData });
            const data = await res.json();

            if (data.secure_url) {
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
                return data.secure_url;
            }
            return null;
        } catch (error) {
            console.error("Upload failed", error);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4, 5, 6] },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-blue-600 underline' }
            }),
            Image.configure({
                HTMLAttributes: { class: 'rounded-lg border max-w-full my-4' },
                allowBase64: true,
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: { class: 'border-collapse table-auto w-full my-4' },
            }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder: 'Write something amazing...',
            }),
        ],
        content: safeValue,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 [&_p]:m-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        uploadImage(file).then(url => {
                            if (url) {
                                const { schema } = view.state;
                                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                                if (coordinates) {
                                    const node = schema.nodes.image.create({ src: url });
                                    const transaction = view.state.tr.insert(coordinates.pos, node);
                                    view.dispatch(transaction);
                                }
                            }
                        });
                        return true;
                    }
                }
                return false;
            }
        },
        onUpdate: ({ editor }) => {
            if (!isSourceMode) {
                onChange(editor.getHTML());
            }
        },
    });

    useEffect(() => {
        if (!editor || isSourceMode) return;

        const currentContent = editor.getHTML();
        if (safeValue !== currentContent) {
            // Only update if editor is empty or not focused to avoid cursor jumps
            if (editor.isEmpty || !editor.isFocused) {
                editor.commands.setContent(safeValue);
            }
        }
    }, [safeValue, editor, isSourceMode]);

    useEffect(() => {
        return () => {
            editor?.destroy();
        };
    }, []);

    if (!editor) return null;

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadImage(e.target.files[0]).then(url => {
                if (url) editor.chain().focus().setImage({ src: url }).run();
            });
        }
    };

    const ToolbarBtn = ({ onClick, isActive, icon: Icon, label, disabled = false }: { onClick: () => void, isActive?: boolean, icon: any, label: string, disabled?: boolean }) => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${isActive ? 'bg-zinc-200 text-black' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
                    onClick={onClick}
                    disabled={disabled}
                >
                    <Icon className="w-4 h-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );

    return (
        <TooltipProvider>
            <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col h-full min-h-[400px]">
                {/* Toolbar */}
                <div className="bg-zinc-50 border-b border-zinc-200 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10 w-full">

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsSourceMode(!isSourceMode)}
                                className={`h-8 px-2 gap-2 font-bold ${isSourceMode ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white' : ''}`}
                            >
                                {isSourceMode ? <><span className="text-xs">👁️</span> Visual</> : <><Code className="w-4 h-4" /> HTML</>}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isSourceMode ? "Switch to Visual Editor" : "Edit HTML Source"}</p>
                        </TooltipContent>
                    </Tooltip>

                    <div className="w-px h-6 bg-zinc-300 mx-1" />

                    {!isSourceMode ? (
                        <>
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                isActive={editor.isActive('bold')}
                                icon={Bold}
                                label="Bold"
                            />
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                isActive={editor.isActive('italic')}
                                icon={Italic}
                                label="Italic"
                            />
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                isActive={editor.isActive('underline')}
                                icon={UnderlineIcon}
                                label="Underline"
                            />
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().unsetAllMarks().run()}
                                icon={RotateCcw}
                                label="Clear Formatting"
                            />

                            <div className="w-px h-6 bg-zinc-300 mx-1" />

                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-zinc-600">
                                                <Type className="w-4 h-4" />
                                                <span className="text-xs font-medium w-16 text-left truncate">
                                                    {editor.isActive('heading', { level: 1 }) ? 'Heading 1' :
                                                        editor.isActive('heading', { level: 2 }) ? 'Heading 2' :
                                                            editor.isActive('heading', { level: 3 }) ? 'Heading 3' :
                                                                editor.isActive('heading', { level: 4 }) ? 'Heading 4' :
                                                                    editor.isActive('heading', { level: 5 }) ? 'Heading 5' :
                                                                        editor.isActive('heading', { level: 6 }) ? 'Heading 6' : 'Paragraph'}
                                                </span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Text Format</p></TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Paragraph</span>
                                            <span className="text-xs text-muted-foreground">Normal text</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                                        <h1 className="text-xl font-bold">Heading 1</h1>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                                        <h2 className="text-lg font-bold">Heading 2</h2>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                                        <h3 className="text-base font-bold">Heading 3</h3>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
                                        <h4 className="text-sm font-bold">Heading 4</h4>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}>
                                        <h5 className="text-xs font-bold">Heading 5</h5>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>
                                        <h6 className="text-[10px] font-bold">Heading 6</h6>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="w-px h-6 bg-zinc-300 mx-1" />

                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                isActive={editor.isActive('bulletList')}
                                icon={List}
                                label="Bullet List"
                            />
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                isActive={editor.isActive('orderedList')}
                                icon={ListOrdered}
                                label="Numbered List"
                            />

                            <div className="w-px h-6 bg-zinc-300 mx-1" />

                            <ToolbarBtn
                                onClick={setLink}
                                isActive={editor.isActive('link')}
                                icon={LinkIcon}
                                label="Insert Link"
                            />

                            <Popover>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900">
                                                <ImageIcon className="w-4 h-4" />
                                            </Button>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Insert Image</p></TooltipContent>
                                </Tooltip>
                                <PopoverContent className="w-80 p-3" align="start">
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm">Insert Image</h4>
                                        <div className="grid gap-2">
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="img-url">URL</Label>
                                                <Input
                                                    id="img-url"
                                                    placeholder="https://..."
                                                    className="h-8"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const target = e.target as HTMLInputElement;
                                                            if (target.value) { editor.chain().focus().setImage({ src: target.value }).run(); }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="text-center text-xs text-muted-foreground">- OR -</div>
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="img-upload" className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-center py-2 rounded border border-dashed border-zinc-300 transition-colors block w-full">
                                                    {isUploading ? 'Uploading...' : 'Upload from Computer'}
                                                </Label>
                                                <Input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUploadChange} disabled={isUploading} />
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <div className="w-px h-6 bg-zinc-300 mx-1" />

                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className={`h-8 w-8 ${editor.isActive('table') ? 'bg-zinc-200 text-black' : 'text-zinc-500 hover:text-zinc-900'}`}>
                                                <TableIcon className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Table</p></TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent className="w-48">
                                    <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                                        Insert 3x3 Table
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => editor.can().addColumnAfter() && editor.chain().focus().addColumnAfter().run()} className={!editor.can().addColumnAfter() ? 'opacity-50 pointer-events-none' : ''}>Add Column</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => editor.can().deleteColumn() && editor.chain().focus().deleteColumn().run()} className={!editor.can().deleteColumn() ? 'opacity-50 pointer-events-none' : ''}>Delete Column</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => editor.can().addRowAfter() && editor.chain().focus().addRowAfter().run()} className={!editor.can().addRowAfter() ? 'opacity-50 pointer-events-none' : ''}>Add Row</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => editor.can().deleteRow() && editor.chain().focus().deleteRow().run()} className={!editor.can().deleteRow() ? 'opacity-50 pointer-events-none' : ''}>Delete Row</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => editor.can().deleteTable() && editor.chain().focus().deleteTable().run()} className={`text-red-600 ${!editor.can().deleteTable() ? 'opacity-50 pointer-events-none' : ''}`}>
                                        Delete Table
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <textarea
                            value={safeValue}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full h-full min-h-[400px] p-4 font-mono text-sm resize-none focus:outline-none bg-zinc-50"
                            spellCheck={false}
                        />
                    )}
                </div>

                <div className="flex-1 bg-white relative">
                    {isUploading && (
                        <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                <span className="text-sm font-medium">Uploading Image...</span>
                            </div>
                        </div>
                    )}
                    {/* Reuse editor instance for Visual, but hide it if source mode (or unmount? Unmounting loses history. Keeping it grounded is better but Tiptap view might conflict. 
                      Actually, hiding visually is safer for history, but if we edit source, we update content anyway. 
                      Simple approach: Toggle rendering. 
                  */}
                    {!isSourceMode ? (
                        <EditorContent editor={editor} className="min-h-[400px] h-full" />
                    ) : null}
                    {/* Note: I moved textarea UP into the conditional block above to cleaner switch */}
                </div>

                <div className="bg-zinc-50 border-t border-zinc-200 px-3 py-1 text-[10px] text-zinc-400 flex justify-between">
                    <span>{isSourceMode ? 'HTML Source' : 'ProseMirror Rich Text'}</span>
                    <span>{isSourceMode ? '' : 'Drag & drop images supported'}</span>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default RichTextEditor;
