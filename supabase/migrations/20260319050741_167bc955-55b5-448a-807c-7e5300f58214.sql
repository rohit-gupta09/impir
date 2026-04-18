
-- The contact_messages INSERT policy with true is intentional for public contact forms
-- But let's add a rate-limiting check by requiring non-empty fields (already enforced by NOT NULL)
-- No change needed - the warning is expected for public contact forms
-- Instead, let's just acknowledge it and move on

-- Add index for common queries
CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);
CREATE INDEX idx_wishlist_items_user ON public.wishlist_items(user_id);
CREATE INDEX idx_quotes_user ON public.quotes(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_saved_addresses_user ON public.saved_addresses(user_id);
