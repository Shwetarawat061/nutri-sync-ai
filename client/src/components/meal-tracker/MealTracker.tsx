import React, { useState, useMemo } from "react";
import {
  Plus,
  Camera,
  Bell,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Star,
  Lightbulb,
  CheckCircle2,
  Circle,
  Clock,
  Footprints,
  Moon,
  Droplets,
  Flame,
  Utensils,
  Wheat,
  Dumbbell,
  X,
  Trash2,
  Check,
  Activity,
  ArrowUpRight,
  Info,
  Calendar,
} from "lucide-react";
import { MealItem, UserProfile } from "../../types";
import { api } from "../../api";
import { formatDate } from "../../lib/utils";
import { AISmartMealLogger } from "./AISmartMealLogger";

interface MealTrackerProps {
  userProfile: UserProfile | null;
  meals: MealItem[];
  budgetHostelMode?: boolean;
  onMealAdded: (meal: MealItem) => void;
  onMealDeleted: (id: string) => void;
  onNavigateToScan: () => void;
}

export const MealTracker: React.FC<MealTrackerProps> = ({
  userProfile,
  meals,
  budgetHostelMode = false,
  onMealAdded,
  onMealDeleted,
  onNavigateToScan,
}) => {
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState<boolean>(false);
  const [showNutritionDetailsModal, setShowNutritionDetailsModal] = useState<boolean>(false);
  const [showAllInsightsModal, setShowAllInsightsModal] = useState<boolean>(false);
  const [showAllRemindersModal, setShowAllRemindersModal] = useState<boolean>(false);
  const [selectedMealDetail, setSelectedMealDetail] = useState<MealItem | null>(null);
  const [mealToDelete, setMealToDelete] = useState<MealItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [weekFilter, setWeekFilter] = useState<string>("This Week");

  // Form states for manual entry
  const [foodName, setFoodName] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fats, setFats] = useState<string>("");
  const [fiber, setFiber] = useState<string>("");
  const [mealType, setMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Lunch");
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Targets
  const targetCalories = userProfile?.calorie_target || 1800;
  const targetProtein = userProfile?.protein_target || 120;
  const targetCarbs = userProfile?.carbs_target || 250;
  const targetFats = userProfile?.fats_target || 70;

  // Real-time totals calculated from logged meals
  const totalCalories = useMemo(
    () => meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0),
    [meals]
  );
  const totalProtein = useMemo(
    () => meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0),
    [meals]
  );
  const totalCarbs = useMemo(
    () => meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0),
    [meals]
  );
  const totalFats = useMemo(
    () => meals.reduce((sum, m) => sum + (Number(m.fats) || 0), 0),
    [meals]
  );

  // Remaining calories
  const remainingCalories = Math.max(0, targetCalories - Math.round(totalCalories));

  // Weekly Goal Progress Data dynamically aligned (Today is Monday)
  const isThisWeek = weekFilter === "This Week";
  const todayCals = totalCalories > 0 ? Math.round(totalCalories) : 1320;
  const todayPct = totalCalories > 0
    ? Math.min(100, Math.round((totalCalories / targetCalories) * 100))
    : 73;

  const weeklyBars = isThisWeek
    ? [
        {
          day: "Mon",
          pct: todayPct,
          calories: todayCals,
          active: true,
          label: "Today",
        },
        { day: "Tue", pct: 0, calories: 0, active: false },
        { day: "Wed", pct: 0, calories: 0, active: false },
        { day: "Thu", pct: 0, calories: 0, active: false },
        { day: "Fri", pct: 0, calories: 0, active: false },
        { day: "Sat", pct: 0, calories: 0, active: false },
        { day: "Sun", pct: 0, calories: 0, active: false },
      ]
    : [
        { day: "Mon", pct: 85, calories: 1530, active: false },
        { day: "Tue", pct: 90, calories: 1620, active: false },
        { day: "Wed", pct: 75, calories: 1350, active: false },
        { day: "Thu", pct: 92, calories: 1656, active: false },
        { day: "Fri", pct: 80, calories: 1440, active: false },
        { day: "Sat", pct: 70, calories: 1260, active: false },
        { day: "Sun", pct: 60, calories: 1080, active: false },
      ];

  // 7-day Nutrition trend data points for SVG line chart
  const trendData = isThisWeek
    ? [
        { day: "Mon", calories: todayCals },
        { day: "Tue", calories: 0 },
        { day: "Wed", calories: 0 },
        { day: "Thu", calories: 0 },
        { day: "Fri", calories: 0 },
        { day: "Sat", calories: 0 },
        { day: "Sun", calories: 0 },
      ]
    : [
        { day: "Mon", calories: 1530 },
        { day: "Tue", calories: 1620 },
        { day: "Wed", calories: 1350 },
        { day: "Thu", calories: 1656 },
        { day: "Fri", calories: 1440 },
        { day: "Sat", calories: 1260 },
        { day: "Sun", calories: 1080 },
      ];

  // SVG Chart Calculations
  const chartWidth = 320;
  const chartHeight = 120;
  const maxCaloriesChart = 2000;
  const goalLineY = chartHeight - (targetCalories / maxCaloriesChart) * chartHeight;

  const pointsString = trendData
    .map((d, index) => {
      const x = 20 + index * ((chartWidth - 40) / (trendData.length - 1));
      const y = chartHeight - (d.calories / maxCaloriesChart) * (chartHeight - 15) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  // Formatted date string for Today's Summary
  const todayFormattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  // Meal slot breakdown
  const breakfastMeals = meals.filter((m) => m.meal_type === "Breakfast");
  const lunchMeals = meals.filter((m) => m.meal_type === "Lunch");
  const snackMeals = meals.filter((m) => m.meal_type === "Snack");
  const dinnerMeals = meals.filter((m) => m.meal_type === "Dinner");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !userProfile?.email) return;

    setSaving(true);
    setErrorMessage(null);
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
        nutrition_reasoning: `Logged manually under ${mealType}.`,
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
    } catch (err: any) {
      console.error("Manual meal log failed:", err);
      setErrorMessage(err.message || "Failed to save meal");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!mealToDelete) return;
    const targetId = mealToDelete.id;
    setIsDeleting(true);
    try {
      await api.deleteMeal(targetId);
      onMealDeleted(targetId);
      if (selectedMealDetail?.id === targetId) {
        setSelectedMealDetail(null);
      }
      setMealToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete meal:", err);
      onMealDeleted(targetId);
      setMealToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="meal-plan-and-tracker-view" className="space-y-6 max-w-6xl mx-auto pb-28 px-2 sm:px-4">
      {/* 1. Header Section (Matching Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Meal Plan & Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track daily nutrition, plan meals and build better habits.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="manual-entry-top-btn"
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>

          <button
            id="scan-meal-top-btn"
            onClick={onNavigateToScan}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Meal</span>
          </button>

          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center justify-center cursor-pointer shadow-2xs transition"
              title="Daily Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {showNotificationPopup && (
              <div className="absolute right-0 mt-2 w-72 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white">Nutrition Alerts</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Live</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  🎯 You've reached <strong>{Math.round(totalCalories || 1620)} kcal</strong> today. Drink water to stay hydrated!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Smart Natural Language Meal Logger Bar */}
      <AISmartMealLogger
        userProfile={userProfile}
        onMealAdded={onMealAdded}
        budgetHostelMode={budgetHostelMode}
      />

      {/* 2. Top Row: Weekly Goal Progress & Today's Summary (Matching Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Weekly Goal Progress (col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Weekly Goal Progress
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stay consistent and hit your nutrition goals!
              </p>
            </div>

            {/* Dropdown Filter */}
            <div className="relative">
              <button
                onClick={() =>
                  setWeekFilter(weekFilter === "This Week" ? "Last Week" : "This Week")
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{weekFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Bar Chart Section */}
          <div className="pt-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-40 pb-2">
              {weeklyBars.map((bar, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  {/* Percent label on top */}
                  <span
                    className={`text-[11px] font-bold ${
                      bar.active
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {bar.pct}%
                  </span>

                  {/* Bar shape */}
                  <div className="w-full max-w-[40px] sm:max-w-[48px] h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col justify-end p-0.5 overflow-hidden">
                    <div
                      className={`w-full rounded-2xl transition-all duration-700 ${
                        bar.active
                          ? "bg-emerald-600 shadow-md shadow-emerald-600/30"
                          : bar.pct > 0
                          ? "bg-emerald-100 dark:bg-emerald-950/60 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900"
                          : "bg-transparent"
                      }`}
                      style={{ height: `${Math.max(4, bar.pct)}%` }}
                    />
                  </div>

                  {/* Day and label */}
                  <div className="text-center">
                    <span
                      className={`text-xs font-semibold block ${
                        bar.active
                          ? "text-slate-900 dark:text-white font-black"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {bar.day}
                    </span>
                    {bar.label && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block -mt-0.5">
                        {bar.label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Goal</span>
              <strong className="font-extrabold text-slate-900 dark:text-white">
                {targetCalories} kcal / day
              </strong>
            </div>

            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
              <span>Average</span>
              <strong className="font-extrabold text-slate-900 dark:text-white flex items-center gap-0.5">
                {isThisWeek ? `${todayPct}%` : "80%"}{" "}
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 inline" />
              </strong>
            </div>
          </div>
        </div>

        {/* Right Card: Today's Summary (col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Today's Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {todayFormattedDate}
            </p>
          </div>

          {/* Donut Progress Ring + Legend */}
          <div className="flex items-center justify-around gap-4 py-1">
            {/* Circular Gauge Ring */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="9"
                  fill="transparent"
                />
                {/* Progress arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-emerald-600 transition-all duration-1000 ease-out"
                  strokeWidth="9"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={
                    2 * Math.PI * 40 * (1 - (totalCalories > 0 ? totalCalories / targetCalories : 1620 / 1800))
                  }
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {totalCalories > 0 ? Math.round(totalCalories) : 1620}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">kcal</span>
              </div>
            </div>

            {/* Metric Legend Rows */}
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full border border-slate-400" />
                  <span>Goal</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {targetCalories} kcal
                </span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Eaten</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {totalCalories > 0 ? Math.round(totalCalories) : 1620} kcal
                </span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">↺</span>
                  <span>Remaining</span>
                </div>
                <span className="font-extrabold text-slate-600 dark:text-slate-400">
                  {totalCalories > 0 ? remainingCalories : 180} kcal
                </span>
              </div>
            </div>
          </div>

          {/* 3 Macro Cards (Protein, Carbs, Fats) */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Protein */}
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold uppercase">
                <Dumbbell className="w-3 h-3" />
                <span>Protein</span>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                {totalProtein > 0 ? Math.round(totalProtein) : 72} / {targetProtein}g
              </span>
            </div>

            {/* Carbs */}
            <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400 text-[10px] font-extrabold uppercase">
                <Wheat className="w-3 h-3" />
                <span>Carbs</span>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                {totalCarbs > 0 ? Math.round(totalCarbs) : 182} / {targetCarbs}g
              </span>
            </div>

            {/* Fats */}
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase">
                <Droplets className="w-3 h-3" />
                <span>Fats</span>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                {totalFats > 0 ? Math.round(totalFats) : 48} / {targetFats}g
              </span>
            </div>
          </div>

          {/* View Details Link */}
          <button
            onClick={() => setShowNutritionDetailsModal(true)}
            className="w-full text-center text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1 cursor-pointer pt-1 transition"
          >
            <span>View Nutrition Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Middle Section: Today's Meal Plan (Matching Image 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Today's Meal Plan
          </h2>
          <button
            onClick={() => setShowManualModal(true)}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meal</span>
          </button>
        </div>

        {/* 4 Meal Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Breakfast */}
          <div
            onClick={() => {
              if (breakfastMeals.length > 0) setSelectedMealDetail(breakfastMeals[0]);
              else setShowManualModal(true);
            }}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 overflow-hidden flex items-center justify-center text-xl shrink-0 border border-amber-100 dark:border-amber-900/30">
                {breakfastMeals[0]?.image_data ? (
                  <img
                    src={breakfastMeals[0].image_data}
                    alt="Breakfast"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "🥣"
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Breakfast</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  <span>{breakfastMeals[0] ? formatDate(breakfastMeals[0].created_at) : "8:00 AM"}</span>
                  {breakfastMeals[0] && (
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      • {Math.round(breakfastMeals[0].calories)} kcal
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Lunch */}
          <div
            onClick={() => {
              if (lunchMeals.length > 0) setSelectedMealDetail(lunchMeals[0]);
              else setShowManualModal(true);
            }}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 overflow-hidden flex items-center justify-center text-xl shrink-0 border border-orange-100 dark:border-orange-900/30">
                {lunchMeals[0]?.image_data ? (
                  <img
                    src={lunchMeals[0].image_data}
                    alt="Lunch"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "🍛"
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Lunch</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    ☀️ {lunchMeals[0] ? Math.round(lunchMeals[0].calories) : "430"} kcal
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Snack */}
          <div
            onClick={() => {
              if (snackMeals.length > 0) setSelectedMealDetail(snackMeals[0]);
              else setShowManualModal(true);
            }}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden flex items-center justify-center text-xl shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                {snackMeals[0]?.image_data ? (
                  <img
                    src={snackMeals[0].image_data}
                    alt="Snack"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "🥗"
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Snack</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    🌱 {snackMeals[0] ? Math.round(snackMeals[0].calories) : "150"} kcal
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Dinner */}
          <div
            onClick={() => {
              if (dinnerMeals.length > 0) setSelectedMealDetail(dinnerMeals[0]);
              else setShowManualModal(true);
            }}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 overflow-hidden flex items-center justify-center text-xl shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                {dinnerMeals[0]?.image_data ? (
                  <img
                    src={dinnerMeals[0].image_data}
                    alt="Dinner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "🍲"
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Dinner</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 text-sky-500 font-semibold">
                    🌙 {dinnerMeals[0] ? Math.round(dinnerMeals[0].calories) : "500"} kcal
                  </span>
                </div>
              </div>
            </div>

            <div>
              {dinnerMeals.length > 0 ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-rose-300 dark:border-rose-700 flex items-center justify-center" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row 3-Columns: AI Insights, Nutrition Trend, Upcoming Reminders (Matching Image 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: AI Insights */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              AI Insights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized insights to help you eat better
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Card 1: Protein Star */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-white" />
              </div>
              <div className="text-xs space-y-0.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white">
                  Great job with your protein intake!
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-snug">
                  You're meeting 90% of your daily protein goal.
                </p>
              </div>
            </div>

            {/* Card 2: Fiber Tip */}
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 fill-white" />
              </div>
              <div className="text-xs space-y-0.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white">
                  Tip for you
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-snug">
                  Try adding more fiber-rich foods to improve digestion.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAllInsightsModal(true)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
          >
            <span>View All Insights</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Column 2: Nutrition Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Nutrition Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your progress over the last 7 days
              </p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Calories</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-slate-300 dark:bg-slate-600 border-b border-dashed" />
                <span>Goal</span>
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full h-32 pt-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              {/* Horizontal Grid lines */}
              <line
                x1="0"
                y1="0"
                x2={chartWidth}
                y2="0"
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
                className="dark:stroke-slate-800"
              />
              <line
                x1="0"
                y1={goalLineY}
                x2={chartWidth}
                y2={goalLineY}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <line
                x1="0"
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#e2e8f0"
                strokeWidth="1"
                className="dark:stroke-slate-800"
              />

              {/* Area gradient under line */}
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <polygon
                points={`20,${chartHeight} ${pointsString} ${chartWidth - 20},${chartHeight}`}
                fill="url(#trendGradient)"
              />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />

              {/* Data points dots */}
              {trendData.map((d, index) => {
                const x = 20 + index * ((chartWidth - 40) / (trendData.length - 1));
                const y = chartHeight - (d.calories / maxCaloriesChart) * (chartHeight - 15) - 10;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r={index === 3 ? "4.5" : "3"}
                      className={
                        index === 3
                          ? "fill-emerald-600 stroke-white stroke-2"
                          : "fill-emerald-500"
                      }
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Days axis */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 border-t border-slate-100 dark:border-slate-800 pt-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Column 3: Upcoming Reminders */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Upcoming Reminders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stay synchronized with your health routine
            </p>
          </div>

          <div className="space-y-2">
            {/* Reminder 1 */}
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Drink Water
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">2:00 PM</span>
            </div>

            {/* Reminder 2 */}
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Footprints className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Evening Walk
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">6:00 PM</span>
            </div>

            {/* Reminder 3 */}
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Moon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Sleep Early
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">10:30 PM</span>
            </div>
          </div>

          <button
            onClick={() => setShowAllRemindersModal(true)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
          >
            <span>View All Reminders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Bottom AI Food Scan Banner (Matching Image 2) */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Scan your meal to get instant AI analysis
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Know calories, macros, and personalized suggestions in seconds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button
            id="scan-meal-now-banner-btn"
            onClick={onNavigateToScan}
            className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black transition shadow-md shadow-emerald-700/20 cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Meal Now</span>
          </button>

          {/* Fresh Salad Graphic Emoji / Badge */}
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-2xl shadow-xs shrink-0">
            🥗
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Log Meal Manually</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Dish / Meal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2 Roti, Dal, Paneer Bhurji & Curd"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
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
                    placeholder="420"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-rose-600 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    placeholder="22"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-sky-600 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    placeholder="45"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-amber-600 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    placeholder="12"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Meal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nutrition Details Modal */}
      {showNutritionDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Nutrition Pacing & Details
              </h3>
              <button
                onClick={() => setShowNutritionDetailsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                  Metabolic Pacing Status: Optimal
                </span>
                <p className="text-emerald-700 dark:text-emerald-400">
                  You have logged <strong>{Math.round(totalCalories || 1620)} kcal</strong> today against your target of <strong>{targetCalories} kcal</strong>.
                </p>
              </div>

              {/* Complete Meals List for Today */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Logged Meals ({meals.length})
                </span>
                {meals.length === 0 ? (
                  <p className="text-slate-400 italic">No custom meals logged yet today.</p>
                ) : (
                  meals.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white capitalize">
                          {m.food_name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {m.meal_type} • P: {Math.round(m.protein)}g | C: {Math.round(m.carbs)}g | F: {Math.round(m.fats)}g
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white">
                          {Math.round(m.calories)} kcal
                        </span>
                        <button
                          onClick={() => setMealToDelete(m)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All AI Insights Modal */}
      {showAllInsightsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                All AI Health Insights
              </h3>
              <button
                onClick={() => setShowAllInsightsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  Protein Bioavailability
                </h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  You are consistently hitting over 90% of your target protein. Pairing with vitamin C enhances iron and amino acid absorption.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                  Pre-Bedtime Pacing
                </h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Keep your dinner at least 2.5 hours prior to sleep to maximize REM cycle quality and reduce nocturnal glucose spikes.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-600 fill-sky-600" />
                  Electrolyte Balance
                </h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Ensure hydration with a pinch of pink salt or lemon water during afternoon work hours to prevent mid-day fatigue.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAllInsightsModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
            >
              Close Insights
            </button>
          </div>
        </div>
      )}

      {/* All Reminders Modal */}
      {showAllRemindersModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-500" />
                Scheduled Health Reminders
              </h3>
              <button
                onClick={() => setShowAllRemindersModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">💧 Morning Hydration (500ml)</span>
                <span className="text-slate-400 font-semibold">7:30 AM</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">🥗 Midday Water Refill</span>
                <span className="text-slate-400 font-semibold">2:00 PM</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">🚶 20-min Post-Snack Walk</span>
                <span className="text-slate-400 font-semibold">6:00 PM</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">🌙 Screen Off & Sleep Routine</span>
                <span className="text-slate-400 font-semibold">10:30 PM</span>
              </div>
            </div>

            <button
              onClick={() => setShowAllRemindersModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Selected Meal Detail Modal */}
      {selectedMealDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {selectedMealDetail.meal_type}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white capitalize">
                  {selectedMealDetail.food_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMealDetail(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 block">Calories</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {Math.round(selectedMealDetail.calories)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                <span className="text-[10px] block">Protein</span>
                <span className="font-black">{Math.round(selectedMealDetail.protein)}g</span>
              </div>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
                <span className="text-[10px] block">Carbs</span>
                <span className="font-black">{Math.round(selectedMealDetail.carbs)}g</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <span className="text-[10px] block">Fats</span>
                <span className="font-black">{Math.round(selectedMealDetail.fats)}g</span>
              </div>
            </div>

            {selectedMealDetail.nutrition_reasoning && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                💡 {selectedMealDetail.nutrition_reasoning}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setMealToDelete(selectedMealDetail);
                  setSelectedMealDetail(null);
                }}
                className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entry</span>
              </button>
              <button
                onClick={() => setSelectedMealDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {mealToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-sm w-full p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Delete Meal Log?
                </h3>
                <p className="text-xs text-slate-400">
                  This will remove the entry from today's targets.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setMealToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
