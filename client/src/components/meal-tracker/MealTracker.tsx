import React, { useState } from "react";
import {
  Utensils,
  Plus,
  Trash2,
  Clock,
  Flame,
  Activity,
  Droplets,
  Camera,
  Calendar,
  Sparkles,
  Info,
  X,
  Target,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { MealItem, UserProfile } from "../../types";
import { api } from "../../api";
import { formatDate } from "../../lib/utils";

interface MealTrackerProps {
  userProfile: UserProfile | null;
  meals: MealItem[];
  onMealAdded: (meal: MealItem) => void;
  onMealDeleted: (id: string) => void;
  onNavigateToScan: () => void;
}

export const MealTracker: React.FC<MealTrackerProps> = ({
  userProfile,
  meals,
  onMealAdded,
  onMealDeleted,
  onNavigateToScan,
}) => {
  const [viewMode, setViewMode] = useState<"D" | "W">("W");
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [foodName, setFoodName] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fats, setFats] = useState<string>("");
  const [fiber, setFiber] = useState<string>("");
  const [mealType, setMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Lunch");
  const [nutritionReasoning, setNutritionReasoning] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedMealDetail, setSelectedMealDetail] = useState<MealItem | null>(null);

  // Weekly bar data for Goal chart (matching Screen 2)
  const weeklyData = [
    { day: "Fri", pct: 20 },
    { day: "Sat", pct: 35 },
    { day: "Sun", pct: 40 },
    { day: "Tue", pct: 70, active: true },
    { day: "Wed", pct: 30 },
    { day: "Thu", pct: 45 },
    { day: "Wed", pct: 35 },
  ];

  // Totals for current list
  const totalCalories = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0);
  const totalFats = meals.reduce((sum, m) => sum + (Number(m.fats) || 0), 0);

  const targetCalories = userProfile?.calorie_target || 2100;
  const targetProtein = userProfile?.protein_target || 120;
  const targetCarbs = userProfile?.carbs_target || 200;
  const targetFats = userProfile?.fats_target || 60;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !userProfile?.email) return;

    setSaving(true);
    try {
      const newMeal: Partial<MealItem> = {
        user_email: userProfile.email,
        food_name: foodName,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
        fiber: Number(fiber) || 0,
        meal_type: mealType,
        nutrition_reasoning: nutritionReasoning || "Manually logged nutritional entry.",
        created_at: new Date().toISOString(),
      };

      const saved = await api.logMeal(newMeal);
      onMealAdded(saved);
      setShowManualModal(false);

      // Reset
      setFoodName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      setFiber("");
      setNutritionReasoning("");
    } catch (err: any) {
      console.error("Manual meal log failed:", err);
      alert("Failed to save meal: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this meal entry?")) return;

    try {
      await api.deleteMeal(id);
      onMealDeleted(id);
      if (selectedMealDetail?.id === id) {
        setSelectedMealDetail(null);
      }
    } catch (err: any) {
      alert("Failed to delete meal: " + err.message);
    }
  };

  return (
    <div id="meal-tracker-container" className="space-y-6 max-w-4xl mx-auto pb-24 px-2">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Meal Plan & Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track daily nutrition pacing and target consistency
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual</span>
          </button>

          <button
            onClick={onNavigateToScan}
            className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition shadow-md shadow-slate-900/10 cursor-pointer flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Meal</span>
          </button>
        </div>
      </div>

      {/* Goal Weekly Progress Card (Screen 2 from Reference Image) */}
      <div className="genz-card p-6 space-y-5">
        {/* Header & D/W Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Goal</h3>
          </div>

          {/* D / W Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("D")}
              className={`px-3 py-0.5 rounded-full text-xs font-bold transition ${
                viewMode === "D"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              D
            </button>
            <button
              onClick={() => setViewMode("W")}
              className={`px-3 py-0.5 rounded-full text-xs font-bold transition ${
                viewMode === "W"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              W
            </button>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-4 pb-2 h-44">
          {weeklyData.map((d, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
              <span
                className={`text-[10px] font-bold transition ${
                  d.active ? "text-teal-600 dark:text-teal-400" : "text-slate-400"
                }`}
              >
                {d.pct}%
              </span>

              {/* Bar track */}
              <div className="w-7 sm:w-9 h-28 bg-slate-100 dark:bg-slate-800 rounded-full flex flex-col justify-end p-0.5 overflow-hidden">
                <div
                  className={`w-full rounded-full transition-all duration-700 ${
                    d.active
                      ? "bg-gradient-to-t from-teal-500 to-cyan-400 shadow-md shadow-teal-500/30"
                      : "bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400"
                  }`}
                  style={{ height: `${d.pct}%` }}
                />
              </div>

              <span
                className={`text-xs font-semibold ${
                  d.active
                    ? "text-slate-900 dark:text-white font-extrabold"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {d.day}
              </span>
            </div>
          ))}
        </div>

        {/* Daily Goal vs Eaten Footer */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-base font-extrabold text-slate-900 dark:text-white block">
              {targetCalories} <span className="text-xs font-normal text-slate-400">Kcal</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Daily Goal</span>
          </div>

          <div className="text-right">
            <span className="text-base font-extrabold text-slate-900 dark:text-white block">
              {Math.round(totalCalories)} <span className="text-xs font-normal text-slate-400">Kcal</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Eaten</span>
          </div>
        </div>

        {/* Macro Tags */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center">
            <span className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 block">
              Protein
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {Math.round(totalProtein)} / {targetProtein}g
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
            <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">
              Carbs
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {Math.round(totalCarbs)} / {targetCarbs}g
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
              Fat
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {Math.round(totalFats)} / {targetFats}g
            </span>
          </div>
        </div>
      </div>

      {/* Today's Meal Plan Section (Matching Screen 2 from Reference Image) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Today's Meal Plan
          </h3>
          <button
            onClick={() => setShowManualModal(true)}
            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Add</span>
          </button>
        </div>

        {meals.length === 0 ? (
          <div className="genz-card p-10 text-center space-y-3">
            <Utensils className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-medium text-slate-500">No meals logged yet today.</p>
            <button
              onClick={onNavigateToScan}
              className="px-4 py-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
            >
              Scan with AI Camera
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <div
                key={meal.id}
                onClick={() => setSelectedMealDetail(meal)}
                className="genz-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                {/* Left: Thumbnail & Name & Macros */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-sky-100 dark:border-slate-700">
                    {meal.image_data ? (
                      <img
                        src={meal.image_data}
                        alt={meal.food_name}
                        className="w-full h-full object-cover"
                      />
                    ) : meal.meal_type === "Breakfast" ? (
                      "🍳"
                    ) : meal.meal_type === "Lunch" ? (
                      "🥗"
                    ) : meal.meal_type === "Dinner" ? (
                      "🍲"
                    ) : (
                      "🍎"
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {meal.food_name}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {meal.meal_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(meal.created_at)}</span>
                    </div>

                    {/* Macro pills */}
                    <div className="flex items-center gap-2 text-[11px] pt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold">
                        P: {Math.round(meal.protein)}g
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold">
                        C: {Math.round(meal.carbs)}g
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                        F: {Math.round(meal.fats)}g
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Kcal & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {Math.round(meal.calories)}{" "}
                      <span className="text-xs font-normal text-slate-400">kcal</span>
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(meal.id, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="Delete Meal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="genz-card bg-white dark:bg-slate-900 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Meal Manually</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Food / Dish Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2 Boiled Eggs with Toast"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Meal Type
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="350"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-orange-600 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    placeholder="20"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-sky-600 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    placeholder="35"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-emerald-600 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                >
                  {saving ? "Saving..." : "Save Meal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
