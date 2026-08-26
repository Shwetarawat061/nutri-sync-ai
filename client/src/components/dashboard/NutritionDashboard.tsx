import React, { useState, useEffect } from "react";
import {
  Flame,
  Activity,
  Droplets,
  Zap,
  Sparkles,
  ArrowUpRight,
  Clock,
  Plus,
  Camera,
  CheckCircle2,
  Bell,
  Utensils,
  ChevronRight,
  TrendingUp,
  Target,
  Trash2,
  X,
  Calendar,
} from "lucide-react";
import { UserProfile, DailyTotals, MealItem } from "../../types";
import { NextBestActionCard } from "./NextBestActionCard";
import { CalorieArcGauge } from "./CalorieArcGauge";
import { WaterTrackerCard } from "./WaterTrackerCard";
import { WeeklyGoalProgressCard } from "./WeeklyGoalProgressCard";
import { UpcomingRemindersCard } from "./UpcomingRemindersCard";
import { api } from "../../api";
import { formatDate, formatDateWithWeekday, formatFullDate } from "../../lib/utils";

interface NutritionDashboardProps {
  userProfile: UserProfile | null;
  dailyTotals: DailyTotals;
  meals: MealItem[];
  budgetHostelMode: boolean;
  onNavigateToScan: () => void;
  onNavigateToTracker: () => void;
  onNavigateToDietPlan: () => void;
  onNavigateToProfile: () => void;
  onNavigateToAdvisor?: () => void;
  onMealDeleted?: (id: string) => void;
}

export const NutritionDashboard: React.FC<NutritionDashboardProps> = ({
  userProfile,
  dailyTotals,
  meals,
  budgetHostelMode,
  onNavigateToScan,
  onNavigateToTracker,
  onNavigateToDietPlan,
  onNavigateToProfile,
  onNavigateToAdvisor,
  onMealDeleted,
}) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [adherenceScore, setAdherenceScore] = useState<number>(88);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [mealToDelete, setMealToDelete] = useState<MealItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleConfirmDelete = async () => {
    if (!mealToDelete) return;
    const targetId = mealToDelete.id;
    setIsDeleting(true);

    try {
      await api.deleteMeal(targetId);
      if (onMealDeleted) {
        onMealDeleted(targetId);
      }
      setMealToDelete(null);
    } catch (err) {
      console.error("Error deleting meal from dashboard:", err);
      if (onMealDeleted) {
        onMealDeleted(targetId);
      }
      setMealToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch AI daily insights
  useEffect(() => {
    if (!userProfile?.email) return;

    const fetchInsights = async () => {
      setLoadingInsights(true);
      try {
        const res = await api.getPersonalizedInsights({
          userGoal: userProfile.goal || "Maintenance",
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
          mealsCount: meals.length,
        });

        if (res.insights && res.insights.length > 0) {
          setInsights(res.insights);
          setAdherenceScore(res.score || 88);
        }
      } catch (err) {
        console.warn("Notice while fetching insights:", err);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [userProfile?.email, dailyTotals.calories, meals.length]);

  const targetCalories = userProfile?.calorie_target || 2100;
  const targetProtein = userProfile?.protein_target || 120;
  const targetCarbs = userProfile?.carbs_target || 200;
  const targetFats = userProfile?.fats_target || 60;

  // Estimated burned calories based on steps & activity
  const estimatedBurned = Math.round(350 + (userProfile?.weight || 68) * 1.8);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Dynamic system date
  const todayFormatted = formatDateWithWeekday(new Date());

  return (
    <div id="nutrition-dashboard" className="space-y-6 max-w-6xl mx-auto pb-24 px-1 sm:px-4">
      {/* Top Header: Avatar, Dynamic Date & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* User Avatar Circle */}
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 p-[2px] shadow-sm">
              <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-slate-800 dark:text-slate-100 text-sm">
                {userProfile?.name
                  ? String(userProfile.name)
                      .trim()
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "U"
                  : "U"}
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Today
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-500" />
                {todayFormatted}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}, {userProfile?.name ? String(userProfile.name).trim().split(" ")[0] : "Champion"}
            </h1>
          </div>
        </div>

        {/* Action Header Pills */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            id="dash-email-status-pill"
            onClick={onNavigateToProfile}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
            title="Manage Email & Daily Digest in Profile"
          >
            <Bell className="w-3.5 h-3.5 text-indigo-500" />
            <span>Email Digest: {userProfile?.email_daily_digest !== 0 ? "Active" : "Paused"}</span>
          </button>

          <button
            onClick={onNavigateToProfile}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span className="capitalize">{userProfile?.goal?.replace(/_/g, " ") || "Maintenance"}</span>
          </button>

          <button
            onClick={onNavigateToScan}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-md shadow-slate-900/10 transition cursor-pointer flex items-center justify-center"
            title="Scan Food"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Flagship USP: AI Next Best Action Banner */}
      <NextBestActionCard
        userProfile={userProfile}
        dailyTotals={dailyTotals}
        recentMeals={meals}
        budgetHostelMode={budgetHostelMode}
        onNavigateToScan={onNavigateToScan}
        onNavigateToDietPlan={onNavigateToDietPlan}
      />

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Calorie Arc Gauge (Hero Dial) */}
        <div className="lg:col-span-7">
          <CalorieArcGauge
            calorieTarget={targetCalories}
            caloriesConsumed={Math.round(dailyTotals.calories)}
            caloriesBurned={estimatedBurned}
            proteinTarget={targetProtein}
            proteinConsumed={dailyTotals.protein}
            carbsTarget={targetCarbs}
            carbsConsumed={dailyTotals.carbs}
            fatsTarget={targetFats}
            fatsConsumed={dailyTotals.fats}
          />
        </div>

        {/* Right: Water Tracker Bento Card */}
        <div className="lg:col-span-5">
          <WaterTrackerCard initialLiters={1.75} targetLiters={3.0} />
        </div>
      </div>

      {/* Secondary Row: Today's Meal Plan & AI Insights Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Meal Feed / Plan (Matches Screen 2 in image) */}
        <div className="lg:col-span-7 genz-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Today's Meal Log</h3>
                  <span className="text-xs text-slate-400">
                    {meals.length} meal{meals.length !== 1 ? "s" : ""} recorded today
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToScan}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1 hover:opacity-90 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quick Add</span>
                </button>
              </div>
            </div>

            {/* Meal Items List */}
            {meals.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Utensils className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No meals logged yet today. Take a photo or scan your tray!
                </p>
                <button
                  onClick={onNavigateToScan}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan Breakfast / Lunch</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
                {meals.slice(0, 4).map((m) => (
                  <div key={m.id} className="py-3.5 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3">
                      {/* Food Emoji/Thumbnail */}
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 flex items-center justify-center text-lg shadow-sm">
                        {m.meal_type === "Breakfast"
                          ? "🍳"
                          : m.meal_type === "Lunch"
                          ? "🥗"
                          : m.meal_type === "Dinner"
                          ? "🍲"
                          : "🍎"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize">
                            {m.food_name}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {m.meal_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(m.created_at)}
                          </span>
                          <span>•</span>
                          <span className="text-orange-500 font-medium">P: {Math.round(m.protein)}g</span>
                          <span className="text-sky-500 font-medium">C: {Math.round(m.carbs)}g</span>
                          <span className="text-emerald-500 font-medium">F: {Math.round(m.fats)}g</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          {Math.round(m.calories)}
                        </span>
                        <span className="text-xs text-slate-400 block -mt-1 font-medium">kcal</span>
                      </div>

                      {onMealDeleted && (
                        <button
                          type="button"
                          onClick={() => setMealToDelete(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Delete Meal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {mealToDelete && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="genz-card bg-white dark:bg-slate-900 max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Delete Meal Log?
                    </h3>
                    <p className="text-xs text-slate-400">
                      Remove this entry from today's targets.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 overflow-hidden flex items-center justify-center text-lg border border-slate-200 dark:border-slate-600">
                    {(mealToDelete.image_url || mealToDelete.image_urls?.[0] || mealToDelete.image_data) ? (
                      <img
                        src={mealToDelete.image_url || mealToDelete.image_urls?.[0] || mealToDelete.image_data}
                        alt={mealToDelete.food_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "🍲"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate capitalize">
                      {mealToDelete.food_name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {Math.round(mealToDelete.calories)} kcal • {mealToDelete.meal_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setMealToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Total Today: <strong className="text-slate-800 dark:text-slate-200">{Math.round(dailyTotals.calories)} kcal</strong>
            </span>
            <button
              onClick={onNavigateToTracker}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Time-Aware Upcoming Reminders Card */}
        <div className="lg:col-span-5">
          <UpcomingRemindersCard
            userProfile={userProfile}
            budgetHostelMode={budgetHostelMode}
            onNavigateToScan={onNavigateToScan}
            onNavigateToAdvisor={onNavigateToAdvisor}
          />
        </div>
      </div>

      {/* Tertiary Row: 7-Day Weekly Goal Progress & Long-Term Memory Trends */}
      <WeeklyGoalProgressCard
        userProfile={userProfile}
        onNavigateToScan={onNavigateToScan}
        onNavigateToAdvisor={onNavigateToAdvisor}
      />
    </div>
  );
};
