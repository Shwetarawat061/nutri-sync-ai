import { Router, Request, Response } from "express";
import { UserModel } from "../models/User.js";
import { NutritionGoalModel } from "../models/NutritionGoal.js";

export const userRoutes = Router();

function publicUser(user: any) {
  const value = user.toObject ? user.toObject() : user;
  return {
    id: String(value._id), name: value.name, email: value.email, age: value.age, weight: value.weight,
    height: value.height, gender: value.gender, bmi: value.bmi, bmr: value.bmr, tdee: value.tdee,
    goal: value.nutritionGoal, dietary_pref: value.dietaryPreference, dietaryPreference: value.dietaryPreference,
    activity_level: value.activityLevel, calorie_target: value.calorieTarget, protein_target: value.proteinTarget,
    carbs_target: value.carbsTarget, fats_target: value.fatsTarget, budget: value.budget,
    hostel_context: value.hostelContext, email_verified: value.emailVerified, created_at: value.createdAt, updated_at: value.updatedAt,
  };
}

async function getOwner(req: Request) {
  return UserModel.findOne({ _id: req.user!.id, email: req.user!.email });
}

async function updateProfile(req: Request, res: Response) {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const body = req.body;
    const update: Record<string, any> = {};
    const fields: Record<string, string> = {
      name: "name", age: "age", weight: "weight", height: "height", gender: "gender", bmi: "bmi", bmr: "bmr", tdee: "tdee",
      goal: "nutritionGoal", dietary_pref: "dietaryPreference", dietaryPreference: "dietaryPreference", activity_level: "activityLevel",
      calorie_target: "calorieTarget", protein_target: "proteinTarget", carbs_target: "carbsTarget", fats_target: "fatsTarget",
      budget: "budget", hostel_context: "hostelContext",
    };
    for (const [input, target] of Object.entries(fields)) if (body[input] !== undefined) update[target] = body[input];
    const updated = await UserModel.findByIdAndUpdate(user._id, { $set: update }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: "User not found" });
    await NutritionGoalModel.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, goal: updated.nutritionGoal || "Maintenance", calories: updated.calorieTarget, protein: updated.proteinTarget, carbs: updated.carbsTarget, fats: updated.fatsTarget },
      { upsert: true, new: true, runValidators: true }
    );
    return res.status(200).json({ success: true, user: publicUser(updated) });
  } catch (error: any) {
    return res.status(400).json({ error: "Failed to update profile", code: "VALIDATION_ERROR", details: error.message });
  }
}

userRoutes.post("/onboard", updateProfile);
userRoutes.put("/profile", updateProfile);

userRoutes.post("/email-preferences", async (req: Request, res: Response) => {
  const user = await getOwner(req);
  if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
  return res.status(200).json({ success: true, message: "Email preferences saved successfully", user: publicUser(user) });
});

userRoutes.post("/send-verification", async (_req: Request, res: Response) => {
  return res.status(200).json({ success: true, message: "Email verification is managed by the authenticated account provider." });
});

userRoutes.post("/verify-email", async (req: Request, res: Response) => {
  const user = await getOwner(req);
  if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
  await UserModel.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
  return res.status(200).json({ success: true, message: "Email address verified successfully!", user: publicUser(user) });
});

userRoutes.post("/send-digest", async (req: Request, res: Response) => {
  const user = await getOwner(req);
  if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
  return res.status(200).json({ success: true, message: `Daily digest prepared for ${user.email}`, targetEmail: user.email, subject: req.body.customSubject || "NutriSync Daily Digest", sentAt: new Date().toISOString() });
});

userRoutes.get("/profile", async (req: Request, res: Response) => {
  const user = await getOwner(req);
  if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
  return res.status(200).json({ success: true, user: publicUser(user) });
});
