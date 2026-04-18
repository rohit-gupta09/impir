import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, Trash2, Package, ArrowRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import ProductImage from '@/components/ProductImage';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, loading, itemCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  if (!loading && items.length === 0) {
    return (
      <div className="text-center py-20 animate-slide-in">
        <ShoppingCart className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Your Cart is Empty</h2>
        <p className="text-muted-foreground mb-6">Add some products to get started</p>
        <Button onClick={() => navigate('/products')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide">
          <Package className="w-4 h-4 mr-2" /> BROWSE PRODUCTS
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">My Cart</h1>
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setShowClearConfirm(true)}>
          <Trash2 className="w-4 h-4 mr-1" /> Clear Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <Card key={item.id} className="border">
              <CardContent className="p-4 flex items-center gap-4">
                <ProductImage src={item.product.image_url} alt={item.product.name} category={item.product.category} className="w-16 h-16 shrink-0" iconClassName="w-6 h-6" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product.category} · {item.product.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeFromCart(item.product_id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border h-fit sticky top-20">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-display text-lg font-bold">Cart Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium">{itemCount}</span>
            </div>
            <p className="text-xs text-muted-foreground bg-muted p-3 rounded">
              Prices will be shared in your quote response
            </p>
            <Button
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide"
              onClick={() => setShowQuoteModal(true)}
            >
              REQUEST A QUOTE <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Clear cart confirmation */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Clear Cart</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to remove all items from your cart?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { clearCart(); setShowClearConfirm(false); }}>Clear Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RequestQuoteModal open={showQuoteModal} onOpenChange={setShowQuoteModal} />
    </div>
  );
}
