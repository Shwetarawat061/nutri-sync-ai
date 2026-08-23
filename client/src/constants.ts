export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

export const GLYCEMIC_LEVELS = ["Low", "Medium", "High"] as const;

export const DEFAULT_NUTRITION_TARGETS = {
  calories: 2100,
  protein: 120,
  carbs: 200,
  fats: 60,
  fiber: 30,
};

export const DIETARY_PREFERENCES = [
  "Omnivore",
  "Vegetarian",
  "Eggetarian",
  "Vegan",
  "High-Protein Non-Veg",
] as const;

export const NUTRITION_GOALS = [
  { id: "fat_loss", label: "Fat Loss / Caloric Deficit", multiplier: 0.8 },
  { id: "muscle_gain", label: "Muscle Gain / Lean Bulk", multiplier: 1.1 },
  { id: "maintenance", label: "Maintenance / Balance", multiplier: 1.0 },
  { id: "high_protein", label: "High-Protein Athletic", multiplier: 1.0 },
  { id: "keto", label: "Ketogenic / Low-Carb High-Fat", multiplier: 0.9 },
] as const;
