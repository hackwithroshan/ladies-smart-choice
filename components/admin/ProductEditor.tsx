import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import ProductForm from './ProductForm';
import { getApiUrl } from '../../utils/apiHelper';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;

interface ProductEditorProps {
    token: string | null;
    productId?: string | null;
}

const ProductEditor: React.FC<ProductEditorProps> = ({ token, productId }) => {
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(!!productId);

    useEffect(() => {
        if (productId && productId !== 'new') {
            const fetchProduct = async () => {
                try {
                    setLoading(true);
                    const res = await fetch(getApiUrl(`/api/products/${productId}`), {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setProduct(data);
                    } else {
                        console.error("Failed to fetch product");
                        alert("Product not found");
                        navigate('/app/products');
                    }
                } catch (error) {
                    console.error('Error fetching product:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        } else {
            // New is no longer used for manual creation, but if hit, we stop loading
            setLoading(false);
        }
    }, [productId, token]);

    const handleSave = async (savedProduct: Omit<Product, 'id'> & { id?: string }) => {
        try {
            const method = savedProduct.id ? 'PUT' : 'POST';
            const url = savedProduct.id ? getApiUrl(`/api/products/${savedProduct.id}`) : getApiUrl('/api/products');

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(savedProduct)
            });

            if (res.ok) {
                navigate('/app/products');
            } else {
                const err = await res.json();
                alert(`Failed to save product: ${err.message}`);
            }
        } catch (error) {
            console.error("Error saving product:", error);
            alert("An error occurred while saving the product.");
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-800 border-t-zinc-200"></div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-background">
            <ProductForm
                product={product}
                onSave={handleSave}
                onCancel={() => navigate('/app/products')}
            />
        </div>
    );
};

export default ProductEditor;
