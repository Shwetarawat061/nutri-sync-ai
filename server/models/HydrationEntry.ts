import mongoose, { Schema } from "mongoose";

const hydrationEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    amountMl: { type: Number, required: true, min: 1, max: 10000 },
    beverageType: {
      type: String,
      enum: ["Water", "Milk", "Tea", "Coffee", "Juice", "Other"],
      default: "Water",
    },
    consumedAt: { type: Date, default: Date.now, index: true },
    source: { type: String, default: "manual" },
    notes: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

hydrationEntrySchema.index({ userId: 1, consumedAt: -1 });
hydrationEntrySchema.index({ userEmail: 1, consumedAt: -1 });

export const HydrationEntryModel: any =
  mongoose.models.HydrationEntry || mongoose.model("HydrationEntry", hydrationEntrySchema);
