import React, { useEffect, useState } from "react";
import { User, Mail, Sparkles, Scale, Ruler, Activity, ArrowRight, ArrowLeft, Target, Zap, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { NutriSyncLogo } from "./brand/NutriSyncLogo";
import { UserProfile } from "../types";
import { calculateMacroTargets, ACTIVITY_MULTIPLIERS } from "../lib/nutrition";
import { api } from "../api";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  setToast?: (toast: { message: string; type: "success" | "error" } | null) => void;
  onBack?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, setToast, onBack }) => {
  const [formData, setFormData] = useState(() => {
    const savedDraft = localStorage.getItem("nutrisync_onboarding_draft");
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch {
        localStorage.removeItem("nutrisync_onboarding_draft");
      }
    }

    return {
      name: "",
      email: "",
      age: 21 as number | string,
      weight: 68 as number | string,
      height: 172 as number | string,
      gender: "male",
      activityLevel: "moderate" as keyof typeof ACTIVITY_MULTIPLIERS,
      goal: "Healthy eating",
      dietary_pref: "Vegetarian",
      budget: "medium",
      hostel_context: "Hostel mess & canteen food",
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("nutrisync_onboarding_draft", JSON.stringify(formData));
  }, [formData]);

  const numWeight = Number(formData.weight) || 0;
  const numHeight = Number(formData.height) || 0;
  const numAge = Number(formData.age) || 0;

  const targets = calculateMacroTargets(
    numWeight,
    numHeight,
    numAge,
    formData.gender,
    formData.activityLevel,
    formData.goal
  );

  const bmi = (numWeight > 0 && numHeight > 0)
    ? Number((numWeight / Math.pow(numHeight / 100, 2)).toFixed(1))
    : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !String(formData.name).trim() || !formData.email || !String(formData.email).trim()) {
      setErrorMsg("Name and Email are required");
      return;
    }

    const validAge = Number(formData.age);
    const validWeight = Number(formData.weight);
    const validHeight = Number(formData.height);

    if (
      formData.age === "" || isNaN(validAge) || validAge <= 0 ||
      formData.weight === "" || isNaN(validWeight) || validWeight <= 0 ||
      formData.height === "" || isNaN(validHeight) || validHeight <= 0 ||
      targets.calories <= 0
    ) {
      setErrorMsg("Profile entries cannot be zero or empty (Age, Weight, and Height must be greater than 0). Changes have been discarded to prevent saving incorrect data.");
      // Discard invalid entries back to default baseline
      setFormData(prev => ({
        ...prev,
        age: 21,
        weight: 68,
        height: 172,
      }));
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const profileToSave: Partial<UserProfile> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        age: validAge,
        weight: validWeight,
        height: validHeight,
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
      localStorage.setItem("user_email", formData.email.trim());
      localStorage.removeItem("nutrisync_onboarding_draft");
      onComplete(saved);
      if (setToast) {
        setToast({ message: "Metabolic Profile Configured", type: "success" });
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      setErrorMsg(error.message || "Failed to persist profile");
      setFormData(prev => ({
        ...prev,
        age: 21,
        weight: 68,
        height: 172,
      }));
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
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-colors duration-300">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <NutriSyncLogo variant="icon" size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Decision Assistant
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">Personal Nutrition Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Don't just track what you eat. Know what to do next.</p>
              </div>
            </div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Overview</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex Rivera"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@college.edu"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950"
                />
              </div>
            </div>

            {/* Age, Gender, Weight, Height */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Goal & Dietary Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Primary Nutrition Goal</label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Healthy eating">Healthy eating (Clean Energy & Vitality)</option>
                  <option value="Increase protein">Increase protein (Muscle Protein Synthesis)</option>
                  <option value="Weight management">Weight management (Fat Loss / Calorie Deficit)</option>
                  <option value="Fitness nutrition">Fitness nutrition (Athletic Performance & Fuel)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Dietary Preference</label>
                <select
                  value={formData.dietary_pref}
                  onChange={(e) => setFormData({ ...formData, dietary_pref: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Budget Preference</label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="low">Budget-Friendly (₹/Student Thrift)</option>
                  <option value="medium">Standard / Balanced</option>
                  <option value="high">Premium / Flexible</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Food Environment</label>
                <select
                  value={formData.hostel_context}
                  onChange={(e) => setFormData({ ...formData, hostel_context: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Hostel mess & canteen food">Hostel Mess & College Canteen</option>
                  <option value="Home cooked food">Home Cooked Food</option>
                  <option value="Restaurant & food delivery">Food Delivery & Restaurants</option>
                  <option value="Self cooking / dorm">Self Cooking in Dorm</option>
                </select>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Target Macro Calibration:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">BMI: {bmi} ({bmi < 18.5 ? "Underweight" : bmi < 25 ? "Optimal" : "Overweight"})</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Target Energy</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{targets.calories} kcal</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Protein</div>
                  <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{targets.protein}g</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Carbs</div>
                  <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{targets.carbs}g</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Fats</div>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{targets.fats}g</div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">{errorMsg}</p>
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
