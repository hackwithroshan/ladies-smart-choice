
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
    buttonText: ''
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            // Optionally, show error inside modal
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

    if (loading) return <div>Loading slider settings...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Homepage Slider</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm"
                    style={{ backgroundColor: COLORS.accent }}
                >
                    Add New Slide
                </button>
            </div>
            {error && <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slides.map(slide => (
                        <div key={slide._id} className="border rounded-lg overflow-hidden shadow flex flex-col">
                            <img src={slide.imageUrl} alt={slide.title} className="h-32 w-full object-cover" />
                            {slide.mobileImageUrl && (
                                <div className="h-8 bg-gray-100 text-xs flex items-center justify-center text-gray-500 border-t border-b">
                                    Mobile Version Available
                                </div>
                            )}
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg truncate">{slide.title || 'Untitled Slide'}</h3>
                                <p className="text-sm text-gray-600 truncate">{slide.subtitle || 'No subtitle'}</p>
                                <div className="mt-auto pt-4 flex justify-end space-x-2">
                                    <button onClick={() => handleOpenModal(slide)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                    <button onClick={() => handleDeleteSlide(slide._id!)} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{'_id' in editingSlide ? 'Edit Slide' : 'Add New Slide'}</h3>
                        <div className="space-y-6">
                            {/* Desktop Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Desktop Image <span className="text-red-500">*</span></label>
                                <MediaPicker 
                                    value={editingSlide.imageUrl || ''} 
                                    onChange={url => setEditingSlide(prev => ({ ...prev, imageUrl: url }))} 
                                    type="image" 
                                />
                                <p className="mt-1 text-xs text-gray-500">Recommended size: 1920x600 pixels (Landscape)</p>
                            </div>

                            {/* Mobile Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Image <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <MediaPicker 
                                    value={editingSlide.mobileImageUrl || ''} 
                                    onChange={url => setEditingSlide(prev => ({ ...prev, mobileImageUrl: url }))} 
                                    type="image" 
                                />
                                <p className="mt-1 text-xs text-gray-500">Recommended size: 800x1000 pixels (Portrait). If left empty, Desktop image is used.</p>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <input type="text" name="title" value={editingSlide.title || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Subtitle <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <input type="text" name="subtitle" value={editingSlide.subtitle || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Button Text <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <input type="text" name="buttonText" value={editingSlide.buttonText || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                            <button onClick={handleSaveSlide} className="px-4 py-2 text-sm font-medium text-white rounded-md" style={{backgroundColor: COLORS.accent}}>Save Slide</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SliderSettings;
