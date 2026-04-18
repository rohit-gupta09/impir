export type CatalogMainCategory = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

export type CatalogSubcategory = {
  id: string;
  main_category_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  legacy_category_name: string | null;
  display_order: number;
  is_active: boolean;
};

export const slugifyCatalogValue = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
