import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Calendar,
  Flame,
  Zap,
  CheckCircle2,
  ChevronRight,
  Brain,
  Sparkles,
  ArrowUpRight,
  Info,
  Layers,
  Activity,
} from "lucide-react";
import { WeeklyProgressResponse, WeeklyDayStat, UserProfile } from "../../types";
import { api } from "../../api";

interface WeeklyGoalProgressCardProps {
  userProfile: UserProfile | null;
  date?: string;
  onNavigateToScan?: () => void;
  onNavigateToAdvisor?: () => void;
}

export const WeeklyGoalProgressCard: React.FC<WeeklyGoalProgressCardProps> = ({
  userProfile,
  date,
  onNavigateToScan,
  onNavigateToAdvisor,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<WeeklyProgressResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"calories" | "protein" | "macros">("calories");
  const [selectedDay, setSelectedDay] = useState<WeeklyDayStat | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState<boolean>(false);

  useEffect(() => {
    if (!userProfile?.email) return;

    let isMounted = true;
    const fetchWeeklyData = async () => {
      try {
        setLoading(true);
        const res = await api.getWeeklyProgress(userProfile.email, date);
        if (isMounted && res) {
          setData(res);
          // Default selected day to today
          const today = res.days.find((d) => d.isToday) || res.days[res.days.length - 1];
          setSelectedDay(today);
        }
      } catch (err) {
        console.warn("Notice while fetching weekly progress:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeeklyData();
    return () => {
      isMounted = false;
    };
  }, [userProfile?.email, date]);

  if (loading && !data) {
    return (
      <div className="genz-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Weekly Goal Progress & Trends</h3>
              <span className="text-xs text-slate-400">Synthesizing 7-day metabolic velocity...</span>
            </div>
          </div>
        </div>
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Aggregating long-term memory logs & nutrition trends...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const targetCal = userProfile?.calorie_target || 2100;
  const targetProt = userProfile?.protein_target || 120;

  // Max value calculation for bar scaling
  const maxCal = Math.max(...data.days.map((d) => Math.max(d.calories, targetCal * 1.15)), 2500);
  const maxProt = Math.max(...data.days.map((d) => Math.max(d.protein, targetProt * 1.15)), 150);

  return (
    <div id="weekly-goal-progress-card" className="genz-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Weekly Goal Progress & Trends
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                {data.weekRange}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Long-term memory tracking • {data.proteinGoalDays}/7 days hit target protein threshold
            </p>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedMetric("calories")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedMetric === "calories"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Calories
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("protein")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedMetric === "protein"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Protein (g)
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("macros")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedMetric === "macros"
                ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Macro Split
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">7-Day Avg Energy</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{data.averageCalories}</span>
            <span className="text-xs text-slate-400 font-medium">/ {targetCal} kcal</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">Avg Daily Protein</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400">{data.averageProtein}g</span>
            <span className="text-xs text-sky-600/70 dark:text-sky-400/70 font-medium">/ {targetProt}g</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Protein Streak</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{data.streakDays}</span>
            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">days active</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Adherence Score</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{data.averageScore}</span>
            <span className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">/ 100</span>
          </div>
        </div>
      </div>

      {/* 7-Day Interactive Visual Bar Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Tap any day to inspect metabolic details</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Target Line: {selectedMetric === "calories" ? `${targetCal} kcal` : `${targetProt}g protein`}</span>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-4 pb-2">
          {data.days.map((day) => {
            const isSelected = selectedDay?.date === day.date;
            const calHeightPct = Math.min(100, Math.max(10, Math.round((day.calories / maxCal) * 100)));
            const protHeightPct = Math.min(100, Math.max(10, Math.round((day.protein / maxProt) * 100)));

            const totalMacros = (day.carbs * 4) + (day.protein * 4) + (day.fats * 9) || 1;
            const carbPct = Math.round(((day.carbs * 4) / totalMacros) * 100);
            const protPct = Math.round(((day.protein * 4) / totalMacros) * 100);
            const fatPct = 100 - carbPct - protPct;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center justify-between p-2 rounded-2xl transition cursor-pointer border ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
                    : day.isToday
                    ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-slate-800 dark:text-slate-100"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="text-center">
                  <span className={`text-[11px] font-black block ${isSelected ? "text-white dark:text-slate-950" : day.isToday ? "text-emerald-500 font-extrabold" : "text-slate-400"}`}>
                    {day.dayName}
                  </span>
                  <span className={`text-[9px] font-bold ${isSelected ? "text-white/70 dark:text-slate-950/70" : "text-slate-400"}`}>
                    {day.date.split("-")[2]}
                  </span>
                </div>

                {/* Visual Bar Indicator */}
                <div className="w-full h-24 sm:h-28 flex items-end justify-center py-2">
                  {selectedMetric === "calories" && (
                    <div className="w-4 sm:w-6 bg-slate-200 dark:bg-slate-700/60 rounded-lg overflow-hidden flex flex-col justify-end h-full relative">
                      {/* Target reference line indicator */}
                      <div
                        className="absolute w-full border-t-2 border-dashed border-emerald-500/60 z-10"
                        style={{ bottom: `${Math.round((targetCal / maxCal) * 100)}%` }}
                        title={`Target: ${targetCal} kcal`}
                      />
                      <div
                        className={`w-full rounded-md transition-all duration-500 ${
                          day.calories >= targetCal * 0.9 && day.calories <= targetCal * 1.1
                            ? "bg-emerald-500"
                            : day.calories > targetCal * 1.1
                            ? "bg-rose-500"
                            : "bg-amber-400"
                        }`}
                        style={{ height: `${calHeightPct}%` }}
                      />
                    </div>
                  )}

                  {selectedMetric === "protein" && (
                    <div className="w-4 sm:w-6 bg-slate-200 dark:bg-slate-700/60 rounded-lg overflow-hidden flex flex-col justify-end h-full relative">
                      {/* Target reference line indicator */}
                      <div
                        className="absolute w-full border-t-2 border-dashed border-sky-500/60 z-10"
                        style={{ bottom: `${Math.round((targetProt / maxProt) * 100)}%` }}
                        title={`Target: ${targetProt}g`}
                      />
                      <div
                        className={`w-full rounded-md transition-all duration-500 ${
                          day.protein >= targetProt * 0.9 ? "bg-sky-500" : "bg-orange-400"
                        }`}
                        style={{ height: `${protHeightPct}%` }}
                      />
                    </div>
                  )}

                  {selectedMetric === "macros" && (
                    <div className="w-4 sm:w-6 h-full rounded-lg overflow-hidden flex flex-col justify-end bg-slate-200 dark:bg-slate-700/60">
                      <div className="w-full bg-emerald-400 transition-all" style={{ height: `${Math.max(5, fatPct)}%` }} title={`Fats: ${day.fats}g`} />
                      <div className="w-full bg-sky-400 transition-all" style={{ height: `${Math.max(5, protPct)}%` }} title={`Protein: ${day.protein}g`} />
                      <div className="w-full bg-amber-400 transition-all" style={{ height: `${Math.max(5, carbPct)}%` }} title={`Carbs: ${day.carbs}g`} />
                    </div>
                  )}
                </div>

                {/* Numerical bottom indicator */}
                <div className="text-center mt-1">
                  <span className={`text-[10px] sm:text-xs font-black block ${isSelected ? "text-white dark:text-slate-950" : "text-slate-700 dark:text-slate-200"}`}>
                    {selectedMetric === "calories" ? `${day.calories}` : selectedMetric === "protein" ? `${day.protein}g` : `${day.adherenceScore}%`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Deep Dive Card */}
      {selectedDay && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                {selectedDay.dayName}, {selectedDay.date} {selectedDay.isToday && "(Today)"}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedDay.status === "perfect"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : selectedDay.status === "over"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
              }`}>
                {selectedDay.status === "perfect" ? "Target Achieved" : selectedDay.status === "over" ? "Calorie Surplus" : "On Track"}
              </span>
            </div>

            <span className="text-xs text-slate-400">
              {selectedDay.mealsCount} meal{selectedDay.mealsCount !== 1 ? "s" : ""} logged
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block">Calories</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {selectedDay.calories} <span className="text-[10px] text-slate-400 font-normal">/ {selectedDay.calorieTarget} kcal</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-bold text-sky-500 block">Protein</span>
              <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400">
                {selectedDay.protein}g <span className="text-[10px] text-slate-400 font-normal">/ {selectedDay.proteinTarget}g</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-bold text-amber-500 block">Carbohydrates</span>
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                {selectedDay.carbs}g
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-bold text-emerald-500 block">Healthy Fats</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {selectedDay.fats}g
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI Weekly Synthesis & Long-Term Memory Section */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-slate-50 dark:from-indigo-950/20 dark:via-purple-950/15 dark:to-slate-900 border border-indigo-100/80 dark:border-indigo-900/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
              Long-Term Memory Weekly Synthesis
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowMemoryModal(true)}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Memory Schema</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          {data.aiWeeklySummary}
        </p>

        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block">
              Priority Focus For Next 7 Days:
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {data.topImprovement}
            </p>
          </div>
        </div>
      </div>

      {/* Memory Schema Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="genz-card bg-white dark:bg-slate-900 max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Persistent Long-Term Memory Schema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMemoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              NutriSync AI continuously persists long-term patterns, dietary constraints, and behavioral state variables to deliver personalized clinical nutrition over weeks and months.
            </p>

            <div className="space-y-2.5">
              {data.memoryInsights.map((mem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-mono text-[11px] leading-relaxed">{mem}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMemoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition cursor-pointer"
              >
                Close Memory View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
