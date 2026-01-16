
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Product, Category } from '../../types';

import { getApiUrl } from '../../utils/apiHelper';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  ArrowUpDown, MoreHorizontal, ChevronRight, ChevronLeft,
  Package, SearchIcon, LayoutTemplate, Activity, Edit, Trash2, FileText,
  Download, Upload, ChevronDown, Calendar
} from '../Icons';
import { cn } from '../../utils/utils';

const ProductList: React.FC<{ token: string | null }> = ({ token }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/products/all'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by tab
    if (activeTab === "active") {
      result = result.filter(p => p.status === 'Active');
    } else if (activeTab === "draft") {
      result = result.filter(p => p.status === 'Draft');
    } else if (activeTab === "archived") {
      result = result.filter(p => p.status === 'Archived');
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [products, activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.status === 'Active').length;
    const draft = products.filter(p => p.status === 'Draft').length;
    const archived = products.filter(p => p.status === 'Archived').length;

    return { total, active, draft, archived };
  }, [products]);

  const toggleRowSelection = (productId: string) => {
    const next = new Set(selectedRows);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setSelectedRows(next);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === paginatedProducts.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(getApiUrl(`/api/products/${productId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchProducts();
        setActionMenuOpen(null);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleToggleStatus = async (product: Product, newStatus: 'Active' | 'Draft' | 'Archived') => {
    try {
      const res = await fetch(getApiUrl(`/api/products/${product.id}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        await fetchProducts();
        setActionMenuOpen(null);
      }
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const handleCreateProduct = async () => {
    try {
      // Create Draft Product Immediately
      const res = await fetch(getApiUrl('/api/products'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `Untitled Product ${new Date().toLocaleString()}`,
          description: 'Start editing your product...',
          category: 'Uncategorized',
          price: 0,
          stock: 0,
          status: 'Draft',
          imageUrl: 'https://placehold.co/600x600?text=Product+Image'
        })
      });

      if (res.ok) {
        const data = await res.json();
        navigate(`/app/products/edit/${data._id || data.id}`);
      } else {
        console.error("Failed to create draft");
        alert("Could not create draft product.");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating product.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-800 border-t-zinc-200"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden space-y-2 pb-2">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog, inventory, and sales channels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Download className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Upload className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Import
          </Button>
          <Button size="sm" className="h-8" onClick={handleCreateProduct}>
            <div className="mr-1 h-4 w-4 flex items-center justify-center rounded-full bg-primary-foreground/20">
              <span className="text-xs">+</span>
            </div>
            Add Product
          </Button>
        </div>
      </div>

      {/* Summary Metrics Section (Clean Strip) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-1">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Products</span>
          <span className="text-2xl font-bold tracking-tight">{stats.total}</span>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">{stats.active}</span>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[10px] px-1.5 py-0">Live</Badge>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Drafts</span>
          <span className="text-2xl font-bold tracking-tight">{stats.draft}</span>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Archived</span>
          <span className="text-2xl font-bold tracking-tight">{stats.archived}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-1 mt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-muted/60 p-1 h-9">
            <TabsTrigger value="all" className="text-xs px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">All</TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Active</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Draft</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-[200px] lg:w-[300px] pl-8 text-xs bg-background"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 px-2 gap-1 text-xs">
            <LayoutTemplate className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex-1 overflow-hidden flex flex-col mt-2">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b bg-muted/30">
                <TableHead className="w-[40px] px-4">
                  <Checkbox
                    checked={selectedRows.size === paginatedProducts.length && paginatedProducts.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-11">Product</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-11">Status</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-11">Inventory</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-11">Category</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-11 text-right">Price</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="group cursor-pointer hover:bg-muted/40 transition-colors h-16 border-b"
                    onClick={() => navigate(`/app/products/edit/${product.id}`)}
                  >
                    <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.has(product.id)}
                        onCheckedChange={() => toggleRowSelection(product.id)}
                      />
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-md overflow-hidden border bg-muted flex items-center justify-center shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 max-w-[200px] xl:max-w-md">
                          <span className="text-sm font-medium leading-none text-foreground truncate">
                            {product.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            SKU: {product.sku || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === 'Active' ? 'default' : 'secondary'}
                        className={cn(
                          "rounded-md px-2 py-0 h-5 text-[10px] font-medium border-0 shadow-none",
                          product.status === 'Active' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                          product.status === 'Draft' && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                          product.status === 'Archived' && "bg-zinc-100 text-zinc-700 hover:bg-zinc-100"
                        )}
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "text-sm font-medium",
                          (product.stock || 0) < (product.lowStockThreshold || 10) ? "text-rose-600" : "text-foreground"
                        )}>
                          {product.stock || 0}
                        </span>
                        {(product.stock || 0) < (product.lowStockThreshold || 10) && (
                          <span className="text-[10px] text-rose-600 font-medium">Low Stock</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-transparent">
                        {product.category || 'Uncategorized'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">₹{product.price.toLocaleString()}</span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const viewportWidth = window.innerWidth;
                          const menuWidth = 192; // 12rem/w-48

                          let left = rect.right - menuWidth;
                          // If menu goes off-screen to the left, align with left edge of button
                          if (left < 10) left = rect.left;

                          // Ensure we don't overflow right edge either
                          if (left + menuWidth > viewportWidth) left = viewportWidth - menuWidth - 10;

                          setMenuPos({ top: rect.bottom + 5, left });
                          setActionMenuOpen(actionMenuOpen === product.id ? null : product.id);
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8 opacity-20" />
                      <p className="text-sm">No products found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer / Pagination */}
        <div className="border-t p-4 flex items-center justify-between bg-muted/10">
          <span className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{paginatedProducts.length}</span> of <span className="font-medium text-foreground">{filteredProducts.length}</span> products
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>



      {
        actionMenuOpen && createPortal((() => {
          const product = products.find(p => p.id === actionMenuOpen);
          if (!product) return null;
          return (
            <>
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setActionMenuOpen(null)}
              />
              <div
                className="fixed z-[101] w-48 rounded-md border bg-popover shadow-lg animate-in fade-in zoom-in-95 duration-100"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                <div className="p-1">
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      navigate(`/app/products/edit/${product.id}`);
                      setActionMenuOpen(null);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      navigate(`/app/products/design?productId=${product.id}`);
                      setActionMenuOpen(null);
                    }}
                  >
                    <Activity className="h-4 w-4" />
                    Edit in builder
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      const newStatus = product.status === 'Draft' ? 'Active' : 'Draft';
                      handleToggleStatus(product, newStatus);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    {product.status === 'Draft' ? 'Mark as active' : 'Mark as draft'}
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </>
          );
        })(), document.body)
      }
    </div >
  );
};

export default ProductList;
