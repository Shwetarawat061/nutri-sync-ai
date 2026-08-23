import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Camera,
  Utensils,
  BookOpen,
  User,
  Zap,
  Building,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { UserProfile, MealItem, DailyTotals } from "./types";
import { api } from "./api";
import { StartingScreen } from "./components/welcome/StartingScreen";
import { Onboarding } from "./components/Onboarding";
import { NutritionDashboard } from "./components/dashboard/NutritionDashboard";
import { FoodScanner } from "./components/food-scan/FoodScanner";
import { MealTracker } from "./components/meal-tracker/MealTracker";
import { DietPlanGenerator } from "./components/diet-plan/DietPlanGenerator";
import { ProfileSettings } from "./components/profile/ProfileSettings";
import { StrategySlide } from "./components/strategy/StrategySlide";

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [onboardingView, setOnboardingView] = useState<"welcome" | "form">("welcome");
  const [activeTab, setActiveTab] = useState<"dashboard" | "scan" | "tracker" | "diet" | "profile" | "strategy" | "start">(() => {
    // Check if opened for the first time today
    const todayKey = getTodayDateString();
    const lastOpened = localStorage.getItem("nutrisync_last_opened_date");
    return lastOpened === todayKey ? "dashboard" : "start";
  });
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [budgetHostelMode, setBudgetHostelMode] = useState<boolean>(() => {
    return localStorage.getItem("nutrisync_hostel_mode") === "true";
  });
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("nutrisync_theme") as "dark" | "light") || "light";
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("nutrisync_theme", theme);
  }, [theme]);

  // Save hostel mode
  useEffect(() => {
    localStorage.setItem("nutrisync_hostel_mode", String(budgetHostelMode));
  }, [budgetHostelMode]);

  // Initial load: Profile & Meals
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const savedEmail = localStorage.getItem("user_email");
        if (savedEmail) {
          const profile = await api.getUserProfile(savedEmail);
          if (profile) {
            setUserProfile(profile);
            const userMeals = await api.getMeals(profile.email);
            setMeals(userMeals);

            // Check if there are legacy localStorage meals to migrate
            const localMealsRaw = localStorage.getItem("nutrisync_meals");
            if (localMealsRaw && userMeals.length === 0) {
              try {
                const localMeals = JSON.parse(localMealsRaw);
                if (Array.isArray(localMeals) && localMeals.length > 0) {
                  const synced = await api.batchSyncMeals(profile.email, localMeals);
                  setMeals(synced);
                }
              } catch (e) {
                console.warn("Could not migrate legacy local meals:", e);
              }
            }
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // Compute live daily totals from meals
  const dailyTotals: DailyTotals = React.useMemo(() => {
    return meals.reduce(
      (acc, m) => ({
        calories: acc.calories + (Number(m.calories) || 0),
        protein: acc.protein + (Number(m.protein) || 0),
        carbs: acc.carbs + (Number(m.carbs) || 0),
        fats: acc.fats + (Number(m.fats) || 0),
        fiber: acc.fiber + (Number(m.fiber) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  }, [meals]);

  // Toast handler
  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleMealLogged = (meal: MealItem) => {
    setMeals((prev) => [meal, ...prev]);
    triggerToast(`"${meal.food_name}" logged successfully!`, "success");
  };

  const handleMealDeleted = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    triggerToast("Meal entry deleted", "success");
  };

  const handleProfileUpdated = (updated: UserProfile) => {
    setUserProfile(updated);
    if (updated.email) {
      localStorage.setItem("user_email", updated.email);
      // Refresh meals under new email
      api.getMeals(updated.email).then((mList) => {
        if (mList && Array.isArray(mList)) {
          setMeals(mList);
        }
      }).catch((e) => console.warn("Failed to reload meals:", e));
    }
    triggerToast("Profile & email updated successfully!", "success");
  };

  const handleLoadDemo = async () => {
    const sampleProfile: UserProfile = {
      name: "Alex Rivera",
      email: "alex.rivera@college.edu",
      age: 21,
      gender: "male",
      weight: 68,
      height: 172,
      bmi: 23.0,
      bmr: 1680,
      tdee: 2350,
      goal: "Healthy eating",
      dietary_pref: "Vegetarian",
      activity_level: "moderate",
      calorie_target: 2150,
      protein_target: 120,
      carbs_target: 250,
      fats_target: 65,
      budget: "medium",
      hostel_context: "Hostel mess & canteen food",
    };

    try {
      const saved = await api.onboardUser(sampleProfile);
      localStorage.setItem("user_email", saved.email);
      localStorage.setItem("nutrisync_last_opened_date", getTodayDateString());
      setUserProfile(saved);
      setActiveTab("dashboard");
      triggerToast("Sample College Mess Profile loaded!", "success");
    } catch (e) {
      setUserProfile(sampleProfile);
      localStorage.setItem("user_email", sampleProfile.email);
      localStorage.setItem("nutrisync_last_opened_date", getTodayDateString());
      setActiveTab("dashboard");
      triggerToast("Sample Profile activated!", "success");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center text-slate-600 dark:text-slate-300 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <Zap className="w-5 h-5 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Loading NutriSync Intelligence...
        </p>
      </div>
    );
  }

  if (!userProfile) {
    if (onboardingView === "welcome") {
      return (
        <StartingScreen
          onGetStarted={() => setOnboardingView("form")}
          onExploreDemo={handleLoadDemo}
          isExistingUser={false}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center">
        <Onboarding
          onComplete={(profile) => {
            localStorage.setItem("nutrisync_last_opened_date", getTodayDateString());
            setUserProfile(profile);
            setActiveTab("dashboard");
            triggerToast("Profile created successfully!");
          }}
          onBack={() => setOnboardingView("welcome")}
          setToast={setToast}
        />
      </div>
    );
  }

  if (activeTab === "start") {
    return (
      <StartingScreen
        onGetStarted={() => {
          localStorage.setItem("nutrisync_last_opened_date", getTodayDateString());
          setActiveTab("dashboard");
        }}
        onExploreDemo={handleLoadDemo}
        isExistingUser={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500/20 transition-colors duration-300">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl border shadow-2xl flex items-center gap-2 text-xs font-bold backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-500/90 border-emerald-400 text-white"
                : "bg-rose-500/90 border-rose-400 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Gen Z Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* User Brand Greeting (Matching Screen 1) */}
          <div
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-purple-400 p-[2px] shadow-sm">
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center font-black text-slate-800 dark:text-slate-100 text-sm">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  Hi, {userProfile?.name?.split(" ")[0] || "User"}
                </span>
                <span className="text-xs">👋</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Let's hit today's targets
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-full border border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("scan")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "scan"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              AI Scanner
            </button>
            <button
              onClick={() => setActiveTab("tracker")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "tracker"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Meal Tracker
            </button>
            <button
              onClick={() => setActiveTab("diet")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "diet"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Diet Plan
            </button>
            <button
              onClick={() => setActiveTab("start")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === "start"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-white"
              }`}
              title="View Welcome & Starting Screen"
            >
              <span>Intro</span>
            </button>
            <button
              onClick={() => setActiveTab("strategy")}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                activeTab === "strategy"
                  ? "bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 shadow-md"
                  : "text-indigo-600 dark:text-cyan-400 hover:text-indigo-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Strategy & Vision</span>
            </button>
          </nav>

          {/* Header Action Badges */}
          <div className="flex items-center gap-2">
            {/* Hostel Mess Interactive Toggle Switch Pill */}
            <div
              id="hostel-mess-header-toggle"
              onClick={() => setBudgetHostelMode(!budgetHostelMode)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border transition-all duration-200 cursor-pointer select-none ${
                budgetHostelMode
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10"
                  : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title={`Click to ${budgetHostelMode ? "disable" : "enable"} Hostel Mess Mode`}
              role="switch"
              aria-checked={budgetHostelMode}
            >
              <Building className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-bold">Mess Mode</span>
              {/* Mini Pill Switch */}
              <div
                className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                  budgetHostelMode ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                    budgetHostelMode ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* Theme Toggle (Light / Dark) with tactile slide */}
            <button
              id="theme-mode-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              role="switch"
              aria-checked={theme === "dark"}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  theme === "light"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  theme === "dark"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Profile Avatar Pill */}
            <button
              id="profile-tab-header-btn"
              onClick={() => setActiveTab("profile")}
              className={`w-8.5 h-8.5 rounded-full border flex items-center justify-center transition cursor-pointer ${
                activeTab === "profile"
                  ? "bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 border-slate-900 dark:border-emerald-400 shadow-md shadow-emerald-500/20"
                  : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Profile & Email Settings"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-28">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              <NutritionDashboard
                userProfile={userProfile}
                dailyTotals={dailyTotals}
                meals={meals}
                budgetHostelMode={budgetHostelMode}
                onNavigateToScan={() => setActiveTab("scan")}
                onNavigateToTracker={() => setActiveTab("tracker")}
                onNavigateToDietPlan={() => setActiveTab("diet")}
                onNavigateToProfile={() => setActiveTab("profile")}
                onMealDeleted={handleMealDeleted}
              />
            </motion.div>
          )}

          {activeTab === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              <FoodScanner
                userProfile={userProfile}
                onMealLogged={handleMealLogged}
                onNavigateToTracker={() => setActiveTab("tracker")}
                onClose={() => setActiveTab("dashboard")}
              />
            </motion.div>
          )}

          {activeTab === "tracker" && (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              <MealTracker
                userProfile={userProfile}
                meals={meals}
                onMealAdded={handleMealLogged}
                onMealDeleted={handleMealDeleted}
                onNavigateToScan={() => setActiveTab("scan")}
              />
            </motion.div>
          )}

          {activeTab === "diet" && (
            <motion.div
              key="diet"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              <DietPlanGenerator
                userProfile={userProfile}
                budgetHostelMode={budgetHostelMode}
                onToggleBudgetHostelMode={setBudgetHostelMode}
                onMealLogged={handleMealLogged}
                onNavigateToTracker={() => setActiveTab("tracker")}
              />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              <ProfileSettings
                userProfile={userProfile}
                onProfileUpdated={handleProfileUpdated}
              />
            </motion.div>
          )}

          {activeTab === "start" && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-md">
                <StartingScreen
                  onGetStarted={() => setActiveTab("dashboard")}
                  isExistingUser={true}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "strategy" && (
            <motion.div
              key="strategy"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              <StrategySlide
                userProfile={userProfile}
                dailyTotals={dailyTotals}
                meals={meals}
                budgetHostelMode={budgetHostelMode}
                onNavigateToScan={() => setActiveTab("scan")}
                onNavigateToDashboard={() => setActiveTab("dashboard")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Gen Z Bottom Capsule Dock (Matching Reference Image Dock) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-full bg-slate-900/90 dark:bg-slate-900/90 text-white backdrop-blur-2xl shadow-2xl border border-white/10 flex items-center gap-1.5 sm:gap-3">
        {/* Dashboard */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`p-2.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 transition cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-white/20 text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
          title="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="hidden sm:inline text-xs">Home</span>
        </button>

        {/* Meal Tracker */}
        <button
          onClick={() => setActiveTab("tracker")}
          className={`p-2.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 transition cursor-pointer ${
            activeTab === "tracker"
              ? "bg-white/20 text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
          title="Meal Tracker"
        >
          <Utensils className="w-5 h-5" />
          <span className="hidden sm:inline text-xs">Meals</span>
        </button>

        {/* Elevated Center AI Camera Scan Button */}
        <button
          onClick={() => setActiveTab("scan")}
          className="relative -top-3 w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 p-[2px] shadow-lg shadow-sky-500/30 hover:scale-105 transition cursor-pointer mx-1"
          title="Scan Food with AI"
        >
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-cyan-300">
            <Camera className="w-6 h-6" />
          </div>
        </button>

        {/* Diet Plan */}
        <button
          onClick={() => setActiveTab("diet")}
          className={`p-2.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 transition cursor-pointer ${
            activeTab === "diet"
              ? "bg-white/20 text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
          title="Diet Plan"
        >
          <BookOpen className="w-5 h-5" />
          <span className="hidden sm:inline text-xs">Plan</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => setActiveTab("profile")}
          className={`p-2.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 transition cursor-pointer ${
            activeTab === "profile"
              ? "bg-white/20 text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
          title="Profile & Settings"
        >
          <User className="w-5 h-5" />
          <span className="hidden sm:inline text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}
