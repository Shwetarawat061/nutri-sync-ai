import mongoose, { Schema } from "mongoose";

const nutritionInsightSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  observation: { type: String, required: true },
  reason: { type: String, required: true },
  nextBestAction: { type: Schema.Types.Mixed },
}, { timestamps: true, versionKey: false });

export const NutritionInsightModel = mongoose.models.NutritionInsight || mongoose.model("NutritionInsight", nutritionInsightSchema);
