import React, { useState, useEffect, useMemo } from 'react';
import { Product, Review } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { StarIcon, Trash2, MoreHorizontal, Eye, ShoppingCart } from '../Icons';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../utils/utils';

interface ReviewWithProduct extends Review {
    productName: string;
    productId: string;
    productImage: string;
}

const Reviews: React.FC<{ token: string | null }> = ({ token }) => {
    const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<ReviewWithProduct | null>(null);
    const [activeTab, setActiveTab] = useState("all");

    const fetchReviews = async () => {
        setLoading(true);
        try {
            // We fetch all products and extract their nested reviews to create a master list
            const res = await fetch(getApiUrl('/api/products/all'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const products: Product[] = await res.json();
                const allReviews: ReviewWithProduct[] = [];
                
                products.forEach(p => {
                    if (p.reviews && p.reviews.length > 0) {
                        p.reviews.forEach(r => {
                            allReviews.push({
                                ...r,
                                productName: p.name,
                                productId: p.id || (p as any)._id,
                                productImage: p.imageUrl
                            });
                        });
                    }
                });
                
                // Sort by date descending
                allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setReviews(allReviews);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, [token]);

    const handleDelete = async (productId: string, reviewId: string) => {
        if (!window.confirm("Permanently remove this customer review?")) return;
        try {
            // Note: In a production app, there would be a specific /api/reviews endpoint
            // Here we assume the backend handles review deletion via the product update route
            const res = await fetch(getApiUrl(`/api/products/${productId}/reviews/${reviewId}`), { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) fetchReviews();
        } catch (e) {
            alert("Delete operation failed");
        }
    };

    const columns: ColumnDef<ReviewWithProduct>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: "Customer",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-600 border border-zinc-200 uppercase">
                        {row.original.name.substring(0, 2)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-zinc-900 truncate leading-none mb-1 uppercase tracking-tighter italic">{row.original.name}</span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(row.original.date).toLocaleDateString()}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "productName",
            header: "Product Detail",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg overflow-hidden border border-zinc-100 shrink-0">
                        <img src={row.original.productImage} className="h-full w-full object-cover" alt="" />
                    </div>
                    <span className="text-xs font-bold text-zinc-600 truncate max-w-[150px] uppercase tracking-tight">{row.original.productName}</span>
                </div>
            )
        },
        {
            accessorKey: "rating",
            header: "Sentiment",
            cell: ({ getValue }) => {
                const rating = getValue() as number;
                return (
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon 
                                key={i} 
                                className={cn("w-3 h-3", i < rating ? "text-amber-400 fill-current" : "text-zinc-200")} 
                            />
                        ))}
                    </div>
                )
            }
        },
        {
            accessorKey: "comment",
            header: "Excerpt",
            cell: ({ getValue }) => (
                <p className="text-xs text-zinc-500 truncate max-w-[200px] italic font-medium">"{getValue() as string}"</p>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right pr-4">Control</div>,
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu trigger={
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        }>
                            <React.Fragment>
                                <DropdownMenuLabel>Review Ops</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSelectedReview(r)}>
                                    <Eye className="mr-2 h-3.5 w-3.5" /> View Full Context
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(r.productId, r.id || (r as any)._id)} variant="destructive">
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Review
                                </DropdownMenuItem>
                            </React.Fragment>
                        </DropdownMenu>
                    </div>
                );
            }
        }
    ], []);

    const filteredReviews = useMemo(() => {
        if (activeTab === "all") return reviews;
        if (activeTab === "positive") return reviews.filter(r => r.rating >= 4);
        if (activeTab === "critical") return reviews.filter(r => r.rating <= 2);
        return reviews;
    }, [reviews, activeTab]);

    if (loading) return <div className="p-20 text-center font-black italic text-zinc-400 animate-pulse tracking-widest uppercase">Syncing Public Feedback...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Review Moderation</h1>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Manage customer sentiment and product feedback across master catalog</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Global Rating</span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-lg font-black italic">4.8</span>
                            <div className="flex text-amber-400"><StarIcon className="w-3.5 h-3.5 fill-current"/></div>
                        </div>
                    </div>
                </div>
            </div>

            <DataTable 
                columns={columns} 
                data={filteredReviews} 
                searchKey="name" 
                searchPlaceholder="Lookup customer name..." 
                onRowClick={setSelectedReview}
                tabs={[
                    { value: "all", label: "Master Registry", count: reviews.length },
                    { value: "positive", label: "Satisfied (4-5★)", count: reviews.filter(r => r.rating >= 4).length },
                    { value: "critical", label: "Critical (1-2★)", count: reviews.filter(r => r.rating <= 2).length }
                ]}
                onTabChange={setActiveTab}
            />

            <Drawer isOpen={!!selectedReview} onClose={() => setSelectedReview(null)} title="Feedback Context">
                {selectedReview && (
                    <div className="flex flex-col h-full">
                        <div className="border-b bg-zinc-50/50 pb-8 p-6">
                            <DrawerHeader>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-16 w-16 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xl font-black italic border-4 border-white shadow-xl">
                                        {selectedReview.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <DrawerTitle>{selectedReview.name}</DrawerTitle>
                                        <DrawerDescription>Verified Purchase / {new Date(selectedReview.date).toLocaleDateString()}</DrawerDescription>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-zinc-100 flex-1 shadow-sm">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Sentiment Score</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-black italic">{selectedReview.rating} / 5</span>
                                            <div className="flex text-amber-400"><StarIcon className="w-3 h-3 fill-current"/></div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-zinc-100 flex-1 shadow-sm">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-black uppercase px-2 py-0.5">Approved</Badge>
                                    </div>
                                </div>
                            </DrawerHeader>
                        </div>

                        <DrawerContent>
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Customer Narrative</label>
                                    <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                                        <p className="text-zinc-600 font-medium italic text-base leading-relaxed">"{selectedReview.comment}"</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Linked Catalog Asset</label>
                                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 shrink-0">
                                            <img src={selectedReview.productImage} className="h-full w-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-zinc-900 truncate uppercase">{selectedReview.productName}</p>
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter italic">ID: {selectedReview.productId}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DrawerContent>

                        <DrawerFooter>
                            <Button variant="ghost" className="flex-1 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-900" onClick={() => setSelectedReview(null)}>Discard</Button>
                            <Button 
                                className="flex-1 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all" 
                                onClick={() => handleDelete(selectedReview.productId, selectedReview.id || (selectedReview as any)._id)}
                            >
                                Purge Record
                            </Button>
                        </DrawerFooter>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default Reviews;