import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { UserModel } from "../models/User.js";
import { authenticateUser, revokeAuthToken, signAuthToken } from "../middleware/auth.js";

export const authRoutes = Router();

function publicUser(user: any) {
  const value = user.toObject ? user.toObject() : user;
  return { id: String(value._id), name: value.name, email: value.email, age: value.age, weight: value.weight, height: value.height, gender: value.gender, bmi: value.bmi, bmr: value.bmr, tdee: value.tdee, goal: value.nutritionGoal, dietary_pref: value.dietaryPreference, activity_level: value.activityLevel, calorie_target: value.calorieTarget, protein_target: value.proteinTarget, carbs_target: value.carbsTarget, fats_target: value.fatsTarget, budget: value.budget, hostel_context: value.hostelContext, email_verified: value.emailVerified, created_at: value.createdAt, updated_at: value.updatedAt };
}

function validationError(message: string) {
  return { error: message, code: "VALIDATION_ERROR" };
}

authRoutes.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!String(name || "").trim() || !normalizedEmail || !String(password || "")) {
      return res.status(400).json(validationError("Name, email, and password are required"));
    }
    if (String(password).length < 8) {
      return res.status(400).json(validationError("Password must be at least 8 characters"));
    }
    const existing = await UserModel.exists({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists", code: "EMAIL_EXISTS" });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = await UserModel.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      age: 18,
      weight: 60,
      height: 170,
      gender: "unspecified",
    });
    const token = signAuthToken({ id: String(user._id), email: normalizedEmail });
    return res.status(201).json({ user: publicUser(user), token });
  } catch (error: any) {
    console.error("Registration failed:", error);
    return res.status(500).json({ error: "Registration failed", code: "AUTH_SERVER_ERROR" });
  }
});

authRoutes.post("/login", async (req: Request, res: Response) => {
  try {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!normalizedEmail || !password) {
      return res.status(400).json(validationError("Email and password are required"));
    }
    const user = await UserModel.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password", code: "AUTH_INVALID" });
    }
    const token = signAuthToken({ id: String(user._id), email: user.email });
    return res.status(200).json({ user: publicUser(user), token });
  } catch (error: any) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed", code: "AUTH_SERVER_ERROR" });
  }
});

authRoutes.get("/me", authenticateUser, async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.user!.id)) return res.status(401).json({ error: "Invalid authenticated user", code: "AUTH_INVALID" });
  const user = await UserModel.findOne({ _id: req.user!.id, email: req.user!.email });
  if (!user) return res.status(401).json({ error: "Authenticated user no longer exists", code: "AUTH_INVALID" });
  return res.status(200).json({ user: publicUser(user) });
});

authRoutes.post("/logout", authenticateUser, (req: Request, res: Response) => {
  if (req.authToken) revokeAuthToken(req.authToken);
  return res.status(200).json({ success: true });
});