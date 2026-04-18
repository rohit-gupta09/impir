CREATE OR REPLACE FUNCTION public.sync_quote_items_from_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.quote_items WHERE quote_id = NEW.id;

  INSERT INTO public.quote_items (
    quote_id,
    line_number,
    product_id,
    name,
    sku,
    quantity,
    unit,
    notes,
    source,
    unit_price,
    tax_percent,
    line_total
  )
  SELECT
    NEW.id,
    item.ordinality::integer,
    CASE
      WHEN json_product.product_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        AND EXISTS (
          SELECT 1
          FROM public.products p
          WHERE p.id = json_product.product_id_text::uuid
        )
      THEN json_product.product_id_text::uuid
      ELSE NULL
    END,
    COALESCE(item.value->>'name', 'Item ' || item.ordinality::text),
    COALESCE(item.value->>'sku', ''),
    COALESCE(NULLIF(item.value->>'quantity', '')::numeric, 1),
    COALESCE(NULLIF(item.value->>'unit', ''), 'per piece'),
    COALESCE(item.value->>'notes', ''),
    COALESCE(NULLIF(item.value->>'source', ''), 'catalog_match'),
    COALESCE(NULLIF(item.value->>'unit_price', '')::numeric, 0),
    COALESCE(NULLIF(item.value->>'tax_percent', '')::numeric, 18),
    COALESCE(
      NULLIF(item.value->>'total_price', '')::numeric,
      COALESCE(NULLIF(item.value->>'unit_price', '')::numeric, 0) * COALESCE(NULLIF(item.value->>'quantity', '')::numeric, 1)
    )
  FROM jsonb_array_elements(COALESCE(NEW.products, '[]'::jsonb)) WITH ORDINALITY AS item(value, ordinality)
  CROSS JOIN LATERAL (
    SELECT COALESCE(NULLIF(item.value->>'product_id', ''), '') AS product_id_text
  ) AS json_product;

  RETURN NEW;
END;
$$;
