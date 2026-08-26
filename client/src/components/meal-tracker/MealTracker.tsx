import React, { useState, useMemo, useEffect } from "react";
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
import { formatDate, formatDateWithWeekday, formatFullDate, getLocalDateString, getWeekdayName } from "../../lib/utils";
import { AISmartMealLogger } from "./AISmartMealLogger";

interface MealTrackerProps {
  userProfile: UserProfile | null;
  meals: MealItem[];
  budgetHostelMode?: boolean;
  onMealAdded: (meal: MealItem) => void;
  onMealDeleted: (id: string) => void;
  onNavigateToScan: () => void;
}

function getMealDateKey(meal: MealItem, timezone?: string): string {
  const ts = meal.consumed_at || meal.consumedAt || meal.created_at;
  if (!ts) return "";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts.slice(0, 10);
    return timezone
      ? new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
      : getLocalDateString(d);
  } catch {
    return ts.slice(0, 10);
  }
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

  // Dynamic system dates
  const timezone = userProfile?.timezone;
  const todayDateStr = useMemo(() => timezone
    ? new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
    : getLocalDateString(), [timezone]);
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);

  // Form states for manual entry
  const [foodName, setFoodName] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fats, setFats] = useState<string>("");
  const [fiber, setFiber] = useState<string>("");
  const [mealType, setMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Lunch");
  const [manualDate, setManualDate] = useState<string>(() => getLocalDateString());
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analyzingManualMeal, setAnalyzingManualMeal] = useState<boolean>(false);
  const [manualAnalysis, setManualAnalysis] = useState<any | null>(null);
  const [manualPortionFactor, setManualPortionFactor] = useState<number>(1);

  // Targets
  const targetCalories = userProfile?.calorie_target || 1800;
  const targetProtein = userProfile?.protein_target || 120;
  const targetCarbs = userProfile?.carbs_target || 250;
  const targetFats = userProfile?.fats_target || 70;

  // 1. Dynamic 7-day Monday -> Sunday Calendar Array
  const weeklyCalendarDays = useMemo(() => {
    const baseDate = new Date();
    if (weekFilter === "Last Week") {
      baseDate.setDate(baseDate.getDate() - 7);
    }
    const dayOfWeek = baseDate.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + diffToMonday);

    const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const fullWeekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getLocalDateString(d);

      // Filter meals from database for this exact date
      const dayMeals = meals.filter((m) => getMealDateKey(m, timezone) === dateStr);
      const dayCals = dayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
      const dayProt = dayMeals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
      const dayCarbs = dayMeals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0);
      const dayFats = dayMeals.reduce((sum, m) => sum + (Number(m.fats) || 0), 0);
      const isToday = dateStr === todayDateStr;
      const isSelected = dateStr === selectedDate;
      const pct = targetCalories > 0 ? Math.min(100, Math.round((dayCals / targetCalories) * 100)) : 0;

      return {
        date: dateStr,
        dayNumber: d.getDate(),
        dayShort: weekdayNames[i],
        dayFull: fullWeekdayNames[i],
        calories: Math.round(dayCals),
        protein: Math.round(dayProt),
        carbs: Math.round(dayCarbs),
        fats: Math.round(dayFats),
        mealsCount: dayMeals.length,
        pct,
        isToday,
        isSelected,
        label: isToday ? "Today" : undefined,
      };
    });
  }, [weekFilter, meals, selectedDate, todayDateStr, targetCalories, timezone]);

  // Average weekly progress
  const weeklyAveragePct = useMemo(() => {
    const daysWithMeals = weeklyCalendarDays.filter((d) => d.mealsCount > 0);
    if (daysWithMeals.length === 0) return 0;
    const sumPct = daysWithMeals.reduce((acc, d) => acc + d.pct, 0);
    return Math.round(sumPct / daysWithMeals.length);
  }, [weeklyCalendarDays]);

  // 2. Active Selected Day Meals & Computed Totals
  const selectedDayMeals = useMemo(() => {
    return meals.filter((m) => getMealDateKey(m, timezone) === selectedDate);
  }, [meals, selectedDate, timezone]);

  const selectedDayTotals = useMemo(() => {
    return selectedDayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + (Number(m.calories) || 0),
        protein: acc.protein + (Number(m.protein) || 0),
        carbs: acc.carbs + (Number(m.carbs) || 0),
        fats: acc.fats + (Number(m.fats) || 0),
        fiber: acc.fiber + (Number(m.fiber) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  }, [selectedDayMeals]);

  // Remaining calories for selected day
  const remainingCalories = Math.max(0, targetCalories - Math.round(selectedDayTotals.calories));

  // 3. 7-day Nutrition trend data points for SVG line chart
  const trendData = useMemo(() => {
    return weeklyCalendarDays.map((d) => ({
      day: d.dayShort,
      dayFull: d.dayFull,
      date: d.date,
      calories: d.calories,
      isToday: d.isToday,
      isSelected: d.isSelected,
    }));
  }, [weeklyCalendarDays]);

  // SVG Chart Calculations
  const chartWidth = 320;
  const chartHeight = 120;
  const maxCaloriesChart = Math.max(targetCalories * 1.3, ...weeklyCalendarDays.map((d) => d.calories), 2200);
  const goalLineY = chartHeight - (targetCalories / maxCaloriesChart) * chartHeight;

  const pointsString = trendData
    .map((d, index) => {
      const x = 20 + index * ((chartWidth - 40) / (trendData.length - 1));
      const y = chartHeight - (d.calories / maxCaloriesChart) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  // Formatted date string for Selected Day Summary
  const isSelectedDateToday = selectedDate === todayDateStr;
  const selectedDayFormattedDate = formatFullDate(selectedDate);

  // Meal slot breakdown for the active selected day
  const breakfastMeals = selectedDayMeals.filter((m) => m.meal_type === "Breakfast");
  const lunchMeals = selectedDayMeals.filter((m) => m.meal_type === "Lunch");
  const snackMeals = selectedDayMeals.filter((m) => m.meal_type === "Snack");
  const dinnerMeals = selectedDayMeals.filter((m) => m.meal_type === "Dinner");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !userProfile?.email) return;

    setSaving(true);
    setErrorMessage(null);
    try {
      // Build ISO timestamp matching chosen manualDate + current time
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const mealConsumedAt = new Date(`${manualDate}T${timeStr}`).toISOString();

      const newMeal: Partial<MealItem> = {
        user_email: userProfile.email,
        food_name: foodName,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
        fiber: Number(fiber) || 0,
        meal_type: mealType,
        glycemic_index: manualAnalysis?.glycemic_index,
        metabolic_impact: manualAnalysis?.metabolic_impact,
        nutrition_reasoning: manualAnalysis
          ? `${manualAnalysis.nutrition_reasoning} Portion adjusted to ${Math.round(manualPortionFactor * 100)}% of the AI estimate.`
          : `Logged manually under ${mealType}.`,
        consumed_at: mealConsumedAt,
        consumedAt: mealConsumedAt,
        date_status: "exact",
        dateStatus: "exact",
        created_at: new Date().toISOString(),
      };

      const saved = await api.logMeal(newMeal);
      onMealAdded(saved);
      setShowManualModal(false);

      // Reset form
      setFoodName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      setFiber("");
      setManualAnalysis(null);
      setManualPortionFactor(1);
    } catch (err: any) {
      console.error("Manual meal log failed:", err);
      setErrorMessage(err.message || "Failed to save meal");
    } finally {
      setSaving(false);
    }
  };

  const handleManualAnalysis = async () => {
    if (!foodName.trim()) {
      setErrorMessage("Enter a dish or meal name first.");
      return;
    }

    setAnalyzingManualMeal(true);
    setErrorMessage(null);
    try {
      const result = await api.parseMealText({
        text: foodName.trim(),
        userGoal: userProfile?.goal || "Maintenance",
        dietaryPreference: userProfile?.dietary_pref || userProfile?.dietaryPreference,
        userTargets: {
          calories: targetCalories,
          protein: targetProtein,
          carbs: targetCarbs,
          fats: targetFats,
        },
        budgetHostelMode: budgetHostelMode,
      });

      setManualAnalysis(result);
      setManualPortionFactor(1);
      setCalories(String(Math.round(result.calories || 0)));
      setProtein(String(Math.round((result.protein || 0) * 10) / 10));
      setCarbs(String(Math.round((result.carbs || 0) * 10) / 10));
      setFats(String(Math.round((result.fats || 0) * 10) / 10));
      setFiber(String(Math.round((result.fiber || 0) * 10) / 10));
    } catch (err: any) {
      console.error("Manual meal analysis failed:", err);
      setErrorMessage(err.message || "Failed to analyze this meal with AI.");
    } finally {
      setAnalyzingManualMeal(false);
    }
  };

  const handleManualPortionChange = (factor: number) => {
    setManualPortionFactor(factor);
    if (!manualAnalysis) return;
    setCalories(String(Math.round((manualAnalysis.calories || 0) * factor)));
    setProtein(String(Math.round((manualAnalysis.protein || 0) * factor * 10) / 10));
    setCarbs(String(Math.round((manualAnalysis.carbs || 0) * factor * 10) / 10));
    setFats(String(Math.round((manualAnalysis.fats || 0) * factor * 10) / 10));
    setFiber(String(Math.round((manualAnalysis.fiber || 0) * factor * 10) / 10));
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
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              System Calendar Synchronized
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-500" />
              {formatDateWithWeekday(todayDateStr)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Meal Plan & Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track daily nutrition, plan meals and build better metabolic habits.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="manual-entry-top-btn"
            onClick={() => {
              setManualDate(selectedDate);
              setShowManualModal(true);
            }}
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
                  <span className="text-[10px] text-emerald-600 font-semibold">Live System Date</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  🎯 You've logged <strong>{Math.round(selectedDayTotals.calories)} kcal</strong> for {isSelectedDateToday ? "today" : formatFullDate(selectedDate)}.
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

      {/* 2. Top Row: Weekly Goal Progress & Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Weekly Goal Progress (col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Weekly Goal Progress
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                  Mon - Sun
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Click any weekday below to view historical meals and totals.
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

          {/* Bar Chart Section: Monday through Sunday with dynamic dates */}
          <div className="pt-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-40 pb-2">
              {weeklyCalendarDays.map((bar) => (
                <button
                  key={bar.date}
                  type="button"
                  onClick={() => setSelectedDate(bar.date)}
                  className={`flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer p-1 rounded-2xl transition ${
                    bar.isSelected
                      ? "bg-slate-100/90 dark:bg-slate-800/80 ring-2 ring-emerald-500"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                  title={`${bar.dayFull}, ${bar.date}: ${bar.calories} kcal (${bar.pct}% of target)`}
                >
                  {/* Percent label on top */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold ${
                      bar.isSelected
                        ? "text-emerald-700 dark:text-emerald-400 font-black"
                        : bar.isToday
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {bar.pct}%
                  </span>

                  {/* Bar shape */}
                  <div className="w-full max-w-[40px] sm:max-w-[48px] h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col justify-end p-0.5 overflow-hidden">
                    <div
                      className={`w-full rounded-2xl transition-all duration-700 ${
                        bar.isSelected
                          ? "bg-emerald-600 shadow-md shadow-emerald-600/30"
                          : bar.isToday
                          ? "bg-emerald-500/80"
                          : bar.pct > 0
                          ? "bg-emerald-200 dark:bg-emerald-950/80 group-hover:bg-emerald-300 dark:group-hover:bg-emerald-900"
                          : "bg-transparent"
                      }`}
                      style={{ height: `${Math.max(bar.pct > 0 ? 8 : 2, bar.pct)}%` }}
                    />
                  </div>

                  {/* Day and label */}
                  <div className="text-center">
                    <span
                      className={`text-xs font-semibold block ${
                        bar.isSelected
                          ? "text-slate-900 dark:text-white font-black"
                          : bar.isToday
                          ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {bar.dayShort}
                    </span>
                    {bar.isToday && (
                      <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block -mt-0.5">
                        Today
                      </span>
                    )}
                  </div>
                </button>
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
              <span>Weekly Average</span>
              <strong className="font-extrabold text-slate-900 dark:text-white flex items-center gap-0.5">
                {weeklyAveragePct}% <TrendingUp className="w-3.5 h-3.5 text-emerald-600 inline" />
              </strong>
            </div>
          </div>
        </div>

        {/* Right Card: Dynamic Summary for Selected Date (col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isSelectedDateToday ? "Today's Summary" : `${getWeekdayName(selectedDate)}'s Summary`}
                </h2>
                {isSelectedDateToday && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedDayFormattedDate}
              </p>
            </div>

            {!isSelectedDateToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayDateStr)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition cursor-pointer"
              >
                Jump to Today
              </button>
            )}
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
                    2 * Math.PI * 40 * (1 - (selectedDayTotals.calories > 0 ? Math.min(1, selectedDayTotals.calories / targetCalories) : 0))
                  }
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {Math.round(selectedDayTotals.calories)}
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
                  {Math.round(selectedDayTotals.calories)} kcal
                </span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">↺</span>
                  <span>Remaining</span>
                </div>
                <span className="font-extrabold text-slate-600 dark:text-slate-400">
                  {remainingCalories} kcal
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
                {Math.round(selectedDayTotals.protein)} / {targetProtein}g
              </span>
            </div>

            {/* Carbs */}
            <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400 text-[10px] font-extrabold uppercase">
                <Wheat className="w-3 h-3" />
                <span>Carbs</span>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                {Math.round(selectedDayTotals.carbs)} / {targetCarbs}g
              </span>
            </div>

            {/* Fats */}
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase">
                <Droplets className="w-3 h-3" />
                <span>Fats</span>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                {Math.round(selectedDayTotals.fats)} / {targetFats}g
              </span>
            </div>
          </div>

          {/* View Details Link */}
          <button
            onClick={() => setShowNutritionDetailsModal(true)}
            className="w-full text-center text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1 cursor-pointer pt-1 transition"
          >
            <span>View Nutrition Details ({selectedDayMeals.length} meals)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Middle Section: Meal Plan Slots for Selected Date */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {isSelectedDateToday ? "Today's Meal Plan" : `${getWeekdayName(selectedDate)}'s Meal Plan`}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selectedDayMeals.length} item{selectedDayMeals.length !== 1 ? "s" : ""} recorded for {selectedDate}
            </span>
          </div>

          <button
            onClick={() => {
              setManualDate(selectedDate);
              setShowManualModal(true);
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meal for this day</span>
          </button>
        </div>

        {/* 4 Meal Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Breakfast */}
          <div
            onClick={() => {
              if (breakfastMeals.length > 0) setSelectedMealDetail(breakfastMeals[0]);
              else {
                setMealType("Breakfast");
                setManualDate(selectedDate);
                setShowManualModal(true);
              }
            }}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 overflow-hidden flex items-center justify-center text-xl shrink-0 border border-amber-100 dark:border-amber-900/30">
                {(breakfastMeals[0]?.image_url || breakfastMeals[0]?.image_urls?.[0] || breakfastMeals[0]?.image_data) ? (
                  <img
                    src={breakfastMeals[0].image_url || breakfastMeals[0].image_urls?.[0] || breakfastMeals[0].image_data}
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
                  {breakfastMeals[0] ? (
                    <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                      {breakfastMeals[0].food_name} • {Math.round(breakfastMeals[0].calories)} kcal
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Not logged</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {breakfastMeals.length > 0 ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500">
                  <Plus className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>

          {/* Lunch */}
          <div
            onClick={() => {
              if (lunchMeals.length > 0) setSelectedMealDetail(lunchMeals[0]);
              else {
                setMealType("Lunch");
                setManualDate(selectedDate);
                setShowManualModal(true);
              }
            }}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 overflow-hidden flex items-center justify-center text-xl shrink-0 border border-orange-100 dark:border-orange-900/30">
                {(lunchMeals[0]?.image_url || lunchMeals[0]?.image_urls?.[0] || lunchMeals[0]?.image_data) ? (
                  <img
                    src={lunchMeals[0].image_url || lunchMeals[0].image_urls?.[0] || lunchMeals[0].image_data}
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
                  {lunchMeals[0] ? (
                    <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                      {lunchMeals[0].food_name} • {Math.round(lunchMeals[0].calories)} kcal
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Not logged</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {lunchMeals.length > 0 ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500">
                  <Plus className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>

          {/* Snack */}
          <div
            onClick={() => {
              if (snackMeals.length > 0) setSelectedMealDetail(snackMeals[0]);
              else {
                setMealType("Snack");
                setManualDate(selectedDate);
                setShowManualModal(true);
              }
            }}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden flex items-center justify-center text-xl shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                {(snackMeals[0]?.image_url || snackMeals[0]?.image_urls?.[0] || snackMeals[0]?.image_data) ? (
                  <img
                    src={snackMeals[0].image_url || snackMeals[0].image_urls?.[0] || snackMeals[0].image_data}
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
                  {snackMeals[0] ? (
                    <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                      {snackMeals[0].food_name} • {Math.round(snackMeals[0].calories)} kcal
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Not logged</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {snackMeals.length > 0 ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500">
                  <Plus className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>

          {/* Dinner */}
          <div
            onClick={() => {
              if (dinnerMeals.length > 0) setSelectedMealDetail(dinnerMeals[0]);
              else {
                setMealType("Dinner");
                setManualDate(selectedDate);
                setShowManualModal(true);
              }
            }}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 overflow-hidden flex items-center justify-center text-xl shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                {(dinnerMeals[0]?.image_url || dinnerMeals[0]?.image_urls?.[0] || dinnerMeals[0]?.image_data) ? (
                  <img
                    src={dinnerMeals[0].image_url || dinnerMeals[0].image_urls?.[0] || dinnerMeals[0].image_data}
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
                  {dinnerMeals[0] ? (
                    <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                      {dinnerMeals[0].food_name} • {Math.round(dinnerMeals[0].calories)} kcal
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Not logged</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {dinnerMeals.length > 0 ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500">
                  <Plus className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row 3-Columns: AI Insights, Dynamic Nutrition Trend, Upcoming Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: AI Insights */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              AI Insights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized metabolic intelligence
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
                  Target Protein Tracking
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-snug">
                  {selectedDayTotals.protein >= targetProtein * 0.9
                    ? "Great job! You've achieved your optimal daily protein threshold."
                    : `Consumed ${Math.round(selectedDayTotals.protein)}g of ${targetProtein}g daily target.`}
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
                  Metabolic Pacing
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-snug">
                  Hydrate with 400ml water between meals to maintain steady electrolyte pacing.
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

        {/* Column 2: Nutrition Trend (Dynamic 7-Day Monday-Sunday Database Line) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Nutrition Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actual calories over the 7-day week
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
                const y = chartHeight - (d.calories / maxCaloriesChart) * (chartHeight - 20) - 10;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r={d.isSelected ? "5" : d.isToday ? "4" : "3"}
                      className={
                        d.isSelected
                          ? "fill-slate-900 dark:fill-white stroke-emerald-500 stroke-2"
                          : d.isToday
                          ? "fill-emerald-600 stroke-white stroke-2"
                          : "fill-emerald-500"
                      }
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Days axis (Monday to Sunday) */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 border-t border-slate-100 dark:border-slate-800 pt-2">
            {weeklyCalendarDays.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDate(d.date)}
                className={`cursor-pointer transition ${
                  d.isSelected
                    ? "font-black text-slate-900 dark:text-white underline underline-offset-4"
                    : d.isToday
                    ? "font-extrabold text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                {d.dayShort}
              </button>
            ))}
          </div>
        </div>

        {/* Column 3: Upcoming Reminders (Time-Aware) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Upcoming Reminders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synchronized with daily meal & hostel timings
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
                  {budgetHostelMode ? "Mess Lunch Fuel Window" : "Lunch Fuel Window"}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">1:00 PM</span>
            </div>

            {/* Reminder 2 */}
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Footprints className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Post-Meal Walk (15 mins)
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
                  Screen Off & Digestion Rest
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

      {/* 5. Bottom AI Food Scan Banner */}
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
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] sm:max-h-[86vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-500" />
                  Log Meal Manually
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enter dish name for instant AI analysis or adjust macros manually.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleManualSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900/50">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Dish / Meal Name
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2 Roti, Dal, Paneer Bhurji & Curd"
                    value={foodName}
                    onChange={(e) => {
                      setFoodName(e.target.value);
                      setManualAnalysis(null);
                      setManualPortionFactor(1);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleManualAnalysis}
                    disabled={analyzingManualMeal || !foodName.trim()}
                    className="w-full px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {analyzingManualMeal ? "Analyzing nutrition with AI..." : "Analyze with AI"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Meal Date
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

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
              </div>

              {manualAnalysis && (
                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-900/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-black">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI detected nutrition
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        How much did you actually eat? Adjust the portion to update the values below.
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-300 whitespace-nowrap bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 rounded-md">
                      {Math.round(manualPortionFactor * 100)}% portion
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="rounded-xl bg-white/90 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-900/40 px-1.5 py-2 text-center shadow-xs">
                      <span className="block text-[9px] font-bold uppercase text-amber-600">Calories</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white">{calories || 0}</span>
                      <span className="text-[9px] text-slate-400">kcal</span>
                    </div>
                    <div className="rounded-xl bg-white/90 dark:bg-slate-900/80 border border-rose-200/70 dark:border-rose-900/40 px-1.5 py-2 text-center shadow-xs">
                      <span className="block text-[9px] font-bold uppercase text-rose-600">Protein</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white">{protein || 0}g</span>
                    </div>
                    <div className="rounded-xl bg-white/90 dark:bg-slate-900/80 border border-sky-200/70 dark:border-sky-900/40 px-1.5 py-2 text-center shadow-xs">
                      <span className="block text-[9px] font-bold uppercase text-sky-600">Carbs</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white">{carbs || 0}g</span>
                    </div>
                    <div className="rounded-xl bg-white/90 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-900/40 px-1.5 py-2 text-center shadow-xs">
                      <span className="block text-[9px] font-bold uppercase text-amber-600">Fats</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white">{fats || 0}g</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={manualPortionFactor}
                    onChange={(e) => handleManualPortionChange(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                    aria-label="Adjust meal portion"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>Half portion (50%)</span>
                    <span>AI estimate (100%)</span>
                    <span>Double portion (200%)</span>
                  </div>
                  {manualAnalysis.nutrition_reasoning && (
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/30">
                      {manualAnalysis.nutrition_reasoning}
                    </p>
                  )}
                </div>
              )}

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

              {/* Sticky / Pinned Action Bar inside modal */}
              <div className="sticky bottom-0 pt-4 mt-4 pb-1 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || analyzingManualMeal}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black transition shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Approve & Save Meal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nutrition Details Modal */}
      {showNutritionDetailsModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Nutrition Details for {formatDateWithWeekday(selectedDate)}
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedDayMeals.length} meal{selectedDayMeals.length !== 1 ? "s" : ""} recorded
                </span>
              </div>
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
                  Metabolic Pacing Status: {selectedDayTotals.calories >= targetCalories * 0.9 ? "Target Reached" : "Active Day"}
                </span>
                <p className="text-emerald-700 dark:text-emerald-400">
                  Logged <strong>{Math.round(selectedDayTotals.calories)} kcal</strong> against target of <strong>{targetCalories} kcal</strong>.
                </p>
              </div>

              {/* Complete Meals List for Selected Day */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Logged Meals ({selectedDayMeals.length})
                </span>
                {selectedDayMeals.length === 0 ? (
                  <p className="text-slate-400 italic py-4 text-center">No meals logged for this date.</p>
                ) : (
                  selectedDayMeals.map((m) => (
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
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                All AI Health Insights
              </h3>
              <button
                type="button"
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
              type="button"
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
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-500" />
                Scheduled Health Reminders
              </h3>
              <button
                type="button"
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
              type="button"
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
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto my-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {selectedMealDetail.meal_type} • {selectedMealDetail.created_at ? formatDate(selectedMealDetail.created_at) : ""}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white capitalize">
                  {selectedMealDetail.food_name}
                </h3>
              </div>
              <button
                type="button"
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
                type="button"
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
                type="button"
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
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-sm w-full p-6 rounded-3xl space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Delete Meal Log?
                </h3>
                <p className="text-xs text-slate-400">
                  This will remove the entry from the database and daily targets.
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
