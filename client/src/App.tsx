import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  LayoutGrid,
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
import { NutriSyncLogo } from "./components/brand/NutriSyncLogo";
import { StartingScreen } from "./components/welcome/StartingScreen";
import { Onboarding } from "./components/Onboarding";
import { NutritionDashboard } from "./components/dashboard/NutritionDashboard";
import { FoodScanner } from "./components/food-scan/FoodScanner";
import { MealTracker } from "./components/meal-tracker/MealTracker";
import { DietPlanGenerator } from "./components/diet-plan/DietPlanGenerator";
import { ProfileSettings } from "./components/profile/ProfileSettings";
import { AIHealthAdvisor } from "./components/advisor/AIHealthAdvisor";
import { AuthScreen } from "./components/auth/AuthScreen";

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [onboardingView, setOnboardingView] = useState<"welcome" | "form">("welcome");
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "scan" | "tracker" | "diet" | "profile" | "advisor">("dashboard");
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [budgetHostelMode, setBudgetHostelMode] = useState<boolean>(() => {
    return localStorage.getItem("nutrisync_hostel_mode") === "true";
  });
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("nutrisync_theme") as "dark" | "light") || "light";
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
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
      setStartupError(null);
      try {
        const savedToken = localStorage.getItem("nutrisync_auth_token");
        if (savedToken) {
          const profile = await api.getCurrentUser();
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
          } else {
            localStorage.removeItem("nutrisync_auth_token");
            localStorage.removeItem("user_email");
          }
        }
      } catch (err) {
        localStorage.removeItem("nutrisync_auth_token");
        localStorage.removeItem("user_email");
        console.error("Initialization error:", err);
        setStartupError("We could not restore your account. Check that the server is running and try again.");
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

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem("nutrisync_last_opened_date");
    setUserProfile(null);
    setMeals([]);
    setOnboardingView("welcome");
    setActiveTab("start");
    setShowAuth(false);
    triggerToast("Logged out successfully. Returning to starting page...", "success");
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

  if (startupError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="max-w-md text-sm font-semibold text-slate-600 dark:text-slate-300">{startupError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!userProfile) {
    if (onboardingView === "welcome") {
      return (
        <StartingScreen
          onGetStarted={() => {
            setShowAuth(true);
            setOnboardingView("form");
          }}
          isExistingUser={false}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        />
      );
    }

    if (showAuth) {
      return (
        <AuthScreen
          onAuthenticated={(profile) => {
            setUserProfile(profile);
            setActiveTab("dashboard");
            setShowAuth(false);
            setOnboardingView("welcome");
          }}
          onBack={() => setShowAuth(false)}
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
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* NutriSync Official Logo Identity */}
          <div
            onClick={() => setActiveTab("dashboard")}
            className="cursor-pointer group select-none transition-transform active:scale-95"
            title="NutriSync Dashboard"
          >
            <NutriSyncLogo variant="horizontal" size="sm" showTagline={true} />
          </div>

          {/* Header Action Badges */}
          <div className="flex items-center gap-2">
            {/* AI Health Advisor Direct Header Pill */}
            <button
              id="ai-advisor-header-btn"
              onClick={() => setActiveTab("advisor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer select-none text-xs font-bold ${
                activeTab === "advisor"
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              }`}
              title="Consult AI Health & Metabolic Advisor"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Advisor</span>
            </button>

            {/* Hostel Mess Interactive Toggle Switch Pill */}
            <div
              id="hostel-mess-header-toggle"
              onClick={() => setBudgetHostelMode(!budgetHostelMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer select-none ${
                budgetHostelMode
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-xs shadow-emerald-500/10"
                  : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
              title={`Click to ${budgetHostelMode ? "disable" : "enable"} Hostel Mess Mode`}
              role="switch"
              aria-checked={budgetHostelMode}
            >
              <Building className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline text-xs font-bold">Mess Mode</span>
              {/* Mini Pill Switch */}
              <div
                className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                  budgetHostelMode ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                    budgetHostelMode ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* Theme Toggle (Light / Dark) */}
            <button
              id="theme-mode-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300 shadow-xs"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              role="switch"
              aria-checked={theme === "dark"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Profile Avatar Initials Pill (e.g. SR) */}
            <button
              id="profile-tab-header-btn"
              onClick={() => setActiveTab("profile")}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-xs transition cursor-pointer shadow-sm ${
                activeTab === "profile"
                  ? "bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/20"
                  : "bg-gradient-to-tr from-sky-100 to-indigo-100 dark:from-slate-900 dark:to-slate-800 border-indigo-400/60 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-200 hover:border-indigo-500"
              }`}
              title="Profile & Settings"
            >
              {userProfile?.name
                ? String(userProfile.name)
                    .trim()
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "SR"
                : "SR"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-12">
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
                onNavigateToAdvisor={() => setActiveTab("advisor")}
                onMealDeleted={handleMealDeleted}
              />
            </motion.div>
          )}

          {activeTab === "advisor" && (
            <motion.div
              key="advisor"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              <AIHealthAdvisor
                userProfile={userProfile}
                meals={meals}
                budgetHostelMode={budgetHostelMode}
                onNavigateToScan={() => setActiveTab("scan")}
                onNavigateToDietPlan={() => setActiveTab("diet")}
                onNavigateToTracker={() => setActiveTab("tracker")}
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
                onNavigateToDashboard={() => setActiveTab("dashboard")}
                onNavigateToAdvisor={() => setActiveTab("advisor")}
                onNavigateToDietPlan={() => setActiveTab("diet")}
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
                budgetHostelMode={budgetHostelMode}
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
                dailyTotals={dailyTotals}
                recentMeals={meals}
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
                onLogout={handleLogout}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Navigation Capsule Dock (Matching Image 1) */}
      <div
        id="bottom-navigation-capsule"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-6 py-2.5 rounded-full bg-[#1e293b]/95 dark:bg-[#0f172a]/95 text-white backdrop-blur-2xl shadow-2xl shadow-slate-950/40 border border-slate-700/60 dark:border-slate-800 flex items-center gap-3 sm:gap-6 select-none"
      >
        {/* Home */}
        <button
          id="nav-btn-home"
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            activeTab === "dashboard"
              ? "text-cyan-400 font-bold bg-white/10"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Home Dashboard"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-xs font-semibold">Home</span>
        </button>

        {/* Meals (Meal Plan & Tracker) */}
        <button
          id="nav-btn-meals"
          onClick={() => setActiveTab("tracker")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            activeTab === "tracker"
              ? "text-cyan-400 font-bold bg-white/10"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Meal Plan & Tracker"
        >
          <Utensils className="w-5 h-5" />
          <span className="text-xs font-semibold">Meals</span>
        </button>

        {/* Elevated Center AI Camera Scan Button (Image 1 reference) */}
        <button
          id="nav-btn-scan-camera"
          onClick={() => setActiveTab("scan")}
          className="relative -top-4 -my-2 w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-tr from-cyan-400 via-sky-500 to-teal-400 shadow-xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center group"
          title="Scan Meal with AI Camera"
        >
          <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center text-cyan-400 group-hover:text-white transition">
            <Camera className="w-5 h-5" />
          </div>
        </button>

        {/* Plan (Weekly Diet Planner) */}
        <button
          id="nav-btn-plan"
          onClick={() => setActiveTab("diet")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            activeTab === "diet"
              ? "text-cyan-400 font-bold bg-white/10"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Diet & Meal Plan"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-semibold">Plan</span>
        </button>

        {/* Profile */}
        <button
          id="nav-btn-profile"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            activeTab === "profile"
              ? "text-cyan-400 font-bold bg-white/10"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Profile & Preferences"
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-semibold">Profile</span>
        </button>
      </div>
    </div>
  );
}
