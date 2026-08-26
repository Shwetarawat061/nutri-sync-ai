import mongoose, { Schema } from "mongoose";

const aiAnalysisSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  analysisType: { type: String, required: true, enum: ["food_scan", "meal_text", "advisor", "diet_plan", "insight"] },
  input: { type: Schema.Types.Mixed, required: true },
  output: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ["success", "fallback", "error"], default: "success" },
}, { timestamps: true, versionKey: false });

export const AIAnalysisModel = mongoose.models.AIAnalysis || mongoose.model("AIAnalysis", aiAnalysisSchema);
