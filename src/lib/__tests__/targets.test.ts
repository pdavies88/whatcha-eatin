import { describe, expect, it } from '@jest/globals';

import { cmToFeetInches, computeTargets, feetInchesToCm, kgToLb, lbToKg, restingCalories, type Profile } from '../targets';

const man: Profile = {
  age: 30,
  sex: 'male',
  heightCm: 180,
  weightKg: 80,
  activity: 'moderate',
  goal: 'maintain',
  units: 'metric',
};

const woman: Profile = {
  age: 25,
  sex: 'female',
  heightCm: 165,
  weightKg: 60,
  activity: 'sedentary',
  goal: 'maintain',
  units: 'metric',
};

describe('restingCalories (Mifflin-St Jeor)', () => {
  it('matches the published equation for men and women', () => {
    expect(restingCalories(man)).toBe(1780);
    expect(restingCalories(woman)).toBeCloseTo(1345.25);
  });

  it('uses the midpoint constant when sex is unspecified', () => {
    expect(restingCalories({ ...man, sex: 'unspecified' })).toBe(1697);
  });
});

describe('computeTargets', () => {
  it('builds maintain, lose and gain plans from daily burn', () => {
    const result = computeTargets(man);
    if (result.kind !== 'ok') throw new Error('expected targets');
    // 1780 × 1.55 = 2759
    expect(result.maintenanceCalories).toBe(2760);
    expect(result.plans.maintain.calories).toBe(2760);
    expect(result.plans.lose?.calories).toBe(2260);
    expect(result.plans.gain.calories).toBe(3060);
    expect(result.plans.maintain.protein_g).toBe(96);
    expect(result.plans.lose?.protein_g).toBe(128);
  });

  it('keeps macro calories equal to the calorie target', () => {
    const result = computeTargets(man);
    if (result.kind !== 'ok') throw new Error('expected targets');
    for (const plan of Object.values(result.plans)) {
      if (!plan) continue;
      const fromMacros = plan.protein_g * 4 + plan.carbs_g * 4 + plan.fat_g * 9;
      expect(Math.abs(fromMacros - plan.calories)).toBeLessThan(15);
      expect(plan.fiber_g).toBe(Math.round((plan.calories / 1000) * 14));
    }
  });

  it('never sets a weight-loss target below the safe minimum', () => {
    const result = computeTargets(woman);
    if (result.kind !== 'ok') throw new Error('expected targets');
    expect(result.plans.lose?.calories).toBe(1200);
    expect(result.plans.lose?.atCalorieFloor).toBe(true);
  });

  it('gives no weight-loss plan when underweight', () => {
    const result = computeTargets({ ...woman, weightKg: 48 });
    if (result.kind !== 'ok') throw new Error('expected targets');
    expect(result.underweight).toBe(true);
    expect(result.plans.lose).toBeUndefined();
  });

  it('bases protein on a BMI-25 weight above a BMI of 30', () => {
    const result = computeTargets({ ...man, weightKg: 130 });
    if (result.kind !== 'ok') throw new Error('expected targets');
    // 25 × 1.8² = 81 kg reference weight, × 1.2 g/kg
    expect(result.plans.maintain.protein_g).toBe(97);
  });

  it('declines to calculate for people under 18', () => {
    expect(computeTargets({ ...man, age: 16 })).toEqual({ kind: 'minor' });
  });
});

describe('unit conversions', () => {
  it('round-trips pounds and feet/inches', () => {
    expect(lbToKg(176)).toBeCloseTo(79.83, 1);
    expect(kgToLb(lbToKg(150))).toBeCloseTo(150);
    expect(feetInchesToCm(5, 10)).toBeCloseTo(177.8);
    expect(cmToFeetInches(177.8)).toEqual({ feet: 5, inches: 10 });
  });
});
