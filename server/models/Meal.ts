import mongoose, { Schema } from "mongoose";

const mealSchema = new Schema({
  legacyId: { type: String, index: true, sparse: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  foodName: { type: String, required: true, trim: true, maxlength: 240 },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, required: true, min: 0 },
  carbs: { type: Number, required: true, min: 0 },
  fats: { type: Number, required: true, min: 0 },
  fiber: { type: Number, default: 0, min: 0 },
  waterContentMl: { type: Number, default: null },
  waterContentConfidence: { type: Number, default: null },
  glycemicIndex: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  metabolicImpact: { type: String, default: "" },
  nutritionReasoning: { type: String, default: "" },
  mealType: { type: String, required: true, default: "Snack" },
    quantity: { type: Number, default: 1, min: 0 },
  imageData: { type: String },
  imageUrl: { type: String, trim: true },
  imageUrls: { type: [String], default: [] },
  foods: { type: [Schema.Types.Mixed], default: [] },
  nutrition: { type: Schema.Types.Mixed },
  aiMetadata: { type: Schema.Types.Mixed },
  scanResult: { type: Schema.Types.Mixed },
  consumedAt: { type: Date, required: true, default: Date.now, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
  dateStatus: { type: String, enum: ["exact", "migrated", "unknown"], default: "exact" },
}, { timestamps: true, versionKey: false });

mealSchema.index({ userId: 1, consumedAt: -1 });
mealSchema.index({ userId: 1, createdAt: -1 });
export const MealModel: any = mongoose.models.Meal || mongoose.model("Meal", mealSchema);
