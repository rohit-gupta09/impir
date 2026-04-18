import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  saved_for_later: boolean;
  product: {
    id: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    sku: string;
    image_url: string;
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  loading: false,
  itemCount: 0,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  refresh: async () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity, saved_for_later, products(id, name, description, category, unit, sku, image_url)')
      .eq('user_id', user.id)
      .eq('saved_for_later', false);
    setItems((data || []).map((item: any) => ({ ...item, product: item.products })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) return;
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity });
    }
    toast.success('Added to cart');
    await fetchCart();
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user || quantity < 1) return;
    await supabase.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('product_id', productId);
    await fetchCart();
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId);
    toast.success('Removed from cart');
    await fetchCart();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    toast.success('Cart cleared');
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{
      items, loading, itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      addToCart, updateQuantity, removeFromCart, clearCart, refresh: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};
