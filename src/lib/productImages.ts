const BRAND_NAMES = [
  'Bosch',
  'Dewalt',
  'Makita',
  'Hikoki',
  'Hitachi',
  'Stanley',
  'Taparia',
  'Baum',
  'Eastman',
  'Karam',
  'Insize',
  'ESAB',
  '3M',
  'Honeywell',
] as const;

const PRODUCT_TYPE_RULES: Array<{ match: RegExp; value: string }> = [
  { match: /grinder/i, value: 'angle grinder' },
  { match: /drill machine/i, value: 'electric drill' },
  { match: /welding machine/i, value: 'welding machine' },
  { match: /welding rod/i, value: 'welding electrode' },
  { match: /chain block/i, value: 'chain hoist' },
  { match: /allen bolt/i, value: 'socket cap screw' },
  { match: /hex bolt/i, value: 'hexagon bolt' },
  { match: /hex nut/i, value: 'hexagon nut' },
  { match: /spring washer/i, value: 'spring washer' },
  { match: /cutting wheel/i, value: 'cutting disc' },
  { match: /safety helmet/i, value: 'hard hat helmet' },
  { match: /safety belt/i, value: 'safety harness' },
  { match: /vernier caliper/i, value: 'vernier caliper' },
  { match: /torque wrench/i, value: 'torque wrench' },
  { match: /hydraulic jack/i, value: 'hydraulic jack' },
  { match: /bearing/i, value: 'ball bearing' },
  { match: /drill bit|ps drill|ts drill/i, value: 'drill bit' },
  { match: /hammer/i, value: 'hammer tool' },
  { match: /chisel/i, value: 'cold chisel' },
  { match: /plier/i, value: 'pliers tool' },
  { match: /spanner/i, value: 'spanner wrench' },
  { match: /socket/i, value: 'socket wrench' },
] as const;

const SHARED_PRODUCT_IMAGES: Array<{ match: RegExp; imageUrl: string; label: string }> = [
  { match: /allen bolt|hex bolt|anchor bolt|eye bolt|foundation bolt|carriage bolt|\bbolt\b/i, imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bolt_and_nut.jpg?width=400', label: 'bolt' },
  { match: /hex nut|lock nut|flange nut|coupling nut|\bnut\b/i, imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bolt_and_nut.jpg?width=400', label: 'nut' },
  { match: /spring washer|plain washer|star washer|\bwasher\b/i, imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bolt_and_nut.jpg?width=400', label: 'washer' },
];

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Fasteners & Bolts': 'https://commons.wikimedia.org/wiki/Special:FilePath/Bolt_and_nut.jpg?width=400',
  'Power Tools': 'https://commons.wikimedia.org/wiki/Special:FilePath/Bosch_angle_grinder.jpg?width=400',
  'Hand Tools': 'https://commons.wikimedia.org/wiki/Special:FilePath/Hammer.jpg?width=400',
  'Drill Bits & Cutters': 'https://commons.wikimedia.org/wiki/Special:FilePath/Drill_bits.jpg?width=400',
  'Welding & Gas Cutting': 'https://commons.wikimedia.org/wiki/Special:FilePath/MIG_welding.jpg?width=400',
  'Spanners & Wrenches': 'https://commons.wikimedia.org/wiki/Special:FilePath/Spanners.jpg?width=400',
  'Abrasives & Grinding': 'https://commons.wikimedia.org/wiki/Special:FilePath/Grinding_disc.jpg?width=400',
  'Sockets & Socket Sets': 'https://commons.wikimedia.org/wiki/Special:FilePath/Socket_set.jpg?width=400',
  'Safety Equipment': 'https://commons.wikimedia.org/wiki/Special:FilePath/Safety_helmet.jpg?width=400',
  'Measuring & Layout Tools': 'https://commons.wikimedia.org/wiki/Special:FilePath/Vernier_caliper.jpg?width=400',
};

export type ProductImageSource = 'none' | 'wikimedia' | 'uploaded' | 'manual_url' | 'category_fallback';

export type ProductImageLookupResult = {
  imageUrl: string;
  source: ProductImageSource;
  matchedTitle?: string;
  queryUsed?: string;
};

export function extractBrand(productName: string) {
  return BRAND_NAMES.find((brand) => new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(productName)) || null;
}

export function extractProductType(productName: string) {
  const match = PRODUCT_TYPE_RULES.find((rule) => rule.match.test(productName));
  return match?.value || productName.trim();
}

export function buildProductImageQuery(productName: string, description?: string | null, category?: string | null) {
  const brand = extractBrand(productName);
  const productType = extractProductType(productName);
  const normalizedDescription = (description || '').trim().toLowerCase();
  const normalizedCategory = (category || '').trim().toLowerCase();

  if (/allen bolt|hex bolt|anchor bolt|eye bolt|foundation bolt|\bbolt\b/i.test(productName)) {
    return brand ? `${brand} metal bolt fastener` : 'metal bolt fastener hardware';
  }

  if (/hex nut|lock nut|flange nut|coupling nut|\bnut\b/i.test(productName)) {
    return brand ? `${brand} metal hex nut fastener` : 'metal hex nut fastener';
  }

  if (/spring washer|plain washer|star washer|\bwasher\b/i.test(productName)) {
    return brand ? `${brand} metal washer fastener` : 'metal washer fastener';
  }

  if (brand) {
    return `${brand} ${productType}`.replace(/\s+/g, ' ').trim();
  }

  if (productType !== productName.trim()) {
    return `${productType} ${normalizedCategory.includes('fastener') ? 'fastener' : 'hardware tool'}`.trim();
  }

  if (normalizedDescription.includes('industrial') || normalizedCategory.includes('hardware')) {
    return `${productName.trim()} hardware`;
  }

  return productName.trim();
}

export function getSharedProductImage(productName: string) {
  const match = SHARED_PRODUCT_IMAGES.find((rule) => rule.match.test(productName));
  return match?.imageUrl || null;
}

export function getCategoryFallback(category?: string | null) {
  if (!category) return null;
  return CATEGORY_FALLBACK_IMAGES[category] || null;
}

export function createProductPlaceholderDataUrl(productName: string) {
  const safeLabel = productName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 48);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#e5e7eb" />
      <rect x="20" y="20" width="360" height="360" rx="24" fill="#f3f4f6" stroke="#d1d5db" />
      <text x="200" y="185" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">No Image</text>
      <text x="200" y="225" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#374151">${safeLabel}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function resolveProductImage(
  productName: string,
  description?: string | null,
  category?: string | null,
  directQuery?: string,
): Promise<ProductImageLookupResult> {
  const sharedImage = getSharedProductImage(productName);
  if (sharedImage) {
    return {
      imageUrl: sharedImage,
      source: 'category_fallback',
      queryUsed: 'shared-product-image',
      matchedTitle: 'shared-product-image',
    };
  }

  const categoryFallback = getCategoryFallback(category);
  if (categoryFallback) {
    return {
      imageUrl: categoryFallback,
      source: 'category_fallback',
      queryUsed: directQuery || buildProductImageQuery(productName, description, category),
      matchedTitle: 'category-fallback',
    };
  }

  return {
    imageUrl: createProductPlaceholderDataUrl(productName),
    source: 'category_fallback',
    queryUsed: directQuery || buildProductImageQuery(productName, description, category),
    matchedTitle: 'placeholder',
  };
}
