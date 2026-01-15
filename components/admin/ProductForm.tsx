
import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductVariant } from '../../types';
import { COLORS, CLOUDINARY } from '../../constants';
import MediaPicker from './MediaPicker';
import { getApiUrl } from '../../utils/apiHelper';
import { Package, UploadCloud, X, Plus, Trash2, Image as ImageIcon, ChevronDown } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

// UI Components (Relative Imports)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";

// Note: Select in ui/select.tsx is incomplete, using native select with styling

// Helper for Label
const Label = ({ children, className = "", required = false }: { children: React.ReactNode, className?: string, required?: boolean }) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

// Helper for Textarea
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

interface ProductFormProps {
    product: Product | null;
    onSave: (product: Omit<Product, 'id'> & { id?: string }) => void;
    onCancel: () => void;
}

const initialFormData: Omit<Product, 'id'> = {
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    brand: '',
    sku: '',
    barcode: '',
    category: '',
    subCategory: '',
    tags: [],
    status: 'Active',
    price: 0,
    mrp: 0,
    costPrice: 0,
    taxRate: 0,
    stock: 0,
    lowStockThreshold: 5,
    allowBackorders: false,
    imageUrl: '',
    galleryImages: [],
    videoUrl: '',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    hasVariants: false,
    variants: [],
};

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialFormData);
    const [tagInput, setTagInput] = useState('');
    const [seoKeywordInput, setSeoKeywordInput] = useState('');

    // Validation State
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const formTopRef = useRef<HTMLDivElement>(null);

    // Gallery State
    const [isUploading, setIsUploading] = useState(false);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

    // Category Management State
    const [categories, setCategories] = useState<any[]>([]);

    const fetchCategories = async () => {
        try {
            const res = await fetch(getApiUrl('/api/products/categories'));
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
                if (!formData.category && data.length > 0 && !product) {
                    setFormData(prev => ({ ...prev, category: data[0].name }));
                }
            }
        } catch (e) { console.error("Failed to fetch categories", e); }
    };

    useEffect(() => {
        fetchCategories();
        if (product) {
            setFormData({
                ...initialFormData,
                ...product,
                dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
                tags: product.tags || [],
                galleryImages: product.galleryImages || [],
                variants: product.variants || [],
                seoKeywords: product.seoKeywords || [],
                status: product.status || 'Active',
                barcode: product.barcode || '',
            });
        } else {
            setFormData(initialFormData);
        }
    }, [product]);

    // Generic Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (errors[name]) {
            const newErrors = { ...errors };
            delete newErrors[name];
            setErrors(newErrors);
        }

        if (name.startsWith('dim_')) {
            const dimKey = name.split('_')[1];
            setFormData(prev => ({
                ...prev,
                dimensions: { ...prev.dimensions!, [dimKey]: Number(value) }
            }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (errors.name) {
            const newErrors = { ...errors };
            delete newErrors.name;
            setErrors(newErrors);
        }

        const generateSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        setFormData(prev => ({
            ...prev,
            name: val,
            slug: !product && (!prev.slug || prev.slug === generateSlug(prev.name))
                ? generateSlug(val)
                : prev.slug,
            seoTitle: !prev.seoTitle ? val : prev.seoTitle
        }));
    };

    // Gallery Handlers
    const handleGalleryUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        const token = localStorage.getItem('token');

        const uploads = Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY.UPLOAD_PRESET);
            try {
                const res = await fetch(CLOUDINARY.UPLOAD_URL, { method: 'POST', body: formData });
                const data = await res.json();

                if (data.secure_url) {
                    try {
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
                                type: 'image'
                            })
                        });
                    } catch (dbError) {
                        console.error("Failed to save image to media library DB:", dbError);
                    }
                    return data.secure_url;
                }
                return null;
            } catch (error) {
                console.error("Upload failed for file", file.name, error);
                return null;
            }
        });

        const urls = (await Promise.all(uploads)).filter(url => url !== null) as string[];
        setFormData(prev => ({ ...prev, galleryImages: [...(prev.galleryImages || []), ...urls] }));
        setIsUploading(false);
    };

    const removeGalleryImage = (index: number) => {
        setFormData(prev => ({ ...prev, galleryImages: prev.galleryImages?.filter((_, i) => i !== index) }));
    };

    const handleSortStart = (index: number) => setDraggedImageIndex(index);
    const handleSortDrop = (targetIndex: number) => {
        if (draggedImageIndex === null || draggedImageIndex === targetIndex) return;
        const updatedImages = [...(formData.galleryImages || [])];
        const [movedImage] = updatedImages.splice(draggedImageIndex, 1);
        updatedImages.splice(targetIndex, 0, movedImage);
        setFormData(prev => ({ ...prev, galleryImages: updatedImages }));
        setDraggedImageIndex(null);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleGalleryUpload(e.dataTransfer.files);
        }
    };

    // Variant Handlers
    const addVariant = () => {
        const newVariant: ProductVariant = { name: 'Size', options: [{ value: 'S', price: formData.price, stock: 10, image: '' }] };
        setFormData(prev => ({ ...prev, variants: [...(prev.variants || []), newVariant] }));
    };

    const updateVariantName = (vIndex: number, val: string) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants?.map((v, i) => i === vIndex ? { ...v, name: val } : v)
        }));
    };

    const addVariantOption = (vIndex: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants?.map((v, i) => i === vIndex ? {
                ...v,
                options: [...v.options, { value: '', price: formData.price, stock: 0, image: '' }]
            } : v)
        }));
    };

    const updateVariantOption = (vIndex: number, oIndex: number, field: string, val: any) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants?.map((v, i) => i === vIndex ? {
                ...v,
                options: v.options.map((opt, j) => j === oIndex ? { ...opt, [field]: val } : opt)
            } : v)
        }));
    };

    const removeVariantOption = (vIndex: number, oIndex: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants?.map((v, i) => i === vIndex ? {
                ...v,
                options: v.options.filter((_, j) => j !== oIndex)
            } : v)
        }));
    };

    const removeVariant = (vIndex: number) => {
        setFormData(prev => ({ ...prev, variants: prev.variants?.filter((_, i) => i !== vIndex) }));
    };

    // Tag & SEO Keywords Handlers
    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
                setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
            }
            setTagInput('');
        }
    };
    const removeTag = (index: number) => setFormData(prev => ({ ...prev, tags: prev.tags?.filter((_, i) => i !== index) }));

    const handleSeoKeywordKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (seoKeywordInput.trim() && !formData.seoKeywords?.includes(seoKeywordInput.trim())) {
                setFormData(prev => ({ ...prev, seoKeywords: [...(prev.seoKeywords || []), seoKeywordInput.trim()] }));
            }
            setSeoKeywordInput('');
        }
    };
    const removeSeoKeyword = (index: number) => setFormData(prev => ({ ...prev, seoKeywords: prev.seoKeywords.filter((_, i) => i !== index) }));

    // Validation
    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = "Product name is required.";
        if (!formData.description.trim()) newErrors.description = "Full description is required.";
        if (!formData.category) newErrors.category = "Please select a category.";
        if (formData.price <= 0) newErrors.price = "Price must be greater than 0.";
        if (!formData.imageUrl) newErrors.imageUrl = "Main product image is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        onSave({ ...formData, id: product?.id });
    };



    return (
        <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); }} className="flex flex-col w-full h-full bg-zinc-50/50 relative">
            <div ref={formTopRef} className="absolute -top-10"></div>

            {/* Sticky Header */}



            <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto pb-20">

                    {/* Left Column (Main Content) */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Product Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Details</CardTitle>
                                <CardDescription>Basic information about your product</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label required>Title</Label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleNameChange}
                                        className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        placeholder="e.g. Premium Cotton T-Shirt"
                                    />
                                    {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>Brand</Label>
                                        <Input name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>SKU</Label>
                                        <Input name="sku" value={formData.sku} onChange={handleChange} placeholder="Auto-generated if empty" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Barcode (ISBN/UPC)</Label>
                                        <Input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="0123456789" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Short Description</Label>
                                    <Textarea
                                        name="shortDescription"
                                        value={formData.shortDescription}
                                        onChange={handleChange}
                                        placeholder="Brief summary for product cards..."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label required>Full Description</Label>
                                    <div className={`rounded-md transition-all ${errors.description ? "ring-2 ring-red-500" : "border border-input focus-within:ring-2 focus-within:ring-zinc-900"}`}>
                                        <RichTextEditor value={formData.description} onChange={(val) => {
                                            setFormData(prev => ({ ...prev, description: val }));
                                            if (val.trim() && errors.description) {
                                                const n = { ...errors }; delete n.description; setErrors(n);
                                            }
                                        }} />
                                    </div>
                                    {errors.description && <p className="text-xs text-red-500 font-medium mt-1">{errors.description}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Media */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Media</CardTitle>
                                <CardDescription>Images and videos for your product</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label required>Main Product Image</Label>
                                    <div className={errors.imageUrl ? "ring-2 ring-red-500 rounded-lg p-0.5" : ""}>
                                        <MediaPicker value={formData.imageUrl} onChange={(url) => {
                                            setFormData(prev => ({ ...prev, imageUrl: url }));
                                            if (url && errors.imageUrl) { const n = { ...errors }; delete n.imageUrl; setErrors(n); }
                                        }} type="image" />
                                    </div>
                                    {errors.imageUrl && <p className="text-xs text-red-500 font-medium">{errors.imageUrl}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Gallery Images</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                        {formData.galleryImages?.map((img, idx) => (
                                            <div
                                                key={idx}
                                                draggable
                                                onDragStart={() => handleSortStart(idx)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleSortDrop(idx)}
                                                className="relative group aspect-square bg-muted rounded-lg border overflow-hidden cursor-move hover:ring-2 hover:ring-zinc-500 transition-all"
                                            >
                                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="destructive"
                                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-sm"
                                                    onClick={() => removeGalleryImage(idx)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">{idx + 1}</div>
                                            </div>
                                        ))}

                                        <MediaPicker
                                            value=""
                                            onChange={(url) => setFormData(prev => ({ ...prev, galleryImages: [...(prev.galleryImages || []), url] }))}
                                            renderTrigger={(openModal) => (
                                                <div
                                                    className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-zinc-50 hover:border-zinc-400 ${isUploading ? 'bg-zinc-50 border-zinc-400' : 'border-zinc-200'}`}
                                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                    onDrop={handleFileDrop}
                                                    onClick={openModal}
                                                >
                                                    {isUploading ? (
                                                        <div className="animate-pulse flex flex-col items-center">
                                                            <div className="h-5 w-5 rounded-full border-2 border-zinc-800 border-t-transparent animate-spin mb-2" />
                                                            <span className="text-xs text-zinc-600 font-medium">Uploading...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center text-muted-foreground group">
                                                            <div className="bg-zinc-100 p-2 rounded-full mb-2 group-hover:bg-zinc-200 transition-colors">
                                                                <Plus className="w-5 h-5 text-zinc-500" />
                                                            </div>
                                                            <span className="text-xs font-semibold text-zinc-600">Add Image</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Video URL</Label>
                                    <Input
                                        value={formData.videoUrl || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                                        placeholder="https://youtube.com/..."
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing & Inventory */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pricing & Inventory</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label required>Selling Price</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-zinc-500 text-sm font-semibold">₹</span>
                                            <Input type="number" name="price" value={formData.price} onChange={handleChange} className={`pl-7 font-semibold ${errors.price ? "border-red-500" : ""}`} />
                                        </div>
                                        {errors.price && <p className="text-xs text-red-500 font-medium">{errors.price}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>MRP (Compare at)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                                            <Input type="number" name="mrp" value={formData.mrp} onChange={handleChange} className="pl-7" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label required>Stock Quantity</Label>
                                        <Input type="number" name="stock" value={formData.stock} onChange={handleChange} />
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>Cost Price</Label>
                                        <Input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} className="text-zinc-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tax Rate (%)</Label>
                                        <Input type="number" name="taxRate" value={formData.taxRate} onChange={handleChange} className="text-zinc-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Low Stock Threshold</Label>
                                        <Input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="text-zinc-500" />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 border p-3 rounded-lg bg-zinc-50/50">
                                    <Checkbox
                                        id="allowBackorders"
                                        checked={formData.allowBackorders}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowBackorders: !!checked }))}
                                    />
                                    <label htmlFor="allowBackorders" className="text-sm font-medium leading-none cursor-pointer">
                                        Allow Backorders (Continue selling when out of stock)
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shipping */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Shipping</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <Label>Weight (kg)</Label>
                                        <Input type="number" name="weight" value={formData.weight} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Length (cm)</Label>
                                        <Input type="number" name="dim_length" value={formData.dimensions?.length} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Width (cm)</Label>
                                        <Input type="number" name="dim_width" value={formData.dimensions?.width} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Height (cm)</Label>
                                        <Input type="number" name="dim_height" value={formData.dimensions?.height} onChange={handleChange} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Variants */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle>Variants</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasVariants"
                                        checked={formData.hasVariants}
                                        onCheckedChange={(c) => setFormData(prev => ({ ...prev, hasVariants: !!c }))}
                                    />
                                    <Label htmlFor="hasVariants" className="cursor-pointer">Enable Variants</Label>
                                </div>
                            </CardHeader>
                            {formData.hasVariants && (
                                <CardContent className="space-y-6 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {formData.variants?.map((variant, vIndex) => (
                                        <div key={vIndex} className="rounded-xl border bg-zinc-50/80 p-5 space-y-4">
                                            <div className="flex items-center justify-between border-b pb-3">
                                                <Input
                                                    value={variant.name}
                                                    onChange={(e) => updateVariantName(vIndex, e.target.value)}
                                                    className="max-w-[200px] font-bold bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary h-8"
                                                    placeholder="Option Name (e.g. Size)"
                                                />
                                                <Button variant="ghost" size="sm" onClick={() => removeVariant(vIndex)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs font-bold uppercase tracking-wide">
                                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove Option
                                                </Button>
                                            </div>
                                            <div className="space-y-3">
                                                {variant.options.map((opt, oIndex) => (
                                                    <div key={oIndex} className="grid grid-cols-12 gap-3 items-center">
                                                        <div className="col-span-3">
                                                            <Input value={opt.value} onChange={(e) => updateVariantOption(vIndex, oIndex, 'value', e.target.value)} placeholder="Value (e.g. Red)" className="h-9 text-sm" />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <Input type="number" value={opt.price} onChange={(e) => updateVariantOption(vIndex, oIndex, 'price', Number(e.target.value))} placeholder="Price" className="h-9 text-sm" />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <Input type="number" value={opt.stock} onChange={(e) => updateVariantOption(vIndex, oIndex, 'stock', Number(e.target.value))} placeholder="Stock" className="h-9 text-sm" />
                                                        </div>
                                                        <div className="col-span-4">
                                                            <MediaPicker value={opt.image || ''} onChange={(url) => updateVariantOption(vIndex, oIndex, 'image', url)} type="image" placeholder="Image"
                                                                renderTrigger={(open) => (
                                                                    <div onClick={open} className="flex items-center justify-between gap-2 cursor-pointer border rounded-md px-2 h-9 hover:bg-white transition-colors bg-white/50">
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            {opt.image ? <img src={opt.image} className="w-5 h-5 rounded object-cover" /> : <ImageIcon className="w-4 h-4 text-zinc-400" />}
                                                                            <span className="text-xs text-zinc-500 truncate">{opt.image ? 'Change' : 'Select Img'}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="col-span-1 flex justify-end">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeVariantOption(vIndex, oIndex)}
                                                                className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="link" size="sm" onClick={() => addVariantOption(vIndex)} className="px-0 text-blue-600 font-semibold text-xs h-auto">
                                                    <Plus className="w-3 h-3 mr-1" /> Add Option Value
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full border-dashed border-zinc-300 text-zinc-600 hover:bg-zinc-50 py-4 h-auto">
                                        <Plus className="w-4 h-4 mr-2" /> Add Variant Type
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="space-y-8">
                        {/* Status */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Archived">Archived</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Category */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Organization</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label required>Category</Label>
                                    </div>

                                    <div className="relative">
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                            className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer ${errors.category ? "border-red-500" : ""}`}
                                        >
                                            <option value="" disabled>Select Category</option>
                                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                                    </div>
                                    {errors.category && <p className="text-xs text-red-500 font-medium">{errors.category}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Sub-Category</Label>
                                    <Input name="subCategory" value={formData.subCategory} onChange={handleChange} placeholder="e.g. T-Shirts" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tags</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Enter tags (press Enter)"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags?.map((tag, idx) => (
                                        <Badge key={idx} variant="secondary" className="px-2.5 py-1 gap-1.5 font-normal">
                                            {tag}
                                            <X className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeTag(idx)} />
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* SEO */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">SEO</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Page Title</Label>
                                    <Input name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="text-xs" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Meta Description</Label>
                                    <Textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={3} className="text-xs" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Keywords</Label>
                                    <Input
                                        value={seoKeywordInput}
                                        onChange={(e) => setSeoKeywordInput(e.target.value)}
                                        onKeyDown={handleSeoKeywordKeyDown}
                                        placeholder="Comma separated"
                                        className="text-xs"
                                    />
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {formData.seoKeywords?.map((keyword, idx) => (
                                            <Badge key={idx} variant="outline" className="gap-1 text-[10px] font-mono">
                                                {keyword}
                                                <X className="w-3 h-3 cursor-pointer hover:text-blue-600" onClick={() => removeSeoKeyword(idx)} />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>URL Slug</Label>
                                    <Input name="slug" value={formData.slug} onChange={handleChange} className="bg-muted text-xs font-mono text-zinc-500" readOnly />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-8 max-w-7xl mx-auto w-full">
                    <Button variant="outline" type="button" onClick={onCancel} className="h-11 px-8">Discard</Button>
                    <Button type="submit" className="h-11 px-8 min-w-[150px]">Save Product</Button>
                </div>
            </div>


        </form >
    );
};

export default ProductForm;
