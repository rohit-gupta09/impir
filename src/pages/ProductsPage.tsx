import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Minus, Heart, Package, Share2, ArrowLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import ProductImage from '@/components/ProductImage';
import type { CatalogMainCategory, CatalogSubcategory } from '@/lib/catalog';

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  company_id: string | null;
  company_name: string;
  unit: string;
  sku: string;
  image_url: string;
  is_popular: boolean;
  is_new: boolean;
  main_category_id?: string | null;
  subcategory_id?: string | null;
  created_at?: string;
};

type CompanyOption = {
  id: string;
  name: string;
};

const COMPANY_NAME_PREFIX = 'name:';

export default function ProductsPage() {
  const PAGE_SIZE = 12;
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number(searchParams.get('page') || '1');
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Products']);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [mainCategories, setMainCategories] = useState<CatalogMainCategory[]>([]);
  const [subcategories, setSubcategories] = useState<CatalogSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All Products');
  const [mainCategorySlug, setMainCategorySlug] = useState(searchParams.get('mainCategory') || '');
  const [subCategorySlug, setSubCategorySlug] = useState(searchParams.get('subCategory') || '');
  const [companyId, setCompanyId] = useState(searchParams.get('companyId') || '');
  const [company, setCompany] = useState(searchParams.get('company') || 'All Companies');
  const [sort, setSort] = useState('name-asc');
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const hasMountedFiltersRef = useRef(false);

  const selectedMainCategory = useMemo(
    () => mainCategories.find((item) => item.slug === mainCategorySlug) || null,
    [mainCategories, mainCategorySlug]
  );
  const selectedSubcategory = useMemo(
    () => subcategories.find((item) => item.slug === subCategorySlug && item.main_category_id === selectedMainCategory?.id) || null,
    [selectedMainCategory?.id, subCategorySlug, subcategories]
  );
  const visibleSubcategories = useMemo(
    () => subcategories.filter((item) => item.main_category_id === selectedMainCategory?.id && item.is_active),
    [selectedMainCategory?.id, subcategories]
  );

  const showingCatalogLanding =
    !selectedMainCategory &&
    category === 'All Products' &&
    !search.trim() &&
    !companyId &&
    company === 'All Companies';

  const showProductResults =
    !selectedMainCategory ||
    !!selectedSubcategory ||
    !!search.trim() ||
    !!companyId ||
    company !== 'All Companies';

  useEffect(() => {
    const fetchLookupData = async () => {
      const [categoryRes, companyRes, productCompanyRes, mainCategoryRes, subcategoryRes] = await Promise.all([
        supabase.from('categories').select('name').order('display_order'),
        supabase.from('companies').select('id, name').eq('is_active', true).order('name'),
        supabase.from('products').select('company_id, company_name').not('company_name', 'is', null),
        supabase.from('catalog_main_categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('catalog_subcategories').select('*').eq('is_active', true).order('display_order'),
      ]);

      const companyMap = new Map<string, CompanyOption>();

      for (const item of companyRes.data || []) {
        const name = item.name?.trim();
        if (!name) continue;
        companyMap.set(item.id, { id: item.id, name });
      }

      for (const item of productCompanyRes.data || []) {
        const name = item.company_name?.trim();
        if (!name) continue;

        if (item.company_id && companyMap.has(item.company_id)) continue;
        if (item.company_id) {
          companyMap.set(item.company_id, { id: item.company_id, name });
          continue;
        }

        const syntheticId = `${COMPANY_NAME_PREFIX}${name}`;
        if (!companyMap.has(syntheticId)) {
          companyMap.set(syntheticId, { id: syntheticId, name });
        }
      }

      const companyOptions = Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name));

      setCategories(['All Products', ...((categoryRes.data || []).map((item) => item.name))]);
      setCompanies(companyOptions);
      setMainCategories((mainCategoryRes.data || []) as CatalogMainCategory[]);
      setSubcategories((subcategoryRes.data || []) as CatalogSubcategory[]);
      setCatalogLoading(false);
    };

    fetchLookupData();
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const matchedCompany = companies.find((item) => item.id === companyId);
    if (matchedCompany) setCompany(matchedCompany.name);
  }, [companyId, companies]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const matchedCompany = companies.find((item) => item.id === companyId);
      const selectedCompanyName = companyId.startsWith(COMPANY_NAME_PREFIX)
        ? companyId.slice(COMPANY_NAME_PREFIX.length)
        : matchedCompany?.name;
      const rangeFrom = (page - 1) * PAGE_SIZE;
      const rangeTo = rangeFrom + PAGE_SIZE - 1;
      let query = supabase.from('products').select('*', { count: 'exact' });

      if (selectedSubcategory) query = query.eq('subcategory_id', selectedSubcategory.id);
      else if (selectedMainCategory) query = query.eq('main_category_id', selectedMainCategory.id);
      else if (category !== 'All Products') query = query.eq('category', category);

      if (companyId) {
        if (companyId.startsWith(COMPANY_NAME_PREFIX)) {
          query = query.eq('company_name', selectedCompanyName || '');
        } else if (selectedCompanyName) {
          query = query.or(`company_id.eq.${companyId},company_name.eq.${selectedCompanyName}`);
        } else {
          query = query.eq('company_id', companyId);
        }
      } else if (company !== 'All Companies') {
        query = query.eq('company_name', company);
      }

      if (search.trim()) {
        const term = search.trim();
        query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%,company_name.ilike.%${term}%`);
      }

      if (sort === 'name-asc') query = query.order('name', { ascending: true });
      else if (sort === 'name-desc') query = query.order('name', { ascending: false });
      else if (sort === 'newest') query = query.order('created_at', { ascending: false });

      const { data, count, error } = await query.range(rangeFrom, rangeTo);
      if (error) {
        toast.error('Failed to load products');
        setProducts([]);
        setTotalProducts(0);
        setLoading(false);
        return;
      }

      setProducts((data || []) as Product[]);
      setTotalProducts(count || 0);
      setLoading(false);
    };

    fetchProducts();
  }, [category, companies, company, companyId, page, search, selectedMainCategory, selectedSubcategory, sort]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (search) next.set('search', search); else next.delete('search');
    if (selectedMainCategory) next.set('mainCategory', selectedMainCategory.slug); else next.delete('mainCategory');
    if (selectedSubcategory) next.set('subCategory', selectedSubcategory.slug); else next.delete('subCategory');
    if (!selectedMainCategory && category !== 'All Products') next.set('category', category); else next.delete('category');
    if (companyId) next.set('companyId', companyId); else next.delete('companyId');
    if (company !== 'All Companies') next.set('company', company); else next.delete('company');
    if (page > 1) next.set('page', String(page)); else next.delete('page');
    setSearchParams(next, { replace: true });
  }, [category, company, companyId, page, search, searchParams, selectedMainCategory, selectedSubcategory, setSearchParams]);

  useEffect(() => {
    if (!hasMountedFiltersRef.current) {
      hasMountedFiltersRef.current = true;
      return;
    }
    setPage(1);
  }, [category, company, companyId, mainCategorySlug, search, sort, subCategorySlug]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [page, totalProducts]);

  useEffect(() => {
    if (!user) return;
    supabase.from('wishlist_items').select('product_id').eq('user_id', user.id).then(({ data }) => {
      setWishlist(new Set((data || []).map((item) => item.product_id)));
    });
  }, [user]);

  const toggleWishlist = async (productId: string) => {
    if (!user) return;
    if (wishlist.has(productId)) {
      await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', productId);
      setWishlist((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      toast.success('Removed from wishlist');
      return;
    }

    await supabase.from('wishlist_items').insert({ user_id: user.id, product_id: productId });
    setWishlist((prev) => new Set(prev).add(productId));
    toast.success('Added to wishlist');
  };

  const openDetail = async (product: Product) => {
    setSelected(product);
    let relatedQuery = supabase.from('products').select('*').neq('id', product.id).limit(3);

    if (product.subcategory_id) relatedQuery = relatedQuery.eq('subcategory_id', product.subcategory_id);
    else if (product.main_category_id) relatedQuery = relatedQuery.eq('main_category_id', product.main_category_id);
    else relatedQuery = relatedQuery.eq('category', product.category);

    const { data } = await relatedQuery;
    setRelated((data || []) as Product[]);
  };

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, value: number) => setQuantities((prev) => ({ ...prev, [id]: Math.max(1, value) }));
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const startItem = totalProducts === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalProducts);

  const getVisiblePages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (page <= 3) return [1, 2, 3, 4, totalPages];
    if (page >= totalPages - 2) return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, page - 1, page, page + 1, totalPages];
  };

  const visiblePages = getVisiblePages();
  const headerTitle = selectedSubcategory?.name || selectedMainCategory?.name || 'Products';
  const headerDescription = selectedSubcategory
    ? `Showing products from ${selectedMainCategory?.name}`
    : selectedMainCategory
      ? 'Choose a subcategory or browse everything in this section'
      : 'Browse the product catalog by category or subcategory';

  const handleMainCategorySelect = (slug: string) => {
    setMainCategorySlug(slug);
    setSubCategorySlug('');
    setCategory('All Products');
  };

  const handleSubcategorySelect = (slug: string) => {
    setSubCategorySlug(slug);
    setCategory('All Products');
  };

  const handleBackToMainCategories = () => {
    setMainCategorySlug('');
    setSubCategorySlug('');
    setCategory('All Products');
  };

  const handleBackToSubcategories = () => setSubCategorySlug('');

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold">{headerTitle}</h1>
        <p className="text-sm text-muted-foreground">{headerDescription}</p>
      </div>

      {selectedMainCategory && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button variant="outline" size="sm" onClick={handleBackToMainCategories}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Categories
          </Button>
          <Badge variant="outline" className="px-3 py-1">{selectedMainCategory.name}</Badge>
          {selectedSubcategory && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button variant="ghost" size="sm" onClick={handleBackToSubcategories}>Subcategories</Button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Badge className="px-3 py-1">{selectedSubcategory.name}</Badge>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          value={companyId || company}
          onValueChange={(value) => {
            if (value === 'All Companies') {
              setCompanyId('');
              setCompany('All Companies');
              return;
            }
            const matchedCompany = companies.find((item) => item.id === value);
            setCompanyId(matchedCompany?.id || '');
            setCompany(matchedCompany?.name || 'All Companies');
          }}
        >
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All Companies">All Companies</SelectItem>
            {companies.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {catalogLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-44 w-full" />)}
        </div>
      ) : showingCatalogLanding ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Main Categories</h2>
            <p className="text-xs text-muted-foreground">Choose a section to browse subcategories</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {mainCategories.map((catalogCategory) => (
              <Card
                key={catalogCategory.id}
                className="cursor-pointer overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
                onClick={() => handleMainCategorySelect(catalogCategory.slug)}
              >
                <CardContent className="p-0">
                  <ProductImage
                    src={catalogCategory.image_url}
                    alt={catalogCategory.name}
                    category={catalogCategory.name}
                    className="h-40 w-full rounded-none bg-white"
                    imageClassName="object-contain p-5"
                    iconClassName="h-12 w-12"
                  />
                  <div className="border-t p-4 text-center">
                    <p className="font-display text-base font-bold leading-tight">{catalogCategory.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {subcategories.filter((item) => item.main_category_id === catalogCategory.id && item.is_active).length} subcategories
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : selectedMainCategory && !selectedSubcategory && !search.trim() && !companyId && company === 'All Companies' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Subcategories</h2>
            <p className="text-xs text-muted-foreground">Open a subcategory to see the product catalog</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {visibleSubcategories.map((subcategory) => (
              <Card
                key={subcategory.id}
                className="cursor-pointer overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
                onClick={() => handleSubcategorySelect(subcategory.slug)}
              >
                <CardContent className="p-0">
                  <ProductImage
                    src={subcategory.image_url}
                    alt={subcategory.name}
                    category={selectedMainCategory.name}
                    className="h-36 w-full rounded-none bg-white"
                    imageClassName="object-contain p-5"
                    iconClassName="h-12 w-12"
                  />
                  <div className="border-t p-4 text-center">
                    <p className="font-display text-sm font-bold leading-tight">{subcategory.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            <Button
              variant={category === 'All Products' && !selectedMainCategory ? 'default' : 'outline'}
              size="sm"
              onClick={handleBackToMainCategories}
              className={`whitespace-nowrap text-xs font-medium ${category === 'All Products' && !selectedMainCategory ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
            >
              Catalog
            </Button>
            {categories.map((item) => (
              <Button
                key={item}
                variant={category === item && !selectedMainCategory ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setMainCategorySlug('');
                  setSubCategorySlug('');
                  setCategory(item);
                }}
                className={`whitespace-nowrap text-xs font-medium ${category === item && !selectedMainCategory ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
              >
                {item}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {showProductResults && !loading && totalProducts > 0 && (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Showing {startItem}-{endItem} of {totalProducts} products</p>
          <p>Page {page} of {totalPages}</p>
        </div>
      )}

      {!showProductResults ? null : loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="border">
              <CardContent className="p-4">
                <Skeleton className="mb-3 h-32 w-full" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="font-display text-lg font-bold">No products found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="group border transition-shadow duration-150 hover:shadow-md">
              <CardContent className="p-4">
                <div className="mb-3 cursor-pointer" onClick={() => openDetail(product)}>
                  <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    category={product.category}
                    className="h-32 w-full"
                    iconClassName="h-10 w-10 transition-colors duration-150 group-hover:text-accent"
                  />
                </div>
                <div className="mb-1 flex min-w-0 flex-wrap gap-1">
                  <Badge variant="secondary" className="max-w-full truncate text-[10px]">{product.category}</Badge>
                  <Badge variant="outline" className="max-w-full truncate text-[10px]">{product.company_name}</Badge>
                  {product.is_new && <Badge className="shrink-0 bg-accent text-[10px] text-accent-foreground">New</Badge>}
                  {product.is_popular && <Badge variant="outline" className="shrink-0 text-[10px]">Popular</Badge>}
                </div>
                <p className="cursor-pointer truncate text-sm font-medium" onClick={() => openDetail(product)}>{product.name}</p>
                <p className="mb-2 truncate text-xs text-muted-foreground">{product.description}</p>
                <p className="mb-3 text-xs text-muted-foreground">Sold {product.unit}</p>

                <div className="mb-2 flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(product.id, getQty(product.id) - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{getQty(product.id)}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(product.id, getQty(product.id) + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-accent text-xs text-accent-foreground hover:bg-accent/90" onClick={() => addToCart(product.id, getQty(product.id))}>
                    ADD TO CART
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => toggleWishlist(product.id)}>
                    <Heart className={`h-4 w-4 ${wishlist.has(product.id) ? 'fill-accent text-accent' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showProductResults && !loading && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {visiblePages.map((pageNumber, index) => {
              const previous = visiblePages[index - 1];
              const shouldShowEllipsis = previous && pageNumber - previous > 1;

              return (
                <Fragment key={pageNumber}>
                  {shouldShowEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive={page === pageNumber}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                </Fragment>
              );
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <ProductImage src={selected.image_url} alt={selected.name} category={selected.category} className="h-48 w-full" iconClassName="h-16 w-16" />
                <p className="text-sm">{selected.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Category:</span><br />{selected.category}</div>
                  <div><span className="text-muted-foreground">Company:</span><br />{selected.company_name}</div>
                  <div><span className="text-muted-foreground">Unit:</span><br />{selected.unit}</div>
                  <div><span className="text-muted-foreground">SKU:</span><br />{selected.sku}</div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(selected.id, getQty(selected.id) - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-medium">{getQty(selected.id)}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(selected.id, getQty(selected.id) + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { addToCart(selected.id, getQty(selected.id)); setSelected(null); }}>
                    ADD TO CART
                  </Button>
                  <Button variant="outline" onClick={() => toggleWishlist(selected.id)}>
                    <Heart className={`mr-2 h-4 w-4 ${wishlist.has(selected.id) ? 'fill-accent text-accent' : ''}`} />
                    Wishlist
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {related.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-display text-sm font-bold">Related Products</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {related.map((relatedProduct) => (
                        <Card key={relatedProduct.id} className="cursor-pointer border hover:shadow-sm" onClick={() => openDetail(relatedProduct)}>
                          <CardContent className="p-3 text-center">
                            <ProductImage src={relatedProduct.image_url} alt={relatedProduct.name} category={relatedProduct.category} className="mb-2 h-16 w-full" iconClassName="h-6 w-6" />
                            <p className="truncate text-xs">{relatedProduct.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
