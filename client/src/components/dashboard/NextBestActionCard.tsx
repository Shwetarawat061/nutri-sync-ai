import React, { useState } from "react";
import { Sparkles, ArrowRight, RefreshCw, Flame, Utensils, Droplets } from "lucide-react";
import { NextBestActionData, UserProfile, DailyTotals, MealItem } from "../../types";
import { api } from "../../api";
import { getTimeOfDay } from "../../lib/utils";

interface NextBestActionCardProps {
  userProfile: UserProfile | null;
  dailyTotals: DailyTotals;
  recentMeals: MealItem[];
  budgetHostelMode: boolean;
  onNavigateToScan?: () => void;
  onNavigateToDietPlan?: () => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  userProfile,
  dailyTotals,
  recentMeals,
  budgetHostelMode,
  onNavigateToScan,
  onNavigateToDietPlan,
}) => {
  const [actionData, setActionData] = useState<NextBestActionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNextBestAction = async () => {
    if (!userProfile) return;
    setLoading(true);

    try {
      const data = await api.getNextBestAction({
        userGoal: userProfile.goal || "Healthy eating",
        dietaryPreference: userProfile.dietaryPreference || userProfile.dietary_pref || "Omnivore",
        consumed: {
          calories: dailyTotals.calories,
          protein: dailyTotals.protein,
          carbs: dailyTotals.carbs,
          fats: dailyTotals.fats,
        },
        targets: {
          calories: userProfile.calorie_target || 2100,
          protein: userProfile.protein_target || 120,
          carbs: userProfile.carbs_target || 200,
          fats: userProfile.fats_target || 60,
        },
        recentMeals: recentMeals.slice(0, 5).map((m) => ({
          food_name: m.food_name,
          meal_type: m.meal_type,
          calories: m.calories,
          protein: m.protein,
        })),
        timeOfDay: getTimeOfDay(),
        budgetHostelMode,
      });

      setActionData(data);
    } catch (err) {
      console.error("Failed to fetch next best action:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (userProfile?.email && !actionData) {
      fetchNextBestAction();
    }
  }, [userProfile?.email, dailyTotals.calories, budgetHostelMode]);

  const targetCal = userProfile?.calorie_target || 2100;
  const targetProt = userProfile?.protein_target || 120;
  const remainingCalories = Math.max(0, targetCal - dailyTotals.calories);
  const remainingProtein = Math.max(0, targetProt - dailyTotals.protein);

  const proteinRatio = Math.round((dailyTotals.protein / (targetProt || 1)) * 100);
  const carbsRatio = Math.round((dailyTotals.carbs / (userProfile?.carbs_target || 200)) * 100);
  const fatsRatio = Math.round((dailyTotals.fats / (userProfile?.fats_target || 60)) * 100);

  return (
    <div className="genz-card p-5 relative overflow-hidden bg-gradient-to-r from-indigo-50/70 via-sky-50/50 to-purple-50/40 dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/60 dark:border-indigo-500/20">
      {/* Top Ambient Glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        {/* Left Orb + Main Action Text */}
        <div className="flex items-start sm:items-center gap-3.5 flex-1">
          {/* Glowing Gen Z AI Orb */}
          <div className="relative shrink-0 mt-0.5 sm:mt-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-300 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
            </div>
            <div className="absolute -inset-1 rounded-full bg-indigo-500/30 blur-sm pointer-events-none -z-10" />
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                NutriSync Decision Engine ⚡
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {actionData?.title || "Next Best Action"}
              </span>
            </div>

            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
              {actionData?.action ||
                `Prioritize consuming ~${Math.round(remainingProtein * 0.4)}g protein in your next meal to stay on track.`}
            </p>

            {/* AI Reasoning Context Flow */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Context: </span>
              {budgetHostelMode ? "Hostel / Mess Menu Active • " : "Standard Kitchen • "}
              {userProfile?.goal || "High Protein"} • {remainingProtein}g Protein Deficit
            </div>

            {/* Micro Macro Badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {remainingCalories} Kcal Left
              </span>
              <span>•</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">Protein {proteinRatio}%</span>
              <span>•</span>
              <span className="text-sky-600 dark:text-sky-400 font-medium">Carbs {carbsRatio}%</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Fat {fatsRatio}%</span>
            </div>
          </div>
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={fetchNextBestAction}
            disabled={loading}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
            title="Refresh AI Directive"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          </button>

          {onNavigateToScan && (
            <button
              onClick={onNavigateToScan}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 flex items-center gap-1.5 transition shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <span>Scan Meal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
