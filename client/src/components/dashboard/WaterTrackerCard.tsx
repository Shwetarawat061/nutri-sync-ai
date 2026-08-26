import React, { useState, useEffect, useCallback } from "react";
import {
  Droplets,
  Plus,
  Coffee,
  CupSoda,
  Utensils,
  History,
  Trash2,
  Sparkles,
  Info,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../api";
import { HydrationTodayResponse, HydrationEntry, UserProfile } from "../../types";

interface WaterTrackerCardProps {
  userProfile?: UserProfile | null;
  onLogged?: () => void;
}

const BEVERAGE_ICONS: Record<string, any> = {
  Water: Droplets,
  Milk: CupSoda,
  Tea: Coffee,
  Coffee: Coffee,
  Juice: CupSoda,
  Other: Droplets,
};

const BEVERAGE_COLORS: Record<string, string> = {
  Water: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  Milk: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  Tea: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  Coffee: "text-amber-800 dark:text-amber-400 bg-amber-700/10 border-amber-700/20",
  Juice: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  Other: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
};

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  userProfile,
  onLogged,
}) => {
  const [data, setData] = useState<HydrationTodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("Water");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [insightText, setInsightText] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHydration = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getTodayHydration(userProfile?.timezone);
      setData(res);
      if (res.explanation) {
        setInsightText(`${res.explanation} ${res.nextBestAction}`);
      }
    } catch (err: any) {
      console.warn("Failed to load hydration status:", err);
      // Fallback deterministic default based on user profile
      const isMale = userProfile?.gender?.toLowerCase() === "male";
      const bevTarget = isMale ? 3000 : 2200;
      const totalTarget = isMale ? 3700 : 2700;
      setData({
        success: true,
        date: new Date().toISOString().split("T")[0],
        timezone: "UTC",
        totalWaterGoalMl: totalTarget,
        beverageGoalMl: bevTarget,
        foodWaterEstimateMl: 500,
        consumedFromDrinksMl: 0,
        estimatedFoodWaterMl: 0,
        totalWaterConsumedMl: 0,
        remainingBeverageMl: bevTarget,
        remainingTotalWaterMl: totalTarget,
        hydrationPercentage: 0,
        beveragePercentage: 0,
        totalPercentage: 0,
        status: "Needs attention",
        explanation: `Your daily beverage target is ${(bevTarget / 1000).toFixed(1)} L.`,
        nextBestAction: "Try logging a 250 ml glass of water to get started.",
        foodWaterTrackingIncomplete: false,
        contextualFactors: [],
        beverageBreakdown: { Water: 0, Milk: 0, Tea: 0, Coffee: 0, Juice: 0, Other: 0 },
        entriesCount: 0,
        mealsCount: 0,
        entries: [],
      });
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchHydration();
  }, [fetchHydration]);

  const handleQuickLog = async (amountMl: number, bevType: string = selectedType) => {
    try {
      setLogging(true);
      setErrorMsg(null);
      const res = await api.logHydration({
        amountMl,
        beverageType: bevType,
        consumedAt: new Date().toISOString(),
        timezone: userProfile?.timezone,
      });
      if (res.progress) {
        setData(res.progress);
        setInsightText(`${res.progress.explanation} ${res.progress.nextBestAction}`);
      } else {
        await fetchHydration();
      }
      if (onLogged) onLogged();
    } catch (err: any) {
      console.error("Hydration logging failed:", err);
      setErrorMsg(err.message || "Failed to log hydration");
    } finally {
      setLogging(false);
      setShowCustomModal(false);
      setCustomAmount("");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      setDeletingId(id);
      await api.deleteHydration(id);
      await fetchHydration();
      if (onLogged) onLogged();
    } catch (err: any) {
      console.error("Failed to delete entry:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const consumedBeverageL = data ? (data.consumedFromDrinksMl / 1000).toFixed(1) : "0.0";
  const beverageGoalL = data ? (data.beverageGoalMl / 1000).toFixed(1) : "3.0";
  const totalWaterL = data ? (data.totalWaterConsumedMl / 1000).toFixed(1) : "0.0";
  const totalGoalL = data ? (data.totalWaterGoalMl / 1000).toFixed(1) : "3.7";
  const foodWaterMl = data?.estimatedFoodWaterMl || 0;
  const percentage = data ? data.beveragePercentage : 0;

  const statusBadgeColor =
    data?.status === "Good"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      : data?.status === "Getting there"
      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

  return (
    <div id="hydration-engine-card" className="genz-card p-6 flex flex-col justify-between h-full relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shadow-xs">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">Hydration Engine</h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="text-slate-400 hover:text-sky-500 transition cursor-pointer p-0.5"
                title="DRI Reference Baseline Info"
                aria-label="DRI Reference Baseline Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Personalized DRI Fluid Balance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Drink History & Breakdown"
            aria-label="Drink History & Breakdown"
          >
            <History className="w-4 h-4" />
          </button>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadgeColor}`}>
            {data?.status || "Tracking"}
          </span>
        </div>
      </div>

      {/* Main Gauge & Metrics Container */}
      <div className="my-4 flex flex-col items-center justify-center relative">
        <div className="relative w-40 h-40 rounded-full border-4 border-sky-100 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-900/90 overflow-hidden flex flex-col items-center justify-center shadow-inner">
          {/* Fluid fill level */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-600 via-sky-500 to-cyan-400 transition-all duration-700 ease-out opacity-85"
            style={{ height: `${percentage}%` }}
          >
            <div className="absolute -top-3 inset-x-0 h-4 bg-sky-300/60 rounded-full animate-wave" />
          </div>

          {/* Center metric text */}
          <div className="relative z-10 text-center select-none px-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white drop-shadow-sm">
                {consumedBeverageL}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-200">/ {beverageGoalL} L</span>
            </div>
            <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-white/70 dark:bg-slate-900/80 px-2 py-0.5 rounded-full mt-0.5 backdrop-blur-xs">
              {percentage}% Fluids
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium block mt-0.5">
              Total: {totalWaterL} / {totalGoalL} L
            </span>
          </div>
        </div>

        {/* Food Water Contribution Pill */}
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          <Utensils className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            Food water: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+{foodWaterMl} ml</strong> from meals
          </span>
          {data?.foodWaterTrackingIncomplete && (
            <span className="text-[10px] text-amber-500 dark:text-amber-400" title="Some meals lacked reliable water data">
              *partial
            </span>
          )}
        </div>
      </div>

      {/* Beverage Category Selector */}
      <div className="mb-3">
        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
          Select Beverage
        </label>
        <div className="grid grid-cols-6 gap-1">
          {["Water", "Milk", "Tea", "Coffee", "Juice", "Other"].map((type) => {
            const isSelected = selectedType === type;
            const Icon = BEVERAGE_ICONS[type] || Droplets;
            const colorClass = BEVERAGE_COLORS[type] || "text-sky-500";
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 transition cursor-pointer border ${
                  isSelected
                    ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                title={type}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : colorClass.split(" ")[0]}`} />
                <span className="truncate max-w-[45px] text-[10px]">{type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Tap Controls */}
      <div className="flex items-center gap-1.5 pt-1">
        <button
          type="button"
          disabled={logging}
          onClick={() => handleQuickLog(250)}
          className="flex-1 py-2 px-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          title="Log 250 ml glass"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>250ml</span>
        </button>

        <button
          type="button"
          disabled={logging}
          onClick={() => handleQuickLog(500)}
          className="flex-1 py-2 px-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer shadow-sm shadow-sky-500/20"
          title="Log 500 ml bottle"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>500ml</span>
        </button>

        <button
          type="button"
          disabled={logging}
          onClick={() => handleQuickLog(750)}
          className="flex-1 py-2 px-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          title="Log 750 ml flask"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>750ml</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center transition cursor-pointer"
          title="Custom amount"
        >
          Custom
        </button>
      </div>

      {/* Insight Banner */}
      {insightText && (
        <div className="mt-3 p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/50 dark:border-sky-800/40 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            {insightText}
          </p>
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CUSTOM DRINK MODAL */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-sky-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white">Log Custom Drink</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Beverage Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium"
                  >
                    <option value="Water">Water</option>
                    <option value="Milk">Milk</option>
                    <option value="Tea">Tea</option>
                    <option value="Coffee">Coffee</option>
                    <option value="Juice">Juice</option>
                    <option value="Other">Other Fluid</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Amount (ml)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    step="10"
                    placeholder="e.g. 350"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!customAmount || Number(customAmount) <= 0 || logging}
                    onClick={() => handleQuickLog(Number(customAmount))}
                    className="flex-1 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {logging ? "Logging..." : "Save Drink"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HISTORY & BREAKDOWN MODAL */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-sky-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white">Hydration Logs & Breakdown</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Breakdown by Beverage */}
              <div className="py-3 border-b border-slate-100 dark:border-slate-800">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Beverage Breakdown Today
                </h5>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(data?.beverageBreakdown || {}).map(([bev, ml]) => (
                    <div
                      key={bev}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 flex flex-col"
                    >
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{bev}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{ml} ml</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logged List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Today's Entries ({data?.entries?.length || 0})
                </h5>

                {(!data?.entries || data.entries.length === 0) ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center">
                    No drinks logged yet today.
                  </p>
                ) : (
                  data.entries.map((entry) => {
                    const Icon = BEVERAGE_ICONS[entry.beverageType || entry.beverage_type] || Droplets;
                    const timeStr = entry.consumedAt || entry.consumed_at
                      ? new Date(entry.consumedAt || entry.consumed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "";
                    const isDeleting = deletingId === entry.id;

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {entry.amountMl || entry.amount_ml} ml
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                                {entry.beverageType || entry.beverage_type}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">{timeStr}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Remove drink entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRI SCIENCE REFERENCE INFO MODAL */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white">National Academies DRI Standards</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-3 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  NutriSync uses the <strong>National Academies Dietary Reference Intake (DRI)</strong> guidelines as our science-backed baseline:
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">Adult Men:</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Total water AI = 3.7 L/day (~3.0 L from beverages, ~700 ml from food).</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">Adult Women:</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Total water AI = 2.7 L/day (~2.2 L from beverages, ~500 ml from food).</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">Pregnancy & Lactation:</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Pregnancy: 3.0 L total (2.3 L beverages); Lactation: 3.8 L total (3.1 L beverages).</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <em>Important:</em> 3.7 L and 2.7 L represent <strong>total water</strong> from beverages and food. Food contributes approximately 20% of total water intake in a standard diet.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="w-full py-2 rounded-xl bg-sky-500 text-white text-xs font-bold"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
