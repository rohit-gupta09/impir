const XLSX = require('xlsx');
const fs = require('fs');
const workbookPath = '/Users/rohitgupta/Downloads/ProBuild_Final_Product_Catalog.xlsx';
const outputPath = 'supabase/migrations/20260329120000_sync_catalog_to_excel_structure.sql';
const wb = XLSX.readFile(workbookPath);
const mainRows = XLSX.utils.sheet_to_json(wb.Sheets['Main Categories'], { defval: '', raw: false });
const subRows = XLSX.utils.sheet_to_json(wb.Sheets['Subcategories'], { defval: '', raw: false });
const productRows = XLSX.utils.sheet_to_json(wb.Sheets['Products (Import Ready)'], { defval: '', raw: false });

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-{2,}/g, '-');

const sqlString = (value) => String(value ?? '').replace(/'/g, "''");

const mainCategories = mainRows
  .map((row, index) => ({
    name: String(row['Main Category'] || '').trim(),
    slug: slugify(row['Main Category'] || ''),
    display_order: (index + 1) * 10,
    description: String(row['Notes'] || '').trim(),
  }))
  .filter((row) => row.name);

const subcategoryCategoryMap = new Map();
for (const row of productRows) {
  const main = String(row.main_category || '').trim();
  const sub = String(row.subcategory || '').trim();
  const category = String(row.category || '').trim();
  if (!main || !sub || !category) continue;
  const key = `${main}|||${sub}`;
  if (!subcategoryCategoryMap.has(key)) {
    subcategoryCategoryMap.set(key, category);
  }
}

const subcategories = subRows
  .map((row, index) => {
    const mainName = String(row['Main Category'] || '').trim();
    const name = String(row['Subcategory'] || '').trim();
    return {
      mainName,
      name,
      slug: slugify(name),
      display_order: (index + 1) * 10,
      legacy_category_name: subcategoryCategoryMap.get(`${mainName}|||${name}`) || '',
    };
  })
  .filter((row) => row.mainName && row.name);

const leafCategories = [...new Set(productRows.map((row) => String(row.category || '').trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b))
  .map((name, index) => ({ name, display_order: (index + 1) * 10 }));

const lines = [];
lines.push('-- Sync catalog structure to match ProBuild_Final_Product_Catalog.xlsx');
lines.push('UPDATE public.products SET main_category_id = NULL, subcategory_id = NULL;');
lines.push('DELETE FROM public.catalog_subcategories;');
lines.push('DELETE FROM public.catalog_main_categories;');
lines.push('');
lines.push('-- Ensure leaf categories used by products exist');
for (const category of leafCategories) {
  lines.push(`INSERT INTO public.categories (name, icon, display_order)`);
  lines.push(`VALUES ('${sqlString(category.name)}', 'Package', ${category.display_order})`);
  lines.push(`ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;`);
  lines.push('');
}
lines.push('-- Insert main categories from Excel');
for (const category of mainCategories) {
  lines.push(`INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)`);
  lines.push(`VALUES ('${sqlString(category.name)}', '${sqlString(category.slug)}', '${sqlString(category.description)}', '', ${category.display_order}, true);`);
  lines.push('');
}
lines.push('-- Insert subcategories from Excel');
for (const sub of subcategories) {
  lines.push(`INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)`);
  lines.push(`SELECT id, '${sqlString(sub.name)}', '${sqlString(sub.slug)}', '', '', '${sqlString(sub.legacy_category_name)}', ${sub.display_order}, true`);
  lines.push(`FROM public.catalog_main_categories`);
  lines.push(`WHERE name = '${sqlString(sub.mainName)}';`);
  lines.push('');
}

fs.writeFileSync(outputPath, lines.join('\n') + '\n');
console.log(`Wrote ${outputPath}`);
console.log(`Main categories: ${mainCategories.length}`);
console.log(`Subcategories: ${subcategories.length}`);
console.log(`Leaf categories: ${leafCategories.length}`);
