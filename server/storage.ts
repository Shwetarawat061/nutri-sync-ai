import { db } from "./db.js";
import { isMongoActive } from "./mongo.js";
import { UserModel } from "./models/User.js";
import { MealModel } from "./models/Meal.js";
import { NutritionGoalModel } from "./models/NutritionGoal.js";
import { AIAnalysisModel } from "./models/AIAnalysis.js";
import { HydrationEntryModel } from "./models/HydrationEntry.js";
import {
  getUserTimezone,
  getTodayDateString,
  getDayBoundariesUTC,
  formatLocalDateFromTimestamp,
} from "./utils/dateUtils.js";
import mongoose from "mongoose";
import crypto from "crypto";

export interface NormalizedUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  bmi: number;
  bmr: number;
  tdee: number;
  goal: string;
  nutritionGoal: string;
  dietary_pref: string;
  dietaryPreference: string;
  activity_level: string;
  activityLevel: string;
  calorie_target: number;
  calorieTarget: number;
  protein_target: number;
  proteinTarget: number;
  carbs_target: number;
  carbsTarget: number;
  fats_target: number;
  fatsTarget: number;
  budget: string;
  hostel_context: string;
  hostelContext: string;
  pregnancy_status?: string | boolean;
  pregnancyStatus?: string | boolean;
  lactation_status?: string | boolean;
  lactationStatus?: string | boolean;
  climate?: string;
  timezone?: string;
  email_verified: boolean;
  emailVerified: boolean;
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
}

export interface NormalizedMeal {
  id: string;
  _id?: string;
  user_email: string;
  userId?: string;
  food_name: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  water_content_ml?: number | null;
  waterContentMl?: number | null;
  water_content_confidence?: number | null;
  waterContentConfidence?: number | null;
  glycemic_index: string;
  glycemicIndex: string;
  metabolic_impact: string;
  metabolicImpact: string;
  nutrition_reasoning: string;
  nutritionReasoning: string;
  meal_type: string;
  mealType: string;
  image_data?: string;
  imageData?: string;
  image_url?: string;
  imageUrl?: string;
  image_urls?: string[];
  imageUrls?: string[];
  foods?: any[];
  nutrition?: any;
  ai_metadata?: any;
  aiMetadata?: any;
  scan_result?: any;
  scanResult?: any;
  consumed_at: string;
  consumedAt: string;
  date_status?: string;
  dateStatus?: string;
  created_at: string;
  createdAt: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface NormalizedHydrationEntry {
  id: string;
  _id?: string;
  user_email: string;
  userEmail: string;
  userId?: string;
  amount_ml: number;
  amountMl: number;
  beverage_type: string;
  beverageType: string;
  consumed_at: string;
  consumedAt: string;
  source: string;
  notes?: string;
  created_at: string;
  createdAt: string;
}

function normalizeSqliteUser(row: any): NormalizedUser {
  const goal = row.goal || "Healthy eating";
  const dietaryPref = row.dietary_pref || "Omnivore";
  const activityLevel = row.activity_level || "Moderate";
  const calorieTarget = Number(row.calorie_target) || 2100;
  const proteinTarget = Number(row.protein_target) || 120;
  const carbsTarget = Number(row.carbs_target) || 200;
  const fatsTarget = Number(row.fats_target) || 60;
  const budget = row.budget || "medium";
  const hostelContext = row.hostel_context || "";
  const pregnancyStatus = row.pregnancy_status || "";
  const lactationStatus = row.lactation_status || "";
  const climate = row.climate || "";
  const timezone = row.timezone || "";
  const emailVerified = Boolean(row.email_verified);
  const createdAt = row.created_at || new Date().toISOString();
  const updatedAt = row.updated_at || createdAt;

  return {
    id: String(row.id),
    _id: String(row.id),
    name: row.name,
    email: String(row.email).toLowerCase(),
    passwordHash: row.password_hash,
    age: Number(row.age) || 18,
    weight: Number(row.weight) || 60,
    height: Number(row.height) || 170,
    gender: row.gender || "unspecified",
    bmi: Number(row.bmi) || 21.5,
    bmr: Number(row.bmr) || 1500,
    tdee: Number(row.tdee) || 2100,
    goal,
    nutritionGoal: goal,
    dietary_pref: dietaryPref,
    dietaryPreference: dietaryPref,
    activity_level: activityLevel,
    activityLevel,
    calorie_target: calorieTarget,
    calorieTarget,
    protein_target: proteinTarget,
    proteinTarget,
    carbs_target: carbsTarget,
    carbsTarget,
    fats_target: fatsTarget,
    fatsTarget,
    budget,
    hostel_context: hostelContext,
    hostelContext,
    pregnancy_status: pregnancyStatus,
    pregnancyStatus,
    lactation_status: lactationStatus,
    lactationStatus,
    climate,
    timezone,
    email_verified: emailVerified,
    emailVerified,
    created_at: createdAt,
    createdAt,
    updated_at: updatedAt,
    updatedAt,
  };
}

function normalizeMongoUser(doc: any): NormalizedUser {
  const value = doc.toObject ? doc.toObject() : doc;
  const goal = value.nutritionGoal || value.goal || "Healthy eating";
  const dietaryPref = value.dietaryPreference || value.dietary_pref || "Omnivore";
  const activityLevel = value.activityLevel || value.activity_level || "Moderate";
  const calorieTarget = Number(value.calorieTarget || value.calorie_target) || 2100;
  const proteinTarget = Number(value.proteinTarget || value.protein_target) || 120;
  const carbsTarget = Number(value.carbsTarget || value.carbs_target) || 200;
  const fatsTarget = Number(value.fatsTarget || value.fats_target) || 60;
  const budget = value.budget || "medium";
  const hostelContext = value.hostelContext || value.hostel_context || "";
  const pregnancyStatus = value.pregnancyStatus || value.pregnancy_status || "";
  const lactationStatus = value.lactationStatus || value.lactation_status || "";
  const climate = value.climate || "";
  const timezone = value.timezone || "";
  const emailVerified = Boolean(value.emailVerified ?? value.email_verified);
  const createdAt = value.createdAt ? new Date(value.createdAt).toISOString() : new Date().toISOString();
  const updatedAt = value.updatedAt ? new Date(value.updatedAt).toISOString() : createdAt;

  return {
    id: String(value._id),
    _id: String(value._id),
    name: value.name,
    email: String(value.email).toLowerCase(),
    passwordHash: value.passwordHash || value.password_hash,
    age: Number(value.age) || 18,
    weight: Number(value.weight) || 60,
    height: Number(value.height) || 170,
    gender: value.gender || "unspecified",
    bmi: Number(value.bmi) || 21.5,
    bmr: Number(value.bmr) || 1500,
    tdee: Number(value.tdee) || 2100,
    goal,
    nutritionGoal: goal,
    dietary_pref: dietaryPref,
    dietaryPreference: dietaryPref,
    activity_level: activityLevel,
    activityLevel,
    calorie_target: calorieTarget,
    calorieTarget,
    protein_target: proteinTarget,
    proteinTarget,
    carbs_target: carbsTarget,
    carbsTarget,
    fats_target: fatsTarget,
    fatsTarget,
    budget,
    hostel_context: hostelContext,
    hostelContext,
    pregnancy_status: pregnancyStatus,
    pregnancyStatus,
    lactation_status: lactationStatus,
    lactationStatus,
    climate,
    timezone,
    email_verified: emailVerified,
    emailVerified,
    created_at: createdAt,
    createdAt,
    updated_at: updatedAt,
    updatedAt,
  };
}

function normalizeSqliteMeal(row: any): NormalizedMeal {
  let imageUrls: string[] = [];
  try {
    if (row.image_urls) imageUrls = JSON.parse(row.image_urls);
    else if (row.image_data) imageUrls = [row.image_data];
  } catch {
    if (row.image_data) imageUrls = [row.image_data];
  }

  let foods: any[] = [];
  try {
    if (row.foods) foods = JSON.parse(row.foods);
  } catch {
    foods = [];
  }

  let nutrition: any = null;
  try {
    if (row.nutrition) nutrition = JSON.parse(row.nutrition);
  } catch {
    nutrition = null;
  }

  let aiMetadata: any = null;
  try {
    if (row.ai_metadata) aiMetadata = JSON.parse(row.ai_metadata);
  } catch {
    aiMetadata = null;
  }

  const createdAt = row.created_at || new Date().toISOString();
  const consumedAt = row.consumed_at || row.created_at || createdAt;
  const dateStatus = row.date_status || (row.consumed_at ? "exact" : "migrated");
  const waterContentMl = row.water_content_ml !== null && row.water_content_ml !== undefined ? Number(row.water_content_ml) : null;
  const waterContentConfidence = row.water_content_confidence !== null && row.water_content_confidence !== undefined ? Number(row.water_content_confidence) : null;

  return {
    id: String(row.id),
    _id: String(row.id),
    user_email: row.user_email,
    food_name: row.food_name,
    foodName: row.food_name,
    calories: Number(row.calories) || 0,
    protein: Number(row.protein) || 0,
    carbs: Number(row.carbs) || 0,
    fats: Number(row.fats) || 0,
    fiber: Number(row.fiber) || 0,
    water_content_ml: waterContentMl,
    waterContentMl,
    water_content_confidence: waterContentConfidence,
    waterContentConfidence,
    glycemic_index: row.glycemic_index || "Medium",
    glycemicIndex: row.glycemic_index || "Medium",
    metabolic_impact: row.metabolic_impact || "",
    metabolicImpact: row.metabolic_impact || "",
    nutrition_reasoning: row.nutrition_reasoning || "",
    nutritionReasoning: row.nutrition_reasoning || "",
    meal_type: row.meal_type || "Snack",
    mealType: row.meal_type || "Snack",
    image_data: row.image_data,
    imageData: row.image_data,
    image_url: row.image_url,
    imageUrl: row.image_url,
    image_urls: imageUrls,
    imageUrls: imageUrls,
    foods,
    nutrition,
    ai_metadata: aiMetadata,
    aiMetadata,
    consumed_at: consumedAt,
    consumedAt,
    date_status: dateStatus,
    dateStatus,
    created_at: createdAt,
    createdAt,
  };
}

function normalizeMongoMeal(doc: any): NormalizedMeal {
  const value = doc.toObject ? doc.toObject() : doc;
  const createdAt = value.createdAt ? new Date(value.createdAt).toISOString() : new Date().toISOString();
  const consumedAt = value.consumedAt ? new Date(value.consumedAt).toISOString() : (value.consumed_at ? new Date(value.consumed_at).toISOString() : createdAt);
  const dateStatus = value.dateStatus || value.date_status || "exact";
  const imageUrls = value.imageUrls || (value.imageData ? [value.imageData] : []);
  const waterContentMl = value.waterContentMl !== null && value.waterContentMl !== undefined ? Number(value.waterContentMl) : (value.water_content_ml !== null && value.water_content_ml !== undefined ? Number(value.water_content_ml) : null);
  const waterContentConfidence = value.waterContentConfidence !== null && value.waterContentConfidence !== undefined ? Number(value.waterContentConfidence) : (value.water_content_confidence !== null && value.water_content_confidence !== undefined ? Number(value.water_content_confidence) : null);

  return {
    id: String(value._id),
    _id: String(value._id),
    user_email: value.userEmail || "",
    userId: value.userId ? String(value.userId) : undefined,
    food_name: value.foodName || value.food_name || "",
    foodName: value.foodName || value.food_name || "",
    calories: Number(value.calories) || 0,
    protein: Number(value.protein) || 0,
    carbs: Number(value.carbs) || 0,
    fats: Number(value.fats) || 0,
    fiber: Number(value.fiber) || 0,
    water_content_ml: waterContentMl,
    waterContentMl,
    water_content_confidence: waterContentConfidence,
    waterContentConfidence,
    glycemic_index: value.glycemicIndex || value.glycemic_index || "Medium",
    glycemicIndex: value.glycemicIndex || value.glycemic_index || "Medium",
    metabolic_impact: value.metabolicImpact || value.metabolic_impact || "",
    metabolicImpact: value.metabolicImpact || value.metabolic_impact || "",
    nutrition_reasoning: value.nutritionReasoning || value.nutrition_reasoning || "",
    nutritionReasoning: value.nutritionReasoning || value.nutrition_reasoning || "",
    meal_type: value.mealType || value.meal_type || "Snack",
    mealType: value.mealType || value.meal_type || "Snack",
    image_data: value.imageData || value.image_data,
    imageData: value.imageData || value.image_data,
    image_url: value.imageUrl || value.image_url,
    imageUrl: value.imageUrl || value.image_url,
    image_urls: imageUrls,
    imageUrls,
    foods: value.foods || [],
    nutrition: value.nutrition,
    ai_metadata: value.aiMetadata || value.ai_metadata,
    aiMetadata: value.aiMetadata || value.ai_metadata,
    scan_result: value.scanResult || value.scan_result,
    scanResult: value.scanResult || value.scan_result,
    consumed_at: consumedAt,
    consumedAt,
    date_status: dateStatus,
    dateStatus,
    created_at: createdAt,
    createdAt,
  };
}

function normalizeSqliteHydrationEntry(row: any): NormalizedHydrationEntry {
  const createdAt = row.created_at || new Date().toISOString();
  const consumedAt = row.consumed_at || createdAt;
  return {
    id: String(row.id),
    _id: String(row.id),
    user_email: row.user_email,
    userEmail: row.user_email,
    userId: row.user_id ? String(row.user_id) : undefined,
    amount_ml: Number(row.amount_ml) || 0,
    amountMl: Number(row.amount_ml) || 0,
    beverage_type: row.beverage_type || "Water",
    beverageType: row.beverage_type || "Water",
    consumed_at: consumedAt,
    consumedAt,
    source: row.source || "manual",
    notes: row.notes || "",
    created_at: createdAt,
    createdAt,
  };
}

function normalizeMongoHydrationEntry(doc: any): NormalizedHydrationEntry {
  const value = doc.toObject ? doc.toObject() : doc;
  const createdAt = value.createdAt ? new Date(value.createdAt).toISOString() : new Date().toISOString();
  const consumedAt = value.consumedAt ? new Date(value.consumedAt).toISOString() : createdAt;
  return {
    id: String(value._id),
    _id: String(value._id),
    user_email: value.userEmail || "",
    userEmail: value.userEmail || "",
    userId: value.userId ? String(value.userId) : undefined,
    amount_ml: Number(value.amountMl) || 0,
    amountMl: Number(value.amountMl) || 0,
    beverage_type: value.beverageType || "Water",
    beverageType: value.beverageType || "Water",
    consumed_at: consumedAt,
    consumedAt,
    source: value.source || "manual",
    notes: value.notes || "",
    created_at: createdAt,
    createdAt,
  };
}

export const storage = {
  // Public serialization helpers
  toPublicUser(user: NormalizedUser | any) {
    if (!user) return null;
    const u = user.toObject ? normalizeMongoUser(user) : user;
    const isNew = !u.gender || u.gender === "unspecified" || (Number(u.age) === 18 && Number(u.weight) === 60 && Number(u.height) === 170 && (u.gender === "unspecified" || !u.gender));
    return {
      id: String(u.id || u._id),
      name: u.name,
      email: u.email,
      age: u.age,
      weight: u.weight,
      height: u.height,
      gender: u.gender,
      bmi: u.bmi,
      bmr: u.bmr,
      tdee: u.tdee,
      goal: u.goal || u.nutritionGoal,
      dietary_pref: u.dietary_pref || u.dietaryPreference,
      dietaryPreference: u.dietaryPreference || u.dietary_pref,
      activity_level: u.activity_level || u.activityLevel,
      calorie_target: u.calorie_target || u.calorieTarget,
      protein_target: u.protein_target || u.proteinTarget,
      carbs_target: u.carbs_target || u.carbsTarget,
      fats_target: u.fats_target || u.fatsTarget,
      budget: u.budget,
      hostel_context: u.hostel_context || u.hostelContext,
      is_new_user: isNew,
      profile_completed: !isNew,
      email_verified: Boolean(u.email_verified ?? u.emailVerified),
      created_at: u.created_at || u.createdAt,
      updated_at: u.updated_at || u.updatedAt,
    };
  },

  toPublicMeal(meal: NormalizedMeal | any) {
    if (!meal) return null;
    const m = meal.toObject ? normalizeMongoMeal(meal) : meal;
    const consumedAt = m.consumed_at || m.consumedAt || m.created_at || m.createdAt || new Date().toISOString();
    return {
      id: String(m.id || m._id),
      user_email: m.user_email,
      food_name: m.food_name || m.foodName,
      calories: Number(m.calories) || 0,
      protein: Number(m.protein) || 0,
      carbs: Number(m.carbs) || 0,
      fats: Number(m.fats) || 0,
      fiber: Number(m.fiber) || 0,
      water_content_ml: m.water_content_ml !== undefined ? m.water_content_ml : m.waterContentMl,
      waterContentMl: m.waterContentMl !== undefined ? m.waterContentMl : m.water_content_ml,
      water_content_confidence: m.water_content_confidence !== undefined ? m.water_content_confidence : m.waterContentConfidence,
      waterContentConfidence: m.waterContentConfidence !== undefined ? m.waterContentConfidence : m.water_content_confidence,
      glycemic_index: m.glycemic_index || m.glycemicIndex,
      metabolic_impact: m.metabolic_impact || m.metabolicImpact,
      nutrition_reasoning: m.nutrition_reasoning || m.nutritionReasoning,
      meal_type: m.meal_type || m.mealType,
      image_url: m.image_url || m.imageUrl,
      image_urls: m.image_urls || m.imageUrls || (m.image_data ? [m.image_data] : []),
      foods: m.foods || [],
      nutrition: m.nutrition,
      ai_metadata: m.ai_metadata || m.aiMetadata,
      consumed_at: consumedAt,
      consumedAt: consumedAt,
      date_status: m.date_status || m.dateStatus || "exact",
      created_at: m.created_at || m.createdAt,
    };
  },

  toPublicHydrationEntry(entry: NormalizedHydrationEntry | any) {
    if (!entry) return null;
    const e = entry.toObject ? normalizeMongoHydrationEntry(entry) : entry;
    return {
      id: String(e.id || e._id),
      user_email: e.user_email || e.userEmail,
      amount_ml: Number(e.amount_ml ?? e.amountMl) || 0,
      amountMl: Number(e.amountMl ?? e.amount_ml) || 0,
      beverage_type: e.beverage_type || e.beverageType || "Water",
      beverageType: e.beverageType || e.beverage_type || "Water",
      consumed_at: e.consumed_at || e.consumedAt || new Date().toISOString(),
      consumedAt: e.consumedAt || e.consumed_at || new Date().toISOString(),
      source: e.source || "manual",
      notes: e.notes || "",
      created_at: e.created_at || e.createdAt || new Date().toISOString(),
    };
  },

  // User retrieval
  async findUserByEmail(email: string, includePassword = false): Promise<NormalizedUser | null> {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return null;

    if (isMongoActive()) {
      try {
        const query = UserModel.findOne({ email: normalizedEmail });
        if (includePassword) query.select("+passwordHash");
        const doc = await query.exec();
        if (doc) return normalizeMongoUser(doc);
      } catch (err) {
        console.warn("MongoDB findUserByEmail error, falling back to SQLite:", err);
      }
    }

    try {
      const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
      if (row) return normalizeSqliteUser(row);
    } catch (err) {
      console.warn("SQLite findUserByEmail error:", err);
    }
    return null;
  },

  async findUserByIdOrEmail(id: string, email?: string): Promise<NormalizedUser | null> {
    if (isMongoActive()) {
      try {
        if (mongoose.isValidObjectId(id)) {
          const doc = await UserModel.findById(id);
          if (doc) return normalizeMongoUser(doc);
        }
        if (email) {
          const doc = await UserModel.findOne({ email: String(email).toLowerCase() });
          if (doc) return normalizeMongoUser(doc);
        }
      } catch (err) {
        console.warn("MongoDB findUserByIdOrEmail error, falling back to SQLite:", err);
      }
    }

    try {
      let row = null;
      if (!isNaN(Number(id))) {
        row = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(id));
      }
      if (!row && email) {
        row = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email).toLowerCase());
      }
      if (!row) {
        row = db.prepare("SELECT * FROM users WHERE id = ? OR email = ?").get(id, id);
      }
      if (row) return normalizeSqliteUser(row);
    } catch (err) {
      console.warn("SQLite findUserByIdOrEmail error:", err);
    }
    return null;
  },

  async createUser(data: {
    name: string;
    email: string;
    passwordHash?: string;
    age?: number;
    weight?: number;
    height?: number;
    gender?: string;
  }): Promise<NormalizedUser> {
    const normalizedEmail = String(data.email).trim().toLowerCase();
    const age = data.age || 18;
    const weight = data.weight || 60;
    const height = data.height || 170;
    const gender = data.gender || "unspecified";
    const heightM = height / 100;
    const bmi = heightM > 0 ? parseFloat((weight / (heightM * heightM)).toFixed(1)) : 21.5;
    const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
    const tdee = Math.round(bmr * 1.4);

    let mongoCreated: any = null;
    if (isMongoActive()) {
      try {
        mongoCreated = await UserModel.create({
          name: data.name.trim(),
          email: normalizedEmail,
          passwordHash: data.passwordHash,
          age,
          weight,
          height,
          gender,
          bmi,
          bmr,
          tdee,
          nutritionGoal: "Healthy eating",
          dietaryPreference: "Omnivore",
          activityLevel: "Moderate",
          calorieTarget: 2100,
          proteinTarget: 120,
          carbsTarget: 200,
          fatsTarget: 60,
        });
      } catch (err) {
        console.warn("MongoDB createUser failed, falling back to SQLite:", err);
      }
    }

    // Always keep SQLite in sync
    try {
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail) as any;
      if (!existing) {
        const info = db.prepare(`
          INSERT INTO users (name, email, password_hash, age, weight, height, gender, bmi, bmr, tdee, goal, dietary_pref, activity_level, calorie_target, protein_target, carbs_target, fats_target)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Healthy eating', 'Omnivore', 'Moderate', 2100, 120, 200, 60)
        `).run(data.name.trim(), normalizedEmail, data.passwordHash || null, age, weight, height, gender, bmi, bmr, tdee);
        
        if (!mongoCreated) {
          const row = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
          return normalizeSqliteUser(row);
        }
      }
    } catch (err) {
      console.warn("SQLite insert mirror note:", err);
    }

    if (mongoCreated) return normalizeMongoUser(mongoCreated);
    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
    return normalizeSqliteUser(row);
  },

  async updateUser(user: NormalizedUser, update: Record<string, any>): Promise<NormalizedUser> {
    const fields: Record<string, string> = {
      name: "name", age: "age", weight: "weight", height: "height", gender: "gender",
      bmi: "bmi", bmr: "bmr", tdee: "tdee",
      goal: "nutritionGoal", nutritionGoal: "nutritionGoal",
      dietary_pref: "dietaryPreference", dietaryPreference: "dietaryPreference",
      activity_level: "activityLevel", activityLevel: "activityLevel",
      calorie_target: "calorieTarget", calorieTarget: "calorieTarget",
      protein_target: "proteinTarget", proteinTarget: "proteinTarget",
      carbs_target: "carbsTarget", carbsTarget: "carbsTarget",
      fats_target: "fatsTarget", fatsTarget: "fatsTarget",
      budget: "budget", hostel_context: "hostelContext", hostelContext: "hostelContext",
      email_verified: "emailVerified", emailVerified: "emailVerified",
    };

    const mongoSet: Record<string, any> = {};
    for (const [key, val] of Object.entries(update)) {
      if (val !== undefined && fields[key]) {
        mongoSet[fields[key]] = val;
      }
    }

    if (isMongoActive() && mongoose.isValidObjectId(user.id)) {
      try {
        const updated = await UserModel.findByIdAndUpdate(user.id, { $set: mongoSet }, { new: true });
        if (updated) {
          await NutritionGoalModel.findOneAndUpdate(
            { userId: user.id },
            {
              userId: user.id,
              goal: updated.nutritionGoal || "Healthy eating",
              calories: updated.calorieTarget,
              protein: updated.proteinTarget,
              carbs: updated.carbsTarget,
              fats: updated.fatsTarget,
            },
            { upsert: true }
          );
          return normalizeMongoUser(updated);
        }
      } catch (err) {
        console.warn("MongoDB updateUser failed, falling back to SQLite:", err);
      }
    }

    // Update SQLite
    try {
      const sqliteSets: string[] = [];
      const sqliteVals: any[] = [];
      const sqliteFieldMap: Record<string, string> = {
        name: "name", age: "age", weight: "weight", height: "height", gender: "gender",
        bmi: "bmi", bmr: "bmr", tdee: "tdee",
        goal: "goal", nutritionGoal: "goal",
        dietary_pref: "dietary_pref", dietaryPreference: "dietary_pref",
        activity_level: "activity_level", activityLevel: "activity_level",
        calorie_target: "calorie_target", calorieTarget: "calorie_target",
        protein_target: "protein_target", proteinTarget: "protein_target",
        carbs_target: "carbs_target", carbsTarget: "carbs_target",
        fats_target: "fats_target", fatsTarget: "fats_target",
        budget: "budget", hostel_context: "hostel_context", hostelContext: "hostel_context",
        email_verified: "email_verified", emailVerified: "email_verified",
      };

      for (const [key, val] of Object.entries(update)) {
        if (val !== undefined && sqliteFieldMap[key]) {
          sqliteSets.push(`${sqliteFieldMap[key]} = ?`);
          sqliteVals.push(typeof val === "boolean" ? (val ? 1 : 0) : val);
        }
      }

      if (sqliteSets.length > 0) {
        sqliteSets.push("updated_at = CURRENT_TIMESTAMP");
        sqliteVals.push(user.email);
        db.prepare(`UPDATE users SET ${sqliteSets.join(", ")} WHERE email = ?`).run(...sqliteVals);
      }

      const row = db.prepare("SELECT * FROM users WHERE email = ?").get(user.email);
      if (row) return normalizeSqliteUser(row);
    } catch (err) {
      console.warn("SQLite updateUser error:", err);
    }

    return user;
  },

  // Meals
  async getMeals(user: NormalizedUser, options?: { date?: string; timezone?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<NormalizedMeal[]> {
    const tz = getUserTimezone(user, options?.timezone);
    let startDate = options?.startDate;
    let endDate = options?.endDate;

    if (options?.date) {
      const { startUTC, endUTC } = getDayBoundariesUTC(options.date, tz);
      startDate = startUTC;
      endDate = endUTC;
    }

    if (isMongoActive() && mongoose.isValidObjectId(user.id)) {
      try {
        const query: any = { userId: user.id };
        if (startDate || endDate) {
          query.consumedAt = {};
          if (startDate) query.consumedAt.$gte = startDate;
          if (endDate) query.consumedAt.$lt = endDate;
        }
        const docs = await MealModel.find(query).sort({ consumedAt: -1, createdAt: -1 }).limit(options?.limit || 500);
        return docs.map(normalizeMongoMeal);
      } catch (err) {
        console.warn("MongoDB getMeals failed, falling back to SQLite:", err);
      }
    }

    try {
      let sql = "SELECT * FROM meals WHERE user_email = ?";
      const params: any[] = [user.email];

      if (startDate && endDate) {
        sql += " AND datetime(consumed_at) >= datetime(?) AND datetime(consumed_at) < datetime(?)";
        params.push(startDate.toISOString(), endDate.toISOString());
      } else if (startDate) {
        sql += " AND datetime(consumed_at) >= datetime(?)";
        params.push(startDate.toISOString());
      } else if (endDate) {
        sql += " AND datetime(consumed_at) < datetime(?)";
        params.push(endDate.toISOString());
      }

      sql += ` ORDER BY datetime(consumed_at) DESC, datetime(created_at) DESC LIMIT ${options?.limit || 500}`;
      const rows = db.prepare(sql).all(...params) as any[];
      return rows.map(normalizeSqliteMeal);
    } catch (err) {
      console.warn("SQLite getMeals error:", err);
      return [];
    }
  },

  async getMealById(id: string, user: NormalizedUser): Promise<NormalizedMeal | null> {
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      try {
        const doc = await MealModel.findOne({ _id: id, userId: user.id });
        if (doc) return normalizeMongoMeal(doc);
      } catch (err) {
        console.warn("MongoDB getMealById failed, falling back to SQLite:", err);
      }
    }

    try {
      const row = db.prepare("SELECT * FROM meals WHERE id = ? AND user_email = ?").get(id, user.email);
      if (row) return normalizeSqliteMeal(row);
    } catch (err) {
      console.warn("SQLite getMealById error:", err);
    }
    return null;
  },

  async createMeal(user: NormalizedUser, mealData: Record<string, any>): Promise<NormalizedMeal> {
    const mealId = mealData.id || crypto.randomUUID();
    const foodName = mealData.food_name || mealData.foodName || "Logged Meal";
    const calories = Number(mealData.calories) || 0;
    const protein = Number(mealData.protein) || 0;
    const carbs = Number(mealData.carbs) || 0;
    const fats = Number(mealData.fats) || 0;
    const fiber = Number(mealData.fiber) || 0;
    const glycemicIndex = mealData.glycemic_index || mealData.glycemicIndex || "Medium";
    const metabolicImpact = mealData.metabolic_impact || mealData.metabolicImpact || "";
    const nutritionReasoning = mealData.nutrition_reasoning || mealData.nutritionReasoning || "";
    const mealType = mealData.meal_type || mealData.mealType || "Snack";
    const imageUrl = mealData.image_url || mealData.imageUrl;
    const imageUrls = mealData.image_urls || mealData.imageUrls || (mealData.image_data ? [mealData.image_data] : []);
    const imageData = mealData.image_data || mealData.imageData || (imageUrls.length ? imageUrls[0] : undefined);
    const foods = mealData.foods || [];
    const nutrition = mealData.nutrition || null;
    const aiMetadata = mealData.ai_metadata || mealData.aiMetadata || null;

    const rawConsumed = mealData.consumed_at || mealData.consumedAt || mealData.consumedDate || mealData.date || mealData.created_at;
    const consumedAt = rawConsumed ? new Date(rawConsumed) : new Date();
    const dateStatus = mealData.date_status || mealData.dateStatus || "exact";
    const createdAt = mealData.created_at ? new Date(mealData.created_at) : new Date();

    const waterContentMl = mealData.water_content_ml !== undefined && mealData.water_content_ml !== null ? Number(mealData.water_content_ml) : (mealData.waterContentMl !== undefined && mealData.waterContentMl !== null ? Number(mealData.waterContentMl) : null);
    const waterContentConfidence = mealData.water_content_confidence !== undefined && mealData.water_content_confidence !== null ? Number(mealData.water_content_confidence) : (mealData.waterContentConfidence !== undefined && mealData.waterContentConfidence !== null ? Number(mealData.waterContentConfidence) : null);

    let mongoMeal: any = null;
    if (isMongoActive() && mongoose.isValidObjectId(user.id)) {
      try {
        mongoMeal = await MealModel.create({
          userId: user.id,
          foodName,
          calories,
          protein,
          carbs,
          fats,
          fiber,
          waterContentMl,
          waterContentConfidence,
          glycemicIndex,
          metabolicImpact,
          nutritionReasoning,
          mealType,
          imageUrl,
          imageUrls,
          imageData,
          foods,
          nutrition,
          aiMetadata,
          consumedAt,
          dateStatus,
          createdAt,
          updatedAt: createdAt,
        });
      } catch (err) {
        console.warn("MongoDB createMeal failed, falling back to SQLite:", err);
      }
    }

    // Always mirror to SQLite
    try {
      db.prepare(`
        INSERT INTO meals (id, user_email, food_name, calories, protein, carbs, fats, fiber, water_content_ml, water_content_confidence, glycemic_index, metabolic_impact, nutrition_reasoning, meal_type, image_data, consumed_at, date_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        mongoMeal ? String(mongoMeal._id) : mealId,
        user.email,
        foodName,
        calories,
        protein,
        carbs,
        fats,
        fiber,
        waterContentMl,
        waterContentConfidence,
        glycemicIndex,
        metabolicImpact,
        nutritionReasoning,
        mealType,
        imageData || null,
        consumedAt.toISOString(),
        dateStatus,
        createdAt.toISOString()
      );
    } catch (err) {
      console.warn("SQLite meal mirror note:", err);
    }

    if (mongoMeal) return normalizeMongoMeal(mongoMeal);
    const row = db.prepare("SELECT * FROM meals WHERE id = ?").get(mealId);
    return normalizeSqliteMeal(row || {
      id: mealId,
      user_email: user.email,
      food_name: foodName,
      calories, protein, carbs, fats, fiber,
      water_content_ml: waterContentMl,
      water_content_confidence: waterContentConfidence,
      glycemic_index: glycemicIndex,
      metabolic_impact: metabolicImpact,
      nutrition_reasoning: nutritionReasoning,
      meal_type: mealType,
      image_data: imageData,
      consumed_at: consumedAt.toISOString(),
      date_status: dateStatus,
      created_at: createdAt.toISOString(),
    });
  },

  async updateMeal(id: string, user: NormalizedUser, updates: any): Promise<NormalizedMeal | null> {
    const foodName = updates.food_name || updates.foodName;
    const calories = updates.calories !== undefined ? Math.max(0, Math.round(Number(updates.calories) || 0)) : undefined;
    const protein = updates.protein !== undefined ? Math.max(0, Math.round((Number(updates.protein) || 0) * 10) / 10) : undefined;
    const carbs = updates.carbs !== undefined ? Math.max(0, Math.round((Number(updates.carbs) || 0) * 10) / 10) : undefined;
    const fats = updates.fats !== undefined ? Math.max(0, Math.round((Number(updates.fats) || 0) * 10) / 10) : undefined;
    const fiber = updates.fiber !== undefined ? Math.max(0, Math.round((Number(updates.fiber) || 0) * 10) / 10) : undefined;
    const waterContentMl = updates.water_content_ml !== undefined ? (updates.water_content_ml === null ? null : Number(updates.water_content_ml)) : (updates.waterContentMl !== undefined ? (updates.waterContentMl === null ? null : Number(updates.waterContentMl)) : undefined);
    const waterContentConfidence = updates.water_content_confidence !== undefined ? (updates.water_content_confidence === null ? null : Number(updates.water_content_confidence)) : (updates.waterContentConfidence !== undefined ? (updates.waterContentConfidence === null ? null : Number(updates.waterContentConfidence)) : undefined);
    const mealType = updates.meal_type || updates.mealType;

    const rawConsumed = updates.consumed_at || updates.consumedAt || updates.consumedDate || updates.date;
    const consumedAt = rawConsumed ? new Date(rawConsumed) : undefined;
    const dateStatus = updates.date_status || updates.dateStatus;

    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      try {
        const mongoUpdates: any = {};
        if (foodName !== undefined) mongoUpdates.foodName = foodName;
        if (calories !== undefined) mongoUpdates.calories = calories;
        if (protein !== undefined) mongoUpdates.protein = protein;
        if (carbs !== undefined) mongoUpdates.carbs = carbs;
        if (fats !== undefined) mongoUpdates.fats = fats;
        if (fiber !== undefined) mongoUpdates.fiber = fiber;
        if (waterContentMl !== undefined) mongoUpdates.waterContentMl = waterContentMl;
        if (waterContentConfidence !== undefined) mongoUpdates.waterContentConfidence = waterContentConfidence;
        if (mealType !== undefined) mongoUpdates.mealType = mealType;
        if (consumedAt !== undefined) mongoUpdates.consumedAt = consumedAt;
        if (dateStatus !== undefined) mongoUpdates.dateStatus = dateStatus;
        mongoUpdates.updatedAt = new Date();

        const doc = await MealModel.findOneAndUpdate({ _id: id, userId: user.id }, { $set: mongoUpdates }, { new: true });
        if (doc) return normalizeMongoMeal(doc);
      } catch (err) {
        console.warn("MongoDB updateMeal failed, falling back to SQLite:", err);
      }
    }

    try {
      const sets: string[] = [];
      const vals: any[] = [];
      if (foodName !== undefined) { sets.push("food_name = ?"); vals.push(foodName); }
      if (calories !== undefined) { sets.push("calories = ?"); vals.push(calories); }
      if (protein !== undefined) { sets.push("protein = ?"); vals.push(protein); }
      if (carbs !== undefined) { sets.push("carbs = ?"); vals.push(carbs); }
      if (fats !== undefined) { sets.push("fats = ?"); vals.push(fats); }
      if (fiber !== undefined) { sets.push("fiber = ?"); vals.push(fiber); }
      if (waterContentMl !== undefined) { sets.push("water_content_ml = ?"); vals.push(waterContentMl); }
      if (waterContentConfidence !== undefined) { sets.push("water_content_confidence = ?"); vals.push(waterContentConfidence); }
      if (mealType !== undefined) { sets.push("meal_type = ?"); vals.push(mealType); }
      if (consumedAt !== undefined) { sets.push("consumed_at = ?"); vals.push(consumedAt.toISOString()); }
      if (dateStatus !== undefined) { sets.push("date_status = ?"); vals.push(dateStatus); }
      
      if (sets.length > 0) {
        vals.push(id, user.email);
        db.prepare(`UPDATE meals SET ${sets.join(", ")} WHERE id = ? AND user_email = ?`).run(...vals);
      }
      const row = db.prepare("SELECT * FROM meals WHERE id = ? AND user_email = ?").get(id, user.email);
      if (row) return normalizeSqliteMeal(row);
    } catch (err) {
      console.warn("SQLite updateMeal error:", err);
    }

    return this.getMealById(id, user);
  },

  async deleteMeal(id: string, user: NormalizedUser): Promise<number> {
    let deletedCount = 0;
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      try {
        const res = await MealModel.deleteOne({ _id: id, userId: user.id });
        deletedCount = res.deletedCount || 0;
      } catch (err) {
        console.warn("MongoDB deleteMeal failed, falling back to SQLite:", err);
      }
    }

    try {
      const res = db.prepare("DELETE FROM meals WHERE (id = ? OR id = ?) AND user_email = ?").run(id, id, user.email);
      deletedCount = Math.max(deletedCount, res.changes);
    } catch (err) {
      console.warn("SQLite deleteMeal error:", err);
    }
    return deletedCount;
  },

  async batchSyncMeals(user: NormalizedUser, meals: any[]): Promise<NormalizedMeal[]> {
    for (const meal of meals) {
      await this.createMeal(user, meal);
    }
    return this.getMeals(user, { limit: 200 });
  },

  // Authoritative Daily Dashboard Calculation
  async getDashboardToday(user: NormalizedUser, options: { timezone?: string; date?: string } = {}) {
    const tz = getUserTimezone(user, options.timezone);
    const dateStr = options.date || getTodayDateString(tz);
    const { startUTC, endUTC } = getDayBoundariesUTC(dateStr, tz);

    const todayMeals = await this.getMeals(user, { startDate: startUTC, endDate: endUTC });
    const hydrationToday = await this.getHydrationToday(user, { timezone: tz, date: dateStr });

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalFiber = 0;

    for (const meal of todayMeals) {
      totalCalories += Number(meal.calories) || 0;
      totalProtein += Number(meal.protein) || 0;
      totalCarbs += Number(meal.carbs) || 0;
      totalFats += Number(meal.fats) || 0;
      totalFiber += Number(meal.fiber) || 0;
    }

    const targetCalories = Math.max(500, Math.round(Number(user.calorie_target || user.calorieTarget) || 2100));
    const targetProtein = Math.max(20, Math.round(Number(user.protein_target || user.proteinTarget) || 120));
    const targetCarbs = Math.max(20, Math.round(Number(user.carbs_target || user.carbsTarget) || 200));
    const targetFats = Math.max(10, Math.round(Number(user.fats_target || user.fatsTarget) || 60));

    // Dynamic burned calories based on BMR / TDEE baseline activity
    const tdee = Number(user.tdee) || 2100;
    const bmr = Number(user.bmr) || 1600;
    const activityBurn = Math.max(150, Math.round((tdee - bmr) * 0.7));

    const totalWaterEatenMl = todayMeals.reduce((acc, m) => acc + (Number(m.water_content_ml) || 0), 0);
    const totalWaterBeverageMl = (hydrationToday.entries || []).reduce((acc: number, e: any) => acc + (Number(e.amount_ml || e.amountMl) || 0), 0);
    const totalWaterMl = totalWaterBeverageMl + totalWaterEatenMl;

    return {
      date: dateStr,
      timezone: tz,
      calories: {
        target: targetCalories,
        eaten: Math.round(totalCalories),
        remaining: Math.max(0, Math.round(targetCalories - totalCalories)),
        burned: activityBurn,
      },
      macros: {
        protein: { eaten: Math.round(totalProtein * 10) / 10, target: targetProtein },
        carbs: { eaten: Math.round(totalCarbs * 10) / 10, target: targetCarbs },
        fat: { eaten: Math.round(totalFats * 10) / 10, target: targetFats },
        fiber: { eaten: Math.round(totalFiber * 10) / 10 },
      },
      water: {
        consumedMl: totalWaterMl,
        beverageMl: totalWaterBeverageMl,
        foodWaterMl: totalWaterEatenMl,
        goalMl: 3000, // Or dynamic hydration target
      },
      mealCount: todayMeals.length,
      meals: todayMeals.map((m) => this.toPublicMeal(m)),
      totals: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fats: Math.round(totalFats * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10,
      },
    };
  },

  // AI & Scans
  async countDailyScans(user: NormalizedUser, sinceDate: Date): Promise<number> {
    if (isMongoActive() && mongoose.isValidObjectId(user.id)) {
      try {
        return await AIAnalysisModel.countDocuments({
          userId: user.id,
          analysisType: "food_scan",
          createdAt: { $gte: sinceDate },
        });
      } catch (err) {
        console.warn("MongoDB countDailyScans fallback:", err);
      }
    }

    try {
      const count = db.prepare(`
        SELECT COUNT(*) as cnt FROM recommendations
        WHERE user_email = ? AND recommendation_type = 'food_scan' AND datetime(created_at) >= datetime(?)
      `).get(user.email, sinceDate.toISOString()) as any;
      return count?.cnt || 0;
    } catch {
      return 0;
    }
  },

  async recordAiAnalysis(user: NormalizedUser, type: string, input: any, output: any, status = "success"): Promise<void> {
    if (isMongoActive() && mongoose.isValidObjectId(user.id)) {
      try {
        await AIAnalysisModel.create({
          userId: user.id,
          analysisType: type,
          input,
          output,
          status,
        });
      } catch (err) {
        // Safe non-blocking log
      }
    }

    try {
      db.prepare(`
        INSERT INTO recommendations (user_email, recommendation_type, content_json, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(user.email, type, JSON.stringify({ input, output, status }));
    } catch {
      // Non-blocking
    }
  },

  // ==========================================
  // HYDRATION ENGINE PERSISTENCE
  // ==========================================

  async createHydrationEntry(user: NormalizedUser, entryData: {
    amountMl: number;
    beverageType?: string;
    consumedAt?: string | Date;
    source?: string;
    notes?: string;
  }): Promise<NormalizedHydrationEntry> {
    const entryId = crypto.randomUUID();
    const amountMl = Math.max(1, Math.min(10000, Math.round(Number(entryData.amountMl) || 250)));
    const beverageType = entryData.beverageType || "Water";
    const consumedAt = entryData.consumedAt ? new Date(entryData.consumedAt) : new Date();
    const source = entryData.source || "manual";
    const notes = entryData.notes || "";

    let mongoEntry: any = null;
    if (isMongoActive() && mongoose.isValidObjectId(user.id)) {
      try {
        mongoEntry = await HydrationEntryModel.create({
          userId: user.id,
          userEmail: user.email,
          amountMl,
          beverageType,
          consumedAt,
          source,
          notes,
        });
      } catch (err) {
        console.warn("MongoDB createHydrationEntry failed, falling back to SQLite:", err);
      }
    }

    try {
      db.prepare(`
        INSERT INTO hydration_entries (id, user_email, user_id, amount_ml, beverage_type, consumed_at, source, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        mongoEntry ? String(mongoEntry._id) : entryId,
        user.email,
        user.id || null,
        amountMl,
        beverageType,
        consumedAt.toISOString(),
        source,
        notes,
        new Date().toISOString()
      );
    } catch (err) {
      console.warn("SQLite hydration mirror note:", err);
    }

    if (mongoEntry) return normalizeMongoHydrationEntry(mongoEntry);
    const row = db.prepare("SELECT * FROM hydration_entries WHERE id = ?").get(entryId);
    return normalizeSqliteHydrationEntry(row || {
      id: entryId,
      user_email: user.email,
      amount_ml: amountMl,
      beverage_type: beverageType,
      consumed_at: consumedAt.toISOString(),
      source,
      notes,
      created_at: new Date().toISOString(),
    });
  },

  async getHydrationEntries(user: NormalizedUser, options: {
    startDate?: Date;
    endDate?: Date;
    date?: string;
    timezone?: string;
    limit?: number;
  } = {}): Promise<NormalizedHydrationEntry[]> {
    const limit = options.limit || 500;
    const tz = getUserTimezone(user, options.timezone);
    let startDate = options.startDate;
    let endDate = options.endDate;

    if (options.date) {
      const { startUTC, endUTC } = getDayBoundariesUTC(options.date, tz);
      startDate = startUTC;
      endDate = endUTC;
    }

    if (isMongoActive() && mongoose.isValidObjectId(user.id)) {
      try {
        const query: any = {
          $or: [{ userId: user.id }, { userEmail: user.email.toLowerCase() }],
        };
        if (startDate || endDate) {
          query.consumedAt = {};
          if (startDate) query.consumedAt.$gte = startDate;
          if (endDate) query.consumedAt.$lt = endDate;
        }
        const docs = await HydrationEntryModel.find(query)
          .sort({ consumedAt: -1 })
          .limit(limit);
        if (docs && docs.length > 0) {
          return docs.map(normalizeMongoHydrationEntry);
        }
      } catch (err) {
        console.warn("MongoDB getHydrationEntries failed, falling back to SQLite:", err);
      }
    }

    try {
      let sql = "SELECT * FROM hydration_entries WHERE user_email = ?";
      const params: any[] = [user.email];

      if (startDate && endDate) {
        sql += " AND datetime(consumed_at) >= datetime(?) AND datetime(consumed_at) < datetime(?)";
        params.push(startDate.toISOString(), endDate.toISOString());
      } else if (startDate) {
        sql += " AND datetime(consumed_at) >= datetime(?)";
        params.push(startDate.toISOString());
      } else if (endDate) {
        sql += " AND datetime(consumed_at) < datetime(?)";
        params.push(endDate.toISOString());
      }
      sql += " ORDER BY datetime(consumed_at) DESC LIMIT ?";
      params.push(limit);

      const rows = db.prepare(sql).all(...params);
      return rows.map(normalizeSqliteHydrationEntry);
    } catch (err) {
      console.warn("SQLite getHydrationEntries error:", err);
      return [];
    }
  },

  async deleteHydrationEntry(id: string, user: NormalizedUser): Promise<number> {
    let deletedCount = 0;
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      try {
        const res = await HydrationEntryModel.deleteOne({
          _id: id,
          $or: [{ userId: user.id }, { userEmail: user.email.toLowerCase() }],
        });
        deletedCount = res.deletedCount || 0;
      } catch (err) {
        console.warn("MongoDB deleteHydrationEntry failed, falling back to SQLite:", err);
      }
    }

    try {
      const res = db.prepare("DELETE FROM hydration_entries WHERE id = ? AND user_email = ?").run(id, user.email);
      deletedCount = Math.max(deletedCount, res.changes);
    } catch (err) {
      console.warn("SQLite deleteHydrationEntry error:", err);
    }
    return deletedCount;
  },

  async getHydrationToday(user: NormalizedUser, options: { timezone?: string; date?: string } = {}) {
    const tz = getUserTimezone(user, options.timezone);
    const localDateStr = options.date || getTodayDateString(tz);
    const { startUTC, endUTC } = getDayBoundariesUTC(localDateStr, tz);

    const entries = await this.getHydrationEntries(user, { startDate: startUTC, endDate: endUTC });
    const meals = await this.getMeals(user, { startDate: startUTC, endDate: endUTC });

    const totalBeverageMl = entries.reduce((acc, e) => acc + (Number(e.amount_ml || e.amountMl) || 0), 0);
    const totalFoodWaterMl = meals.reduce((acc, m) => acc + (Number(m.water_content_ml || m.waterContentMl) || 0), 0);

    return {
      date: localDateStr,
      timezone: tz,
      totalConsumedMl: totalBeverageMl + totalFoodWaterMl,
      beverageMl: totalBeverageMl,
      foodWaterMl: totalFoodWaterMl,
      hydrationGoalMl: 3000,
      entries,
      meals,
    };
  },
};
