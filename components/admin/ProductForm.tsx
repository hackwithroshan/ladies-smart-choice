
import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductVariant, Category } from '../../types';
import { COLORS, CLOUDINARY } from '../../constants';
import MediaPicker from './MediaPicker';
import { getApiUrl } from '../../utils/apiHelper';
import { CodeIcon } from '../Icons';
import RichTextEditor from './RichTextEditor';

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
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const formTopRef = useRef<HTMLDivElement>(null);
  
  // Gallery State
  const [isUploading, setIsUploading] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  
  // We use this ref only for the fallback direct input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category (Collection) Management State
  const [categories, setCategories] = useState<any[]>([]);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Clear error for this field
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
    let val: any = value;
    if (type === 'number') val = Number(value);
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (errors.name) {
          const newErrors = { ...errors };
          delete newErrors.name;
          setErrors(newErrors);
      }
      
      // SEO Friendly Slugify
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

  const addVariant = () => {
      const newVariant: ProductVariant = { name: 'Size', options: [{ value: 'Standard', price: formData.price, stock: 10, image: '' }] };
      setFormData(prev => ({ ...prev, variants: [...(prev.variants || []), newVariant] }));
  };
  
  const updateVariantName = (vIndex: number, val: string) => {
      const updated = [...(formData.variants || [])];
      updated[vIndex].name = val;
      setFormData({ ...formData, variants: updated });
  };

  const addVariantOption = (vIndex: number) => {
      const updated = [...(formData.variants || [])];
      updated[vIndex].options.push({ value: '', price: formData.price, stock: 0, image: '' });
      setFormData({ ...formData, variants: updated });
  };

  const updateVariantOption = (vIndex: number, oIndex: number, field: string, val: any) => {
      const updated = [...(formData.variants || [])];
      updated[vIndex].options[oIndex] = { ...updated[vIndex].options[oIndex], [field]: val };
      setFormData({ ...formData, variants: updated });
  };

  const removeVariant = (vIndex: number) => {
     const updated = (formData.variants || []).filter((_, i) => i !== vIndex);
     setFormData({ ...formData, variants: updated });
  };

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

  const validate = () => {
      const newErrors: {[key: string]: string} = {};
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
        alert("Please correct the errors in the form.");
        formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
    }
    onSave({ ...formData, id: product?.id });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && !(e.target as HTMLElement).isContentEditable) {
      e.preventDefault();
    }
  };

  const handleAddCategory = async () => {
      if(!newCatName.trim()) return;
      const token = localStorage.getItem('token');
      try {
          const res = await fetch(getApiUrl('/api/products/categories'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ name: newCatName })
          });
          if (res.ok) { 
              setNewCatName(''); 
              fetchCategories(); 
          } else { 
              const err = await res.json();
              alert(err.message || 'Failed to add category.'); 
          }
      } catch(e) { console.error(e); }
  };

  const handleDeleteCategory = async (id: string) => {
      if(!window.confirm("Deleting this category will also remove the corresponding homepage collection. Are you sure?")) return;
      const token = localStorage.getItem('token');
      try {
          await fetch(getApiUrl(`/api/products/categories/${id}`), {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          fetchCategories();
      } catch(e) { console.error(e); }
  };

  const errorClass = "border-red-500 ring-1 ring-red-200 focus:ring-red-500 focus:border-red-500";
  const standardClass = "border-gray-300 focus:ring-blue-500 focus:border-blue-500";

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col w-full h-full bg-gray-100 relative">
      <div ref={formTopRef} className="absolute -top-10"></div>
      
      {/* Sticky Header */}
      <div className="bg-black border-b border-gray-700 px-6 py-4 flex justify-between items-center shadow-md z-40 sticky top-0 w-full">
         <div className="flex items-center space-x-4">
             <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
             <div>
                <h2 className="text-lg font-bold text-white">{product ? 'Edit Product' : 'Create Product'}</h2>
                {product && <p className="text-xs text-gray-400">Editing: {product.name}</p>}
             </div>
         </div>
         <div className="flex space-x-3">
             <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800">Discard</button>
             <button type="submit" className="px-6 py-2 text-sm font-bold text-white rounded-md shadow-lg hover:opacity-90" style={{backgroundColor: COLORS.accent}}>Save</button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
              
              <div className="lg:col-span-3 space-y-8">
                 
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Product Details</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                            <input type="text" name="name" value={formData.name} onChange={handleNameChange} className={`block w-full rounded-lg shadow-sm p-3 border outline-none transition-all ${errors.name ? errorClass : standardClass}`}/>
                            {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.name}</p>}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                             <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border"/></div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Auto-gen if empty)</label>
                                <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border" placeholder="e.g. AYU-9901"/>
                             </div>
                             <div><label className="block text-sm font-medium text-gray-700 mb-1">Barcode (ISBN/UPC)</label><input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border" placeholder="0123456789"/></div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                            <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} rows={3} className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm text-sm" placeholder="Brief summary shown on cards..."/>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Description <span className="text-red-500">*</span></label>
                            <div className={errors.description ? "border border-red-500 rounded-lg overflow-hidden" : ""}>
                                <RichTextEditor value={formData.description} onChange={(val) => { 
                                    setFormData(prev => ({ ...prev, description: val }));
                                    if(val.trim() && errors.description) {
                                        const n = {...errors}; delete n.description; setErrors(n);
                                    }
                                }} />
                            </div>
                            {errors.description && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.description}</p>}
                        </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Media</h3>
                    
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Main Product Image <span className="text-red-500">*</span></label>
                        <div className={errors.imageUrl ? "ring-2 ring-red-500 rounded-lg" : ""}>
                            <MediaPicker value={formData.imageUrl} onChange={(url) => {
                                setFormData(prev => ({...prev, imageUrl: url}));
                                if(url && errors.imageUrl) { const n = {...errors}; delete n.imageUrl; setErrors(n); }
                            }} type="image" />
                        </div>
                        {errors.imageUrl && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.imageUrl}</p>}
                    </div>

                    <div className="mb-6">
                         <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (Drag to sort)</label>
                         <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                             {formData.galleryImages?.map((img, idx) => (
                                 <div 
                                    key={idx} 
                                    draggable
                                    onDragStart={() => handleSortStart(idx)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleSortDrop(idx)}
                                    className="relative group aspect-square bg-gray-100 rounded-lg border border-gray-200 overflow-hidden cursor-move hover:ring-2 hover:ring-blue-500 transition-all"
                                 >
                                     <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover"/>
                                     <button 
                                        type="button" 
                                        onClick={() => removeGalleryImage(idx)} 
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        title="Remove Image"
                                     >
                                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                     </button>
                                     <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 rounded">{idx + 1}</div>
                                 </div>
                             ))}

                             <MediaPicker
                                value=""
                                onChange={(url) => setFormData(prev => ({ ...prev, galleryImages: [...(prev.galleryImages || []), url] }))}
                                renderTrigger={(openModal) => (
                                    <div 
                                        className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-blue-50 hover:border-blue-400 ${isUploading ? 'bg-blue-50 border-blue-400' : 'border-gray-300'}`}
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={handleFileDrop}
                                        onClick={openModal}
                                    >
                                        {isUploading ? (
                                            <div className="animate-pulse flex flex-col items-center">
                                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <span className="text-xs text-blue-600 font-medium">Uploading...</span>
                                            </div>
                                        ) : (
                                            <div className="text-center p-2">
                                                <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                                <span className="text-xs font-medium text-blue-600">Add Images</span>
                                                <p className="text-[10px] text-gray-400 mt-1 hidden sm:block">Drag & Drop or Click</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                             />
                         </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                        <MediaPicker value={formData.videoUrl || ''} onChange={(url) => setFormData(prev => ({...prev, videoUrl: url}))} type="video" placeholder="Select or paste video URL" />
                    </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Pricing & Inventory</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price <span className="text-red-500">*</span></label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className={`block w-full rounded-lg shadow-sm p-2.5 border font-bold ${errors.price ? errorClass : 'border-gray-300 text-gray-900'}`}/>
                            {errors.price && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.price}</p>}
                         </div>
                         <div><label className="block text-sm font-medium text-gray-700 mb-1">MRP (Compare at)</label><input type="number" name="mrp" value={formData.mrp} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border"/></div>
                         <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity <span className="text-red-500">*</span></label><input type="number" name="stock" value={formData.stock} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border"/></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6">
                         <div><label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (Profit Calc)</label><input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border text-gray-600"/></div>
                         <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label><input type="number" name="taxRate" value={formData.taxRate} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border text-gray-600"/></div>
                         <div><label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label><input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border text-gray-600"/></div>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                        <input type="checkbox" id="allowBackorders" name="allowBackorders" checked={formData.allowBackorders} onChange={handleChange} className="h-4 w-4 text-orange-600 border-gray-300 rounded"/>
                        <label htmlFor="allowBackorders" className="ml-2 block text-sm text-gray-900">Allow Backorders (Continue selling when out of stock)</label>
                    </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Shipping Specifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label><input type="number" name="weight" value={formData.weight} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label><input type="number" name="dim_length" value={formData.dimensions?.length} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label><input type="number" name="dim_width" value={formData.dimensions?.width} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label><input type="number" name="dim_height" value={formData.dimensions?.height} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2.5 border"/></div>
                    </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Variants</h3>
                        <div className="flex items-center">
                            <input type="checkbox" id="hasVariants" checked={formData.hasVariants} onChange={handleChange} name="hasVariants" className="mr-2 h-4 w-4" />
                            <label htmlFor="hasVariants">Enable Variants</label>
                        </div>
                    </div>
                    {formData.hasVariants && (
                        <div className="space-y-6">
                            {formData.variants?.map((variant, vIndex) => (
                                <div key={vIndex} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex justify-between mb-2">
                                        <input type="text" value={variant.name} onChange={(e) => updateVariantName(vIndex, e.target.value)} className="font-bold bg-transparent border-b border-gray-300 mb-2 focus:outline-none" placeholder="Option Name (e.g. Size)"/>
                                        <button type="button" onClick={() => removeVariant(vIndex)} className="text-red-500 text-xs font-bold uppercase hover:text-red-700">Remove Option</button>
                                    </div>
                                    {variant.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="grid grid-cols-12 gap-2 items-center mb-2">
                                            <div className="col-span-3"><input type="text" value={opt.value} onChange={(e) => updateVariantOption(vIndex, oIndex, 'value', e.target.value)} className="w-full border border-gray-300 p-2 rounded text-sm" placeholder="Value (e.g. Red)"/></div>
                                            <div className="col-span-2"><input type="number" value={opt.price} onChange={(e) => updateVariantOption(vIndex, oIndex, 'price', Number(e.target.value))} className="w-full border border-gray-300 p-2 rounded text-sm" placeholder="Price"/></div>
                                            <div className="col-span-2"><input type="number" value={opt.stock} onChange={(e) => updateVariantOption(vIndex, oIndex, 'stock', Number(e.target.value))} className="w-full border border-gray-300 p-2 rounded text-sm" placeholder="Stock"/></div>
                                            <div className="col-span-5"><MediaPicker value={opt.image || ''} onChange={(url) => updateVariantOption(vIndex, oIndex, 'image', url)} type="image" placeholder="Variant Image" /></div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addVariantOption(vIndex)} className="text-sm text-blue-600 font-medium mt-2 hover:text-blue-800">+ Add Option Value</button>
                                </div>
                            ))}
                            <button type="button" onClick={addVariant} className="bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 shadow-sm">+ Add Variant Type</button>
                        </div>
                    )}
                 </div>
              </div>

              <div className="space-y-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Status</h3>
                      <select name="status" value={formData.status} onChange={handleChange} className="block w-full border-gray-300 rounded-lg p-2.5 border focus:ring-blue-500 focus:border-blue-500">
                          <option>Active</option>
                          <option>Draft</option>
                          <option>Archived</option>
                      </select>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Category <span className="text-red-500">*</span></h3>
                      <div className="flex justify-between mb-2 items-center"><label className="text-xs text-gray-600">Select Category</label><button type="button" onClick={() => setIsManageCatsOpen(true)} className="text-xs text-blue-600 hover:underline font-medium">Manage Categories</button></div>
                      <select name="category" value={formData.category} onChange={handleChange} className={`block w-full rounded-lg p-2.5 border outline-none transition-all ${errors.category ? errorClass : standardClass}`}>
                          <option value="" disabled>Select...</option>
                          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                      {errors.category && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.category}</p>}
                      <div className="mt-4">
                          <label className="block text-xs text-gray-600 mb-1">Sub-Category</label>
                          <input type="text" name="subCategory" value={formData.subCategory} onChange={handleChange} className="block w-full border-gray-300 rounded-lg p-2 border text-sm" placeholder="e.g. T-Shirts"/>
                      </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Tags</h3>
                      <input 
                        type="text" 
                        value={tagInput} 
                        onChange={(e) => setTagInput(e.target.value)} 
                        onKeyDown={handleTagKeyDown}
                        className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Enter tags (press Enter)"
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                          {formData.tags?.map((tag, idx) => (
                              <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs flex items-center border border-gray-200">
                                  {tag}
                                  <button type="button" onClick={() => removeTag(idx)} className="ml-2 text-gray-400 hover:text-red-500 font-bold">×</button>
                              </span>
                          ))}
                      </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Search Engine Optimization</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Page Title</label>
                              <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded text-sm"/>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
                              <textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={3} className="w-full border border-gray-300 p-2 rounded text-sm"></textarea>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Keywords</label>
                              <input 
                                type="text" 
                                value={seoKeywordInput} 
                                onChange={(e) => setSeoKeywordInput(e.target.value)} 
                                onKeyDown={handleSeoKeywordKeyDown}
                                className="w-full border border-gray-300 p-2 rounded text-sm" 
                                placeholder="Comma separated keywords"
                              />
                              <div className="flex flex-wrap gap-2 mt-2">
                                  {formData.seoKeywords?.map((keyword, idx) => (
                                      <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs flex items-center border border-blue-100">
                                          {keyword}
                                          <button type="button" onClick={() => removeSeoKeyword(idx)} className="ml-1 text-blue-400 hover:text-blue-600">×</button>
                                      </span>
                                  ))}
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">URL Slug</label>
                              <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded text-sm text-gray-600 bg-gray-50"/>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {isManageCatsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-800">Manage Category Collections</h3>
                    <button onClick={() => setIsManageCatsOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>
                </div>
                <div className="p-4 max-h-60 overflow-y-auto">
                    <ul className="space-y-2">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex justify-between border-b pb-2 items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border">
                                        {cat.imageUrl && <img src={cat.imageUrl} className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{cat.name}</span>
                                </div>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 text-xs hover:text-red-700 font-bold uppercase">Delete</button>
                            </li>
                        ))}
                        {categories.length === 0 && <p className="text-center py-4 text-gray-400 text-sm">No categories yet.</p>}
                    </ul>
                </div>
                <div className="p-4 border-t flex gap-2 bg-gray-50">
                    <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-blue-500" placeholder="New Category Name"/>
                    <button onClick={handleAddCategory} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">Add</button>
                </div>
                <p className="px-4 pb-4 text-[10px] text-gray-400 italic">
                    Note: Adding a category here creates a new "Shop By Category" Collection.
                </p>
            </div>
        </div>
      )}
    </form>
  );
};

export default ProductForm;
