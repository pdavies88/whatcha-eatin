import type { Macros, NutritionAnalysis } from '@/lib/nutrition/schema';

/**
 * Product lookups by barcode using Open Food Facts, a free, open database of packaged foods.
 * No API key is needed. Data is under the Open Database License and product photos are
 * CC BY-SA, so the app credits Open Food Facts wherever it shows them.
 * API docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */
export const OPEN_FOOD_FACTS_NAME = 'Open Food Facts';
export const OPEN_FOOD_FACTS_CREDIT = 'Product data and photo from Open Food Facts (ODbL / CC BY-SA)';

const FIELDS = 'product_name,brands,quantity,serving_size,serving_quantity,nutriments,image_front_url,image_url';

export function productUrl(barcode: string): string {
  return `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
}

/** Open Food Facts asks every app to identify itself with "AppName/Version (contact)". */
export function openFoodFactsHeaders(appVersion: string, contactEmail: string): Record<string, string> {
  return { 'User-Agent': `WhatchaEatin/${appVersion} (${contactEmail})` };
}

export type Product = {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  /** The label's serving, e.g. "1 oz (28.3 g)". Absent when the label only lists values per 100 g. */
  serving?: { label: string; macros: Macros };
  per100g?: Macros;
};

export type ProductLookup =
  | { status: 'found'; product: Product }
  | { status: 'no_nutrition'; name: string; imageUrl?: string }
  | { status: 'not_found' };

type Nutriments = Record<string, unknown>;

const NUTRIENT_FIELDS: Record<Exclude<keyof Macros, 'calories'>, string> = {
  protein_g: 'proteins',
  carbs_g: 'carbohydrates',
  fat_g: 'fat',
  fiber_g: 'fiber',
  sugar_g: 'sugars',
};

const KJ_PER_KCAL = 4.184;

function numberField(source: Nutriments, key: string): number | undefined {
  const value = source[key];
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/** Reads one basis ("100g" or "serving") of the nutriments. Returns undefined without calories. */
function readMacros(nutriments: Nutriments, basis: '100g' | 'serving'): Macros | undefined {
  const kcal =
    numberField(nutriments, `energy-kcal_${basis}`) ??
    (numberField(nutriments, `energy_${basis}`) ?? NaN) / KJ_PER_KCAL;
  if (!Number.isFinite(kcal)) return undefined;

  const macros = { calories: kcal } as Macros;
  for (const [key, field] of Object.entries(NUTRIENT_FIELDS) as [keyof typeof NUTRIENT_FIELDS, string][]) {
    // Labels often omit fiber or sugar. Treat a missing value as zero rather than dropping the product.
    macros[key] = numberField(nutriments, `${field}_${basis}`) ?? 0;
  }
  return macros;
}

export function scaleMacros(macros: Macros, factor: number): Macros {
  return {
    calories: macros.calories * factor,
    protein_g: macros.protein_g * factor,
    carbs_g: macros.carbs_g * factor,
    fat_g: macros.fat_g * factor,
    fiber_g: macros.fiber_g * factor,
    sugar_g: macros.sugar_g * factor,
  };
}

export function parseProductResponse(body: unknown, barcode: string): ProductLookup {
  const product = (body as { product?: Record<string, unknown> } | null)?.product;
  if (!product) return { status: 'not_found' };

  const name = String(product.product_name ?? '').trim() || 'Unnamed product';
  const brand = String(product.brands ?? '').split(',')[0]?.trim() || undefined;
  const imageUrl = String(product.image_front_url ?? product.image_url ?? '') || undefined;
  const nutriments = (product.nutriments ?? {}) as Nutriments;

  const per100g = readMacros(nutriments, '100g');
  const servingGrams = numberField(product as Nutriments, 'serving_quantity');
  const servingMacros =
    readMacros(nutriments, 'serving') ?? (per100g && servingGrams ? scaleMacros(per100g, servingGrams / 100) : undefined);

  if (!per100g && !servingMacros) {
    return { status: 'no_nutrition', name, imageUrl };
  }

  const servingLabel =
    String(product.serving_size ?? '').trim() || (servingGrams ? `${servingGrams} g` : 'serving');

  return {
    status: 'found',
    product: {
      barcode,
      name,
      brand,
      imageUrl,
      serving: servingMacros ? { label: servingLabel, macros: servingMacros } : undefined,
      per100g,
    },
  };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

function roundMacros(macros: Macros): Macros {
  return {
    calories: Math.round(macros.calories),
    protein_g: round1(macros.protein_g),
    carbs_g: round1(macros.carbs_g),
    fat_g: round1(macros.fat_g),
    fiber_g: round1(macros.fiber_g),
    sugar_g: round1(macros.sugar_g),
  };
}

/** The portion basis a product is measured in: its label serving if known, otherwise 100 g. */
export function portionBasis(product: Product): { label: string; macros: Macros } {
  return product.serving ?? { label: '100 g', macros: product.per100g! };
}

/** Turns a scanned product and amount into the same shape the photo analysis produces. */
export function productToAnalysis(product: Product, amount: number): NutritionAnalysis {
  const basis = portionBasis(product);
  const totals = roundMacros(scaleMacros(basis.macros, amount));
  const amountLabel = amount === 1 ? '' : `${amount} × `;
  const displayName = product.brand ? `${product.brand} ${product.name}` : product.name;

  return {
    is_food: true,
    meal_name: displayName,
    items: [{ name: displayName, portion: `${amountLabel}${basis.label}`, ...totals }],
    totals,
    confidence: 'high',
    notes: `Nutrition label data for barcode ${product.barcode}. ${OPEN_FOOD_FACTS_CREDIT}.`,
  };
}
