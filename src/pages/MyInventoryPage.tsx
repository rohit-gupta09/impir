import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, Check, Package, Plus, Search, Send, Trash2, TriangleAlert, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  sku: string;
  company_name: string;
  category: string;
  unit: string;
};

type InventoryItem = {
  id: string;
  product_id: string | null;
  item_name: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  notes: string;
  procurement_requested: boolean;
  procurement_status: string;
  procurement_requested_at: string | null;
  admin_procurement_notes: string;
  created_at: string;
  products?: {
    name: string;
    sku: string;
    company_name: string;
    category: string;
  } | null;
};

type InventoryRow = Omit<InventoryItem, 'products'>;

type RowDraft = {
  itemName: string;
  quantity: string;
  unit: string;
  reorderLevel: string;
  notes: string;
};

const NEW_ROW_ID = 'new-row';

const createEmptyDraft = (): RowDraft => ({
  itemName: '',
  quantity: '',
  unit: '',
  reorderLevel: '',
  notes: '',
});

const createDraftFromItem = (item: InventoryItem): RowDraft => ({
  itemName: item.item_name,
  quantity: String(item.quantity),
  unit: item.unit,
  reorderLevel: String(item.reorder_level),
  notes: item.notes || '',
});

const normalizeValue = (value: string) => value.trim().toLowerCase();

export default function MyInventoryPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RowDraft>(createEmptyDraft);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);

    const [productsRes, itemsRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, sku, company_name, category, unit')
        .order('name'),
      supabase
        .from('user_inventory_items' as never)
        .select('id, product_id, item_name, quantity, unit, reorder_level, notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (productsRes.error) {
      toast.error('Failed to load catalog products');
      setProducts([]);
    }

    if (itemsRes.error) {
      toast.error('Failed to load inventory items');
      setItems([]);
      setLoading(false);
      return;
    }

    const loadedProducts = (productsRes.data || []) as Product[];
    const productMap = new Map(loadedProducts.map((product) => [product.id, product]));
    const loadedItems = ((itemsRes.data || []) as InventoryRow[]).map((item) => {
      const linkedProduct = item.product_id ? productMap.get(item.product_id) : null;

      return {
        ...item,
        procurement_requested: false,
        procurement_status: 'not_requested',
        procurement_requested_at: null,
        admin_procurement_notes: '',
        products: linkedProduct
          ? {
              name: linkedProduct.name,
              sku: linkedProduct.sku,
              company_name: linkedProduct.company_name,
              category: linkedProduct.category,
            }
          : null,
      } satisfies InventoryItem;
    });

    setProducts(loadedProducts);
    setItems(loadedItems);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const query = normalizeValue(search);

    if (!query) {
      return items;
    }

    return items.filter((item) =>
      [
        item.item_name,
        item.unit,
        item.notes,
        item.products?.sku || '',
        item.products?.company_name || '',
        item.products?.category || '',
      ].some((value) => normalizeValue(value).includes(query)),
    );
  }, [items, search]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeRowId) || null,
    [activeRowId, items],
  );

  const lowStockItems = items.filter((item) => Number(item.quantity) <= Number(item.reorder_level));
  const totalUnits = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const resetRowEditor = () => {
    setActiveRowId(null);
    setDraft(createEmptyDraft());
  };

  const startAddRow = () => {
    setActiveRowId(NEW_ROW_ID);
    setDraft(createEmptyDraft());
  };

  const startEditRow = (item: InventoryItem) => {
    setActiveRowId(item.id);
    setDraft(createDraftFromItem(item));
  };

  const updateDraft = (field: keyof RowDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resolveProductMatch = (itemName: string) => {
    const normalizedName = normalizeValue(itemName);

    if (!normalizedName) {
      return null;
    }

    return products.find((product) => normalizeValue(product.name) === normalizedName) || null;
  };

  const handleSaveRow = async (rowId: string) => {
    if (!user) {
      return;
    }

    const itemName = draft.itemName.trim();
    const quantity = Number(draft.quantity);
    const reorderLevel = Number(draft.reorderLevel || 0);

    if (!itemName) {
      toast.error('Enter an item name');
      return;
    }

    if (Number.isNaN(quantity) || quantity < 0) {
      toast.error('Enter a valid quantity');
      return;
    }

    if (Number.isNaN(reorderLevel) || reorderLevel < 0) {
      toast.error('Enter a valid reorder level');
      return;
    }

    const matchedProduct = resolveProductMatch(itemName);
    const normalizedDraftName = normalizeValue(itemName);
    const unit = draft.unit.trim() || matchedProduct?.unit || activeItem?.unit || 'units';
    const payload = {
      user_id: user.id,
      product_id:
        matchedProduct?.id ||
        (activeItem && normalizedDraftName === normalizeValue(activeItem.item_name) ? activeItem.product_id : null),
      item_name: itemName,
      quantity,
      unit,
      reorder_level: reorderLevel,
      notes: draft.notes.trim(),
    };

    setSavingRowId(rowId);

    if (rowId === NEW_ROW_ID) {
      const duplicate = items.find((item) => {
        if (payload.product_id && item.product_id === payload.product_id) {
          return true;
        }

        return normalizeValue(item.item_name) === normalizedDraftName;
      });

      if (duplicate) {
        const { error } = await supabase
          .from('user_inventory_items' as never)
          .update(payload)
          .eq('id', duplicate.id)
          .eq('user_id', user.id);

        if (error) {
          toast.error('Failed to update existing inventory item');
          setSavingRowId(null);
          return;
        }

        toast.success('Existing inventory item updated');
      } else {
        const { error } = await supabase
          .from('user_inventory_items' as never)
          .insert(payload);

        if (error) {
          toast.error('Failed to add inventory item');
          setSavingRowId(null);
          return;
        }

        toast.success('Inventory item added');
      }
    } else {
      const { error } = await supabase
        .from('user_inventory_items' as never)
        .update(payload)
        .eq('id', rowId)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to update inventory item');
        setSavingRowId(null);
        return;
      }

      toast.success('Inventory item updated');
    }

    setSavingRowId(null);
    resetRowEditor();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      return;
    }

    setDeletingRowId(id);

    const { error } = await supabase
      .from('user_inventory_items' as never)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    setDeletingRowId(null);

    if (error) {
      toast.error('Failed to delete inventory item');
      return;
    }

    toast.success('Inventory item removed');

    if (activeRowId === id) {
      resetRowEditor();
    }

    loadData();
  };

  const renderEditorRow = (rowId: string) => (
    <TableRow key={rowId} className="bg-muted/20">
      <TableCell className="min-w-[220px]">
        <Input
          value={draft.itemName}
          onChange={(event) => updateDraft('itemName', event.target.value)}
          placeholder="Item name"
          className="h-9"
        />
      </TableCell>
      <TableCell className="w-[140px]">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={draft.quantity}
          onChange={(event) => updateDraft('quantity', event.target.value)}
          placeholder="0"
          className="h-9"
        />
      </TableCell>
      <TableCell className="w-[140px]">
        <Input
          value={draft.unit}
          onChange={(event) => updateDraft('unit', event.target.value)}
          placeholder="units"
          className="h-9"
        />
      </TableCell>
      <TableCell className="w-[160px]">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={draft.reorderLevel}
          onChange={(event) => updateDraft('reorderLevel', event.target.value)}
          placeholder="0"
          className="h-9"
        />
      </TableCell>
      <TableCell className="min-w-[220px]">
        <Textarea
          value={draft.notes}
          onChange={(event) => updateDraft('notes', event.target.value)}
          placeholder="Optional note"
          className="min-h-[36px] resize-none"
          rows={1}
        />
      </TableCell>
      <TableCell className="w-[180px]">
        <span className="text-sm text-muted-foreground">
          {rowId === NEW_ROW_ID ? 'New item' : 'Editing'}
        </span>
      </TableCell>
      <TableCell className="w-[140px]">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            onClick={() => handleSaveRow(rowId)}
            disabled={savingRowId === rowId}
            className="h-8 w-8"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={resetRowEditor}
            disabled={savingRowId === rowId}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const renderMobileForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inventory-item-name">Item Name</Label>
        <Input
          id="inventory-item-name"
          value={draft.itemName}
          onChange={(event) => updateDraft('itemName', event.target.value)}
          placeholder="Item name"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="inventory-item-quantity">Quantity</Label>
          <Input
            id="inventory-item-quantity"
            type="number"
            min="0"
            step="0.01"
            value={draft.quantity}
            onChange={(event) => updateDraft('quantity', event.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inventory-item-unit">Unit</Label>
          <Input
            id="inventory-item-unit"
            value={draft.unit}
            onChange={(event) => updateDraft('unit', event.target.value)}
            placeholder="units"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inventory-item-reorder-level">Reorder Level</Label>
        <Input
          id="inventory-item-reorder-level"
          type="number"
          min="0"
          step="0.01"
          value={draft.reorderLevel}
          onChange={(event) => updateDraft('reorderLevel', event.target.value)}
          placeholder="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inventory-item-notes">Notes</Label>
        <Textarea
          id="inventory-item-notes"
          value={draft.notes}
          onChange={(event) => updateDraft('notes', event.target.value)}
          placeholder="Optional note"
          className="min-h-[96px]"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold">My Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Keep inventory in a simple table. Click any row to edit inline, or use the plus button to add a new item.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tracked Items</p>
            <p className="mt-1 font-display text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current Units</p>
            <p className="mt-1 font-display text-2xl font-bold">{totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Low Stock Alerts</p>
            <p className="mt-1 font-display text-2xl font-bold">{lowStockItems.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-display">
                <Boxes className="h-5 w-5 text-accent" />
                Inventory Table
              </CardTitle>
              <CardDescription>
                A cleaner spreadsheet-style inventory list. Exact product name matches still auto-link to your catalog.
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search inventory"
                  className="pl-9"
                />
              </div>
              <Button
                size="icon"
                onClick={startAddRow}
                disabled={activeRowId === NEW_ROW_ID}
                className="h-10 w-10 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
                aria-label="Add inventory item"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              <span>{lowStockItems.length} item{lowStockItems.length === 1 ? '' : 's'} need attention because quantity is at or below reorder level.</span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 && activeRowId !== NEW_ROW_ID ? (
            <div className="rounded-md border border-dashed p-10 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No inventory items yet</p>
              <p className="text-sm text-muted-foreground">Use the plus button to add your first item.</p>
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No items match your search.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = Number(item.quantity) <= Number(item.reorder_level);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => startEditRow(item)}
                      className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{item.item_name}</span>
                            {item.product_id && <Badge variant="secondary">Catalog</Badge>}
                            {isLowStock && <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Low Stock</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} in stock
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Reorder at {item.reorder_level}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground">{item.notes}</p>
                          )}
                          {item.procurement_requested && (
                            <Badge className="bg-blue-100 text-blue-900 hover:bg-blue-100">
                              <Send className="mr-1 h-3 w-3" />
                              {item.procurement_status}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(item.id);
                          }}
                          disabled={deletingRowId === item.id}
                          aria-label={`Delete ${item.item_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRowId === NEW_ROW_ID && renderEditorRow(NEW_ROW_ID)}

                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No items match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const isEditing = activeRowId === item.id;
                    const isLowStock = Number(item.quantity) <= Number(item.reorder_level);

                    if (isEditing) {
                      return renderEditorRow(item.id);
                    }

                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => startEditRow(item)}
                      >
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{item.item_name}</span>
                              {item.product_id && <Badge variant="secondary">Catalog</Badge>}
                              {isLowStock && <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Low Stock</Badge>}
                            </div>
                            {item.products && (
                              <p className="text-xs text-muted-foreground">
                                {item.products.company_name} • {item.products.category} • {item.products.sku}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.reorder_level}</TableCell>
                        <TableCell className="max-w-[260px]">
                          <p className="truncate text-sm text-muted-foreground">
                            {item.notes || '—'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-2">
                            {item.procurement_requested ? (
                              <Badge className="bg-blue-100 text-blue-900 hover:bg-blue-100">
                                <Send className="mr-1 h-3 w-3" />
                                {item.procurement_status}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">In stock</span>
                            )}
                            {item.procurement_requested_at && (
                              <span className="text-xs text-muted-foreground">
                                Sent {new Date(item.procurement_requested_at).toLocaleDateString()}
                              </span>
                            )}
                            {item.admin_procurement_notes && (
                              <span className="text-xs text-muted-foreground">
                                Admin: {item.admin_procurement_notes}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditRow(item)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingRowId === item.id}
                              aria-label={`Delete ${item.item_name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isMobile && (
        <Sheet open={activeRowId !== null} onOpenChange={(open) => !open && resetRowEditor()}>
          <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{activeRowId === NEW_ROW_ID ? 'Add Item' : 'Edit Item'}</SheetTitle>
              <SheetDescription>
                Use the form to add or update inventory on mobile.
              </SheetDescription>
            </SheetHeader>

            <div className="py-4">
              {renderMobileForm()}
            </div>

            <SheetFooter className="gap-2">
              {activeRowId !== null && activeRowId !== NEW_ROW_ID && (
                <Button
                  variant="outline"
                  onClick={() => handleDelete(activeRowId)}
                  disabled={deletingRowId === activeRowId || savingRowId === activeRowId}
                >
                  Delete
                </Button>
              )}
              <Button variant="outline" onClick={resetRowEditor}>
                Cancel
              </Button>
              <Button
                onClick={() => activeRowId && handleSaveRow(activeRowId)}
                disabled={!activeRowId || savingRowId === activeRowId}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {savingRowId === activeRowId ? 'Saving...' : 'Save'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
