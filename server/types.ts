export interface UserRow {
  id: number;
  name: string;
  email: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  bmi: number;
  bmr?: number;
  tdee?: number;
  goal?: string;
  dietary_pref?: string;
  activity_level?: string;
  calorie_target?: number;
  protein_target?: number;
  carbs_target?: number;
  fats_target?: number;
  budget?: string;
  hostel_context?: string;
  email_verified?: number | boolean;
  verification_code?: string;
  pending_email?: string;
  code_expires_at?: string;
  email_daily_digest?: number;
  email_weekly_recap?: number;
  email_deficit_alerts?: number;
  email_hostel_hacks?: number;
  created_at?: string;
}

export interface MealRow {
  id: string;
  user_email: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  glycemic_index?: string;
  metabolic_impact?: string;
  nutrition_reasoning?: string;
  meal_type: string;
  image_data?: string;
  created_at: string;
}
