import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { Badge } from '../../ui/badge';
import { Loader2, Save, Undo2 } from 'lucide-react';

interface EmailTemplate {
    _id: string;
    name: string;
    type: string;
    subject: string;
    body: string;
    placeholders: string[];
}

interface EmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string | null;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ isOpen, onClose, token }) => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ subject: string; body: string }>({ subject: '', body: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) fetchTemplates();
    }, [isOpen]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/automations/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTemplates(data);
            if (data.length > 0 && !selectedId) {
                selectTemplate(data[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectTemplate = (template: EmailTemplate) => {
        setSelectedId(template._id);
        setEditForm({ subject: template.subject, body: template.body });
    };

    const handleSave = async () => {
        if (!selectedId) return;
        setSaving(true);
        try {
            await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/automations/templates/${selectedId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            // Update local state
            setTemplates(prev => prev.map(t => t._id === selectedId ? { ...t, ...editForm } : t));
        } catch (err) {
            console.error("Failed to save", err);
        } finally {
            setSaving(false);
        }
    };

    const selectedTemplate = templates.find(t => t._id === selectedId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white/95 backdrop-blur-md">
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar List */}
                    <div className="w-1/3 border-r border-border bg-gray-50/50 flex flex-col">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle className="text-xl">Email Templates</DialogTitle>
                            <DialogDescription>Select a template to edit.</DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-3 space-y-2">
                                {loading ? (
                                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                                ) : (
                                    templates.map(t => (
                                        <div
                                            key={t._id}
                                            onClick={() => selectTemplate(t)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedId === t._id
                                                ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                                                : 'hover:bg-white border-transparent hover:border-gray-200'
                                                }`}
                                        >
                                            <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                                            <div className="text-xs text-gray-500 mt-1 truncate">{t.subject}</div>
                                            <Badge variant="secondary" className="mt-2 text-[10px] uppercase">{t.type.replace(/_/g, ' ')}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedTemplate ? (
                            <>
                                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">Subject Line</Label>
                                        <Input
                                            value={editForm.subject}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                                            className="font-medium text-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        />
                                    </div>

                                    <div className="space-y-2 flex-1 flex flex-col h-full bg-red-500">
                                        {/* Hack to fill height, actually just make it big */}
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold uppercase text-gray-500">HTML Body</Label>
                                            <div className="text-[10px] text-gray-400">Supports HTML</div>
                                        </div>
                                        <Textarea
                                            value={editForm.body}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                                            className="font-mono text-xs min-h-[400px] flex-1 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none p-4 leading-relaxed"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">Available Variables</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTemplate.placeholders.map(p => (
                                                <Badge key={p} variant="outline" className="font-mono text-xs bg-gray-50">
                                                    {p}
                                                </Badge>
                                            ))}
                                            <Badge variant="outline" className="font-mono text-xs bg-gray-50">{'{customer_name}'}</Badge>
                                            <Badge variant="outline" className="font-mono text-xs bg-gray-50">{'{order_number}'}</Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t bg-gray-50/50 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 italic">Changes affect all future emails.</span>
                                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {saving ? <Loader2 className="animate-spin mr-2 size-4" /> : <Save className="mr-2 size-4" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">Select a template</div>
                        )}
                    </div>
                </div>
                <DialogFooter className="hidden" /> {/* Hide default footer */}
            </DialogContent>
        </Dialog>
    );
};

export default EmailTemplateModal;
