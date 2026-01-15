
import React, { useState, useEffect } from 'react';
import { PDPSection, ProductPageLayout, Product, PDPSectionType } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';
import { useSiteData } from '../../contexts/SiteDataContext';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, useDraggable } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../../components/ui/accordion"
import {
    Image,
    FileText,
    Settings,
    StarIcon,
    Package,
    CodeIcon,
    Sparkles,
    MousePointer2,
    Trash2,
    MenuIcon
} from '../Icons';

const ShadcnSlider: React.FC<{ label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }> = ({ label, value, onChange, min = 10, max = 100, unit = 'px' }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</label>
            <span className="text-[10px] font-mono font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">{value}{unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
        />
    </div>
);

const PDPSectionSettings: React.FC<{
    section: PDPSection;
    update: (updates: Partial<PDPSection>) => void;
    token: string | null;
    addSection: (type: PDPSectionType) => void;
}> = ({ section, update, token, addSection }) => {
    const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');

    const handleStyleChange = (key: string, val: any) => {
        update({ style: { ...section.style, [key]: val } });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 p-1 text-zinc-500 w-full mb-4">
                <button onClick={() => setActiveTab('content')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all w-1/2 ${activeTab === 'content' ? 'bg-white text-zinc-950 shadow-sm' : 'hover:text-zinc-950'}`}>Content</button>
                <button onClick={() => setActiveTab('design')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all w-1/2 ${activeTab === 'design' ? 'bg-white text-zinc-950 shadow-sm' : 'hover:text-zinc-950'}`}>Design</button>
            </div>

            {activeTab === 'content' && (
                <div className="space-y-6">
                    {section.type === 'Hero' && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4">
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Dynamic Hero Block</p>
                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Product name, price, and primary image are pulled automatically.</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Child Sections</p>
                                <button
                                    onClick={() => addSection('ProductDetails')}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-dashed border-zinc-300 rounded-md text-[10px] font-black uppercase tracking-widest hover:border-zinc-900 hover:bg-zinc-50 transition-all"
                                >
                                    <MenuIcon className="w-3 h-3" />
                                    <span>Add Inner Section</span>
                                </button>
                                <p className="text-[10px] text-zinc-400 italic text-center">Only Product Details block is supported as a child.</p>
                            </div>
                        </div>
                    )}

                    {section.type === 'FAQ' && (
                        <div className="space-y-4">
                            {(section.content?.faqs || []).map((faq: any, idx: number) => (
                                <div key={idx} className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-2 relative group">
                                    <input type="text" value={faq.q} onChange={e => {
                                        const n = [...section.content.faqs]; n[idx].q = e.target.value;
                                        update({ content: { ...section.content, faqs: n } });
                                    }} placeholder="Question" className="w-full text-xs font-bold bg-transparent border-b border-zinc-200 pb-1 outline-none" />
                                    <textarea value={faq.a} onChange={e => {
                                        const n = [...section.content.faqs]; n[idx].a = e.target.value;
                                        update({ content: { ...section.content, faqs: n } });
                                    }} placeholder="Answer" className="w-full text-xs bg-transparent outline-none resize-none" rows={2} />
                                    <button onClick={() => {
                                        const n = section.content.faqs.filter((_: any, i: number) => i !== idx);
                                        update({ content: { ...section.content, faqs: n } });
                                    }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                </div>
                            ))}
                            <button onClick={() => {
                                const n = [...(section.content?.faqs || []), { q: 'New Question', a: '' }];
                                update({ content: { ...section.content, faqs: n } });
                            }} className="w-full py-2 bg-white border border-dashed border-zinc-300 rounded-md text-[10px] font-black uppercase tracking-widest hover:border-zinc-900">+ Add FAQ Entry</button>
                        </div>
                    )}

                    {section.type === 'A+Content' && (
                        <div className="space-y-6">
                            <div className="space-y-3 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                                <label className="text-[10px] font-black text-zinc-400 uppercase">Section Heading (Optional)</label>
                                <input type="text" value={section.content?.title || ''} onChange={e => update({ content: { ...section.content, title: e.target.value } })} className="w-full text-sm font-bold bg-white border border-zinc-200 rounded px-2 py-1.5 outline-none" placeholder="Section Title" />
                                <textarea value={section.content?.description || ''} onChange={e => update({ content: { ...section.content, description: e.target.value } })} className="w-full text-xs bg-white border border-zinc-200 rounded p-2 outline-none" rows={2} placeholder="Section Description paragraph..." />
                            </div>

                            {(section.content?.blocks || []).map((block: any, idx: number) => (
                                <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4 shadow-sm relative group">
                                    <MediaPicker value={block.img} onChange={url => {
                                        const n = [...section.content.blocks]; n[idx].img = url;
                                        update({ content: { ...section.content, blocks: n } });
                                    }} type="image" />
                                    <input type="text" value={block.title} onChange={e => {
                                        const n = [...section.content.blocks]; n[idx].title = e.target.value;
                                        update({ content: { ...section.content, blocks: n } });
                                    }} className="w-full font-bold text-xs border-b border-zinc-100 outline-none pb-1" placeholder="Block Title" />
                                    <input type="text" value={block.link || ''} onChange={e => {
                                        const n = [...section.content.blocks]; n[idx].link = e.target.value;
                                        update({ content: { ...section.content, blocks: n } });
                                    }} className="w-full text-[10px] font-mono text-blue-600 border-b border-zinc-100 outline-none pb-1" placeholder="Link URL (optional)" />
                                    <textarea value={block.text} onChange={e => {
                                        const n = [...section.content.blocks]; n[idx].text = e.target.value;
                                        update({ content: { ...section.content, blocks: n } });
                                    }} className="w-full text-xs outline-none bg-zinc-50 rounded p-2" rows={2} placeholder="Block Description..." />
                                    <button onClick={() => {
                                        const n = section.content.blocks.filter((_: any, i: number) => i !== idx);
                                        update({ content: { ...section.content, blocks: n } });
                                    }} className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100">Delete</button>
                                </div>
                            ))}
                            <button onClick={() => {
                                const n = [...(section.content?.blocks || []), { img: '', title: 'Brand Feature', text: 'Detail about this feature...' }];
                                update({ content: { ...section.content, blocks: n } });
                            }} className="w-full py-2 bg-white border border-dashed border-zinc-300 rounded-md text-[10px] font-black uppercase tracking-widest">+ Add Story Block</button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'design' && (
                <div className="space-y-10 pb-10">
                    {/* Hero Specific Typography */}
                    {section.type === 'Hero' && (
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-3 bg-zinc-900 rounded-full"></span>
                                Typography Scaling
                            </h4>
                            <div className="grid grid-cols-1 gap-6">
                                <ShadcnSlider label="Title Font Size" value={section.style?.titleFontSize || 48} onChange={v => handleStyleChange('titleFontSize', v)} min={20} max={100} />
                                <ShadcnSlider label="Price Font Size" value={section.style?.priceFontSize || 56} onChange={v => handleStyleChange('priceFontSize', v)} min={20} max={120} />
                                <ShadcnSlider label="Description Size" value={section.style?.shortDescFontSize || 15} onChange={v => handleStyleChange('shortDescFontSize', v)} min={12} max={24} />
                            </div>
                        </div>
                    )}

                    {section.type === 'RelatedProducts' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1 h-3 bg-zinc-900 rounded-full"></span>
                                    Display Settings
                                </h4>
                                <ShadcnSlider label="Total Products to Show" value={section.settings?.limit || 4} onChange={v => update({ settings: { ...section.settings, limit: v } })} min={2} max={12} />
                                <ShadcnSlider label="Products per Row" value={section.settings?.itemsPerRow || 4} onChange={v => update({ settings: { ...section.settings, itemsPerRow: v } })} min={2} max={6} />
                            </div>
                        </div>
                    )}

                    {/* Image Controls */}
                    {(section.type === 'Hero' || section.type === 'A+Content') && (
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-3 bg-zinc-900 rounded-full"></span>
                                Media Sizing
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Image Width</label>
                                    <input type="text" value={section.style?.imageWidth || '100%'} onChange={e => handleStyleChange('imageWidth', e.target.value)} className="w-full h-9 rounded-md border border-zinc-200 px-3 py-1 text-sm font-mono shadow-sm" placeholder="e.g. 500px or 80%" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Image Height</label>
                                    <input type="text" value={section.style?.imageHeight || 'auto'} onChange={e => handleStyleChange('imageHeight', e.target.value)} className="w-full h-9 rounded-md border border-zinc-200 px-3 py-1 text-sm font-mono shadow-sm" placeholder="e.g. auto or 400px" />
                                </div>
                                <div className="col-span-2">
                                    <ShadcnSlider label="Image Border Radius" value={section.style?.imageBorderRadius || 0} onChange={v => handleStyleChange('imageBorderRadius', v)} max={50} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Alignment</label>
                                <select value={section.style?.imageAlign || 'center'} onChange={e => handleStyleChange('imageAlign', e.target.value)} className="w-full h-9 rounded-md border border-zinc-200 px-3 py-1 text-sm shadow-sm bg-white">
                                    <option value="left">Left Align</option>
                                    <option value="center">Center Align</option>
                                    <option value="right">Right Align</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Standard Section Padding */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 bg-zinc-900 rounded-full"></span>
                            Section Spacing
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                            <ShadcnSlider label="Top Padding" value={section.style?.paddingTop ?? 0} onChange={v => handleStyleChange('paddingTop', v)} max={200} />
                            <ShadcnSlider label="Bottom Padding" value={section.style?.paddingBottom ?? 0} onChange={v => handleStyleChange('paddingBottom', v)} max={200} />
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Container Width</label>
                                <input type="text" value={section.style?.containerMaxWidth || '1200px'} onChange={e => handleStyleChange('containerMaxWidth', e.target.value)} className="w-full h-9 rounded-md border border-zinc-200 px-3 py-1 text-sm font-mono shadow-sm" placeholder="e.g. 1400px or 100%" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 bg-zinc-900 rounded-full"></span>
                            Visual Styling
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase">Background</label>
                                <input type="color" value={section.style?.backgroundColor || '#FFFFFF'} onChange={e => handleStyleChange('backgroundColor', e.target.value)} className="w-full h-10 rounded-md border-none cursor-pointer shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase">Text Contrast</label>
                                <input type="color" value={section.style?.textColor || '#09090b'} onChange={e => handleStyleChange('textColor', e.target.value)} className="w-full h-10 rounded-md border-none cursor-pointer shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

// Sortable Item Component
// Sortable Item Component with Nesting Support
function SortableLayerItem({ section, isActive, setActive, removeSection, updateSection, depth = 0 }: { section: PDPSection; isActive: boolean; setActive: (id: string) => void; removeSection: (id: string) => void; updateSection: (id: string, data: Partial<PDPSection>) => void; depth?: number }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${depth * 16}px`
    };

    return (
        <div className="space-y-2">
            <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={(e) => { e.stopPropagation(); setActive(section.id); }} className={`group relative flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isActive ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}>
                <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 opacity-50 cursor-grab active:cursor-grabbing">
                        <div className="w-4 h-0.5 bg-current rounded-full"></div>
                        <div className="w-4 h-0.5 bg-current rounded-full"></div>
                        <div className="w-4 h-0.5 bg-current rounded-full"></div>
                    </div>
                    <span className="text-[12px] font-bold tracking-tight">{depth > 0 && '└ '}{section.type} Block</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                        className={`p-1 rounded hover:bg-zinc-100/20 active:scale-95 transition-all text-current`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            {/* Render Children if any */}
            {section.children && section.children.length > 0 && (
                <SortableContext items={section.children.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2 relative border-l-2 border-zinc-100 ml-4 pl-0">
                        {section.children.map(child => (
                            <SortableLayerItem
                                key={child.id}
                                section={child}
                                isActive={isActive} // Check handled by parent usually but here logic matches ID
                                setActive={setActive}
                                removeSection={removeSection}
                                updateSection={updateSection}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                </SortableContext>
            )}
        </div>
    );
}

// Draggable Component for New Sections
function DraggableSectionItem({ type, icon: Icon, label }: { type: PDPSectionType; icon: any; label: string }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `new-${type}`,
        data: { type, isNew: true }
    });

    // Only apply transform if we are dragging this specific item to show the ghost
    // Note: for the "toolbar" item itself, we usually don't want it to move, but useDragOverlay is better.
    // However, for simplicity and typical dnd-kit usage without overlay, the item moves.
    // To keep the list intact, we would ideally use DragOverlay.
    // Given the constraints and typical "sidebar drag" pattern, we'll let it move or use a key strategy if requested.
    // For now, standard draggable behavior.
    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        opacity: 0.8,
        zIndex: 1000,
        position: 'relative' as 'relative'
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="w-full">
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 cursor-grab active:cursor-grabbing transition-colors">
                <div className="p-1.5 bg-white border border-zinc-200 rounded shadow-sm text-zinc-500">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-zinc-700">{label}</span>
            </div>
        </div>
    );
}

const SECTION_TYPES = [
    { type: 'Hero', label: 'Hero Section', icon: Sparkles },
    { type: 'A+Content', label: 'A+ Content', icon: Image },
    { type: 'FAQ', label: 'FAQ Accordion', icon: FileText },
    { type: 'Reviews', label: 'Reviews', icon: StarIcon },
    { type: 'RelatedProducts', label: 'Related Products', icon: Package },
    { type: 'CustomCode', label: 'Custom Code', icon: CodeIcon },
    { type: 'ProductDetails', label: 'Product Details', icon: MenuIcon },
] as const;

const PDPBuilder: React.FC<{ token: string | null; productId: string }> = ({ token, productId }) => {
    const [layout, setLayout] = useState<ProductPageLayout>({ productId, isGlobal: productId === 'global', sections: [], stickyAtcEnabled: true });
    const [activeSecId, setActiveSecId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
    const [selectedComponentType, setSelectedComponentType] = useState<PDPSectionType | ''>('');
    const { siteSettings } = useSiteData();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        const fetchDesignerData = async () => {
            setLoading(true);
            try {
                const lRes = await fetch(getApiUrl(`/api/settings/pdp-layout/${productId}`));
                if (lRes.ok) {
                    const data = await lRes.json();
                    if (data && data.sections) setLayout(prev => ({ ...prev, ...data }));
                }
                const pRes = await fetch(getApiUrl(productId !== 'global' ? `/api/products/${productId}` : '/api/products/featured'));
                if (pRes.ok) {
                    const pData = await pRes.json();
                    setPreviewProduct(Array.isArray(pData) ? pData[0] : pData);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchDesignerData();
    }, [productId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(getApiUrl(`/api/settings/pdp-layout/${productId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(layout)
            });
            alert('PDP Design Published!');
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const addSection = (type: PDPSectionType) => {
        const newSec: PDPSection = {
            id: `pdp-${type.toLowerCase()}-${Date.now()}`,
            type,
            isActive: true,
            content: type === 'FAQ' ? { faqs: [] } : (type === 'A+Content' ? { blocks: [] } : {}),
            settings: {},
            style: {
                paddingTop: type === 'ProductDetails' ? 20 : 60, paddingBottom: type === 'ProductDetails' ? 20 : 60, paddingLeft: 0, paddingRight: 0,
                marginTop: 0, marginBottom: 0,
                backgroundColor: '#FFFFFF', textColor: '#09090b',
                titleFontSize: 42, priceFontSize: 56, shortDescFontSize: 15,
                containerMaxWidth: '1200px', imageWidth: '100%', imageHeight: 'auto', imageAlign: 'center'
            }
        };

        // Check if we are adding ProductDetails to a Hero block
        if (activeSecId && type === 'ProductDetails') {
            const activeSec = findActiveSection(layout.sections, activeSecId);
            if (activeSec && activeSec.type === 'Hero') {
                updateSection(activeSec.id, { children: [...(activeSec.children || []), newSec] });
                setActiveSecId(newSec.id);
                setSelectedComponentType('');
                return;
            }
        }

        setLayout(prev => ({ ...prev, sections: [...prev.sections, newSec] }));
        setActiveSecId(newSec.id);
        setSelectedComponentType('');
    };

    const updateSectionRecursive = (sections: PDPSection[], id: string, updates: Partial<PDPSection>): PDPSection[] => {
        return sections.map(s => {
            if (s.id === id) return { ...s, ...updates };
            if (s.children) return { ...s, children: updateSectionRecursive(s.children, id, updates) };
            return s;
        });
    };

    const updateSection = (id: string, updates: Partial<PDPSection>) => {
        setLayout(prev => ({ ...prev, sections: updateSectionRecursive(prev.sections, id, updates) }));
    };

    const removeSectionRecursive = (sections: PDPSection[], id: string): PDPSection[] => {
        return sections.filter(s => s.id !== id).map(s => ({
            ...s,
            children: s.children ? removeSectionRecursive(s.children, id) : undefined
        }));
    };

    const removeSection = (id: string) => {
        setLayout(prev => ({ ...prev, sections: removeSectionRecursive(prev.sections, id) }));
        if (activeSecId === id) setActiveSecId(null);
    };

    // Recursive search for active section
    const findActiveSection = (sections: PDPSection[], id: string | null): PDPSection | undefined => {
        if (!id) return undefined;
        for (const sec of sections) {
            if (sec.id === id) return sec;
            if (sec.children) {
                const found = findActiveSection(sec.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    // Correctly handle reordering for nested lists
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        if (active.data.current?.isNew) {
            addSection(active.data.current.type as PDPSectionType);
            return;
        }

        if (active.id !== over.id) {
            setLayout((prev) => {
                // Helper to find and reorder within the correct parent
                const reorderRecursive = (sections: PDPSection[]): PDPSection[] => {
                    const activeIndex = sections.findIndex(s => s.id === active.id);
                    const overIndex = sections.findIndex(s => s.id === over.id);

                    if (activeIndex !== -1 && overIndex !== -1) {
                        return arrayMove(sections, activeIndex, overIndex);
                    }

                    return sections.map(s => {
                        if (s.children) return { ...s, children: reorderRecursive(s.children) };
                        return s;
                    });
                };

                return { ...prev, sections: reorderRecursive(prev.sections) };
            });
        }
    };

    const activeSection = findActiveSection(layout.sections, activeSecId);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-zinc-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900"></div>
                <p className="text-sm font-medium text-zinc-500 tracking-tight">Loading Visual Editor...</p>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-full bg-zinc-100 overflow-hidden">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {/* Sidebar Layers */}
                <div className="w-[260px] bg-white border-r border-zinc-200 flex flex-col shrink-0 overflow-hidden h-full shadow-xl z-20">
                    <div className="p-5 border-b border-zinc-100 flex flex-col gap-4">
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Add Element</h4>
                            <div className="relative">
                                <Select value={selectedComponentType} onValueChange={(val: any) => setSelectedComponentType(val)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Component" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SECTION_TYPES.map((item) => (
                                            <SelectItem key={item.type} value={item.type}>
                                                <div className="flex items-center gap-2">
                                                    <item.icon className="w-4 h-4 text-zinc-500" />
                                                    <span>{item.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Draggable Preview of Selected Component */}
                            {selectedComponentType && (
                                <div className="p-3 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg">
                                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-2">Drag to Stage</p>
                                    {SECTION_TYPES.filter(t => t.type === selectedComponentType).map(t => (
                                        <DraggableSectionItem key={t.type} type={t.type as PDPSectionType} icon={t.icon} label={t.label} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Structure</h4>
                        <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-900 font-bold">{layout.sections.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 admin-scroll bg-zinc-50/30">
                        <SortableContext items={layout.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {layout.sections.map((sec) => (
                                <SortableLayerItem
                                    key={sec.id}
                                    section={sec}
                                    isActive={activeSecId === sec.id || !!(sec.children?.find(c => c.id === activeSecId))}
                                    setActive={setActiveSecId}
                                    removeSection={removeSection}
                                    updateSection={updateSection}
                                />
                            ))}
                        </SortableContext>

                        {layout.sections.length === 0 && (
                            <div className="py-12 text-center px-4">
                                <p className="text-xs font-medium text-zinc-400 italic">No sections added yet.</p>
                                <p className="text-[10px] text-zinc-300 mt-1">Select a component above to start.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-100 bg-white">
                        <button onClick={handleSave} disabled={saving} className="w-full inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-50 shadow-lg hover:bg-zinc-900/90 transition-all active:scale-[0.98] disabled:opacity-50">
                            {saving ? 'Syncing...' : 'Publish Layout'}
                        </button>
                    </div>
                </div>

                {/* Canvas Preview - Droppable Area implicitly */}
                <div className="flex-1 overflow-y-auto p-12 bg-zinc-100 admin-scroll flex justify-center items-start h-full">
                    <div className="w-full max-w-full bg-white shadow-2xl rounded-[1rem] border border-zinc-200 overflow-hidden min-h-[900px] transform transition-all">
                        <div className="flex flex-col">
                            {layout.sections.map(sec => sec.isActive && (
                                <div key={sec.id} style={{
                                    paddingTop: `${sec.style?.paddingTop}px`, paddingBottom: `${sec.style?.paddingBottom}px`,
                                    paddingLeft: `${sec.style?.paddingLeft}px`, paddingRight: `${sec.style?.paddingRight}px`,
                                    marginTop: `${sec.style?.marginTop}px`, marginBottom: `${sec.style?.marginBottom}px`,
                                    backgroundColor: sec.style?.backgroundColor, color: sec.style?.textColor
                                }} className={`relative border-y border-transparent transition-all ${activeSecId === sec.id ? 'ring-2 ring-zinc-950 ring-inset z-10' : ''}`}>
                                    <div style={{ maxWidth: sec.style?.containerMaxWidth || '1200px', width: '100%' }} className="mx-auto">
                                        {sec.type === 'Hero' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 px-6">
                                                <div className="lg:col-span-7">
                                                    <div className={`flex justify-${sec.style?.imageAlign || 'center'}`}>
                                                        <img src={previewProduct?.imageUrl} style={{ width: sec.style?.imageWidth || '100%', height: sec.style?.imageHeight || 'auto' }} className="object-contain" />
                                                    </div>
                                                </div>
                                                <div className="lg:col-span-5 space-y-8 text-left">
                                                    <div className="space-y-4">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{previewProduct?.category}</span>
                                                        <h1 style={{ fontSize: `${sec.style?.titleFontSize || 48}px` }} className="font-black text-zinc-900 tracking-tighter uppercase italic leading-[0.9]">{previewProduct?.name}</h1>
                                                        <p style={{ fontSize: `${sec.style?.shortDescFontSize || 15}px` }} className="text-zinc-500 font-medium italic leading-relaxed">{previewProduct?.shortDescription}</p>
                                                    </div>
                                                    <div style={{ fontSize: `${sec.style?.priceFontSize || 56}px` }} className="font-black text-zinc-950 italic tracking-tighter leading-none">₹{previewProduct?.price.toLocaleString()}</div>

                                                    {/* Render Children (Nested ProductDetails) */}
                                                    {sec.children && sec.children.map(child => (
                                                        <div key={child.id} onClick={(e) => { e.stopPropagation(); setActiveSecId(child.id); }} className={`relative group transition-all ${activeSecId === child.id ? 'ring-2 ring-zinc-900 rounded-lg p-1' : ''}`}>
                                                            {child.type === 'ProductDetails' && (
                                                                <Accordion type="single" collapsible className="w-full">
                                                                    <AccordionItem value="desc">
                                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Description</AccordionTrigger>
                                                                        <AccordionContent>
                                                                            <div className="prose prose-sm max-w-none text-zinc-500 leading-relaxed">
                                                                                {previewProduct?.description || 'Product description will appear here.'}
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                    <AccordionItem value="details">
                                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Product Details</AccordionTrigger>
                                                                        <AccordionContent>
                                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                <p>Material: 100% Cotton</p>
                                                                                <p>Fit: Regular Fit</p>
                                                                                <p>Pattern: Solid</p>
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                    <AccordionItem value="care">
                                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Product Care</AccordionTrigger>
                                                                        <AccordionContent>
                                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                    <AccordionItem value="shipping">
                                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Shipping & Delivery</AccordionTrigger>
                                                                        <AccordionContent>
                                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                Standard shipping: 3-5 business days. Express shipping available at checkout.
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                    <AccordionItem value="returns">
                                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Return & Exchange Policy</AccordionTrigger>
                                                                        <AccordionContent>
                                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                Easy returns within 14 days of delivery. Items must be unworn and in original packaging.
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                    <AccordionItem value="seller">
                                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Seller Information</AccordionTrigger>
                                                                        <AccordionContent>
                                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                Sold by: {siteSettings?.storeName || 'Store Name'}
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                    <AccordionItem value="gst">
                                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">GST Benefits</AccordionTrigger>
                                                                        <AccordionContent>
                                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                                Save up to 18% with GST input credit for business purchases.
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                </Accordion>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); removeSection(child.id); }}
                                                                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 text-[10px]"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        )}

                                        {/* Default visualization for other types */}
                                        {sec.type === 'A+Content' && (
                                            <div className="space-y-8 animate-in fade-in">
                                                {(sec.content?.title || sec.content?.description) && (
                                                    <div className="text-center space-y-4 max-w-3xl mx-auto mb-8">
                                                        {sec.content.title && <h2 style={{ color: sec.style?.textColor }} className="text-3xl font-black uppercase tracking-tight">{sec.content.title}</h2>}
                                                        {sec.content.description && <p style={{ color: sec.style?.textColor }} className="opacity-80 leading-relaxed text-sm whitespace-pre-wrap">{sec.content.description}</p>}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 gap-8">
                                                    {(sec.content?.blocks || []).map((block: any, i: number) => (
                                                        <div key={i} className="flex flex-col gap-4">
                                                            <div className="relative overflow-hidden w-full" style={{ borderRadius: `${sec.style?.imageBorderRadius || 0}px` }}>
                                                                {block.link ? (
                                                                    <a href={block.link} className="block cursor-pointer hover:opacity-95 transition-opacity">
                                                                        <img src={block.img || 'https://via.placeholder.com/1200x600'} style={{ width: sec.style?.imageWidth || '100%', height: sec.style?.imageHeight || 'auto' }} className={`object-cover mx-auto ${sec.style?.imageAlign === 'left' ? 'mr-auto ml-0' : sec.style?.imageAlign === 'right' ? 'ml-auto mr-0' : ''}`} />
                                                                    </a>
                                                                ) : (
                                                                    <img src={block.img || 'https://via.placeholder.com/1200x600'} style={{ width: sec.style?.imageWidth || '100%', height: sec.style?.imageHeight || 'auto' }} className={`object-cover mx-auto ${sec.style?.imageAlign === 'left' ? 'mr-auto ml-0' : sec.style?.imageAlign === 'right' ? 'ml-auto mr-0' : ''}`} />
                                                                )}
                                                            </div>
                                                            {(block.title || block.text) && (
                                                                <div className={`text-${sec.style?.textAlign || 'center'} space-y-2 max-w-4xl mx-auto`}>
                                                                    {block.title && <h3 style={{ color: sec.style?.textColor }} className="font-bold text-xl uppercase tracking-tight">{block.title}</h3>}
                                                                    {block.text && <p style={{ color: sec.style?.textColor }} className="text-sm opacity-75 whitespace-pre-wrap">{block.text}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {sec.type === 'RelatedProducts' && (
                                            <div className="px-6 text-center space-y-8">
                                                <h3 className="text-xl font-bold uppercase tracking-widest text-zinc-900">Related Products</h3>
                                                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sec.settings?.itemsPerRow || 4}, minmax(0, 1fr))` }}>
                                                    {[...Array(sec.settings?.limit || 4)].map((_, i) => (
                                                        <div key={i} className="aspect-[3/4] bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-300 font-bold text-xs uppercase tracking-widest border border-dashed border-zinc-200">
                                                            Product {i + 1}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {sec.type === 'ProductDetails' && (
                                            <div className="px-6 mx-auto animate-in fade-in slide-in-from-bottom-2" style={{ maxWidth: '800px' }}>
                                                <Accordion type="single" collapsible className="w-full">
                                                    <AccordionItem value="desc">
                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Description</AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="prose prose-sm max-w-none text-zinc-500 leading-relaxed">
                                                                {previewProduct?.description || 'Product description will appear here.'}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                    <AccordionItem value="details">
                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Product Details</AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                <p>Material: 100% Cotton</p>
                                                                <p>Fit: Regular Fit</p>
                                                                <p>Pattern: Solid</p>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                    <AccordionItem value="care">
                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Product Care</AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                    <AccordionItem value="shipping">
                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Shipping & Delivery</AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                Standard shipping: 3-5 business days. Express shipping available at checkout.
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                    <AccordionItem value="returns">
                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Return & Exchange Policy</AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                Easy returns within 14 days of delivery. Items must be unworn and in original packaging.
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                    <AccordionItem value="seller">
                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">Seller Information</AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                Sold by: {siteSettings?.storeName || 'Store Name'}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                    <AccordionItem value="gst">
                                                        <AccordionTrigger className="uppercase tracking-widest text-xs font-bold text-zinc-900">GST Benefits</AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="text-zinc-500 text-sm leading-relaxed">
                                                                Save up to 18% with GST input credit for business purchases.
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </div>
                                        )}

                                        {/* Default visualization for remaining types */}
                                        {['FAQ', 'Reviews', 'CustomCode'].includes(sec.type) && (
                                            <div className="p-12 text-center">
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{sec.type} Block Content</h3>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DndContext>

            {/* Properties Panel */}
            <div className="w-[340px] bg-white border-l border-zinc-200 flex flex-col shrink-0 overflow-hidden h-full shadow-xl z-20">
                {activeSection ? (
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black text-zinc-950 uppercase tracking-tight italic">Properties</h2>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{activeSection.type}</p>
                            </div>
                            <button onClick={() => updateSection(activeSection.id, { isActive: !activeSection.isActive })} className={`text-[10px] font-black uppercase px-2 py-1 rounded transition-colors ${activeSection.isActive ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'}`}>
                                {activeSection.isActive ? 'Enabled' : 'Hidden'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 admin-scroll">
                            <PDPSectionSettings section={activeSection} update={(upd) => updateSection(activeSection.id, upd)} token={token} addSection={addSection} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center p-12 text-center text-zinc-300 font-bold uppercase italic">Select a layer to configure</div>
                )}
            </div>
        </div>
    );
};

export default PDPBuilder;
