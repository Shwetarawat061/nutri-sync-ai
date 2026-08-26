import React, { useState } from "react";
import {
  Sparkles,
  Utensils,
  Building,
  Check,
  Plus,
  Clock,
  Flame,
  Activity,
  Droplets,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { UserProfile, DietPlanData, MealItem } from "../../types";
import { api } from "../../api";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface DietPlanGeneratorProps {
  userProfile: UserProfile | null;
  budgetHostelMode: boolean;
  onToggleBudgetHostelMode: (enabled: boolean) => void;
  onMealLogged: (meal: MealItem) => void;
  onNavigateToTracker?: () => void;
  dailyTotals?: { calories: number; protein: number; carbs: number; fats: number };
  recentMeals?: MealItem[];
}

export const DietPlanGenerator: React.FC<DietPlanGeneratorProps> = ({
  userProfile,
  budgetHostelMode,
  onToggleBudgetHostelMode,
  onMealLogged,
  onNavigateToTracker,
  dailyTotals,
  recentMeals,
}) => {
  const [dietaryPref, setDietaryPref] = useState<string>(
    userProfile?.dietaryPreference || userProfile?.dietary_pref || "Vegetarian"
  );
  const [budgetTier, setBudgetTier] = useState<string>(userProfile?.budget || "low");
  const [hostelMenuNotes, setHostelMenuNotes] = useState<string>(
    "Standard hostel mess menu: Dal, Roti, Rice, Seasonal Sabzi, Curd, Boiled Eggs / Paneer on select days"
  );
  const [dislikedFoods, setDislikedFoods] = useState<string>("");
  const [useRemainingDeficit, setUseRemainingDeficit] = useState<boolean>(
    Boolean(dailyTotals && (dailyTotals.calories > 0 || dailyTotals.protein > 0))
  );
  const [generating, setGenerating] = useState<boolean>(false);
  const [dietPlan, setDietPlan] = useState<DietPlanData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loggedMealIndices, setLoggedMealIndices] = useState<Record<number, boolean>>({});

  const targetCal = userProfile?.calorie_target || 2100;
  const targetProt = userProfile?.protein_target || 120;
  const consumedCal = dailyTotals?.calories || 0;
  const consumedProt = dailyTotals?.protein || 0;
  const remainingCal = Math.max(300, targetCal - consumedCal);
  const remainingProt = Math.max(15, targetProt - consumedProt);
  const formatGrams = (value: number) => value.toFixed(2);

  const handleGeneratePlan = async () => {
    if (!userProfile) return;
    setGenerating(true);
    setErrorMsg(null);
    setLoggedMealIndices({});

    const effectiveCalories = useRemainingDeficit ? remainingCal : targetCal;
    const effectiveProtein = useRemainingDeficit ? remainingProt : targetProt;
    const effectiveCarbs = useRemainingDeficit ? Math.max(30, Math.round(effectiveCalories * 0.45 / 4)) : (userProfile.carbs_target || 200);
    const effectiveFats = useRemainingDeficit ? Math.max(10, Math.round(effectiveCalories * 0.25 / 9)) : (userProfile.fats_target || 60);

    try {
      const plan = await api.generateDietPlan({
        userGoal: useRemainingDeficit
          ? `${userProfile.goal || "Fitness"} (Deficit remaining: ${remainingCal} kcal, ${remainingProt}g protein)`
          : userProfile.goal || "Maintenance",
        dietaryPreference: dietaryPref,
        dailyTarget: {
          calories: effectiveCalories,
          protein: effectiveProtein,
          carbs: effectiveCarbs,
          fats: effectiveFats,
        },
        budget: budgetTier,
        isHostelMessMode: budgetHostelMode,
        hostelMenuText: budgetHostelMode ? hostelMenuNotes : undefined,
        dislikedFoods,
      });

      setDietPlan(plan);
    } catch (err: any) {
      console.error("Failed to generate diet plan:", err);
      setErrorMsg(err.message || "Failed to synthesize diet protocol.");
    } finally {
      setGenerating(false);
    }
  };

  const handleLogPlanMeal = async (meal: any, index: number) => {
    if (!userProfile?.email) return;

    try {
      const itemsList = meal.items?.map((i: any) => `${i.name} (${i.portion})`).join(", ") || meal.meal_type;

      const newMeal: Partial<MealItem> = {
        user_email: userProfile.email,
        food_name: itemsList,
        calories: meal.meal_calories || 450,
        protein: meal.meal_protein || 25,
        carbs: Math.round(meal.meal_calories * 0.45 / 4),
        fats: Math.round(meal.meal_calories * 0.25 / 9),
        meal_type: ["Breakfast", "Lunch", "Dinner", "Snack"].includes(meal.meal_type)
          ? meal.meal_type
          : "Lunch",
        nutrition_reasoning: meal.rationale || "Synthesized from personalized AI diet protocol.",
        created_at: new Date().toISOString(),
      };

      const saved = await api.logMeal(newMeal);
      onMealLogged(saved);
      setLoggedMealIndices((prev) => ({ ...prev, [index]: true }));
    } catch (err: any) {
      alert("Failed to log plan meal: " + err.message);
    }
  };

  return (
    <div id="diet-plan-container" className="space-y-6 max-w-4xl mx-auto pb-24 px-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            AI Meal Plan Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Target-driven meal protocols calibrated for your {userProfile?.calorie_target || 2100} kcal goal
          </p>
        </div>

        {/* Hostel / Budget Toggle Pill */}
        <div className="w-full sm:w-auto">
          <ToggleSwitch
            id="diet-plan-hostel-toggle"
            checked={budgetHostelMode}
            onChange={onToggleBudgetHostelMode}
            label="Hostel & Mess Mode"
            description="Prioritize mess-compatible high protein items"
            icon={<Building className="w-4 h-4" />}
            size="sm"
            className="shadow-sm"
          />
        </div>
      </div>

      {/* Configuration Form Card */}
      <div className="genz-card p-6 space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Preferences & Constraints
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Dietary Preference */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Diet Preference
            </label>
            <select
              value={dietaryPref}
              onChange={(e) => setDietaryPref(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="Omnivore">Omnivore (All foods)</option>
              <option value="Vegetarian">Vegetarian (Indian / Dairy)</option>
              <option value="Eggetarian">Eggetarian (Veg + Eggs)</option>
              <option value="Vegan">Vegan (Plant-based)</option>
              <option value="High-Protein Non-Veg">High-Protein Non-Veg</option>
            </select>
          </div>

          {/* Budget Tier */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Budget Tier
            </label>
            <select
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="low">Low Budget / Student Tier</option>
              <option value="medium">Moderate Budget</option>
              <option value="high">Flexible / Premium Tier</option>
            </select>
          </div>

          {/* Excluded Foods */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Allergies & Dislikes
            </label>
            <input
              type="text"
              placeholder="e.g. Peanuts, Seafood"
              value={dislikedFoods}
              onChange={(e) => setDislikedFoods(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Hostel Mess Menu Context Box */}
        {budgetHostelMode && (
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <Building className="w-3.5 h-3.5" />
              <span>Hostel Mess / Dining Hall Menu</span>
            </div>
            <textarea
              rows={2}
              value={hostelMenuNotes}
              onChange={(e) => setHostelMenuNotes(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        )}

        {/* Connected AI Loop: Adapt to Today's Remaining Target */}
        {dailyTotals && (dailyTotals.calories > 0 || dailyTotals.protein > 0) && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-sky-50/50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/80 dark:border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                ⚡
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Live Metabolic Feedback Loop
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Logged today: <span className="font-bold text-slate-800 dark:text-slate-100">{consumedCal} kcal</span> & <span className="font-bold text-slate-800 dark:text-slate-100">{formatGrams(consumedProt)}g Protein</span>. Remaining: <span className="font-bold text-indigo-600 dark:text-indigo-400">{remainingCal} kcal</span> & <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatGrams(remainingProt)}g Protein</span>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setUseRemainingDeficit(!useRemainingDeficit)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                useRemainingDeficit
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300"
              }`}
            >
              <span>{useRemainingDeficit ? "✓ Calibrating to Remaining Gap" : "Calibrate to Remaining Gap"}</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400">
            {useRemainingDeficit
              ? `Targeting remaining ~${remainingCal} kcal and ~${formatGrams(remainingProt)}g protein for today's upcoming meals.`
              : `Targeting full daily baseline of ${userProfile?.calorie_target || 2100} kcal.`}
          </span>

          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 flex items-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 dark:text-cyan-600" />
            <span>{generating ? "Synthesizing..." : useRemainingDeficit ? "Generate Adaptive Plan" : "Generate Meal Plan"}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Generated Diet Protocol Display */}
      {dietPlan && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="genz-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Daily Protocol Overview
              </h3>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {dietPlan.macros_summary.calories} kcal
                </span>
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  {dietPlan.macros_summary.protein}g Protein
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              {dietPlan.summary}
            </p>

            {/* Budget Hacks Pill Grid */}
            {dietPlan.budget_hacks && dietPlan.budget_hacks.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Mess & Budget Hacks:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {dietPlan.budget_hacks.map((hack, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{hack}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Meals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dietPlan.meals.map((meal, idx) => (
              <div
                key={idx}
                className="genz-card p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {meal.meal_type}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {meal.time_window}
                      </span>
                    </div>

                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {meal.meal_calories} kcal •{" "}
                      <span className="text-orange-500">{meal.meal_protein}g P</span>
                    </div>
                  </div>

                  {/* Meal Food Items */}
                  <div className="space-y-2">
                    {meal.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span>{item.name}</span>
                          <span className="text-slate-400 font-normal">{item.portion}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{item.calories} kcal</span>
                          <span>•</span>
                          <span className="text-orange-500 font-semibold">P: {item.protein}g</span>
                          <span>•</span>
                          <span className="text-sky-500 font-semibold">C: {item.carbs}g</span>
                          <span>•</span>
                          <span className="text-emerald-500 font-semibold">F: {item.fats}g</span>
                        </div>

                        {item.hostel_tip && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-300 font-medium pt-0.5">
                            💡 {item.hostel_tip}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {meal.rationale && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      "{meal.rationale}"
                    </p>
                  )}
                </div>

                {/* Log this Meal Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleLogPlanMeal(meal, idx)}
                    disabled={loggedMealIndices[idx]}
                    className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      loggedMealIndices[idx]
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {loggedMealIndices[idx] ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Logged to Meal Journal</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log to Journal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
