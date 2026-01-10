import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductVariant, Category } from '../../types';
import { CLOUDINARY } from '../../constants';
import MediaPicker from './MediaPicker';
import { getApiUrl } from '../../utils/apiHelper';
import RichTextEditor from './RichTextEditor';
import { cn } from '../../utils/utils';

interface ProductFormProps {
  product: Product | null;
  onSave: (data: any) => void;
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
  // Fix: Removed 'tags' property as it is not defined in the Product interface in types.ts
  status: 'Active',
  price: 0,
  mrp: 0,
  stock: 0,
  lowStockThreshold: 5,
  imageUrl: '',
  galleryImages: [],
  dimensions: { length: 0, width: 0, height: 0 },
  hasVariants: false,
  variants: [],
};

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const formTopRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token');

  const fetchCategories = async () => {
    try {
      const res = await fetch(getApiUrl('/api/products/categories'));
      if (res.ok) setCategories(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchCategories();
    if (product) {
      setFormData({
        ...initialFormData,
        ...product,
        _id: product.id || (product as any)._id,
        dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
      });
    } else {
      setFormData(initialFormData);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (errors[name]) {
        const n = { ...errors }; delete n[name]; setErrors(n);
    }

    if (name.startsWith('dim_')) {
        const dimKey = name.split('_')[1];
        setFormData((p: any) => ({ ...p, dimensions: { ...p.dimensions, [dimKey]: Number(value) } }));
        return;
    }

    let val: any = value;
    if (type === 'number') val = Number(value);
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;
    setFormData((p: any) => ({ ...p, [name]: val }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generateSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setFormData((p: any) => ({
        ...p,
        name: val,
        slug: !product ? generateSlug(val) : p.slug,
        seoTitle: !p.seoTitle ? val : p.seoTitle
    }));
  };

  const addVariant = () => {
    const v: ProductVariant = { name: 'Size', options: [{ value: 'Default', price: formData.price, stock: 10, image: '' }] };
    setFormData((p: any) => ({ ...p, hasVariants: true, variants: [...(p.variants || []), v] }));
  };

  const updateVariantOption = (vIdx: number, oIdx: number, field: string, val: any) => {
    const newVariants = [...formData.variants];
    newVariants[vIdx].options[oIdx] = { ...newVariants[vIdx].options[oIdx], [field]: val };
    setFormData((p: any) => ({ ...p, variants: newVariants }));
  };

  const validate = () => {
    const e: any = {};
    if (!formData.name.trim()) e.name = "Title required";
    if (!formData.description.trim()) e.description = "Storytelling required";
    if (!formData.category) e.category = "Category selection required";
    if (formData.price <= 0) e.price = "Invalid Price";
    if (!formData.imageUrl) e.imageUrl = "Master Visual required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(formData);
    else formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full h-full bg-[#F8FAFC] relative -m-6 md:-m-8">
      <div ref={formTopRef} className="absolute -top-10" />
      
      {/* Sticky Top Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-zinc-200 px-8 py-5 flex justify-between items-center z-40 sticky top-0 shadow-sm">
         <div className="flex items-center gap-5">
             <button type="button" onClick={onCancel} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             </button>
             <div>
                <h2 className="text-lg font-black uppercase italic tracking-tighter text-zinc-900">{product ? 'Update Master Record' : 'Inject New Product'}</h2>
                <p className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">{formData.category || 'General'} / {formData.sku || 'PENDING SKU'}</p>
             </div>
         </div>
         <div className="flex gap-3">
             <button type="button" onClick={onCancel} className="px-5 py-2 text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-900 transition-colors">Discard</button>
             <button type="submit" className="px-10 py-3 bg-[#16423C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all">
                {product ? 'Synchronize' : 'Initialize'}
             </button>
         </div>
      </div>

      <div className="flex-1 p-8 md:p-12 overflow-y-auto admin-scroll">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-10">
              
              {/* Main Column */}
              <div className="lg:col-span-3 space-y-10">
                 
                 {/* Block 1: Identification */}
                 <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 p-10 space-y-8">
                    <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-4 h-0.5 bg-[#16423C]"></span> Identity & Narrative
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Product Title <span className="text-rose-500">*</span></label>
                            <input type="text" name="name" value={formData.name} onChange={handleNameChange} className={cn("block w-full rounded-2xl p-4 border text-sm font-bold outline-none transition-all", errors.name ? "border-rose-500 bg-rose-50" : "border-zinc-200 focus:border-zinc-900")}/>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div><label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Brand</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} className="block w-full border-zinc-200 rounded-2xl p-3.5 border text-sm font-bold outline-none focus:border-zinc-900"/></div>
                             <div><label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">SKU ID</label><input type="text" name="sku" value={formData.sku} onChange={handleChange} className="block w-full border-zinc-200 rounded-2xl p-3.5 border text-sm font-black font-mono outline-none focus:border-zinc-900" placeholder="AUTO-ASSIGNED"/></div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Teaser Description</label>
                            <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} rows={2} className="block w-full p-4 border border-zinc-200 rounded-2xl text-sm font-medium outline-none focus:border-zinc-900"/>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Deep Storytelling <span className="text-rose-500">*</span></label>
                            <div className={cn("rounded-3xl overflow-hidden border", errors.description ? "border-rose-500" : "border-zinc-200")}>
                                <RichTextEditor value={formData.description} onChange={(v) => setFormData((p: any) => ({ ...p, description: v }))} />
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Block 2: Visuals */}
                 <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 p-10 space-y-8">
                    <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-4 h-0.5 bg-[#16423C]"></span> Media Protocol
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Master Frame</label>
                            <MediaPicker value={formData.imageUrl} onChange={(v) => setFormData((p: any) => ({ ...p, imageUrl: v }))} type="image" />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Supporting Gallery</label>
                             <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                 {formData.galleryImages?.map((img: string, idx: number) => (
                                     <div key={idx} className="relative aspect-[3/4] bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden group">
                                         <img src={img} className="w-full h-full object-cover" alt=""/>
                                         <button type="button" onClick={() => setFormData((p: any) => ({ ...p, galleryImages: p.galleryImages.filter((_: any, i: number) => i !== idx) }))} className="absolute top-1.5 right-1.5 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                                     </div>
                                 ))}
                                 <MediaPicker value="" onChange={(v) => setFormData((p: any) => ({ ...p, galleryImages: [...p.galleryImages, v] }))} type="image" renderTrigger={(open) => (
                                     <button type="button" onClick={open} className="aspect-[3/4] border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-zinc-300 hover:border-zinc-900 hover:text-zinc-900 transition-all">
                                         <span className="text-xl">+</span>
                                         <span className="text-[8px] font-black uppercase">Add</span>
                                     </button>
                                 )} />
                             </div>
                        </div>
                    </div>
                 </div>

                 {/* Block 3: Marketplace Logic */}
                 <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 p-10 space-y-8">
                    <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-4 h-0.5 bg-[#16423C]"></span> Market Intelligence
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Live Price (INR)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="block w-full rounded-2xl p-4 border border-zinc-200 text-lg font-black italic outline-none focus:border-zinc-900"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Compare Price (MRP)</label>
                            <input type="number" name="mrp" value={formData.mrp} onChange={handleChange} className="block w-full rounded-2xl p-4 border border-zinc-200 text-lg font-black text-zinc-400 italic outline-none focus:border-zinc-900"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Inventory Stock</label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="block w-full rounded-2xl p-4 border border-zinc-200 text-lg font-black italic outline-none focus:border-zinc-900"/>
                        </div>
                    </div>
                 </div>

                 {/* Block 4: Variants with Advanced Image Support */}
                 <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 p-10 space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-4 h-0.5 bg-[#16423C]"></span> Attribute Engine
                        </h3>
                        <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-2xl border">
                             <span className="text-[10px] font-black uppercase text-zinc-400">Status</span>
                             <input type="checkbox" checked={formData.hasVariants} onChange={handleChange} name="hasVariants" className="w-5 h-5 text-[#16423C] rounded-lg border-zinc-300 focus:ring-0" />
                        </div>
                    </div>

                    {formData.hasVariants && (
                        <div className="space-y-6">
                            {formData.variants?.map((v: any, vIdx: number) => (
                                <div key={vIdx} className="bg-zinc-50/50 p-8 rounded-3xl border border-zinc-200 space-y-6">
                                    <div className="flex justify-between items-center border-b pb-4">
                                        <input value={v.name} onChange={(e) => {
                                            const n = [...formData.variants]; n[vIdx].name = e.target.value;
                                            setFormData((p: any) => ({ ...p, variants: n }));
                                        }} className="font-black text-lg bg-transparent border-none focus:ring-0 uppercase italic tracking-tighter" placeholder="Variant Type (e.g. Size)"/>
                                        <button type="button" onClick={() => setFormData((p: any) => ({ ...p, variants: p.variants.filter((_: any, i: number) => i !== vIdx) }))} className="text-rose-500 font-black uppercase text-[10px] underline">Remove</button>
                                    </div>
                                    <div className="space-y-3">
                                        {v.options.map((opt: any, oIdx: number) => (
                                            <div key={oIdx} className="grid grid-cols-12 gap-3 items-center p-3 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:border-zinc-300 transition-all">
                                                {/* Variant Visual Trigger */}
                                                <div className="col-span-1">
                                                    <MediaPicker 
                                                        value={opt.image || ''} 
                                                        onChange={(url) => updateVariantOption(vIdx, oIdx, 'image', url)} 
                                                        type="image" 
                                                        renderTrigger={(open) => (
                                                            <button 
                                                                type="button" 
                                                                onClick={open} 
                                                                className="w-10 h-10 rounded-lg border border-zinc-100 bg-zinc-50 overflow-hidden flex items-center justify-center hover:border-[#16423C] transition-all group"
                                                            >
                                                                {opt.image ? (
                                                                    <img src={opt.image} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <svg className="w-4 h-4 text-zinc-300 group-hover:text-[#16423C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2}/></svg>
                                                                )}
                                                            </button>
                                                        )}
                                                    />
                                                </div>

                                                <input value={opt.value} onChange={(e) => updateVariantOption(vIdx, oIdx, 'value', e.target.value)} className="col-span-4 border-none text-xs font-bold uppercase focus:ring-0" placeholder="Label"/>
                                                
                                                <div className="col-span-3 flex items-center gap-1 border-l pl-3">
                                                    <span className="text-[10px] font-black text-zinc-400">₹</span>
                                                    <input type="number" value={opt.price} onChange={(e) => updateVariantOption(vIdx, oIdx, 'price', Number(e.target.value))} className="w-full border-none text-xs font-black italic focus:ring-0 p-0" placeholder="Price"/>
                                                </div>

                                                <div className="col-span-3 flex items-center gap-1 border-l pl-3">
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase">Qty</span>
                                                    <input type="number" value={opt.stock} onChange={(e) => updateVariantOption(vIdx, oIdx, 'stock', Number(e.target.value))} className="w-full border-none text-xs font-bold focus:ring-0 p-0" placeholder="Qty"/>
                                                </div>

                                                <div className="col-span-1 flex justify-end">
                                                    <button type="button" onClick={() => {
                                                        const n = [...formData.variants]; n[vIdx].options = n[vIdx].options.filter((_: any, i: number) => i !== oIdx);
                                                        setFormData((p: any) => ({ ...p, variants: n }));
                                                    }} className="text-zinc-300 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => {
                                            const n = [...formData.variants]; n[vIdx].options.push({ value: '', price: formData.price, stock: 0, image: '' });
                                            setFormData((p: any) => ({ ...p, variants: n }));
                                        }} className="text-[10px] font-black uppercase text-blue-600 tracking-widest ml-13">+ Add Option</button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addVariant} className="w-full py-4 border-2 border-dashed rounded-3xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 transition-all">+ Inject New Attribute Category</button>
                        </div>
                    )}
                 </div>
              </div>

              {/* Protocol Column */}
              <div className="space-y-8">
                  <div className="bg-white rounded-3xl border border-zinc-200 p-8 space-y-6 shadow-sm">
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Visibility Protocol</h3>
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-zinc-50 border-zinc-200 rounded-xl p-3.5 text-xs font-black uppercase outline-none cursor-pointer">
                          <option>Active</option>
                          <option>Draft</option>
                          <option>Archived</option>
                      </select>
                  </div>

                  <div className="bg-white rounded-3xl border border-zinc-200 p-8 space-y-6 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Taxonomy</h3>
                        <button type="button" onClick={() => setIsManageCatsOpen(true)} className="text-[9px] font-black text-blue-600 underline uppercase">Manage</button>
                      </div>
                      <select name="category" value={formData.category} onChange={handleChange} className={cn("w-full bg-zinc-50 rounded-xl p-3.5 border text-xs font-black uppercase outline-none cursor-pointer", errors.category ? "border-rose-500" : "border-zinc-200")}>
                          <option value="">Select Root...</option>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                  </div>

                  <div className="bg-white rounded-3xl border border-zinc-200 p-8 space-y-6 shadow-sm">
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dimensions (cm)</h3>
                      <div className="grid grid-cols-3 gap-3">
                          <input type="number" name="dim_length" value={formData.dimensions.length} onChange={handleChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-bold text-center" placeholder="L" />
                          <input type="number" name="dim_width" value={formData.dimensions.width} onChange={handleChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-bold text-center" placeholder="W" />
                          <input type="number" name="dim_height" value={formData.dimensions.height} onChange={handleChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-bold text-center" placeholder="H" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Weight (Kg)</label>
                        <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-bold" />
                      </div>
                  </div>

                  <div className="bg-[#16423C] rounded-3xl p-8 space-y-6 shadow-xl text-white">
                      <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">SEO Strategy</h3>
                      <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase opacity-40">Crawl Title</label>
                            <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full bg-white/10 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:bg-white/20"/>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase opacity-40">Description Snippet</label>
                            <textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={3} className="w-full bg-white/10 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:bg-white/20 resize-none"/>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {isManageCatsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center p-10 border-b bg-zinc-50">
                    <h3 className="font-black text-lg uppercase italic text-zinc-900 tracking-tighter">Taxonomy Manager</h3>
                    <button onClick={() => setIsManageCatsOpen(false)} className="text-zinc-400 hover:text-zinc-900 text-3xl font-black">&times;</button>
                </div>
                <div className="p-10 max-h-72 overflow-y-auto admin-scroll space-y-4">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between p-5 bg-zinc-50 rounded-2xl border border-zinc-200 items-center group shadow-sm">
                            <span className="text-xs font-black uppercase text-zinc-700 tracking-widest">{cat.name}</span>
                            <button onClick={async () => {
                                if(window.confirm("Permanent delete?")) {
                                    await fetch(getApiUrl(`/api/products/categories/${cat.id}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                    fetchCategories();
                                }
                            }} className="text-rose-500 text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Discard</button>
                        </div>
                    ))}
                </div>
                <div className="p-10 border-t bg-zinc-50/50">
                    <div className="flex gap-2">
                        <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 border border-zinc-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-zinc-900" placeholder="New Category Name..."/>
                        <button type="button" onClick={async () => {
                            if(!newCatName) return;
                            await fetch(getApiUrl('/api/products/categories'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name: newCatName }) });
                            setNewCatName(''); fetchCategories();
                        }} className="bg-zinc-900 text-white px-8 rounded-xl text-[10px] font-black uppercase">Inject</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </form>
  );
};

export default ProductForm;