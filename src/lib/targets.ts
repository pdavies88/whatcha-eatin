/**
 * Daily calorie and macro targets from a person's age, sex, height, weight and activity.
 *
 * - Calories at rest use the Mifflin-St Jeor equation, the estimate most dietitians use for adults.
 * - Daily burn multiplies that by a standard activity factor.
 * - Losing weight subtracts 500 kcal a day, which works out to roughly 0.5 kg (1 lb) a week.
 *   It never goes below 1,200 kcal for women or 1,500 kcal for men, common clinical minimums
 *   for eating without medical supervision.
 * - Gaining adds 300 kcal a day for a slow gain that favours muscle over fat.
 * - Fat is 30% of calories and protein follows g/kg guidance. Both sit inside the Dietary
 *   Reference Intakes' healthy ranges. Carbs fill the rest. Fiber is 14 g per 1,000 kcal,
 *   from the Dietary Guidelines for Americans.
 */

export type Sex = 'female' | 'male' | 'unspecified';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type UnitSystem = 'us' | 'metric';

export type Profile = {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  units: UnitSystem;
};

export const ACTIVITY_LEVELS: Record<ActivityLevel, { factor: number; label: string; description: string }> = {
  sedentary: { factor: 1.2, label: 'Mostly sitting', description: 'Desk job and little exercise' },
  light: { factor: 1.375, label: 'Lightly active', description: 'Light exercise 1–3 days a week' },
  moderate: { factor: 1.55, label: 'Moderately active', description: 'Exercise 3–5 days a week' },
  active: { factor: 1.725, label: 'Very active', description: 'Hard exercise 6–7 days a week' },
  very_active: { factor: 1.9, label: 'Extremely active', description: 'Physical job or training twice a day' },
};

export const MIN_ADULT_AGE = 18;

const CALORIE_FLOOR: Record<Sex, number> = { female: 1200, male: 1500, unspecified: 1350 };
const LOSE_DEFICIT = 500;
const GAIN_SURPLUS = 300;
const FAT_SHARE = 0.3;
const MAX_PROTEIN_SHARE = 0.35;
const FIBER_PER_1000_KCAL = 14;
const PROTEIN_G_PER_KG: Record<Goal, number> = { lose: 1.6, maintain: 1.2, gain: 1.6 };

export type DailyPlan = {
  goal: Goal;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  /** True when the weight-loss target was raised to the safe minimum. */
  atCalorieFloor: boolean;
};

export type TargetsResult =
  | { kind: 'minor' }
  | {
      kind: 'ok';
      bmi: number;
      restingCalories: number;
      maintenanceCalories: number;
      /** Underweight (BMI under 18.5) gets no weight-loss plan. */
      underweight: boolean;
      plans: { lose?: DailyPlan; maintain: DailyPlan; gain: DailyPlan };
    };

export function bodyMassIndex(heightCm: number, weightKg: number): number {
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

/** Mifflin-St Jeor. "Unspecified" uses the midpoint of the two sex-specific constants. */
export function restingCalories({ age, sex, heightCm, weightKg }: Pick<Profile, 'age' | 'sex' | 'heightCm' | 'weightKg'>) {
  const sexConstant = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + sexConstant;
}

const roundTo10 = (value: number) => Math.round(value / 10) * 10;

function buildPlan(goal: Goal, calories: number, proteinWeightKg: number, atCalorieFloor: boolean): DailyPlan {
  const protein = Math.min(PROTEIN_G_PER_KG[goal] * proteinWeightKg, (calories * MAX_PROTEIN_SHARE) / 4);
  const fat = (calories * FAT_SHARE) / 9;
  const carbs = Math.max(0, (calories - protein * 4 - fat * 9) / 4);
  return {
    goal,
    calories,
    protein_g: Math.round(protein),
    carbs_g: Math.round(carbs),
    fat_g: Math.round(fat),
    fiber_g: Math.round((calories / 1000) * FIBER_PER_1000_KCAL),
    atCalorieFloor,
  };
}

export function computeTargets(profile: Profile): TargetsResult {
  // These equations and minimums are for adults. Teens have different needs while growing.
  if (profile.age < MIN_ADULT_AGE) return { kind: 'minor' };

  const bmi = bodyMassIndex(profile.heightCm, profile.weightKg);
  const resting = restingCalories(profile);
  const maintenance = resting * ACTIVITY_LEVELS[profile.activity].factor;

  // Protein needs track lean mass, so above a BMI of 30 they're based on the weight at a BMI of 25.
  const meters = profile.heightCm / 100;
  const proteinWeightKg = bmi > 30 ? 25 * meters * meters : profile.weightKg;

  const floor = CALORIE_FLOOR[profile.sex];
  const loseCalories = roundTo10(maintenance - LOSE_DEFICIT);
  const underweight = bmi < 18.5;

  return {
    kind: 'ok',
    bmi: Math.round(bmi * 10) / 10,
    restingCalories: Math.round(resting),
    maintenanceCalories: roundTo10(maintenance),
    underweight,
    plans: {
      lose: underweight
        ? undefined
        : buildPlan('lose', Math.max(loseCalories, floor), proteinWeightKg, loseCalories < floor),
      maintain: buildPlan('maintain', roundTo10(maintenance), proteinWeightKg, false),
      gain: buildPlan('gain', roundTo10(maintenance + GAIN_SURPLUS), proteinWeightKg, false),
    },
  };
}

// Unit conversions. The profile is always stored in metric.
export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * CM_PER_INCH;

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}
