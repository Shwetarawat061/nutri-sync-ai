import React, { useState, useEffect } from "react";
import { Droplets, Plus, Minus } from "lucide-react";

interface WaterTrackerCardProps {
  initialLiters?: number;
  targetLiters?: number;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  initialLiters = 1.75,
  targetLiters = 3.0,
}) => {
  const [liters, setLiters] = useState<number>(() => {
    const saved = localStorage.getItem("nutrisync_water_liters");
    return saved ? Number(saved) : initialLiters;
  });

  useEffect(() => {
    localStorage.setItem("nutrisync_water_liters", liters.toFixed(2));
  }, [liters]);

  const addWater = (amount: number) => {
    setLiters((prev) => Math.min(6.0, Math.max(0, Number((prev + amount).toFixed(2)))));
  };

  const percentage = Math.min(100, Math.round((liters / targetLiters) * 100));

  return (
    <div className="genz-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-500 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
            <Droplets className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Water</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          {percentage}% of Goal
        </span>
      </div>

      {/* Circular Liquid Wave Container */}
      <div className="my-4 flex items-center justify-center relative">
        <div className="relative w-36 h-36 rounded-full border-4 border-sky-100 dark:border-slate-800 bg-sky-50/50 dark:bg-slate-900/80 overflow-hidden flex flex-col items-center justify-center shadow-inner">
          {/* Animated Liquid Background */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-500 to-cyan-400 transition-all duration-700 ease-out opacity-80"
            style={{ height: `${percentage}%` }}
          >
            {/* Wave overlay */}
            <div className="absolute -top-3 inset-x-0 h-4 bg-sky-400/50 rounded-full animate-wave" />
          </div>

          {/* Center Text */}
          <div className="relative z-10 text-center select-none">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white drop-shadow-sm">
                {liters < 10 ? `0${liters.toFixed(1)}` : liters.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-200">Liters</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">
              Goal: {targetLiters}L
            </span>
          </div>
        </div>
      </div>

      {/* Quick Tap Controls */}
      <div className="flex items-center justify-between gap-2 z-10 pt-1">
        <button
          onClick={() => addWater(-0.25)}
          disabled={liters <= 0}
          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition disabled:opacity-40 cursor-pointer"
          title="Minus 250ml"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>250ml</span>
        </button>

        <button
          onClick={() => addWater(0.25)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center justify-center gap-1 transition shadow-md shadow-sky-500/20 cursor-pointer"
          title="Add 250ml"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+250ml</span>
        </button>
      </div>
    </div>
  );
};
