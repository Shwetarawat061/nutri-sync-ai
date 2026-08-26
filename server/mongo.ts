import mongoose from "mongoose";
import { db } from "./db.js";
import { UserModel } from "./models/User.js";
import { MealModel } from "./models/Meal.js";
import { NutritionGoalModel } from "./models/NutritionGoal.js";

let connectionPromise: Promise<typeof mongoose> | null = null;

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is required for MongoDB persistence");
  return uri;
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  connectionPromise ??= mongoose.connect(getMongoUri(), {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  return connectionPromise;
}

export async function migrateSqliteToMongo(): Promise<void> {
  await connectMongo();
  const migrationKey = "sqlite-to-mongo-v1";
  const migrations = mongoose.connection.db!.collection<{ _id: string; completedAt: Date }>("_migrations");
  const migrationState = await migrations.findOne({ _id: migrationKey });
  if (migrationState) return;

  const sqliteUsers = db.prepare("SELECT * FROM users ORDER BY id ASC").all() as any[];
  const userIdMap = new Map<number, mongoose.Types.ObjectId>();
  for (const user of sqliteUsers) {
    const existing = await UserModel.findOne({ email: String(user.email).toLowerCase() } as any);
    const mongoUser = existing || await UserModel.create({
      legacyId: user.id,
      name: user.name,
      email: String(user.email).toLowerCase(),
      ...(user.password_hash ? { passwordHash: user.password_hash } : {}),
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activity_level,
      nutritionGoal: user.goal,
      dietaryPreference: user.dietary_pref,
      bmi: user.bmi,
      bmr: user.bmr,
      tdee: user.tdee,
      calorieTarget: user.calorie_target,
      proteinTarget: user.protein_target,
      carbsTarget: user.carbs_target,
      fatsTarget: user.fats_target,
      budget: user.budget,
      hostelContext: user.hostel_context,
      emailVerified: Boolean(user.email_verified),
      createdAt: user.created_at ? new Date(user.created_at) : undefined,
      updatedAt: user.updated_at ? new Date(user.updated_at) : undefined,
    });
    userIdMap.set(Number(user.id), mongoUser._id);
  }

  const sqliteMeals = db.prepare("SELECT * FROM meals ORDER BY created_at ASC").all() as any[];
  for (const meal of sqliteMeals) {
    const owner = sqliteUsers.find((user) => String(user.email).toLowerCase() === String(meal.user_email).toLowerCase());
    const userId = owner ? userIdMap.get(Number(owner.id)) : undefined;
    if (!userId) continue;
    await MealModel.updateOne(
      { legacyId: meal.id, userId },
      {
        $setOnInsert: {
          legacyId: meal.id,
          userId,
          foodName: meal.food_name,
          calories: Number(meal.calories) || 0,
          protein: Number(meal.protein) || 0,
          carbs: Number(meal.carbs) || 0,
          fats: Number(meal.fats) || 0,
          fiber: Number(meal.fiber) || 0,
          glycemicIndex: meal.glycemic_index || "Medium",
          metabolicImpact: meal.metabolic_impact || "",
          nutritionReasoning: meal.nutrition_reasoning || "",
          mealType: meal.meal_type || "Snack",
          imageData: meal.image_data || undefined,
          createdAt: meal.created_at ? new Date(meal.created_at) : undefined,
          updatedAt: meal.created_at ? new Date(meal.created_at) : undefined,
        },
      },
      { upsert: true }
    );
  }

  for (const user of sqliteUsers) {
    const userId = userIdMap.get(Number(user.id));
    if (!userId) continue;
    await NutritionGoalModel.updateOne(
      { userId },
      {
        $set: {
          goal: user.goal || "Maintenance",
          calories: Number(user.calorie_target) || 2100,
          protein: Number(user.protein_target) || 120,
          carbs: Number(user.carbs_target) || 200,
          fats: Number(user.fats_target) || 60,
        },
        $setOnInsert: { userId },
      },
      { upsert: true }
    );
  }

  await migrations.insertOne({ _id: migrationKey, completedAt: new Date() });
}

export async function closeMongo(): Promise<void> {
  connectionPromise = null;
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
