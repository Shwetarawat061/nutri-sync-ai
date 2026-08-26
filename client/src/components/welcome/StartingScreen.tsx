import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Heart,
  Droplets,
  Zap,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NutriSyncLogo } from "../brand/NutriSyncLogo";

interface StartingScreenProps {
  onGetStarted: () => void;
  isExistingUser?: boolean;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export const StartingScreen: React.FC<StartingScreenProps> = ({
  onGetStarted,
  isExistingUser = false,
  theme = "dark",
  onToggleTheme,
}) => {
  const [currentSlide, setCurrentSlide] = useState(2); // default to "Next Best Action Engine"
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

  useEffect(() => {
    if (isPaused) return;
    const slideTimer = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(slideTimer);
  }, [isPaused, slides.length]);

  const handleHeartClick = () => {
    setIsFavorited((prev) => !prev);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 800);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070b14] flex items-center justify-center p-3 sm:p-6 md:p-8 lg:p-10 select-none overflow-x-hidden transition-colors duration-300">
      {/* Outer Main Container Card matching screenshot */}
      <div className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-white dark:bg-[#0c1424] rounded-[28px] sm:rounded-[36px] lg:rounded-[44px] shadow-2xl overflow-hidden relative border border-slate-200/90 dark:border-slate-800/80 p-3.5 sm:p-5 lg:p-8 flex flex-col lg:grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 min-h-[580px] lg:h-[min(760px,calc(100vh-4rem))] items-stretch transition-colors duration-300">
        
        {/* Soft Background Doodle Elements (Fork on left, Shaker & Apple on right) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-15 dark:opacity-15">
          {/* Fork on bottom-left */}
          <div className="absolute bottom-6 left-6 text-slate-400 dark:text-slate-400 rotate-[-25deg] transform">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
            </svg>
          </div>

          {/* Supplement Bottle on bottom-right */}
          <div className="absolute bottom-28 right-8 text-slate-400 dark:text-slate-400 rotate-[12deg] transform">
            <svg width="48" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="7" width="12" height="15" rx="3" fill="currentColor" fillOpacity="0.35" />
              <path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" />
              <polygon points="12 10 10 14 13 14 11 18 14 14 12 14" fill="currentColor" stroke="none" />
            </svg>
          </div>

          {/* Apple on bottom-right corner */}
          <div className="absolute bottom-6 right-6 text-slate-400 dark:text-slate-400 rotate-[-10deg] transform">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.7c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.63 1.34-.56.65-.98 1.7-.85 2.73 1.01.08 1.96-.47 2.56-1.22z" />
            </svg>
          </div>
        </div>

        {/* LEFT SECTION: Emerald Rounded Container with Food Bowl & Glowing Floating Badges */}
        <div className="relative z-10 w-full h-full bg-gradient-to-b from-[#A5E8D3] via-[#7ae0bf] to-[#50cd9f] dark:from-[#043324] dark:via-[#022c1f] dark:to-[#012217] rounded-[24px] sm:rounded-[32px] lg:rounded-[36px] p-5 sm:p-7 lg:p-8 flex flex-col justify-between overflow-hidden shadow-xl border border-emerald-400/40 dark:border-emerald-900/40 min-h-[340px] sm:min-h-[400px] lg:min-h-0 transition-colors duration-300">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/20 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="flex items-center justify-between z-10">
            <NutriSyncLogo variant="horizontal" size="md" />
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1 rounded-full bg-white/80 dark:bg-emerald-950/70 border border-emerald-600/20 dark:border-emerald-500/30 text-[11px] sm:text-xs font-extrabold text-emerald-900 dark:text-[#A7F3D0] shadow-sm backdrop-blur-md">
                v2.0 Sync
              </div>
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  aria-label="Toggle theme"
                  className="p-1.5 rounded-full bg-white/70 dark:bg-emerald-950/80 border border-emerald-600/20 dark:border-emerald-500/30 text-slate-800 dark:text-emerald-300 hover:scale-105 transition cursor-pointer"
                  title="Toggle Light / Dark theme"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-700" />}
                </button>
              )}
            </div>
          </div>

          {/* Center Food Bowl with White Border & 5 Floating Badges */}
          <div className="relative w-full flex items-center justify-center my-auto py-6 sm:py-8">
            <div className="relative w-56 h-56 sm:w-68 sm:h-68 lg:w-76 lg:h-76 xl:w-84 xl:h-84 flex items-center justify-center">
              
              {/* Outer Glowing Ring around bowl */}
              <div className="absolute inset-2 sm:inset-1 rounded-full bg-white/30 dark:bg-white/10 blur-xl pointer-events-none" />

              {/* White Circular Bowl Container */}
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-48 h-48 sm:w-60 sm:h-60 lg:w-68 lg:h-68 xl:w-76 xl:h-76 rounded-full bg-white p-1 shadow-2xl border-4 sm:border-[6px] border-white overflow-hidden ring-8 ring-white/30 dark:ring-white/10 flex items-center justify-center z-10"
              >
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=85"
                  alt="NutriSync Balanced Nutrition Bowl"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full transform scale-105 hover:scale-110 transition duration-700"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
              </motion.div>

              {/* Floating Badge 1: 'Nn' (Purple - Top Left) */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-2 left-3 sm:top-3 sm:left-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#8B5CF6] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-lg shadow-purple-500/50 border-2 border-white z-20"
                title="Nitrogen & Amino Balance"
              >
                Nn
              </motion.div>

              {/* Floating Badge 2: 'A' (Orange - Mid Left) */}
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="absolute top-[42%] -left-2 sm:-left-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FB923C] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-lg shadow-orange-500/50 border-2 border-white z-20"
                title="Vitamin A (Retinol & Carotenoids)"
              >
                A
              </motion.div>

              {/* Floating Badge 3: 💧 Water Drop (Sky Blue - Top Right-Center) */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="absolute -top-1 right-[26%] sm:top-0 sm:right-[24%] w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#38BDF8] text-white flex items-center justify-center shadow-lg shadow-sky-500/50 border-2 border-white z-20"
                title="Cellular Hydration & Electrolytes"
              >
                <Droplets className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
              </motion.div>

              {/* Floating Badge 4: 'K' (Crimson Red - Top Right) */}
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="absolute top-6 right-2 sm:top-7 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F43F5E] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-lg shadow-rose-500/50 border-2 border-white z-20"
                title="Potassium & Vitamin K"
              >
                K
              </motion.div>

              {/* Floating Badge 5: ⚡ Energy Lightning (Amber Gold - Bottom Right) */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-5 right-3 sm:bottom-6 sm:right-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#FBBF24] text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/50 border-2 border-white z-20"
                title="Metabolic ATP Energy"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950 text-slate-950" />
              </motion.div>
            </div>
          </div>

          {/* Bottom tag text */}
          <div className="hidden sm:flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-300/80 font-bold dark:font-medium px-1">
            <span>Adaptive Bio-Engine</span>
            <span>Clinical Precision</span>
          </div>
        </div>

        {/* RIGHT SECTION: Pagination, Headline, Subtitle, and Action Buttons */}
        <div
          className="relative z-10 flex flex-col justify-between px-2 sm:px-6 lg:px-4 py-2 sm:py-4 lg:py-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Pagination Indicators matching screenshot: . . ▬ . . */}
          <div className="flex items-center gap-2 mb-6 sm:mb-8 lg:mb-10 pt-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentSlide === idx
                    ? "w-8 sm:w-10 h-2 sm:h-2.5 bg-slate-900 dark:bg-white shadow-md shadow-slate-900/20 dark:shadow-white/20"
                    : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-500"
                }`}
              />
            ))}
          </div>

          {/* Animated Main Slide Content */}
          <div className="my-auto py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 sm:space-y-5"
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08] whitespace-pre-line">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl font-normal text-slate-600 dark:text-slate-300/90 leading-relaxed max-w-xl">
                  {slides[currentSlide].subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Actions Row: [Get Today's Sync ->] + [Heart Pill] + Demo link */}
          <div className="pt-8 sm:pt-10 space-y-4">
            <div className="flex items-center justify-between sm:justify-end gap-4">
              {/* Primary Action Button */}
              <button
                onClick={onGetStarted}
                className="flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-slate-900 dark:text-white font-bold text-base sm:text-lg hover:text-emerald-600 dark:hover:text-emerald-300 transition duration-200 cursor-pointer group bg-slate-100 dark:bg-transparent hover:bg-slate-200 dark:hover:bg-white/5 active:scale-95 border border-slate-200 dark:border-transparent"
              >
                <span>{isExistingUser ? "Enter Today's Sync" : "Get Today's Sync"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition duration-200 text-emerald-600 dark:text-emerald-400" />
              </button>

              {/* Circular Heart Button with Glowing Emerald Outline */}
              <button
                onClick={handleHeartClick}
                aria-label="Save or like app"
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center transition duration-200 cursor-pointer active:scale-90 ${
                  isFavorited
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 shadow-lg shadow-rose-500/20"
                    : "border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500/50 dark:bg-[#07241c]/80 dark:hover:bg-[#0b3328] text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/10"
                }`}
              >
                <motion.div
                  animate={heartAnim ? { scale: [1, 1.4, 0.9, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Heart
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      isFavorited
                        ? "fill-rose-500 text-rose-500"
                        : "text-emerald-700 dark:text-emerald-400 hover:fill-emerald-600/20"
                    }`}
                  />
                </motion.div>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

