import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Target,
  CheckCircle2,
  TrendingUp,
  Zap,
  Layers,
  Repeat,
  Compass,
  Award,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Eye,
  BrainCircuit,
  PieChart,
  BarChart3,
  Flame,
  ArrowDown,
  Building,
  Check,
} from "lucide-react";
import { UserProfile, DailyTotals, MealItem } from "../../types";

interface StrategySlideProps {
  userProfile: UserProfile | null;
  dailyTotals: DailyTotals;
  meals: MealItem[];
  budgetHostelMode: boolean;
  onNavigateToScan?: () => void;
  onNavigateToDashboard?: () => void;
}

export const StrategySlide: React.FC<StrategySlideProps> = ({
  userProfile,
  dailyTotals,
  meals,
  budgetHostelMode,
  onNavigateToScan,
  onNavigateToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<"architecture" | "differentiation" | "metrics">("architecture");

  const targetProtein = userProfile?.protein_target || 100;
  const currentProtein = Math.round(dailyTotals.protein);
  const remainingProt = Math.max(0, targetProtein - currentProtein);

  return (
    <div id="strategy-pitch-container" className="max-w-6xl mx-auto space-y-6 pb-24 px-2 sm:px-4">
      {/* Top Banner / Slide Header */}
      <div className="genz-card p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                Product Vision & Strategy
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Executive Evaluation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>NutriSync</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">
                Decision Engine
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              The AI nutrition decision engine that turns every meal recognition into a personalized next-best action.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("architecture")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "architecture"
                  ? "bg-white text-slate-950 shadow-md"
                  : "bg-slate-800/80 text-slate-300 hover:text-white"
              }`}
            >
              Engine Architecture
            </button>
            <button
              onClick={() => setActiveTab("differentiation")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "differentiation"
                  ? "bg-white text-slate-950 shadow-md"
                  : "bg-slate-800/80 text-slate-300 hover:text-white"
              }`}
            >
              Comparison Matrix
            </button>
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "metrics"
                  ? "bg-white text-slate-950 shadow-md"
                  : "bg-slate-800/80 text-slate-300 hover:text-white"
              }`}
            >
              Impact & Metrics
            </button>
          </div>
        </div>
      </div>

      {/* CORE INSIGHT CALLOUT BOX (Section 2 from Prompt) */}
      <div className="genz-card p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-cyan-500/10 border-amber-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Core Market Insight
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">The Problem Gap</span>
            </div>
            <blockquote className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              “People don't need more nutrition data. They need help deciding what to do with it.”
            </blockquote>
          </div>

          {/* Micro Visual Before vs After */}
          <div className="flex items-center gap-3 shrink-0 p-3 rounded-2xl bg-white/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs shadow-sm">
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Traditional</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">"What did I eat?"</span>
              <div className="text-[10px] text-slate-400">→ "520 kcal"</div>
            </div>
            <div className="text-xs font-black text-amber-500">VS</div>
            <div className="text-center px-2 bg-emerald-500/10 rounded-xl p-1.5 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">NutriSync</span>
              <span className="font-bold text-slate-900 dark:text-white">"What should I do next?"</span>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">→ Real-time action</div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: THE COMPLETE DECISION ENGINE FLOW & ARCHITECTURE */}
      {activeTab === "architecture" && (
        <div className="space-y-6">
          {/* Main 3-Column Visual Layout (Target Users, Center Engine, USP & Personalization) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Column 1: Target Users & Product Goals */}
            <div className="lg:col-span-3 space-y-5">
              {/* Target Users */}
              <div className="genz-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Target Users
                  </h3>
                </div>
                <div className="space-y-2">
                  {[
                    { title: "College & Hostel Students", desc: "Limited mess menu, fixed budget" },
                    { title: "Young Working Adults", desc: "No time to weigh grams or manual log" },
                    { title: "Fitness Beginners", desc: "Confused by generic macro charts" },
                  ].map((u, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs">
                      <strong className="block text-slate-900 dark:text-slate-100">{u.title}</strong>
                      <span className="text-[11px] text-slate-400">{u.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Goals */}
              <div className="genz-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Product Goals
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Scan simply:</strong> Zero manual barcode or gram entry.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Understand:</strong> Break food into actionable metabolic velocity.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Personalize:</strong> Infuse hostel/mess context & user targets.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Recommend:</strong> Prescribe the exact next meal item.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 2: CENTER WOW ENGINE (Section 1 from Prompt) */}
            <div className="lg:col-span-6 genz-card p-6 bg-gradient-to-b from-slate-50 via-white to-sky-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 border-2 border-indigo-500/30 flex flex-col justify-between relative shadow-xl">
              <div className="text-center space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-0.5 rounded-full border border-indigo-500/20">
                  Centerpiece Architecture
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  NUTRISYNC DECISION ENGINE
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  From food recognition → to personalized decision support
                </p>
              </div>

              {/* Step-by-Step Flow Graphic */}
              <div className="my-6 space-y-3 relative">
                {/* Step 1: WHAT I ATE */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Input</span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">WHAT I ATE (Image / Text)</h4>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    Hostel Tray / Plate
                  </span>
                </div>

                <div className="flex justify-center -my-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <ArrowDown className="w-3 h-3" />
                  </div>
                </div>

                {/* Step 2: AI FOOD SCAN */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Computer Vision</span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">AI FOOD SCAN & MACRO BREAKDOWN</h4>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">320 kcal • 28g P</span>
                </div>

                <div className="flex justify-center -my-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <ArrowDown className="w-3 h-3" />
                  </div>
                </div>

                {/* Step 3: PERSONAL CONTEXT (The Critical Differentiator) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-2 border-indigo-500/40 shadow-md">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-200 dark:border-indigo-800/60">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5" />
                      PERSONAL CONTEXT INGESTION
                    </span>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                      Step 3
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">🎯 Goal</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {userProfile?.goal || "High Protein & Satiety"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">🥗 Diet & Budget</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {userProfile?.dietaryPreference || "Vegetarian"} • Student
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">🏠 Context</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {budgetHostelMode ? "Hostel / Mess Menu Active" : "Standard Kitchen"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">📊 Today's Gap</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {currentProtein}g / {targetProtein}g Protein ({remainingProt}g left)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center -my-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <ArrowDown className="w-3 h-3" />
                  </div>
                </div>

                {/* Step 4: AI REASONING */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-xs">
                      4
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gemini Synthesis</span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">CLINICAL & METABOLIC REASONING</h4>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-purple-500 animate-spin" style={{ animationDuration: "10s" }} />
                </div>

                <div className="flex justify-center -my-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <ArrowDown className="w-3 h-3" />
                  </div>
                </div>

                {/* Step 5: NEXT BEST ACTION (The Outcome) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 border-2 border-emerald-500/50 shadow-lg text-slate-900 dark:text-white">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      🎯 NEXT BEST ACTION
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      Actionable
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-extrabold leading-snug">
                    "Add 1 cup of curd or 2 boiled eggs / double-dal to lunch to hit your 40g midday protein threshold."
                  </p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-500/20 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    <span>Hostel Mess Hack:</span>
                    <span className="underline">Curd bowl (₹15)</span> • <span className="underline">Double Dal</span> • <span className="underline">Roasted Chana</span>
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div className="text-center pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  ⚡ Meal + Goal + History + Context → AI Reasoning → Action
                </span>
              </div>
            </div>

            {/* Column 3: The USP & Defensibility Loop (Section 3 & 8 from Prompt) */}
            <div className="lg:col-span-3 space-y-5">
              {/* The Upgraded USP */}
              <div className="genz-card p-5 space-y-3 border-emerald-500/30 bg-emerald-50/20 dark:bg-slate-900">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Core USP
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  “The AI nutrition decision engine that turns every meal into a personalized next-best action.”
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Unlike passive calorie counters, NutriSync actively calculates nutrient deficits and context constraints to tell you exactly what to eat next.
                </p>
              </div>

              {/* WHY IT GETS SMARTER (Defensibility & Learning Loop) */}
              <div className="genz-card p-5 space-y-3 bg-gradient-to-b from-purple-500/10 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Why It Gets Smarter
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs">
                  {[
                    "More Meals Logged",
                    "Deeper User Context Ingested",
                    "Refined Metabolic Velocity Pattern",
                    "Hyper-Relevant Next Best Actions",
                    "Compound Long-Term Adherence",
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                      <span className="text-[10px] font-bold text-purple-500">{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIFFERENTIATION MATRIX (TRACK -> UNDERSTAND -> ACT) */}
      {activeTab === "differentiation" && (
        <div className="space-y-6">
          {/* 3-Column Comparison Table (Section 4 from Prompt) */}
          <div className="genz-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Track → Understand → Act
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Why NutriSync is Fundamentally Different
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">5-Second Value Clarity</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Evaluation Dimension</th>
                    <th className="py-3 px-4 bg-slate-50 dark:bg-slate-900/60">Traditional Tracker (MyFitnessPal)</th>
                    <th className="py-3 px-4 bg-slate-50 dark:bg-slate-900/60">AI Food Scanner (Calorie AI)</th>
                    <th className="py-3 px-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black">
                      NutriSync Decision Engine ⚡
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">Core Function</td>
                    <td className="py-3.5 px-4 bg-slate-50/50 dark:bg-slate-900/30">Logs food entries</td>
                    <td className="py-3.5 px-4 bg-slate-50/50 dark:bg-slate-900/30">Identifies visual foods</td>
                    <td className="py-3.5 px-4 bg-emerald-500/10 font-bold text-slate-900 dark:text-white">
                      Understands full personal context & mess limits
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">Data Output</td>
                    <td className="py-3.5 px-4 bg-slate-50/50 dark:bg-slate-900/30">Shows static calorie numbers</td>
                    <td className="py-3.5 px-4 bg-slate-50/50 dark:bg-slate-900/30">Estimates plate nutrition</td>
                    <td className="py-3.5 px-4 bg-emerald-500/10 font-bold text-slate-900 dark:text-white">
                      Explains the metabolic gap & velocity
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">User Effort</td>
                    <td className="py-3.5 px-4 bg-slate-50/50 dark:bg-slate-900/30">Manual search & gram weighing</td>
                    <td className="py-3.5 px-4 bg-slate-50/50 dark:bg-slate-900/30">Fast photo scan</td>
                    <td className="py-3.5 px-4 bg-emerald-500/10 font-bold text-slate-900 dark:text-white">
                      Zero friction scan → Prescribed next action
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">Product Philosophy</td>
                    <td className="py-3.5 px-4 bg-slate-50/50 dark:bg-slate-900/30">Data-focused archive</td>
                    <td className="py-3.5 px-4 bg-slate-50/50 dark:bg-slate-900/30">Recognition-focused gadget</td>
                    <td className="py-3.5 px-4 bg-emerald-500/10 font-black text-emerald-700 dark:text-emerald-300">
                      Decision-focused personal copilot
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 10: BEFORE VS AFTER VISUAL STRIP */}
          <div className="genz-card p-6 bg-slate-900 text-white space-y-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
              Evolution of Nutrition Tech
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Traditional */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Traditional Flow (High Cognitive Friction)</span>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-700">Food</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-700">Calories</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-700">Dashboard</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300">User guesses what to do</span>
                </div>
              </div>

              {/* NutriSync */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-indigo-950 border border-emerald-500/40 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase">NutriSync Flow (Zero-Friction Action)</span>
                <div className="flex items-center gap-2 text-xs font-black text-white flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300">Food Scan</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300">Personal Context</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300">AI Reasoning</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950">NEXT BEST ACTION 🎯</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER IMPACT & NORTH STAR METRICS (Section 6 & 7 from Prompt) */}
      {activeTab === "metrics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* User Impact Card */}
            <div className="genz-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Value Delivered</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">User Impact</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <strong className="text-sm text-slate-900 dark:text-white block">
                  “Reduce the effort required to make a better food decision.”
                </strong>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Eliminates the anxiety of searching food databases, converting portion sizes, and guessing evening deficits.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                  <span className="text-lg font-black text-sky-600 dark:text-sky-400 block">90%</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Less Effort</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">100%</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Personalized</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400 block">1-Click</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Actionable</span>
                </div>
              </div>
            </div>

            {/* Success Metrics & North Star */}
            <div className="genz-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Measurement</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Evaluator Success Metrics</h3>
                </div>
              </div>

              {/* NORTH STAR METRIC (Prompt Section 7) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-emerald-500/20 border-2 border-amber-500/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300">
                    ⭐ North Star Metric
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900 px-2 py-0.5 rounded-full">
                    Core USP Metric
                  </span>
                </div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                  % of meal scans that result in an accepted, personalized Next Best Action
                </p>
              </div>

              {/* Technical & Product Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">AI Quality</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">• Food Scan Success Rate</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">• JSON Schema Adherence</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">• Recommendation Relevance</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Product Traction</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">• Meal Scans / Active User</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">• Weekly Meal Journal Save %</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">• Scan → Action Completion</div>
                </div>
              </div>
            </div>
          </div>

          {/* Go-To-Market & Competition Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="genz-card p-5 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Go-To-Market Strategy</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Direct rollout through college campus hostel student groups, mess dining halls, and student fitness clubs using the zero-friction QR scan flow.
              </p>
            </div>
            <div className="genz-card p-5 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Competitive Moat</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Hyper-localized context ingestion (hostel mess menus, regional pantry budgets, personalized macro velocity) rather than generic worldwide ingredient databases.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
