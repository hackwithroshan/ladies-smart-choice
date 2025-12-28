
import React, { useState, useEffect } from 'react';
import { Slide } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';

const emptySlide: Omit<Slide, '_id'> = {
    imageUrl: '',
    mobileImageUrl: '',
    title: '',
    subtitle: '',
    buttonText: '',
    imageFit: 'cover',
    desktopHeight: '650px',
    mobileHeight: '400px',
    desktopWidth: '100%',
    mobileWidth: '100%'
};

const SliderSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<Slide | Omit<Slide, '_id'>>(emptySlide);
    
    const fetchSlides = async () => {
        try {
            setLoading(true);
            const response = await fetch(getApiUrl('/api/slides'));
            if (!response.ok) throw new Error('Failed to fetch slides');
            const data = await response.json();
            setSlides(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlides();
    }, []);

    const handleOpenModal = (slide?: Slide) => {
        setEditingSlide(slide || emptySlide);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSlide(emptySlide);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditingSlide(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSlide = async () => {
        if (!editingSlide.imageUrl) {
            alert('An image is required to save the slide.');
            return;
        }

        const isEditing = '_id' in editingSlide;
        const url = isEditing ? getApiUrl(`/api/slides/${editingSlide._id}`) : getApiUrl('/api/slides');
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editingSlide)
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to save slide');
            }
            handleCloseModal();
            fetchSlides(); // Refresh the list
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleDeleteSlide = async (slideId: string) => {
        if (!window.confirm('Are you sure you want to delete this slide?')) return;
        
        try {
            const response = await fetch(getApiUrl(`/api/slides/${slideId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete slide');
            fetchSlides();
        } catch (err: any) {
            setError(err.message);
        }
    }

    if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-[#16423C] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Hero Banners</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage the high-impact visual slides on your homepage.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-2.5 text-sm font-bold text-white rounded-lg shadow-lg hover:opacity-90 transition-all transform active:scale-95"
                    style={{ backgroundColor: COLORS.accent }}
                >
                    + Add New Slide
                </button>
            </div>
            {error && <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">{error}</div>}
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {slides.map(slide => (
                        <div key={slide._id} className="group relative border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col bg-white">
                            <div className="h-44 relative bg-gray-50 overflow-hidden">
                                <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                                <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold border border-white/20 uppercase tracking-widest">
                                    {slide.imageFit}
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-gray-900 text-lg truncate mb-1">{slide.title || 'Untitled Slide'}</h3>
                                <p className="text-sm text-gray-500 truncate mb-4">{slide.subtitle || 'No subtitle provided'}</p>
                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${slide.buttonText ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                        {slide.buttonText ? 'Active Button' : 'No Button'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(slide)} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md transition-colors">Edit</button>
                                        <button onClick={() => handleDeleteSlide(slide._id!)} className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-md transition-colors">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {slides.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-medium">No slides created. Click "Add New Slide" to begin.</p>
                        </div>
                    )}
                 </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl z-50 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">{'_id' in editingSlide ? 'Edit Hero Banner' : 'New Hero Banner'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Desktop Image <span className="text-red-500">*</span></label>
                                    <MediaPicker 
                                        value={editingSlide.imageUrl || ''} 
                                        onChange={url => setEditingSlide(prev => ({ ...prev, imageUrl: url }))} 
                                        type="image" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mobile Image</label>
                                    <MediaPicker 
                                        value={editingSlide.mobileImageUrl || ''} 
                                        onChange={url => setEditingSlide(prev => ({ ...prev, mobileImageUrl: url }))} 
                                        type="image" 
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-5">Dimension Settings (CSS Units)</h4>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Image Fit Style</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['cover', 'contain', 'fill'].map(fit => (
                                                <button
                                                    key={fit}
                                                    type="button"
                                                    onClick={() => setEditingSlide(prev => ({ ...prev, imageFit: fit as any }))}
                                                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${editingSlide.imageFit === fit ? 'bg-[#16423C] text-white border-[#16423C]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    {fit.charAt(0).toUpperCase() + fit.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Desktop Display</h5>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Section Height</label>
                                                <input type="text" name="desktopHeight" value={editingSlide.desktopHeight || ''} onChange={handleInputChange} placeholder="e.g. 650px or 80vh" className="w-full border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-[#16423C]"/>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Section Width</label>
                                                <input type="text" name="desktopWidth" value={editingSlide.desktopWidth || ''} onChange={handleInputChange} placeholder="e.g. 100% or 1200px" className="w-full border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-[#16423C]"/>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Mobile Display</h5>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Section Height</label>
                                                <input type="text" name="mobileHeight" value={editingSlide.mobileHeight || ''} onChange={handleInputChange} placeholder="e.g. 400px" className="w-full border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-[#16423C]"/>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Section Width</label>
                                                <input type="text" name="mobileWidth" value={editingSlide.mobileWidth || ''} onChange={handleInputChange} placeholder="e.g. 100%" className="w-full border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-[#16423C]"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Slide Title</label>
                                    <input type="text" name="title" value={editingSlide.title || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-1 focus:ring-[#16423C]"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Subtitle / Subtext</label>
                                    <textarea name="subtitle" value={editingSlide.subtitle || ''} onChange={handleInputChange} rows={2} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-1 focus:ring-[#16423C]"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Button Text</label>
                                    <input type="text" name="buttonText" value={editingSlide.buttonText || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-1 focus:ring-[#16423C]"/>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                            <button onClick={handleSaveSlide} className="px-8 py-2 text-sm font-bold text-white rounded-lg shadow-lg hover:opacity-90 transform active:scale-95" style={{backgroundColor: COLORS.accent}}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SliderSettings;
