
import React, { useState, useEffect } from 'react';
import { HomeSection, HomepageLayout } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { COLORS } from '../../constants';

const HomepageEditor: React.FC<{ token: string | null }> = ({ token }) => {
    const [layout, setLayout] = useState<HomepageLayout>({ sections: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const res = await fetch(getApiUrl('/api/settings/layout'));
                if (res.ok) setLayout(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchLayout();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(getApiUrl('/api/settings/layout'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(layout)
            });
            alert('Homepage Layout updated!');
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const addSection = (type: HomeSection['type']) => {
        const newSection: HomeSection = {
            id: `sec-${Date.now()}`,
            type,
            isActive: true,
            title: `New ${type} Section`,
            code: type === 'CustomCode' ? '<div class="py-20 text-center bg-gray-100">\n  <h2 class="text-4xl font-bold">Custom Title</h2>\n</div>' : ''
        };
        setLayout({ ...layout, sections: [...layout.sections, newSection] });
    };

    const removeSection = (id: string) => {
        setLayout({ ...layout, sections: layout.sections.filter(s => s.id !== id) });
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...layout.sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        setLayout({ ...layout, sections: newSections });
    };

    const updateSection = (id: string, updates: Partial<HomeSection>) => {
        setLayout({
            ...layout,
            sections: layout.sections.map(s => s.id === id ? { ...s, ...updates } : s)
        });
    };

    if (loading) return <div>Loading Layout Builder...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Visual Page Builder</h3>
                    <p className="text-xs text-gray-500">Design your homepage by arranging and customizing sections.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                         <button className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-bold border hover:bg-gray-200 transition-all flex items-center gap-2">
                             + Add Section
                         </button>
                         <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl rounded-lg border hidden group-hover:block z-50 overflow-hidden">
                             {['Hero', 'Collections', 'NewArrivals', 'BestSellers', 'Videos', 'Testimonials', 'Newsletter', 'CustomCode'].map(t => (
                                 <button key={t} onClick={() => addSection(t as any)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b last:border-0">{t}</button>
                             ))}
                         </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="bg-[#16423C] text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all">
                        {saving ? 'Publishing...' : 'Save & Publish'}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {layout.sections.map((section, index) => (
                    <div key={section.id} className={`bg-white border-2 rounded-xl shadow-sm overflow-hidden transition-all ${section.isActive ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
                        {/* Section Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <button onClick={() => moveSection(index, 'up')} className="text-gray-400 hover:text-blue-600"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg></button>
                                    <button onClick={() => moveSection(index, 'down')} className="text-gray-400 hover:text-blue-600"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg></button>
                                </div>
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{section.type}</span>
                                <input 
                                    type="text" 
                                    value={section.title || ''} 
                                    onChange={(e) => updateSection(section.id, { title: e.target.value })} 
                                    className="font-bold text-gray-700 bg-transparent border-none focus:ring-0 p-0 text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => updateSection(section.id, { isActive: !section.isActive })} className={`text-xs font-bold ${section.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                    {section.isActive ? 'Enabled' : 'Disabled'}
                                </button>
                                <button onClick={() => removeSection(section.id)} className="text-red-400 hover:text-red-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Section Content/Settings */}
                        <div className="p-4 bg-white">
                            {section.type === 'CustomCode' ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Section HTML/Tailwind</label>
                                    <textarea 
                                        value={section.code} 
                                        onChange={(e) => updateSection(section.id, { code: e.target.value })}
                                        className="w-full h-48 font-mono text-xs p-3 bg-gray-900 text-green-400 rounded-lg shadow-inner"
                                        placeholder="Enter HTML/CSS/Tailwind here..."
                                    />
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic">
                                    This is a dynamic section. It will display data directly from your {section.type} configuration.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {layout.sections.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
                        <p className="text-gray-400">Your homepage is empty. Click "+ Add Section" to start building.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomepageEditor;
