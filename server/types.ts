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

export interface UserMemoryRow {
  id?: number;
  user_email: string;
  category: "preference" | "constraint" | "habit" | "milestone" | "struggle" | string;
  memory_key: string;
  memory_value: string;
  confidence?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationLogRow {
  id?: number;
  user_email: string;
  role: "user" | "assistant" | "system";
  content: string;
  state_snapshot?: string;
  created_at?: string;
}

export interface DailySnapshotRow {
  id?: number;
  user_email: string;
  snapshot_date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  meals_count?: number;
  adherence_score?: number;
  notes?: string;
  created_at?: string;
}

export interface WeeklyDayStat {
  date: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  calorieTarget: number;
  proteinTarget: number;
  adherenceScore: number;
  mealsCount: number;
  status: "perfect" | "on_track" | "under" | "over";
  isToday: boolean;
}

export interface WeeklyProgressResponse {
  weekRange: string;
  days: WeeklyDayStat[];
  averageCalories: number;
  averageProtein: number;
  averageScore: number;
  totalMealsLogged: number;
  streakDays: number;
  proteinGoalDays: number;
  calorieGoalDays: number;
  aiWeeklySummary: string;
  topImprovement: string;
  memoryInsights: string[];
}

export interface TimedReminderItem {
  id: string;
  title: string;
  timeWindow: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  description: string;
  suggestedAction: string;
  macroFocus: string;
  type: "hydration" | "breakfast" | "lunch" | "snack" | "dinner" | "recovery";
  urgency: "active" | "upcoming" | "past";
  completed: boolean;
}

