export interface NutritionProfile {
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: "male" | "female" | "other";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "fat_loss" | "muscle_gain" | "maintenance" | "high_protein" | "keto";
}

export interface CalculatedTargets {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

/**
 * Calculates BMR using the Mifflin-St Jeor Equation:
 * Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
export function calculateBMR(weightKg: number, heightCm: number, ageYears: number, gender: string): number {
  if (!weightKg || weightKg <= 0 || !heightCm || heightCm <= 0 || !ageYears || ageYears <= 0 || isNaN(weightKg) || isNaN(heightCm) || isNaN(ageYears)) {
    return 0;
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (gender && gender.toLowerCase() === "male") {
    return Math.max(0, Math.round(base + 5));
  }
  return Math.max(0, Math.round(base - 161));
}

/**
 * Activity Multipliers
 */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // Desk job, little to no exercise
  light: 1.375, // Light exercise 1-3 days/week
  moderate: 1.55, // Moderate exercise 3-5 days/week
  active: 1.725, // Hard exercise 6-7 days/week
  very_active: 1.9, // Physical job or 2x/day training
};

export function calculateTDEE(bmr: number, activityLevel: keyof typeof ACTIVITY_MULTIPLIERS): number {
  if (!bmr || bmr <= 0) return 0;
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Derives optimal daily caloric targets & macro split based on goal
 */
export function calculateMacroTargets(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: string,
  activityLevel: keyof typeof ACTIVITY_MULTIPLIERS = "moderate",
  goal: string = "maintenance"
): CalculatedTargets {
  if (!weightKg || weightKg <= 0 || !heightCm || heightCm <= 0 || !ageYears || ageYears <= 0 || isNaN(weightKg) || isNaN(heightCm) || isNaN(ageYears)) {
    return {
      bmr: 0,
      tdee: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };
  }

  const bmr = calculateBMR(weightKg, heightCm, ageYears, gender);
  const tdee = calculateTDEE(bmr, activityLevel);

  let calories = tdee;
  let proteinRatio = 0.25;
  let carbsRatio = 0.50;
  let fatsRatio = 0.25;

  const normalizedGoal = goal.toLowerCase();

  if (
    normalizedGoal.includes("fat") ||
    normalizedGoal.includes("loss") ||
    normalizedGoal.includes("weight") ||
    normalizedGoal.includes("cut")
  ) {
    // 15-20% deficit, higher protein to spare muscle
    calories = Math.round(tdee * 0.82);
    proteinRatio = 0.32;
    carbsRatio = 0.43;
    fatsRatio = 0.25;
  } else if (
    normalizedGoal.includes("muscle") ||
    normalizedGoal.includes("fitness") ||
    normalizedGoal.includes("gain") ||
    normalizedGoal.includes("bulk")
  ) {
    // 10% surplus, high protein
    calories = Math.round(tdee * 1.08);
    proteinRatio = 0.30;
    carbsRatio = 0.48;
    fatsRatio = 0.22;
  } else if (normalizedGoal.includes("keto")) {
    calories = Math.round(tdee * 0.90);
    proteinRatio = 0.25;
    carbsRatio = 0.05; // 5% carbs
    fatsRatio = 0.70; // 70% fats
  } else if (normalizedGoal.includes("protein")) {
    calories = tdee;
    proteinRatio = 0.38;
    carbsRatio = 0.37;
    fatsRatio = 0.25;
  } else {
    // Healthy eating / maintenance
    calories = tdee;
    proteinRatio = 0.25;
    carbsRatio = 0.50;
    fatsRatio = 0.25;
  }

  // Protein = 4 kcal/g, Carbs = 4 kcal/g, Fat = 9 kcal/g
  const protein = Math.round((calories * proteinRatio) / 4);
  const carbs = Math.round((calories * carbsRatio) / 4);
  const fats = Math.round((calories * fatsRatio) / 9);

  return {
    bmr,
    tdee,
    calories,
    protein,
    carbs,
    fats,
  };
}
