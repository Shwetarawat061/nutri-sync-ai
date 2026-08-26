import mongoose, { Schema } from "mongoose";

const nutritionGoalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  goal: { type: String, required: true, trim: true },
  calories: { type: Number, required: true, min: 1 },
  protein: { type: Number, required: true, min: 1 },
  carbs: { type: Number, required: true, min: 1 },
  fats: { type: Number, required: true, min: 1 },
}, { timestamps: true, versionKey: false });

export const NutritionGoalModel: any = mongoose.models.NutritionGoal || mongoose.model("NutritionGoal", nutritionGoalSchema);
