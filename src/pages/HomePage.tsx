import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, FileText, Clock, CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ProductImage from '@/components/ProductImage';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { CatalogMainCategory } from '@/lib/catalog';

export default function HomePage() {
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalQuotes: 0, pending: 0, responded: 0 });
  const [featured, setFeatured] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [mainCategories, setMainCategories] = useState<CatalogMainCategory[]>([]);
  const [promoBanners, setPromoBanners] = useState<any[]>([]);
  const [bannerApi, setBannerApi] = useState<CarouselApi>();
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const handlePromoBannerClick = (banner: any) => {
    if (banner.link_type === 'company' && banner.link_value) navigate(`/products?company=${encodeURIComponent(banner.link_value)}`);
    else if (banner.link_type === 'category' && banner.link_value) navigate(`/products?category=${encodeURIComponent(banner.link_value)}`);
    else if (banner.link_type === 'quick_quote') navigate('/quick-quote');
    else if (banner.link_type === 'quotes') navigate('/quotes');
    else if (banner.link_type === 'external' && banner.link_value) window.open(banner.link_value, '_blank', 'noopener,noreferrer');
    else navigate('/products');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const quoteRequest = user
        ? supabase.from('quotes').select('status').eq('user_id', user.id)
        : Promise.resolve({ data: [], error: null });

      const [quotesRes, productsRes, companiesRes, promoRes, mainCategoriesRes] = await Promise.all([
        quoteRequest,
        supabase.from('products').select('*').or('is_new.eq.true,is_popular.eq.true').limit(4),
        supabase.from('companies').select('*').eq('is_active', true).order('name').limit(6),
        supabase.from('promo_banners').select('*').eq('is_active', true).eq('position', 'home').order('display_order').limit(6),
        supabase.from('catalog_main_categories').select('*').eq('is_active', true).order('display_order').limit(6),
      ]);
      const quotes = quotesRes.data || [];
      setStats({
        totalQuotes: quotes.length,
        pending: quotes.filter(q => q.status === 'Pending').length,
        responded: quotes.filter(q => q.status === 'Responded').length,
      });
      setFeatured(productsRes.data || []);
      setCompanies(companiesRes.data || []);
      setPromoBanners(promoRes.data || []);
      setMainCategories((mainCategoriesRes.data || []) as CatalogMainCategory[]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!bannerApi || promoBanners.length <= 1) return;

    const updateCurrent = () => {
      setActiveBanner(bannerApi.selectedScrollSnap());
    };

    updateCurrent();
    bannerApi.on('select', updateCurrent);

    const intervalId = window.setInterval(() => {
      if (bannerApi.canScrollNext()) bannerApi.scrollNext();
      else bannerApi.scrollTo(0);
    }, 4500);

    return () => {
      bannerApi.off('select', updateCurrent);
      window.clearInterval(intervalId);
    };
  }, [bannerApi, promoBanners.length]);

  const statCards = [
    { label: 'Items in Cart', value: itemCount, icon: ShoppingCart, color: 'text-accent' },
    { label: 'Total Quotes', value: stats.totalQuotes, icon: FileText, color: 'text-status-review' },
    { label: 'Pending Quotes', value: stats.pending, icon: Clock, color: 'text-status-pending' },
    { label: 'Quotes Responded', value: stats.responded, icon: CheckCircle, color: 'text-status-responded' },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Rotating Offer Banner */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[220px] w-full rounded-2xl md:h-[320px] lg:h-[380px] xl:h-[420px]" />
          <div className="flex justify-center gap-2">
            <Skeleton className="h-2.5 w-8 rounded-full" />
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
          </div>
        </div>
      ) : promoBanners.length > 0 && (
        <div className="space-y-3">
          <Carousel setApi={setBannerApi} opts={{ loop: true }} className="w-full">
            <CarouselContent className="ml-0">
              {promoBanners.map((banner) => (
                <CarouselItem key={banner.id} className="pl-0">
                  <Card
                    className="border-0 cursor-pointer overflow-hidden bg-transparent shadow-none"
                    onClick={() => handlePromoBannerClick(banner)}
                  >
                    <CardContent className="p-0">
                      <div className="relative h-[220px] overflow-hidden rounded-2xl md:h-[320px] lg:h-[380px] xl:h-[420px]">
                        <img src={banner.image_url} alt={banner.title || 'Offer banner'} className="absolute inset-0 h-full w-full object-cover object-center" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
                        <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white md:p-8 lg:p-10">
                          <div className="flex items-start justify-end gap-4">
                            {promoBanners.length > 1 && (
                              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                                {activeBanner + 1}/{promoBanners.length}
                              </div>
                            )}
                          </div>
                          <div className="max-w-2xl">
                            {banner.title?.trim() && (
                              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl xl:text-6xl">{banner.title}</h2>
                            )}
                            {banner.subtitle && <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base lg:text-lg">{banner.subtitle}</p>}
                            <div className="mt-5 lg:mt-6">
                              <Button className="bg-accent font-display tracking-wide text-accent-foreground hover:bg-accent/90">
                                {banner.cta_label || 'SHOP NOW'} <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            {promoBanners.length > 1 && (
              <>
                <CarouselPrevious className="left-4 top-auto bottom-4 translate-y-0 border-white/20 bg-black/35 text-white hover:bg-black/55 disabled:opacity-40" />
                <CarouselNext className="right-4 top-auto bottom-4 translate-y-0 border-white/20 bg-black/35 text-white hover:bg-black/55 disabled:opacity-40" />
              </>
            )}
          </Carousel>

          {promoBanners.length > 1 && (
            <div className="flex justify-center gap-2">
              {promoBanners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`Go to banner ${index + 1}`}
                  onClick={() => bannerApi?.scrollTo(index)}
                  className={`h-2.5 rounded-full transition-all ${activeBanner === index ? 'w-8 bg-accent' : 'w-2.5 bg-muted-foreground/30'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color} shrink-0`} />
              <div>
                <p className="text-2xl font-display font-bold">{loading ? <Skeleton className="h-7 w-8" /> : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button onClick={() => navigate('/products')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide">
          <Package className="w-4 h-4 mr-2" /> BROWSE PRODUCTS
        </Button>
        <Button variant="outline" onClick={() => navigate('/quotes')} className="font-display tracking-wide">
          <FileText className="w-4 h-4 mr-2" /> VIEW MY QUOTES
        </Button>
        <Button variant="outline" onClick={() => navigate('/quick-quote')} className="font-display tracking-wide">
          <FileText className="w-4 h-4 mr-2" /> QUICK QUOTE
        </Button>
      </div>

      {/* Featured Products */}
      {featured.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold mb-3">Featured Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featured.map((p) => (
              <Card key={p.id} className="border cursor-pointer hover:shadow-md transition-shadow duration-150" onClick={() => navigate('/products')}>
                <CardContent className="p-4">
                  <ProductImage src={p.image_url} alt={p.name} category={p.category} className="w-full h-24 mb-3" iconClassName="w-8 h-8" />
                  <div className="flex flex-wrap gap-1 mb-1 min-w-0">
                    {p.company_name && <Badge variant="outline" className="text-[10px] max-w-full truncate">{p.company_name}</Badge>}
                    {p.is_new && <Badge className="bg-accent text-accent-foreground text-[10px] shrink-0">New</Badge>}
                    {p.is_popular && <Badge variant="secondary" className="text-[10px] shrink-0">Popular</Badge>}
                  </div>
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.unit}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Company Banners */}
      {(loading || companies.length > 0) && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-display text-xl font-bold">Shop By Company</h2>
            {!loading && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="mx-auto flex max-w-[180px] flex-col items-center">
                    <Skeleton className="aspect-square w-full rounded-full" />
                    <Skeleton className="mt-3 h-4 w-24" />
                    <Skeleton className="mt-2 h-3 w-20" />
                  </div>
                ))
              : companies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    className="group text-left"
                    onClick={() => navigate(`/products?companyId=${encodeURIComponent(company.id)}`)}
                  >
                    <div className="mx-auto flex max-w-[180px] flex-col items-center">
                      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full border bg-gradient-to-br from-white via-white to-muted/40 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-accent/40 group-hover:shadow-lg">
                        {company.banner_image_url || company.logo_url ? (
                          <img
                            src={company.banner_image_url || company.logo_url}
                            alt={company.name}
                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed bg-muted text-sm font-medium text-muted-foreground">
                            {company.name}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-center">
                        <p className="font-display text-sm font-semibold leading-tight sm:text-base">{company.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Browse products</p>
                      </div>
                    </div>
                  </button>
                ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Browse Catalog</h2>
            <p className="text-sm text-muted-foreground">Start with a main category, then drill into subcategories with images.</p>
          </div>
          {!loading && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden border">
                  <CardContent className="p-0">
                    <Skeleton className="h-28 w-full rounded-none" />
                    <div className="border-t p-3">
                      <Skeleton className="mx-auto h-4 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : mainCategories.map((catalogCategory) => (
                <Card
                  key={catalogCategory.id}
                  className="cursor-pointer overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
                  onClick={() => navigate(`/products?mainCategory=${encodeURIComponent(catalogCategory.slug)}`)}
                >
                  <CardContent className="p-0">
                    <ProductImage
                      src={catalogCategory.image_url}
                      alt={catalogCategory.name}
                      category={catalogCategory.name}
                      className="h-28 w-full rounded-none bg-white"
                      imageClassName="object-contain p-4"
                      iconClassName="h-10 w-10"
                    />
                    <div className="border-t p-3 text-center">
                      <p className="text-xs font-medium leading-tight">{catalogCategory.name}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* Promo Banner */}
      <Card className="bg-primary border-0">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-primary-foreground">Need a Bulk Order?</h3>
            <p className="text-primary-foreground/70 text-sm">Request a custom quote today and get competitive pricing.</p>
          </div>
          <Button onClick={() => navigate('/products')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide whitespace-nowrap">
            REQUEST QUOTE <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-accent/30">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold">Become a SupplyWala Partner in Your City</h3>
            <p className="text-sm text-muted-foreground mt-1">Run a shop or godown? Apply to become the next city hub partner.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/partner')} className="font-display">
            APPLY NOW
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
