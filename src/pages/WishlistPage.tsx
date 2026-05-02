import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ProductImage from '@/components/ProductImage';

type WishlistItem = {
  id: string;
  product_id: string;
  product: { id: string; name: string; description: string; category: string; unit: string; sku: string; image_url: string };
};

export default function WishlistPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wishlist_items')
      .select('id, product_id, products(id, name, description, category, unit, sku, image_url)')
      .eq('user_id', user.id);
    setItems((data || []).map((i: any) => ({ ...i, product: i.products })));
    setLoading(false);
  };

  useEffect(() => { fetchWishlist(); }, [user]);

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', productId);
    toast.success('Removed from wishlist');
    fetchWishlist();
  };

  if (!loading && items.length === 0) {
    return (
      <div className="text-center py-20 animate-slide-in">
        <Heart className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Your Wishlist is Empty</h2>
        <p className="text-muted-foreground mb-6">Save your favorite products here</p>
        <Button onClick={() => navigate('/products')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide">
          BROWSE PRODUCTS
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      <h1 className="font-display text-2xl font-bold">Wishlist</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map(item => (
          <Card key={item.id} className="border">
            <CardContent className="p-4">
              <ProductImage src={item.product.image_url} alt={item.product.name} category={item.product.category} className="w-full h-28 mb-3" iconClassName="w-8 h-8" />
              <Badge variant="secondary" className="text-[10px] mb-1">{item.product.category}</Badge>
              <p className="font-medium text-sm truncate">{item.product.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{item.product.unit}</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-display" onClick={() => addToCart(item.product_id)}>
                  <ShoppingCart className="w-3 h-3 mr-1" /> ADD TO QUOTE
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromWishlist(item.product_id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
