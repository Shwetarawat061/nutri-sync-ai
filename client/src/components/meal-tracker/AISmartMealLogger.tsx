import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Send,
  Check,
  Flame,
  Activity,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { MealItem, UserProfile, ParsedMealTextResult } from "../../types";
import { api } from "../../api";

interface AISmartMealLoggerProps {
  userProfile: UserProfile | null;
  onMealAdded: (meal: MealItem) => void;
  budgetHostelMode?: boolean;
}

export const AISmartMealLogger: React.FC<AISmartMealLoggerProps> = ({
  userProfile,
  onMealAdded,
  budgetHostelMode = false,
}) => {
  const [mealText, setMealText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedMealTextResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const quickPresets = [
    "2 boiled eggs + 1 brown bread toast + 1 glass milk",
    "Hostel mess lunch: 2 rotis, yellow dal, aloo matar, and 100g curd",
    "Grilled chicken breast 150g with 1 cup brown rice and steamed veggies",
    "1 scoop whey protein shake with 300ml milk and 1 banana",
    "3 idlis with sambar, coconut chutney, and filter coffee",
  ];

  const handleAnalyze = async (textToUse?: string) => {
    const text = (textToUse || mealText).trim();
    if (!text) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setSuccessToast(false);

    try {
      const userTargets = userProfile
        ? {
            calories: userProfile.calorie_target,
            protein: userProfile.protein_target,
            carbs: userProfile.carbs_target,
            fats: userProfile.fats_target,
          }
        : undefined;

      const result = await api.parseMealText({
        text,
        userGoal: userProfile?.goal || "Healthy eating",
        dietaryPreference: userProfile?.dietary_pref || "Omnivore",
        userTargets,
        budgetHostelMode,
      });

      setParsedResult(result);
      setIsExpanded(true);
    } catch (err: any) {
      console.error("AI meal text parsing failed:", err);
      setErrorMessage(err.message || "Failed to analyze meal description with AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogParsedMeal = async () => {
    if (!parsedResult) return;
    const userEmail = userProfile?.email || localStorage.getItem("user_email") || "guest@nutrisync.app";

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const newMeal: Partial<MealItem> = {
        user_email: userEmail,
        food_name: parsedResult.food_name,
        calories: parsedResult.calories,
        protein: parsedResult.protein,
        carbs: parsedResult.carbs,
        fats: parsedResult.fats,
        fiber: parsedResult.fiber || 0,
        glycemic_index: parsedResult.glycemic_index,
        metabolic_impact: parsedResult.metabolic_impact,
        nutrition_reasoning: parsedResult.nutrition_reasoning,
        meal_type: parsedResult.meal_type || "Lunch",
        consumed_at: new Date().toISOString(),
        consumedAt: new Date().toISOString(),
        date_status: "exact",
        dateStatus: "exact",
        created_at: new Date().toISOString(),
      };

      const saved = await api.logMeal(newMeal);
      onMealAdded(saved);
      setSuccessToast(true);
      setMealText("");
      setParsedResult(null);
      setIsExpanded(false);

      setTimeout(() => setSuccessToast(false), 4000);
    } catch (err: any) {
      console.error("Failed to log parsed meal:", err);
      setErrorMessage(err.message || "Failed to save meal to tracker.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="genz-card p-5 space-y-4 border border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-slate-50 dark:via-slate-900 to-teal-500/5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              AI Smart Meal Logger
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Natural Language
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Type what you ate in plain English or Hinglish — AI calculates exact macros & portions
            </p>
          </div>
        </div>
      </div>

      {/* Input Field & Submit */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={mealText}
            onChange={(e) => setMealText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAnalyze();
              }
            }}
            placeholder="e.g., 2 paneer parathas with 100g curd and a cup of ginger tea"
            disabled={isAnalyzing}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={!mealText.trim() || isAnalyzing}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Estimate Macros</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Example Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">Try:</span>
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setMealText(preset);
                handleAnalyze(preset);
              }}
              disabled={isAnalyzing}
              className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition flex-shrink-0 cursor-pointer shadow-2xs"
            >
              {preset.length > 32 ? preset.slice(0, 30) + "..." : preset}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Notification */}
      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Meal logged and added to your daily metabolic tracker!</span>
        </div>
      )}

      {/* Parsed AI Breakdown Card */}
      {parsedResult && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-emerald-500/30 space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                AI Detected Meal
              </span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {parsedResult.food_name}
              </h4>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {parsedResult.meal_type}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                GI: {parsedResult.glycemic_index}
              </span>
            </div>
          </div>

          {/* Macro Breakdown Strip */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[9px] font-bold uppercase text-amber-600 block">Calories</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {parsedResult.calories} <span className="text-[9px] font-normal">kcal</span>
              </span>
            </div>

            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
              <span className="text-[9px] font-bold uppercase text-orange-600 block">Protein</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {parsedResult.protein}g
              </span>
            </div>

            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
              <span className="text-[9px] font-bold uppercase text-sky-600 block">Carbs</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {parsedResult.carbs}g
              </span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[9px] font-bold uppercase text-emerald-600 block">Fats</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {parsedResult.fats}g
              </span>
            </div>
          </div>

          {/* Items Decomposition */}
          {parsedResult.items_breakdown && parsedResult.items_breakdown.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Itemized Ingredients
              </span>
              <div className="space-y-1">
                {parsedResult.items_breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-medium">
                      {item.name} <span className="text-[10px] text-slate-400">({item.portion})</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {item.calories} kcal | {item.protein}g P
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Insight & Impact */}
          {parsedResult.nutrition_reasoning && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
              💡 {parsedResult.nutrition_reasoning}
            </p>
          )}

          {/* Action Log Button */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setParsedResult(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              Discard
            </button>

            <button
              onClick={handleLogParsedMeal}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log This Meal</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
