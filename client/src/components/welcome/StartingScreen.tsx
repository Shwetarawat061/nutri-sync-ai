import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Heart,
  Droplets,
  Zap,
  Sparkles,
  UtensilsCrossed,
  Apple,
  Dumbbell,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StartingScreenProps {
  onGetStarted: () => void;
  onExploreDemo?: () => void;
  isExistingUser?: boolean;
}

export const StartingScreen: React.FC<StartingScreenProps> = ({
  onGetStarted,
  onExploreDemo,
  isExistingUser = false,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      title: "Your Day,\nIn Sync",
      subtitle: "Achieve your wellness goals, beautifully and effortlessly.",
      tagline: "SMART METABOLIC INTELLIGENCE",
    },
    {
      title: "AI Vision,\nInstant Scan",
      subtitle: "Snap your mess meal or snack to calculate calories & macros with precision.",
      tagline: "MULTIMODAL FOOD RECOGNITION",
    },
    {
      title: "Next Best\nAction Engine",
      subtitle: "Stop guessing what to eat next. Get proactive clinical food recommendations.",
      tagline: "DECISION SUPPORT SYSTEM",
    },
    {
      title: "College Mess\n& Budget Sync",
      subtitle: "Real-world nutritional optimizations tailored for student life and hostel dining.",
      tagline: "AFFORDABLE & ACCESSIBLE",
    },
    {
      title: "Clinical\nBMR & TDEE",
      subtitle: "Personalized glycemic indexing and macro goals mapped to your body metrics.",
      tagline: "EVIDENCE-BASED NUTRITION",
    },
  ];

  // Auto-advance carousel slide every 3.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handleHeartClick = () => {
    setIsFavorited((prev) => !prev);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 800);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-0 sm:p-4 md:p-6 select-none">
      {/* Mobile Device Container Frame */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 sm:rounded-[40px] shadow-2xl overflow-hidden relative border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-screen sm:min-h-[844px] justify-between">
        {/* Soft Background Doodle Elements (Fork, Shaker, Apple) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-20">
          {/* Mint Fork on bottom-left */}
          <div className="absolute bottom-8 left-4 text-[#A5E8D3] rotate-[-25deg] transform">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
            </svg>
          </div>

          {/* Mint Fork on middle-right */}
          <div className="absolute top-[48%] right-4 text-[#A5E8D3] rotate-[35deg] transform">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7z" />
            </svg>
          </div>

          {/* Mint Shaker / Supplement Bottle on middle-right */}
          <div className="absolute top-[60%] right-6 text-[#A5E8D3] rotate-[10deg] transform">
            <svg width="46" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="7" width="12" height="15" rx="3" fill="currentColor" fillOpacity="0.35" />
              <path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" />
              <polygon points="12 10 10 14 13 14 11 18 14 14 12 14" fill="currentColor" stroke="none" />
            </svg>
          </div>

          {/* Mint Apple on bottom-right */}
          <div className="absolute bottom-6 right-5 text-[#A5E8D3] rotate-[-10deg] transform">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.7c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.63 1.34-.56.65-.98 1.7-.85 2.73 1.01.08 1.96-.47 2.56-1.22z" />
            </svg>
          </div>
        </div>

        {/* Top Section: Mint Wave Header + Healthy Bowl & Floating Nutrient Badges */}
        <div className="relative w-full z-10">
          {/* Mint Wave Background SVG Container */}
          <div className="relative w-full bg-[#A5E8D3] dark:bg-emerald-950/80 pt-4 pb-14 sm:pb-16 px-6 overflow-hidden rounded-b-[48px] shadow-sm">
            {/* Ambient Lighting / Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-300/40 dark:bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

            {/* Mobile Status Bar (9:30, Signal, Wifi, Battery) */}
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 text-xs font-bold px-1 mb-3">
              <span>9:30</span>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                {/* Signal */}
                <div className="flex items-end gap-[1.5px] h-3">
                  <span className="w-[2px] h-1 bg-current rounded-full" />
                  <span className="w-[2px] h-1.5 bg-current rounded-full" />
                  <span className="w-[2px] h-2 bg-current rounded-full" />
                  <span className="w-[2px] h-2.5 bg-current rounded-full" />
                </div>
                {/* Wifi */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.78 0 7.22 1.5 9.77 3.96L12 18.3 2.23 11.46C4.78 9 8.22 7.5 12 7.5z" />
                </svg>
                {/* Battery */}
                <div className="w-5 h-2.5 border border-current rounded-[3px] p-[1px] flex items-center">
                  <div className="h-full w-3 bg-current rounded-[1px]" />
                </div>
              </div>
            </div>

            {/* App Brand Header */}
            <div className="flex items-center justify-between mt-1 mb-4">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                <span>NutriSync</span>
              </h1>
              <div className="px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                v2.0 Sync
              </div>
            </div>

            {/* Central Healthy Bowl Image with Floating Badges */}
            <div className="relative w-full flex items-center justify-center my-2">
              <div className="relative w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center">
                {/* Outer Shadow Plate */}
                <div className="absolute inset-2 rounded-full bg-slate-900/10 dark:bg-black/40 blur-xl transform translate-y-3" />

                {/* White Ceramic Bowl with Food */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-white p-1 shadow-xl border-4 border-white/90 overflow-hidden ring-4 ring-emerald-500/10 flex items-center justify-center"
                >
                  <img
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=85"
                    alt="NutriSync Healthy Bowl with Grilled Chicken, Avocado, Quinoa, Broccoli, Tomatoes"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full transform scale-105 hover:scale-110 transition duration-700"
                  />
                  {/* Subtle bowl inner specular shine */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/40 pointer-events-none" />
                </motion.div>

                {/* Floating Badge 1: 'Nn' (Purple - Top Left) */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1 left-2 w-8 h-8 rounded-full bg-[#8B5CF6] text-white font-extrabold text-[11px] flex items-center justify-center shadow-lg shadow-purple-500/30 border-2 border-white"
                  title="Nutrient Nitrogen & Amino Matrix"
                >
                  Nn
                </motion.div>

                {/* Floating Badge 2: 'A' (Warm Orange - Mid Left) */}
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="absolute top-[38%] -left-1 w-7 h-7 rounded-full bg-[#FB923C] text-white font-extrabold text-[11px] flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-white"
                  title="Vitamin A (Beta-Carotene)"
                >
                  A
                </motion.div>

                {/* Floating Badge 3: 💧 Water Drop (Sky Blue - Top Center-Right) */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="absolute -top-1 right-[26%] w-7 h-7 rounded-full bg-[#38BDF8] text-white flex items-center justify-center shadow-lg shadow-sky-500/30 border-2 border-white"
                  title="Hydration & Cellular Electrolytes"
                >
                  <Droplets className="w-3.5 h-3.5 fill-white text-white" />
                </motion.div>

                {/* Floating Badge 4: 'K' (Rose / Red - Top Right) */}
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  className="absolute top-4 right-1 w-7 h-7 rounded-full bg-[#F43F5E] text-white font-extrabold text-[11px] flex items-center justify-center shadow-lg shadow-rose-500/30 border-2 border-white"
                  title="Potassium & Vitamin K"
                >
                  K
                </motion.div>

                {/* Floating Badge 5: ⚡ Lightning / Energy (Amber Gold - Bottom Right) */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-4 right-2 w-8 h-8 rounded-full bg-[#FBBF24] text-slate-900 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-white"
                  title="Metabolic ATP & Energy"
                >
                  <Zap className="w-4 h-4 fill-slate-900 text-slate-900" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Pagination, Display Headlines, Subtitle, and Action Buttons */}
        <div
          className="relative z-10 px-7 sm:px-8 pt-6 pb-8 flex-1 flex flex-col justify-between"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Pagination Indicators (1 Dark Pill + 4 Grey Dots matching image) */}
          <div className="flex items-center gap-1.5 mb-5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentSlide === idx
                    ? "w-7 h-2 bg-slate-900 dark:bg-white"
                    : "w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          {/* Dynamic Animated Content */}
          <div className="min-h-[140px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] whitespace-pre-line font-display">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-sm sm:text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[320px]">
                  {slides[currentSlide].subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Row: [Get Today's Sync ->] + [Heart Pill Button] */}
          <div className="pt-6 space-y-3">
            <div className="flex items-center gap-2.5">
              {/* Main Button: Get Today's Sync -> */}
              <button
                onClick={onGetStarted}
                className="flex-1 py-3.5 px-6 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-slate-900/15 transition duration-200 cursor-pointer group"
              >
                <span>{isExistingUser ? "Enter Today's Sync" : "Get Today's Sync"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition duration-200" />
              </button>

              {/* Heart Pill Button */}
              <button
                onClick={handleHeartClick}
                aria-label="Save or like app"
                className={`p-3.5 rounded-full border border-emerald-500/30 flex items-center justify-center transition duration-200 cursor-pointer ${
                  isFavorited
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-rose-500 border-rose-300"
                    : "bg-[#D1FAE5]/60 hover:bg-[#D1FAE5] dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                <motion.div
                  animate={heartAnim ? { scale: [1, 1.4, 0.9, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorited
                        ? "fill-rose-500 text-rose-500"
                        : "text-emerald-700 dark:text-emerald-300 fill-emerald-600/20"
                    }`}
                  />
                </motion.div>
              </button>
            </div>

            {/* Quick Demo Preview / Hostel Mode Indicator */}
            {onExploreDemo && !isExistingUser && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onExploreDemo}
                  className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer underline-offset-2 hover:underline"
                >
                  Quickly Explore with Sample College Mess Profile →
                </button>
              </div>
            )}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-900 dark:bg-slate-700 rounded-full mx-auto mt-6 opacity-40" />
        </div>
      </div>
    </div>
  );
};
