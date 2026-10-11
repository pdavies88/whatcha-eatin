import { describe, expect, it } from '@jest/globals';

import { openFoodFactsHeaders, parseProductResponse, productToAnalysis, productUrl } from '../open-food-facts';

// Trimmed from a real v3 response for Lay's Classic Potato Chips, 1 oz bag.
const laysResponse = {
  code: '028400090858',
  status: 'success',
  product: {
    product_name: 'Classic Potato Chips',
    brands: "Lay's, PepsiCo",
    serving_size: '1 oz (28.3 g)',
    serving_quantity: 28.3,
    image_front_url: 'https://images.openfoodfacts.org/images/products/002/840/009/0858/front_en.jpg',
    nutriments: {
      'energy-kcal_100g': 565.37,
      'energy-kcal_serving': 160,
      proteins_serving: 2,
      carbohydrates_serving: 15,
      fat_serving: 10,
      fiber_serving: 1,
      sugars_serving: 0.5,
      proteins_100g: 7.07,
      carbohydrates_100g: 53,
      fat_100g: 35.3,
    },
  },
};

describe('productUrl and headers', () => {
  it('requests only the fields the app needs from the v3 API', () => {
    expect(productUrl('028400090858')).toMatch(
      /^https:\/\/world\.openfoodfacts\.org\/api\/v3\/product\/028400090858\.json\?fields=/,
    );
  });

  it('identifies the app as Open Food Facts asks', () => {
    expect(openFoodFactsHeaders('1.2.0', 'a@b.com')).toEqual({ 'User-Agent': 'WhatchaEatin/1.2.0 (a@b.com)' });
  });
});

describe('parseProductResponse', () => {
  it('reads name, brand, photo and per-serving nutrition', () => {
    const result = parseProductResponse(laysResponse, '028400090858');
    if (result.status !== 'found') throw new Error('expected a product');
    expect(result.product.name).toBe('Classic Potato Chips');
    expect(result.product.brand).toBe("Lay's");
    expect(result.product.imageUrl).toContain('front_en.jpg');
    expect(result.product.serving).toEqual({
      label: '1 oz (28.3 g)',
      macros: { calories: 160, protein_g: 2, carbs_g: 15, fat_g: 10, fiber_g: 1, sugar_g: 0.5 },
    });
  });

  it('derives a serving from per-100 g values and serving weight', () => {
    const result = parseProductResponse(
      { product: { product_name: 'Granola', serving_quantity: 50, nutriments: { 'energy-kcal_100g': 400, proteins_100g: 10 } } },
      '123',
    );
    if (result.status !== 'found') throw new Error('expected a product');
    expect(result.product.serving?.macros.calories).toBe(200);
    expect(result.product.serving?.macros.protein_g).toBe(5);
    expect(result.product.serving?.label).toBe('50 g');
  });

  it('converts kilojoules when kcal is missing', () => {
    const result = parseProductResponse({ product: { product_name: 'Tea', nutriments: { energy_100g: 418.4 } } }, '1');
    if (result.status !== 'found') throw new Error('expected a product');
    expect(result.product.per100g?.calories).toBeCloseTo(100);
    expect(result.product.serving).toBeUndefined();
  });

  it('reports products without nutrition data', () => {
    expect(parseProductResponse({ product: { product_name: 'Mystery snack', nutriments: {} } }, '1')).toEqual({
      status: 'no_nutrition',
      name: 'Mystery snack',
      imageUrl: undefined,
    });
  });

  it('reports unknown barcodes', () => {
    expect(parseProductResponse({ status: 'failure', result: { id: 'product_not_found' } }, '1')).toEqual({
      status: 'not_found',
    });
  });
});

describe('productToAnalysis', () => {
  it('scales the serving by the amount eaten', () => {
    const result = parseProductResponse(laysResponse, '028400090858');
    if (result.status !== 'found') throw new Error('expected a product');
    const analysis = productToAnalysis(result.product, 2);
    expect(analysis.meal_name).toBe("Lay's Classic Potato Chips");
    expect(analysis.items[0].portion).toBe('2 × 1 oz (28.3 g)');
    expect(analysis.totals).toEqual({ calories: 320, protein_g: 4, carbs_g: 30, fat_g: 20, fiber_g: 2, sugar_g: 1 });
    expect(analysis.notes).toContain('Open Food Facts');
  });

  it('falls back to 100 g portions when there is no serving size', () => {
    const analysis = productToAnalysis(
      { barcode: '1', name: 'Rice', per100g: { calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4, sugar_g: 0 } },
      1.5,
    );
    expect(analysis.items[0].portion).toBe('1.5 × 100 g');
    expect(analysis.totals.calories).toBe(195);
  });
});
