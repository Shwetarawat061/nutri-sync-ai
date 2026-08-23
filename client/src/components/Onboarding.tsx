import React, { useState } from "react";
import { User, Mail, Sparkles, Scale, Ruler, Activity, ArrowRight, ArrowLeft, Target, Zap, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { UserProfile } from "../types";
import { calculateMacroTargets, ACTIVITY_MULTIPLIERS } from "../lib/nutrition";
import { api } from "../api";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  setToast?: (toast: { message: string; type: "success" | "error" } | null) => void;
  onBack?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, setToast, onBack }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: 21,
    weight: 68,
    height: 172,
    gender: "male",
    activityLevel: "moderate" as keyof typeof ACTIVITY_MULTIPLIERS,
    goal: "Healthy eating",
    dietary_pref: "Vegetarian",
    budget: "medium",
    hostel_context: "Hostel mess & canteen food",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targets = calculateMacroTargets(
    formData.weight,
    formData.height,
    formData.age,
    formData.gender,
    formData.activityLevel,
    formData.goal
  );

  const bmi = Number((formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setErrorMsg("Name and Email are required");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const profileToSave: Partial<UserProfile> = {
        name: formData.name,
        email: formData.email,
        age: formData.age,
        weight: formData.weight,
        height: formData.height,
        gender: formData.gender,
        bmi,
        bmr: targets.bmr,
        tdee: targets.tdee,
        goal: formData.goal,
        dietary_pref: formData.dietary_pref,
        activity_level: formData.activityLevel,
        calorie_target: targets.calories,
        protein_target: targets.protein,
        carbs_target: targets.carbs,
        fats_target: targets.fats,
        budget: formData.budget,
        hostel_context: formData.hostel_context,
      };

      const saved = await api.onboardUser(profileToSave);
      localStorage.setItem("user_email", formData.email);
      onComplete(saved);
      if (setToast) {
        setToast({ message: "Metabolic Profile Configured", type: "success" });
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      setErrorMsg(error.message || "Failed to persist profile");
      if (setToast) {
        setToast({ message: "Setup failed", type: "error" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  NutriSync Decision Assistant
                </span>
                <h2 className="text-2xl font-black text-slate-100 mt-0.5">Personal Nutrition Profile</h2>
                <p className="text-xs text-slate-400">Don't just track what you eat. Know what to do next.</p>
              </div>
            </div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Start</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex Rivera"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@college.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Age, Gender, Weight, Height */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Age</label>
                <input
                  type="number"
                  min={12}
                  max={100}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 20 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 70 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Height (cm)</label>
                <input
                  type="number"
                  min={100}
                  max={240}
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 175 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Goal & Dietary Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Primary Nutrition Goal</label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Healthy eating">Healthy eating (Clean Energy & Vitality)</option>
                  <option value="Increase protein">Increase protein (Muscle Protein Synthesis)</option>
                  <option value="Weight management">Weight management (Fat Loss / Calorie Deficit)</option>
                  <option value="Fitness nutrition">Fitness nutrition (Athletic Performance & Fuel)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Dietary Preference</label>
                <select
                  value={formData.dietary_pref}
                  onChange={(e) => setFormData({ ...formData, dietary_pref: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Vegetarian">Vegetarian (Lacto-Ovo)</option>
                  <option value="Non-Vegetarian">Non-Vegetarian (Eggs & Meat)</option>
                  <option value="Eggetarian">Eggetarian (Vegetarian + Eggs)</option>
                  <option value="Vegan">Vegan (100% Plant-Based)</option>
                  <option value="Omnivore">Omnivore / Flexible</option>
                </select>
              </div>
            </div>

            {/* Student Context: Budget & Hostel/Mess */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Budget Preference</label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="low">Budget-Friendly (₹/Student Thrift)</option>
                  <option value="medium">Standard / Balanced</option>
                  <option value="high">Premium / Flexible</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Food Environment</label>
                <select
                  value={formData.hostel_context}
                  onChange={(e) => setFormData({ ...formData, hostel_context: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Hostel mess & canteen food">Hostel Mess & College Canteen</option>
                  <option value="Home cooked food">Home Cooked Food</option>
                  <option value="Restaurant & food delivery">Food Delivery & Restaurants</option>
                  <option value="Self cooking / dorm">Self Cooking in Dorm</option>
                </select>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Target Macro Calibration:</span>
                <span className="text-emerald-400 font-bold">BMI: {bmi} ({bmi < 18.5 ? "Underweight" : bmi < 25 ? "Optimal" : "Overweight"})</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Target Energy</div>
                  <div className="text-sm font-extrabold text-slate-100 mt-0.5">{targets.calories} kcal</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-blue-400">Protein</div>
                  <div className="text-sm font-extrabold text-blue-400 mt-0.5">{targets.protein}g</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-amber-400">Carbs</div>
                  <div className="text-sm font-extrabold text-amber-400 mt-0.5">{targets.carbs}g</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-emerald-400">Fats</div>
                  <div className="text-sm font-extrabold text-emerald-400 mt-0.5">{targets.fats}g</div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              <span>{isSaving ? "Persisting to SQLite Database..." : "Initialize NutriSync Profile"}</span>
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
