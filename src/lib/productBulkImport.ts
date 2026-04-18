import * as XLSX from 'xlsx';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'product name'],
  sku: ['sku', 'product sku'],
  company_name: ['company_name', 'company name', 'company', 'brand', 'brand name'],
  main_category: ['main_category', 'main category'],
  subcategory: ['subcategory', 'sub category', 'sub_category'],
  category: ['category', 'category name'],
  description: ['description', 'details'],
  unit: ['unit', 'uom'],
  image_url: ['image_url', 'image url', 'image', 'image link'],
  is_new: ['is_new', 'is new', 'new'],
  is_popular: ['is_popular', 'is popular', 'popular'],
};

export type ProductImportRow = Database['public']['Tables']['products']['Insert'] & {
  main_category_name?: string;
  subcategory_name?: string;
};

export type ProductImportPreviewRow = ProductImportRow & {
  rowNumber: number;
};

export type ProductImportParseResult = {
  rows: ProductImportPreviewRow[];
  errors: string[];
};

export type ProductImportResult = {
  createdCategories: number;
  importedProducts: number;
};

type RawSheetRow = Record<string, unknown>;

const DEFAULT_UNIT = 'per piece';
const DEFAULT_CATEGORY_ICON = 'Package';
const CATEGORY_ORDER_STEP = 10;

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

function findHeaderValue(row: RawSheetRow, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);

  for (const [key, value] of Object.entries(row)) {
    if (normalizedAliases.includes(normalizeHeader(key))) {
      return value;
    }
  }

  return undefined;
}

function normalizeString(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = normalizeString(value).toLowerCase();
  if (!normalized) {
    return false;
  }

  return ['true', 'yes', 'y', '1'].includes(normalized);
}

function mapRow(row: RawSheetRow, rowNumber: number) {
  const name = normalizeString(findHeaderValue(row, HEADER_ALIASES.name));
  const sku = normalizeString(findHeaderValue(row, HEADER_ALIASES.sku));
  const company_name = normalizeString(findHeaderValue(row, HEADER_ALIASES.company_name)) || 'General';
  const main_category_name = normalizeString(findHeaderValue(row, HEADER_ALIASES.main_category));
  const subcategory_name = normalizeString(findHeaderValue(row, HEADER_ALIASES.subcategory));
  const category = normalizeString(findHeaderValue(row, HEADER_ALIASES.category));
  const description = normalizeString(findHeaderValue(row, HEADER_ALIASES.description));
  const unit = normalizeString(findHeaderValue(row, HEADER_ALIASES.unit)) || DEFAULT_UNIT;
  const image_url = normalizeString(findHeaderValue(row, HEADER_ALIASES.image_url)) || null;
  const is_new = parseBoolean(findHeaderValue(row, HEADER_ALIASES.is_new));
  const is_popular = parseBoolean(findHeaderValue(row, HEADER_ALIASES.is_popular));

  return {
    rowNumber,
    name,
    sku,
    company_name,
    main_category_name,
    subcategory_name,
    category,
    description,
    unit,
    image_url,
    image_source: image_url ? 'manual_url' : 'none',
    is_new,
    is_popular,
  };
}

export async function parseProductsExcel(file: File): Promise<ProductImportParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return { rows: [], errors: ['The workbook does not contain any sheets.'] };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<RawSheetRow>(worksheet, {
    defval: '',
    raw: false,
  });

  if (rawRows.length === 0) {
    return { rows: [], errors: ['The first sheet is empty.'] };
  }

  const rows: ProductImportPreviewRow[] = [];
  const errors: string[] = [];
  const seenSkus = new Set<string>();

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const mapped = mapRow(rawRow, rowNumber);

    if (!mapped.name || !mapped.sku) {
      errors.push(`Row ${rowNumber}: name and SKU are required.`);
      return;
    }

    if (
      !mapped.category &&
      !mapped.main_category_name &&
      !mapped.subcategory_name
    ) {
      errors.push(`Row ${rowNumber}: provide category or main_category/subcategory.`);
      return;
    }

    const normalizedSku = mapped.sku.toLowerCase();
    if (seenSkus.has(normalizedSku)) {
      errors.push(`Row ${rowNumber}: duplicate SKU "${mapped.sku}" in the file.`);
      return;
    }

    seenSkus.add(normalizedSku);
    rows.push(mapped);
  });

  return { rows, errors };
}

export async function importProductsFromRows(
  supabase: SupabaseClient<Database>,
  rows: ProductImportPreviewRow[],
): Promise<ProductImportResult> {
  if (rows.length === 0) {
    return { createdCategories: 0, importedProducts: 0 };
  }

  const { data: existingCategories, error: categoriesError } = await supabase
    .from('categories')
    .select('name, display_order')
    .order('display_order');

  if (categoriesError) {
    throw categoriesError;
  }

  const [{ data: mainCategories, error: mainCategoriesError }, { data: subcategories, error: subcategoriesError }] = await Promise.all([
    supabase.from('catalog_main_categories').select('id, name').eq('is_active', true),
    supabase.from('catalog_subcategories').select('id, name, main_category_id, legacy_category_name').eq('is_active', true),
  ]);

  if (mainCategoriesError) {
    throw mainCategoriesError;
  }

  if (subcategoriesError) {
    throw subcategoriesError;
  }

  const existingCategoryNames = new Set(
    (existingCategories || []).map((category) => category.name.toLowerCase()),
  );

  const mainCategoryByName = new Map(
    (mainCategories || []).map((category) => [category.name.trim().toLowerCase(), category]),
  );

  const subcategoryByName = new Map(
    (subcategories || []).map((subcategory) => [subcategory.name.trim().toLowerCase(), subcategory]),
  );
  const resolvedRows = rows.map((row) => {
    const resolvedMainCategory = row.main_category_name
      ? mainCategoryByName.get(row.main_category_name.trim().toLowerCase()) || null
      : null;

    const resolvedSubcategory = row.subcategory_name
      ? subcategoryByName.get(row.subcategory_name.trim().toLowerCase()) || null
      : null;

    const inferredCategory =
      row.category ||
      resolvedSubcategory?.legacy_category_name ||
      '';

    return {
      ...row,
      resolvedMainCategory,
      resolvedSubcategory,
      inferredCategory,
    };
  });

  const unresolvedErrors = resolvedRows.flatMap((row) => {
    const rowErrors: string[] = [];

    if (row.main_category_name && !row.resolvedMainCategory) {
      rowErrors.push(`Row ${row.rowNumber}: main category "${row.main_category_name}" not found in admin catalog.`);
    }

    if (row.subcategory_name && !row.resolvedSubcategory) {
      rowErrors.push(`Row ${row.rowNumber}: subcategory "${row.subcategory_name}" not found in admin catalog.`);
    }

    if (
      row.resolvedMainCategory &&
      row.resolvedSubcategory &&
      row.resolvedSubcategory.main_category_id !== row.resolvedMainCategory.id
    ) {
      rowErrors.push(`Row ${row.rowNumber}: subcategory "${row.subcategory_name}" does not belong to main category "${row.main_category_name}".`);
    }

    if (!row.inferredCategory) {
      rowErrors.push(`Row ${row.rowNumber}: category could not be resolved. Add category or map the subcategory to a leaf category.`);
    }

    return rowErrors;
  });

  if (unresolvedErrors.length > 0) {
    throw new Error(unresolvedErrors.join('\n'));
  }

  const missingCategoryNames = Array.from(
    new Set(
      resolvedRows
        .map((row) => row.inferredCategory)
        .filter((category) => category && !existingCategoryNames.has(category.toLowerCase())),
    ),
  );

  let createdCategories = 0;

  if (missingCategoryNames.length > 0) {
    const maxDisplayOrder = (existingCategories || []).reduce(
      (max, category) => Math.max(max, category.display_order ?? 0),
      0,
    );

    const categoriesToInsert = missingCategoryNames.map((name, index) => ({
      name,
      icon: DEFAULT_CATEGORY_ICON,
      display_order: maxDisplayOrder + CATEGORY_ORDER_STEP * (index + 1),
    }));

    const { error: insertCategoriesError } = await supabase
      .from('categories')
      .insert(categoriesToInsert);

    if (insertCategoriesError) {
      throw insertCategoriesError;
    }

    createdCategories = categoriesToInsert.length;
  }

  const productsToUpsert: Database['public']['Tables']['products']['Insert'][] = resolvedRows.map((row) => ({
    name: row.name,
    sku: row.sku,
    company_name: row.company_name,
    company_id: null,
    main_category_id: row.resolvedMainCategory?.id || row.resolvedSubcategory?.main_category_id || null,
    subcategory_id: row.resolvedSubcategory?.id || null,
    category: row.inferredCategory,
    description: row.description,
    unit: row.unit,
    image_url: row.image_url,
    image_source: row.image_url ? 'manual_url' : 'none',
    is_new: row.is_new,
    is_popular: row.is_popular,
  }));

  const { error: productsError } = await supabase
    .from('products')
    .upsert(productsToUpsert, { onConflict: 'sku' });

  if (productsError) {
    throw productsError;
  }

  return {
    createdCategories,
    importedProducts: productsToUpsert.length,
  };
}
