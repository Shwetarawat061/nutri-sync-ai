import React from "react";
import { Flame, Utensils, Zap } from "lucide-react";

interface CalorieArcGaugeProps {
  calorieTarget: number;
  caloriesConsumed: number;
  caloriesBurned?: number;
  proteinTarget: number;
  proteinConsumed: number;
  carbsTarget: number;
  carbsConsumed: number;
  fatsTarget: number;
  fatsConsumed: number;
}

export const CalorieArcGauge: React.FC<CalorieArcGaugeProps> = ({
  calorieTarget = 2100,
  caloriesConsumed = 0,
  caloriesBurned = 420,
  proteinTarget = 120,
  proteinConsumed = 0,
  carbsTarget = 200,
  carbsConsumed = 0,
  fatsTarget = 60,
  fatsConsumed = 0,
}) => {
  const target = Math.max(1, calorieTarget);
  const remaining = Math.max(0, target - caloriesConsumed);
  const overTarget = Math.max(0, caloriesConsumed - target);
  const percent = Math.min(100, Math.max(0, (caloriesConsumed / target) * 100));

  // Arc Gauge Geometry (Semi-circle from 180deg to 0deg)
  const radius = 90;
  const strokeWidth = 16;
  const circumference = Math.PI * radius; // Half-circle perimeter
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="genz-card p-6 flex flex-col justify-between relative overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Calories Intake</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
          Target: {target} kcal
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2 pt-2">
        <svg viewBox="0 0 220 125" className="w-full max-w-[260px] overflow-visible">
          <defs>
            <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="gaugeShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2dd4bf" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Track Arc (180 deg to 0 deg) */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="4 8"
          />

          {/* Animated Progress Arc */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke="url(#calorieGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#gaugeShadow)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text Overlay */}
        <div className="absolute inset-x-0 bottom-2 text-center flex flex-col items-center justify-center">
          {overTarget > 0 ? (
            <>
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                +{overTarget.toLocaleString()} <span className="text-lg font-semibold">Kcal</span>
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full mt-0.5">
                Over Daily Target
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {remaining.toLocaleString()} <span className="text-lg font-semibold">Kcal</span>
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                {remaining === 0 ? "Daily Target Met" : "Calories Left"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Eaten vs Burned Breakdown */}
      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800/80 my-2">
        <div className="text-center sm:text-left">
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block">
            {caloriesConsumed} <span className="text-xs font-normal text-slate-400">Kcal</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
            Eaten Calories
          </span>
        </div>
        <div className="text-center sm:text-right">
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block">
            {caloriesBurned} <span className="text-xs font-normal text-slate-400">Kcal</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
            Burned Calories
          </span>
        </div>
      </div>

      {/* Macro Pills Bottom Bar */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {/* Protein */}
        <div className="p-2.5 rounded-2xl bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Protein</span>
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {Math.round(proteinConsumed)}<span className="text-[10px] text-slate-400 font-normal">/{proteinTarget}g</span>
          </span>
        </div>

        {/* Carbs */}
        <div className="p-2.5 rounded-2xl bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Carbs</span>
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {Math.round(carbsConsumed)}<span className="text-[10px] text-slate-400 font-normal">/{carbsTarget}g</span>
          </span>
        </div>

        {/* Fat */}
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Fat</span>
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {Math.round(fatsConsumed)}<span className="text-[10px] text-slate-400 font-normal">/{fatsTarget}g</span>
          </span>
        </div>
      </div>
    </div>
  );
};
