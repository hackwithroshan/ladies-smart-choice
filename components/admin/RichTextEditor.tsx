
import React, { useState, useEffect, useRef } from 'react';
import { CodeIcon } from '../Icons';

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const [isSourceMode, setIsSourceMode] = useState(false);
    const contentEditableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentEditableRef.current && !isSourceMode && document.activeElement !== contentEditableRef.current) {
            if (contentEditableRef.current.innerHTML !== value) {
                contentEditableRef.current.innerHTML = value;
            }
        }
    }, [value, isSourceMode]);

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

    const ToolbarButton = ({ cmd, arg, icon, label }: { cmd?: string, arg?: string, icon?: React.ReactNode, label?: string }) => (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // Prevents loss of focus from editor
            onClick={() => cmd && execCmd(cmd, arg)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title={label}
        >
            {icon}
        </button>
    );

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm transition-all focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
            <div className="flex items-center gap-1 bg-gray-50 border-b border-gray-200 p-2 flex-wrap">
                <div className="flex gap-1 mr-4 border-r border-gray-300 pr-4">
                    <button
                        type="button"
                        onClick={() => setIsSourceMode(!isSourceMode)}
                        className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-2 ${isSourceMode ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100'}`}
                    >
                        {isSourceMode ? (
                            <><span>👁️</span> Visual</>
                        ) : (
                            <><CodeIcon /> HTML</>
                        )}
                    </button>
                </div>

                {!isSourceMode && (
                    <>
                        <ToolbarButton cmd="bold" label="Bold" icon={<span className="font-bold w-4">B</span>} />
                        <ToolbarButton cmd="italic" label="Italic" icon={<span className="italic w-4">I</span>} />
                        <ToolbarButton cmd="underline" label="Underline" icon={<span className="underline w-4">U</span>} />
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <ToolbarButton cmd="justifyLeft" label="Align Left" icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z"/></svg>} />
                        <ToolbarButton cmd="justifyCenter" label="Align Center" icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm3 7h12v2H6v-2zm-3 7h18v2H3v-2z"/></svg>} />
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <ToolbarButton cmd="insertUnorderedList" label="Bullet List" icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zM8 6h12v2H8V6zm0 5h12v2H8v-2zm0 5h12v2H8v-2z"/></svg>} />
                        <ToolbarButton cmd="insertOrderedList" label="Numbered List" icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zM8 6h12v2H8V6zm0 5h12v2H8v-2zm0 5h12v2H8v-2z"/></svg>} />
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <ToolbarButton cmd="formatBlock" arg="H2" label="Heading 2" icon={<span className="font-bold text-xs">H2</span>} />
                        <ToolbarButton cmd="formatBlock" arg="H3" label="Heading 3" icon={<span className="font-bold text-xs">H3</span>} />
                        <ToolbarButton cmd="removeFormat" label="Clear Format" icon={<span className="text-xs">Clear</span>} />
                    </>
                )}
            </div>

            <div className="relative min-h-[300px]">
                {isSourceMode ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-[300px] p-4 font-mono text-sm text-gray-800 bg-gray-900/5 outline-none resize-y"
                        placeholder="<!-- Paste HTML here -->"
                    />
                ) : (
                    <div
                        ref={contentEditableRef}
                        contentEditable
                        onInput={handleInput}
                        className="prose prose-sm max-w-none p-4 min-h-[300px] outline-none focus:outline-none overflow-y-auto"
                        style={{ maxHeight: '600px' }}
                    />
                )}
            </div>
             <div className="bg-gray-50 px-3 py-1 text-[10px] text-gray-400 border-t text-right">
                {isSourceMode ? 'HTML Mode' : 'Rich Text Mode'}
            </div>
        </div>
    );
};

export default RichTextEditor;
