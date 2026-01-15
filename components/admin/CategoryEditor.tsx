
import React, { useState, useEffect } from 'react';
import { Product, Collection } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Check, ArrowLeft, Loader2, Layout, Circle, Image, Square } from "lucide-react";
import * as ReactRouterDom from 'react-router-dom';

// Hack for useNavigate hook if not directly available (though it is in this project context)
const { useNavigate, useParams } = ReactRouterDom as any;

const CategoryEditor: React.FC<{ token: string | null, categoryId?: string | null }> = ({ token, categoryId }) => {
    const navigate = useNavigate();

    // If categoryId is passed as prop 'new', treat as creation.
    const isEditing = categoryId && categoryId !== 'new';

    const [collectionData, setCollectionData] = useState<Partial<Collection>>({
        isActive: true,
        products: [],
        displayStyle: 'Rectangle',
        title: '',
        imageUrl: ''
    });
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setDataLoading(true);
            try {
                // Fetch Products
                const prodRes = await fetch(getApiUrl('/api/products'));
                if (prodRes.ok) {
                    const data = await prodRes.json();
                    setAllProducts(data);
                }

                // If editing, fetch Collection data
                if (isEditing) {
                    const collRes = await fetch(getApiUrl(`/api/collections/${categoryId}`), {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (collRes.ok) {
                        const data = await collRes.json();
                        setCollectionData({
                            ...data,
                            products: data.products || []
                        });
                    } else {
                        setError("Failed to fetch category details");
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("An error occurred while loading data");
            } finally {
                setDataLoading(false);
            }
        };
        fetchInitialData();
    }, [categoryId, token, isEditing]);

    const handleSave = async () => {
        if (!collectionData.title) {
            alert("Title is required");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing
                ? getApiUrl(`/api/collections/${categoryId}`)
                : getApiUrl('/api/collections');

            const payload = {
                ...collectionData,
                products: collectionData.products?.map(p => typeof p === 'object' ? p.id : p) || []
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                navigate('/app/categories');
            } else {
                const data = await res.json();
                setError(data.message || "Failed to save category");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleProduct = (product: Product) => {
        const current = collectionData.products || [];
        const exists = current.find(p => (typeof p === 'object' ? p.id : p) === product.id);
        const updated = exists
            ? current.filter(p => (typeof p === 'object' ? p.id : p) !== product.id)
            : [...current, product];
        setCollectionData({ ...collectionData, products: updated });
    };

    const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

    const visualStyles = [
        { id: 'Rectangle', label: 'Classic Box', icon: <Layout className="h-6 w-6" /> },
        { id: 'Circle', label: 'Rounded', icon: <Circle className="h-6 w-6" /> },
        { id: 'ImageOnly', label: 'Only Image (Premium)', icon: <Image className="h-6 w-6" /> },
        { id: 'Square', label: 'Perfect Square', icon: <Square className="h-6 w-6" /> }
    ];

    if (dataLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/app/categories')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{isEditing ? 'Edit Category' : 'Create New Category'}</h1>
                    <p className="text-muted-foreground">{isEditing ? 'Update your product collection details.' : 'Add a new product collection to your store.'}</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>
                            Define the name and look of your category.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Category Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. SUMMER ESSENTIALS"
                                value={collectionData.title || ''}
                                onChange={e => setCollectionData({ ...collectionData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Visual Presentation</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {visualStyles.map((style) => (
                                    <div
                                        key={style.id}
                                        onClick={() => setCollectionData({ ...collectionData, displayStyle: style.id as any })}
                                        className={`
                                            cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all gap-2
                                            ${collectionData.displayStyle === style.id
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                            }
                                        `}
                                    >
                                        <span className="text-2xl">{style.icon}</span>
                                        <span className="text-xs font-medium uppercase tracking-wider">{style.label}</span>
                                    </div>
                                ))}
                            </div>
                            {collectionData.displayStyle === 'ImageOnly' && (
                                <p className="text-xs text-rose-500 font-medium">✨ Premium "ImageOnly" mode hides titles on the storefront.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Cover Image</Label>
                            <div className="border rounded-lg p-4 bg-muted/30">
                                <MediaPicker
                                    value={collectionData.imageUrl || ''}
                                    onChange={url => setCollectionData({ ...collectionData, imageUrl: url })}
                                    type="image"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Attached Products</CardTitle>
                        <CardDescription>
                            Select products to include in this category automatically.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Input
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                    className="max-w-sm"
                                />
                                <div className="text-sm text-muted-foreground font-medium">
                                    {collectionData.products?.length || 0} Selected
                                </div>
                            </div>

                            <div className="border rounded-md h-[300px] overflow-y-auto p-2 bg-slate-50">
                                <div className="space-y-1">
                                    {filteredProducts.map(prod => {
                                        const isSelected = collectionData.products?.some(p => (typeof p === 'object' ? p.id : p) === prod.id);
                                        return (
                                            <div
                                                key={prod.id}
                                                onClick={() => toggleProduct(prod)}
                                                className={`
                                                    p-3 rounded-md flex items-center gap-3 cursor-pointer transition-colors border
                                                    ${isSelected
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-white hover:bg-slate-100 border-transparent hover:border-slate-200 text-slate-700'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    flex items-center justify-center w-5 h-5 rounded border transition-colors
                                                    ${isSelected ? 'bg-white/20 border-white/50' : 'border-slate-300 bg-white'}
                                                `}>
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                                <span className="text-sm font-medium truncate">{prod.name}</span>
                                            </div>
                                        );
                                    })}
                                    {filteredProducts.length === 0 && (
                                        <div className="text-center py-10 text-muted-foreground text-sm">
                                            No products found matching "{productSearch}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4 border-t px-6 py-4 bg-muted/20">
                        <Button variant="ghost" onClick={() => navigate('/app/categories')}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            {error && (
                <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    {error}
                </div>
            )}
        </div>
    );
};

export default CategoryEditor;
