import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ProductImage from '@/components/ProductImage';
import { toast } from 'sonner';
import { buildProductImageQuery, resolveProductImage, type ProductImageSource } from '@/lib/productImages';
import { ImagePlus, RefreshCcw, Upload } from 'lucide-react';

type ProductRow = {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  image_url: string | null;
  image_source: string;
};

type RowState = {
  status: 'idle' | 'saved' | 'failed';
  message?: string;
};

export default function AdminProductImages() {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [manualUrls, setManualUrls] = useState<Record<string, string>>({});
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, sku, category, image_url, image_source')
      .order('name');

    if (error) {
      toast.error('Failed to load products');
      setLoading(false);
      return;
    }

    const rows = data || [];
    setProducts(rows);
    setSearchQueries((prev) => {
      const next = { ...prev };
      rows.forEach((product) => {
        next[product.id] = prev[product.id] || buildProductImageQuery(product.name, product.description, product.category);
      });
      return next;
    });
    setManualUrls((prev) => {
      const next = { ...prev };
      rows.forEach((product) => {
        next[product.id] = prev[product.id] || product.image_url || '';
      });
      return next;
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!showOnlyMissing) return products;
    return products.filter((product) => !product.image_url);
  }, [products, showOnlyMissing]);

  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((product) => selectedIds.has(product.id));
  const selectedVisibleCount = filteredProducts.filter((product) => selectedIds.has(product.id)).length;
  const totalWithImages = products.filter((product) => !!product.image_url).length;
  const totalMissing = products.length - totalWithImages;

  const persistProductUpdate = (productId: string, imageUrl: string, imageSource: ProductImageSource) => {
    setProducts((prev) => prev.map((product) => (
      product.id === productId
        ? { ...product, image_url: imageUrl, image_source: imageSource }
        : product
    )));
    setManualUrls((prev) => ({ ...prev, [productId]: imageUrl }));
  };

  const updateProductImage = async (productId: string, imageUrl: string, imageSource: ProductImageSource) => {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl, image_source: imageSource })
      .eq('id', productId);

    if (error) {
      throw error;
    }

    persistProductUpdate(productId, imageUrl, imageSource);
  };

  const applyDefaultImage = async (product: ProductRow, queryOverride?: string) => {
    const query = (queryOverride || searchQueries[product.id] || buildProductImageQuery(product.name, product.description, product.category)).trim();
    try {
      const result = await resolveProductImage(product.name, product.description, product.category, query || product.name);
      await updateProductImage(product.id, result.imageUrl, result.source);
      setRowStates((prev) => ({
        ...prev,
        [product.id]: {
          status: 'saved',
          message: result.source === 'category_fallback' ? 'Default image assigned' : 'Image saved',
        },
      }));
      return true;
    } catch (error) {
      console.error(error);
      setRowStates((prev) => ({
        ...prev,
        [product.id]: {
          status: 'failed',
          message: error instanceof Error ? error.message : 'Search failed',
        },
      }));
      return false;
    }
  };

  const applyDefaultsToProducts = async (ids: string[]) => {
    if (ids.length === 0) {
      toast.error('No products selected');
      return;
    }

    let savedCount = 0;
    for (const id of ids) {
      const product = products.find((item) => item.id === id);
      if (!product) continue;
      const saved = await applyDefaultImage(product, searchQueries[product.id]);
      if (saved) savedCount += 1;
    }

    toast.success(`Assigned default images to ${savedCount} products`);
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        filteredProducts.forEach((product) => next.add(product.id));
      } else {
        filteredProducts.forEach((product) => next.delete(product.id));
      }
      return next;
    });
  };

  const toggleSelected = (productId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(productId);
      else next.delete(productId);
      return next;
    });
  };

  const handleManualSave = async (product: ProductRow) => {
    const url = (manualUrls[product.id] || '').trim();
    if (!url) {
      toast.error('Enter an image URL first');
      return;
    }

    try {
      await updateProductImage(product.id, url, 'manual_url');
      setRowStates((prev) => ({ ...prev, [product.id]: { status: 'saved', message: 'Manual URL saved' } }));
      toast.success('Manual image URL saved');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save manual image URL');
    }
  };

  const handleCustomUpload = async (product: ProductRow, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        toast.error('Failed to read the selected file');
        return;
      }

      try {
        await updateProductImage(product.id, result, 'uploaded');
        setRowStates((prev) => ({ ...prev, [product.id]: { status: 'saved', message: 'Custom image uploaded' } }));
        toast.success('Custom image uploaded');
      } catch (error) {
        console.error(error);
        toast.error('Failed to save custom image');
      }
    };
    reader.onerror = () => toast.error('Failed to read the selected file');
    reader.readAsDataURL(file);
  };

  const handleFileChange = (product: ProductRow, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleCustomUpload(product, file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Product Images</h1>
          <p className="text-sm text-muted-foreground mt-1">Assign reliable default images by product family/category, or override with upload and manual URL.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => applyDefaultsToProducts(products.filter((product) => !product.image_url).map((product) => product.id))}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-display"
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Assign Defaults To All Missing
          </Button>
          <Button
            variant="outline"
            onClick={() => applyDefaultsToProducts(Array.from(selectedIds))}
            disabled={selectedIds.size === 0}
          >
            Assign Defaults To Selected
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Coverage</CardTitle>
            <CardDescription>{totalWithImages} / {products.length} products have images</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={products.length ? (totalWithImages / products.length) * 100 : 0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Needs Attention</CardTitle>
            <CardDescription>{totalMissing} products currently have no image</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/products">Open Product List</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Default Image Strategy</CardTitle>
            <CardDescription>Use shared product-family images and category fallback images only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={products.length ? (totalWithImages / products.length) * 100 : 0} />
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <Badge variant="secondary">Shared family images</Badge>
              <Badge variant="outline">Category fallback images</Badge>
              <Badge variant="outline">Manual upload / URL override</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="font-display">Image Review Queue</CardTitle>
              <CardDescription>Apply dependable default images and override any row manually when needed.</CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={showOnlyMissing} onCheckedChange={(checked) => setShowOnlyMissing(!!checked)} />
                Show only products without images
              </label>
              <Badge variant="outline">{selectedVisibleCount} selected in current view</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading products...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleSelectAllVisible(!!checked)} />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-[280px]">Search Query</TableHead>
                  <TableHead className="min-w-[360px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const rowState = rowStates[product.id];
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(product.id)}
                          onCheckedChange={(checked) => toggleSelected(product.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Source: {product.image_source || 'none'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <ProductImage
                          src={product.image_url}
                          alt={product.name}
                          category={product.category}
                          className="w-20 h-20"
                          iconClassName="w-6 h-6"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={product.image_url ? 'secondary' : 'destructive'}>
                            {product.image_url ? 'Has Image' : 'No Image'}
                          </Badge>
                          {rowState?.status === 'saved' && <p className="text-xs text-green-600">{rowState.message}</p>}
                          {rowState?.status === 'failed' && <p className="text-xs text-destructive">{rowState.message}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={searchQueries[product.id] || ''}
                          onChange={(event) => setSearchQueries((prev) => ({ ...prev, [product.id]: event.target.value }))}
                          placeholder="Optional note / custom label"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" onClick={() => applyDefaultImage(product, searchQueries[product.id])}>
                              <ImagePlus className="w-4 h-4 mr-1" /> Assign Default
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => applyDefaultImage(product, searchQueries[product.id])}>
                              <RefreshCcw className="w-4 h-4 mr-1" /> Reapply Default
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => fileInputRefs.current[product.id]?.click()}>
                              <Upload className="w-4 h-4 mr-1" /> Upload Custom Image
                            </Button>
                            <input
                              ref={(element) => { fileInputRefs.current[product.id] = element; }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => handleFileChange(product, event)}
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <Label htmlFor={`manual-url-${product.id}`} className="text-xs text-muted-foreground">Enter URL manually</Label>
                              <Input
                                id={`manual-url-${product.id}`}
                                value={manualUrls[product.id] || ''}
                                onChange={(event) => setManualUrls((prev) => ({ ...prev, [product.id]: event.target.value }))}
                                placeholder="https://..."
                              />
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleManualSave(product)}>Save URL</Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
