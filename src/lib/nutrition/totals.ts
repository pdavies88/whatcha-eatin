import type { Macros } from './schema';

export const ZERO_MACROS: Macros = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  sugar_g: 0,
};

export function sumMacros(list: Macros[]): Macros {
  return list.reduce<Macros>(
    (sum, macros) => ({
      calories: sum.calories + macros.calories,
      protein_g: sum.protein_g + macros.protein_g,
      carbs_g: sum.carbs_g + macros.carbs_g,
      fat_g: sum.fat_g + macros.fat_g,
      fiber_g: sum.fiber_g + macros.fiber_g,
      sugar_g: sum.sugar_g + macros.sugar_g,
    }),
    ZERO_MACROS,
  );
}

export function isSameDay(a: number, b: number): boolean {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}
