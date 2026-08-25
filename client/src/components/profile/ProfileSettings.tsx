import React, { useState, useEffect } from "react";
import {
  User,
  Activity,
  Zap,
  Save,
  CheckCircle2,
  AlertCircle,
  Calculator,
  RefreshCw,
  Flame,
  Target,
  Mail,
  Send,
  Check,
  X,
  Sparkles,
  Bell,
  Inbox,
  Clock,
  Copy,
  Building,
  LogOut,
  Scale,
  Ruler,
  Utensils,
  ShieldCheck,
  Layers,
  Award,
  Wallet,
  Compass,
  KeyRound,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, EmailDigestResponse } from "../../types";
import { calculateMacroTargets, ACTIVITY_MULTIPLIERS } from "../../lib/nutrition";
import { api } from "../../api";
import { ToggleSwitch } from "../common/ToggleSwitch";

type SettingsTab = "biometrics" | "dietary" | "notifications" | "account";

interface ProfileSettingsProps {
  userProfile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
  onLogout?: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  userProfile,
  onProfileUpdated,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("biometrics");

  // Form states
  const [name, setName] = useState<string>(userProfile?.name || "");
  const [email, setEmail] = useState<string>(userProfile?.email || "");
  const [age, setAge] = useState<number | string>(userProfile?.age ?? 21);
  const [weight, setWeight] = useState<number | string>(userProfile?.weight ?? 68);
  const [height, setHeight] = useState<number | string>(userProfile?.height ?? 172);
  const [gender, setGender] = useState<string>(userProfile?.gender || "male");
  const [activityLevel, setActivityLevel] = useState<keyof typeof ACTIVITY_MULTIPLIERS>(
    (userProfile?.activity_level as any) || "moderate"
  );
  const [goal, setGoal] = useState<string>(userProfile?.goal || "Healthy eating");
  const [dietaryPref, setDietaryPref] = useState<string>(
    userProfile?.dietaryPreference || userProfile?.dietary_pref || "Vegetarian"
  );
  const [budget, setBudget] = useState<string>(userProfile?.budget || "medium");
  const [hostelContext, setHostelContext] = useState<string>(
    userProfile?.hostel_context || "Hostel mess & canteen food"
  );

  // Email Notification & Integration Preferences
  const [emailDailyDigest, setEmailDailyDigest] = useState<boolean>(
    userProfile?.email_daily_digest !== 0
  );
  const [emailWeeklyRecap, setEmailWeeklyRecap] = useState<boolean>(
    userProfile?.email_weekly_recap !== 0
  );
  const [emailDeficitAlerts, setEmailDeficitAlerts] = useState<boolean>(
    userProfile?.email_deficit_alerts !== 0
  );
  const [emailHostelHacks, setEmailHostelHacks] = useState<boolean>(
    userProfile?.email_hostel_hacks !== 0
  );
  const [prefSaveStatus, setPrefSaveStatus] = useState<string | null>(null);

  // Email Digest Dispatch / Preview State
  const [sendingDigest, setSendingDigest] = useState<boolean>(false);
  const [digestResponse, setDigestResponse] = useState<EmailDigestResponse | null>(null);
  const [showDigestModal, setShowDigestModal] = useState<boolean>(false);
  const [copiedDigest, setCopiedDigest] = useState<boolean>(false);

  // Calculated Targets State
  const [targets, setTargets] = useState(() =>
    calculateMacroTargets(
      Number(userProfile?.weight ?? 68) || 0,
      Number(userProfile?.height ?? 172) || 0,
      Number(userProfile?.age ?? 21) || 0,
      userProfile?.gender || "male",
      (userProfile?.activity_level as any) || "moderate",
      userProfile?.goal || "Healthy eating"
    )
  );

  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setEmail(userProfile.email || "");
      setAge(userProfile.age ?? 21);
      setWeight(userProfile.weight ?? 68);
      setHeight(userProfile.height ?? 172);
      setGender(userProfile.gender || "male");
      setGoal(userProfile.goal || "Healthy eating");
      setDietaryPref(userProfile.dietaryPreference || userProfile.dietary_pref || "Vegetarian");
      setBudget(userProfile.budget || "medium");
      setHostelContext(userProfile.hostel_context || "Hostel mess & canteen food");
      setEmailDailyDigest(userProfile.email_daily_digest !== 0);
      setEmailWeeklyRecap(userProfile.email_weekly_recap !== 0);
      setEmailDeficitAlerts(userProfile.email_deficit_alerts !== 0);
      setEmailHostelHacks(userProfile.email_hostel_hacks !== 0);

      const computed = calculateMacroTargets(
        Number(userProfile.weight ?? 68) || 0,
        Number(userProfile.height ?? 172) || 0,
        Number(userProfile.age ?? 21) || 0,
        userProfile.gender || "male",
        (userProfile.activity_level as any) || "moderate",
        userProfile.goal || "Healthy eating"
      );
      setTargets(computed);
    }
  }, [userProfile]);

  // Re-calculate targets whenever inputs change
  const updateTargets = (
    newWeight: number | string = weight,
    newHeight: number | string = height,
    newAge: number | string = age,
    newGender = gender,
    newActivity = activityLevel,
    newGoal = goal
  ) => {
    const nw = Number(newWeight) || 0;
    const nh = Number(newHeight) || 0;
    const na = Number(newAge) || 0;

    const computed = calculateMacroTargets(
      nw,
      nh,
      na,
      newGender,
      newActivity,
      newGoal
    );
    setTargets(computed);
  };

  const handleWeightChange = (v: number | string) => {
    setWeight(v);
    updateTargets(v, height, age, gender, activityLevel, goal);
  };

  const handleHeightChange = (v: number | string) => {
    setHeight(v);
    updateTargets(weight, v, age, gender, activityLevel, goal);
  };

  const handleAgeChange = (v: number | string) => {
    setAge(v);
    updateTargets(weight, height, v, gender, activityLevel, goal);
  };

  const handleGenderChange = (v: string) => {
    setGender(v);
    updateTargets(weight, height, age, v, activityLevel, goal);
  };

  const handleActivityChange = (v: keyof typeof ACTIVITY_MULTIPLIERS) => {
    setActivityLevel(v);
    updateTargets(weight, height, age, gender, v, goal);
  };

  const handleGoalChange = (v: string) => {
    setGoal(v);
    updateTargets(weight, height, age, gender, activityLevel, v);
  };

  // Discard all unsaved changes and restore profile to last saved snapshot
  const handleDiscardChanges = () => {
    if (userProfile) {
      setName(userProfile.name || "");
      setEmail(userProfile.email || "");
      setAge(userProfile.age ?? 21);
      setWeight(userProfile.weight ?? 68);
      setHeight(userProfile.height ?? 172);
      setGender(userProfile.gender || "male");
      setGoal(userProfile.goal || "Healthy eating");
      setDietaryPref(userProfile.dietaryPreference || userProfile.dietary_pref || "Vegetarian");
      setBudget(userProfile.budget || "medium");
      setHostelContext(userProfile.hostel_context || "Hostel mess & canteen food");
      setActivityLevel((userProfile.activity_level as any) || "moderate");
      setEmailDailyDigest(userProfile.email_daily_digest !== 0);
      setEmailWeeklyRecap(userProfile.email_weekly_recap !== 0);
      setEmailDeficitAlerts(userProfile.email_deficit_alerts !== 0);
      setEmailHostelHacks(userProfile.email_hostel_hacks !== 0);

      const restoredTargets = calculateMacroTargets(
        Number(userProfile.weight ?? 68) || 0,
        Number(userProfile.height ?? 172) || 0,
        Number(userProfile.age ?? 21) || 0,
        userProfile.gender || "male",
        (userProfile.activity_level as any) || "moderate",
        userProfile.goal || "Healthy eating"
      );
      setTargets(restoredTargets);
    } else {
      setAge(21);
      setWeight(68);
      setHeight(172);
      setTargets(calculateMacroTargets(68, 172, 21, gender, activityLevel, goal));
    }
  };

  const numWeight = Number(weight) || 0;
  const numHeight = Number(height) || 0;
  const numAge = Number(age) || 0;

  const bmi = (numWeight > 0 && numHeight > 0)
    ? Number((numWeight / Math.pow(numHeight / 100, 2)).toFixed(1))
    : 0;

  // Save Email Preferences
  const handleToggleEmailPref = async (
    key: "daily" | "weekly" | "alerts" | "hostel",
    value: boolean
  ) => {
    const updatedDaily = key === "daily" ? value : emailDailyDigest;
    const updatedWeekly = key === "weekly" ? value : emailWeeklyRecap;
    const updatedAlerts = key === "alerts" ? value : emailDeficitAlerts;
    const updatedHostel = key === "hostel" ? value : emailHostelHacks;

    if (key === "daily") setEmailDailyDigest(value);
    if (key === "weekly") setEmailWeeklyRecap(value);
    if (key === "alerts") setEmailDeficitAlerts(value);
    if (key === "hostel") setEmailHostelHacks(value);

    try {
      const targetUserEmail = userProfile?.email || email;
      if (!targetUserEmail) return;

      const updatedUser = await api.saveEmailPreferences({
        email: targetUserEmail,
        email_daily_digest: updatedDaily,
        email_weekly_recap: updatedWeekly,
        email_deficit_alerts: updatedAlerts,
        email_hostel_hacks: updatedHostel,
      });
      onProfileUpdated(updatedUser);
      setPrefSaveStatus("Preferences synchronized");
      setTimeout(() => setPrefSaveStatus(null), 2500);
    } catch (err: any) {
      console.warn("Failed to sync email preference:", err);
    }
  };

  // Dispatch / Preview Instant Daily Digest
  const handleSendInstantDigest = async () => {
    const targetUserEmail = userProfile?.email || email;
    if (!targetUserEmail) {
      setErrorMsg("Please configure and save your email address in the Account tab first.");
      return;
    }

    setSendingDigest(true);
    try {
      const res = await api.sendEmailDigest(targetUserEmail);
      setDigestResponse(res);
      setShowDigestModal(true);
    } catch (err: any) {
      console.error("Failed to send digest:", err);
      setErrorMsg("Failed to generate email digest: " + err.message);
    } finally {
      setSendingDigest(false);
    }
  };

  const handleCopyDigestHtml = () => {
    if (digestResponse?.htmlPreview) {
      navigator.clipboard.writeText(digestResponse.htmlPreview);
      setCopiedDigest(true);
      setTimeout(() => setCopiedDigest(false), 2000);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const validAge = Number(age);
    const validWeight = Number(weight);
    const validHeight = Number(height);

    // Validate that inputs are not zero, empty, or negative
    const hasZeroOrInvalidBiometrics = (
      age === "" || isNaN(validAge) || validAge <= 0 ||
      weight === "" || isNaN(validWeight) || validWeight <= 0 ||
      height === "" || isNaN(validHeight) || validHeight <= 0
    );

    const hasZeroOrInvalidTargets = (
      targets.calories <= 0 ||
      targets.protein <= 0 ||
      targets.carbs <= 0 ||
      targets.fats <= 0
    );

    if (!email || !String(email).trim() || !name || !String(name).trim()) {
      setErrorMsg("Name and email are required. Please check the Account tab.");
      setActiveTab("account");
      return;
    }

    if (hasZeroOrInvalidBiometrics || hasZeroOrInvalidTargets) {
      // 1. Give user a message that entries cannot be zero
      setErrorMsg(
        "Profile entries cannot be zero or empty (Age, Weight, and Height must be greater than 0). Changes have been discarded to prevent saving incorrect data."
      );
      // 2. Discard the changes & restore last valid profile
      handleDiscardChanges();
      // 3. Do not save incorrect data!
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const updatedProfile: Partial<UserProfile> & { currentEmail?: string } = {
        name: name.trim(),
        email: email.trim(),
        currentEmail: userProfile?.email,
        age: validAge,
        weight: validWeight,
        height: validHeight,
        gender,
        bmi: validWeight > 0 && validHeight > 0 ? Number((validWeight / Math.pow(validHeight / 100, 2)).toFixed(1)) : 0,
        bmr: targets.bmr,
        tdee: targets.tdee,
        goal,
        dietary_pref: dietaryPref,
        dietaryPreference: dietaryPref,
        activity_level: activityLevel,
        calorie_target: targets.calories,
        protein_target: targets.protein,
        carbs_target: targets.carbs,
        fats_target: targets.fats,
        budget,
        hostel_context: hostelContext,
        email_daily_digest: emailDailyDigest,
        email_weekly_recap: emailWeeklyRecap,
        email_deficit_alerts: emailDeficitAlerts,
        email_hostel_hacks: emailHostelHacks,
      };

      const saved = await api.updateUserProfile(updatedProfile);
      onProfileUpdated(saved);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save profile error:", err);
      setErrorMsg("Failed to update profile: " + err.message);
      handleDiscardChanges();
    } finally {
      setSaving(false);
    }
  };

  const dietaryOptions = [
    {
      id: "Vegetarian",
      title: "Vegetarian",
      badge: "Lacto-Ovo",
      desc: "Plant foods, dairy & legumes; no meat or fish.",
      icon: "🥗",
    },
    {
      id: "Non-Vegetarian",
      title: "Non-Vegetarian",
      badge: "Complete Protein",
      desc: "Chicken, fish, eggs & all plant proteins.",
      icon: "🍗",
    },
    {
      id: "Eggetarian",
      title: "Eggetarian",
      badge: "High Bioavailability",
      desc: "Vegetarian diet enriched with whole eggs.",
      icon: "🍳",
    },
    {
      id: "Vegan",
      title: "Vegan",
      badge: "100% Plant",
      desc: "No animal products, dairy, or honey.",
      icon: "🌱",
    },
    {
      id: "Omnivore",
      title: "Omnivore",
      badge: "Flexible",
      desc: "Balanced mix of all wholesome food sources.",
      icon: "🍽️",
    },
  ];

  const goalOptions = [
    {
      id: "Healthy eating",
      title: "Healthy Eating",
      badge: "Vitality & Energy",
      desc: "Optimized micronutrients & clean balance.",
      icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: "Increase protein",
      title: "Increase Protein",
      badge: "Muscle Synthesis",
      desc: "High protein ratio (1.8g - 2.2g / kg).",
      icon: <Zap className="w-4 h-4 text-blue-500" />,
    },
    {
      id: "Weight management",
      title: "Weight Management",
      badge: "Caloric Deficit",
      desc: "Controlled deficit with sustained satiety.",
      icon: <Target className="w-4 h-4 text-amber-500" />,
    },
    {
      id: "Fitness nutrition",
      title: "Fitness Nutrition",
      badge: "Athletic Fuel",
      desc: "Performance carbs + recovery protein.",
      icon: <Flame className="w-4 h-4 text-rose-500" />,
    },
  ];

  const tabs = [
    {
      id: "biometrics" as SettingsTab,
      label: "Biometrics",
      subtitle: "Body & Metabolism",
      icon: <Scale className="w-4 h-4" />,
    },
    {
      id: "dietary" as SettingsTab,
      label: "Dietary",
      subtitle: "Goals & Environment",
      icon: <Utensils className="w-4 h-4" />,
    },
    {
      id: "notifications" as SettingsTab,
      label: "Notifications",
      subtitle: "AI Digests & Schedules",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      id: "account" as SettingsTab,
      label: "Account",
      subtitle: "Identity & Sessions",
      icon: <User className="w-4 h-4" />,
    },
  ];

  return (
    <div id="profile-settings-container" className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-white via-slate-50 to-emerald-50/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              NutriSync Control Hub
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Settings & Calibration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Settings & Profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Configure your biometrics, nutritional protocols, automated AI digests, and account credentials with dedicated module tabs.
          </p>
        </div>

        {/* Global Save & Discard Buttons in Header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDiscardChanges}
            disabled={saving}
            className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            title="Discard unsaved changes and restore previous values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveProfile()}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings, targets, and metabolic calibration synchronized successfully!</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="p-1 text-rose-600 dark:text-rose-400 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* FOUR DEDICATED INTERNAL TABS NAVIGATION                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2.5 p-3 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40"
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold truncate leading-tight">{tab.label}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                  {tab.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT CONTAINER                                                    */}
      {/* ========================================================================= */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {/* ===================================================================== */}
          {/* 1. BIOMETRICS TAB                                                     */}
          {/* Body stats, activity level, and dynamic metabolic metrics (BMI, BMR, TDEE) */}
          {/* ===================================================================== */}
          {activeTab === "biometrics" && (
            <motion.div
              key="biometrics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Dynamic Metabolic Scorecard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Body Mass Index
                    </span>
                    <Scale className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {bmi > 0 ? (
                      <>
                        <span>{bmi}</span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            bmi >= 18.5 && bmi <= 24.9
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : bmi < 18.5
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {bmi < 18.5 ? "Underweight" : bmi <= 24.9 ? "Optimal (18.5-24.9)" : "Overweight"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 dark:text-slate-600">0.0</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                          Zero / Enter Stats
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {Number(height) > 0 && Number(weight) > 0
                      ? `Calculated from height (${height}cm) & weight (${weight}kg).`
                      : "Enter positive height & weight to calculate BMI."}
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Basal Metabolic Rate
                    </span>
                    <Flame className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
                    <span>{targets.bmr > 0 ? targets.bmr : 0}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">kcal/day</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Base energy burned at complete rest (Mifflin-St Jeor).
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Daily Energy Expenditure
                    </span>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
                    <span>{targets.tdee > 0 ? targets.tdee : 0}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">kcal/day</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    TDEE with {activityLevel.replace("_", " ")} activity factor.
                  </p>
                </div>
              </div>

              {/* Target Macros Breakdown */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                      Target Macro Calibration
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Live dynamic recalculation
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Calorie Target</span>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{targets.calories} kcal</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Protein Target</span>
                    <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{targets.protein}g</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Carbs Target</span>
                    <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{targets.carbs}g</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Fats Target</span>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{targets.fats}g</div>
                  </div>
                </div>
              </div>

              {/* Biometrics Controls */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Physical Body Stats
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Age */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Age (years)</label>
                      {(Number(age) <= 0 || age === "") && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Must be &gt; 0</span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                        Number(age) <= 0 || age === ""
                          ? "border-amber-500/70 dark:border-amber-500/70"
                          : "border-slate-300 dark:border-slate-800"
                      } rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition`}
                      placeholder="e.g. 21"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => handleGenderChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Weight */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Weight (kg)</label>
                      {(Number(weight) <= 0 || weight === "") && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Must be &gt; 0</span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => handleWeightChange(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                        Number(weight) <= 0 || weight === ""
                          ? "border-amber-500/70 dark:border-amber-500/70"
                          : "border-slate-300 dark:border-slate-800"
                      } rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition`}
                      placeholder="e.g. 68"
                    />
                  </div>

                  {/* Height */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Height (cm)</label>
                      {(Number(height) <= 0 || height === "") && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Must be &gt; 0</span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                        Number(height) <= 0 || height === ""
                          ? "border-amber-500/70 dark:border-amber-500/70"
                          : "border-slate-300 dark:border-slate-800"
                      } rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition`}
                      placeholder="e.g. 172"
                    />
                  </div>
                </div>

                {/* Activity Level Selector */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Daily Activity Level & Multiplier
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { id: "sedentary", title: "Sedentary", factor: "1.2x", desc: "Desk job, little or no exercise" },
                      { id: "light", title: "Light Activity", factor: "1.375x", desc: "Light exercise / sports 1-3 days/wk" },
                      { id: "moderate", title: "Moderate Activity", factor: "1.55x", desc: "Moderate exercise 3-5 days/wk" },
                      { id: "active", title: "Active", factor: "1.725x", desc: "Hard exercise 6-7 days/wk" },
                      { id: "very_active", title: "Very Active", factor: "1.9x", desc: "Physical job or intense training" },
                    ].map((lvl) => {
                      const isSelected = activityLevel === lvl.id;
                      return (
                        <div
                          key={lvl.id}
                          onClick={() => handleActivityChange(lvl.id as any)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-xs"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{lvl.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                              {lvl.factor}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{lvl.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save Biometrics Action & Discard */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleDiscardChanges}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Discard Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveProfile()}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Biometrics</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===================================================================== */}
          {/* 2. DIETARY TAB                                                        */}
          {/* Nutritional goal, diet type (cards with badges), hostel context, and budget tier */}
          {/* ===================================================================== */}
          {activeTab === "dietary" && (
            <motion.div
              key="dietary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Goal Selection Cards */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Primary Nutritional Goal
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Caloric ratio driver</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {goalOptions.map((g) => {
                    const isSelected = goal === g.id;
                    return (
                      <div
                        key={g.id}
                        onClick={() => handleGoalChange(g.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                          {g.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                              {g.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              {g.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{g.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diet Type Cards with Badges */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Dietary Pattern & Preferences
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Card selections</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {dietaryOptions.map((opt) => {
                    const isSelected = dietaryPref === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setDietaryPref(opt.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl">{opt.icon}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {opt.badge}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{opt.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hostel Context & Budget Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Food Environment */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Food Environment / Mess Context
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tailors food scans and smart recommendations to your cooking accessibility.
                  </p>
                  <select
                    value={hostelContext}
                    onChange={(e) => setHostelContext(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Hostel mess & canteen food">Hostel Mess & College Canteen</option>
                    <option value="Home cooked food">Home Cooked Food</option>
                    <option value="Restaurant & food delivery">Food Delivery & Dining Out</option>
                    <option value="Self cooking / dorm">Self Cooking in Dorm / Flat</option>
                  </select>
                </div>

                {/* Budget Tier */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Budget Preference Tier
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prioritizes cost-effective high-protein meal substitutions.
                  </p>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="low">Budget-Friendly (₹/Student Thrift)</option>
                    <option value="medium">Standard / Balanced</option>
                    <option value="high">Premium / Flexible</option>
                  </select>
                </div>
              </div>

              {/* Save Dietary Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Dietary Settings</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ===================================================================== */}
          {/* 3. NOTIFICATIONS TAB                                                  */}
          {/* Automated AI digests, schedule toggles, and instant preview           */}
          {/* ===================================================================== */}
          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Notification Hub Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          Automated AI Digest Engine
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Active Dispatch
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Target Recipient: <span className="font-semibold text-slate-900 dark:text-slate-200">{email || "Please set in Account tab"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Instant Test Action */}
                  <button
                    id="send-instant-digest-btn"
                    type="button"
                    onClick={handleSendInstantDigest}
                    disabled={sendingDigest}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer self-start sm:self-center"
                  >
                    {sendingDigest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Digest...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Preview & Send Digest</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Schedule Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Automated Notification Schedules
                    </span>
                    {prefSaveStatus && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {prefSaveStatus}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Toggle 1: Daily AI Evening Digest */}
                    <ToggleSwitch
                      id="toggle-daily-digest"
                      checked={emailDailyDigest}
                      onChange={(val) => handleToggleEmailPref("daily", val)}
                      label="Daily AI Evening Digest"
                      description="Daily @ 8:30 PM: Breakdown of consumed macros, metabolic velocity, and next action."
                      badge="Daily"
                      icon={<Clock className="w-4 h-4" />}
                      activeColor="emerald"
                    />

                    {/* Toggle 2: Weekly Metabolic Progress Recap */}
                    <ToggleSwitch
                      id="toggle-weekly-recap"
                      checked={emailWeeklyRecap}
                      onChange={(val) => handleToggleEmailPref("weekly", val)}
                      label="Weekly Metabolic Recap"
                      description="Every Sunday: 7-day caloric balance, protein adherence %, and goal velocity."
                      badge="Weekly"
                      icon={<Activity className="w-4 h-4" />}
                      activeColor="indigo"
                    />

                    {/* Toggle 3: High Deficit & Satiety Alerts */}
                    <ToggleSwitch
                      id="toggle-deficit-alerts"
                      checked={emailDeficitAlerts}
                      onChange={(val) => handleToggleEmailPref("alerts", val)}
                      label="High Deficit & Satiety Alerts"
                      description="Real-time alert when remaining protein deficit exceeds 35g before dinner."
                      badge="Alert"
                      icon={<Flame className="w-4 h-4" />}
                      activeColor="amber"
                    />

                    {/* Toggle 4: Hostel Mess & Canteen Hacks */}
                    <ToggleSwitch
                      id="toggle-hostel-hacks"
                      checked={emailHostelHacks}
                      onChange={(val) => handleToggleEmailPref("hostel", val)}
                      label="Hostel Mess Nutrition Hacks"
                      description="Weekly curated mess survival guide with affordable local high-protein swaps."
                      badge="Mess Mode"
                      icon={<Building className="w-4 h-4" />}
                      activeColor="cyan"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===================================================================== */}
          {/* 4. ACCOUNT TAB                                                        */}
          {/* Basic identity (Name, Email), credentials, and session management     */}
          {/* ===================================================================== */}
          {activeTab === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Identity Details Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 p-[2px] shadow-sm">
                    <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-slate-800 dark:text-slate-100 text-base">
                      {name
                        ? String(name)
                            .trim()
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() || "U"
                        : "U"}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      User Identity & Credentials
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Personal name, communication email, and authentication state.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                      placeholder="e.g. Shweta Rawat"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                      placeholder="user@domain.com"
                    />
                  </div>
                </div>

                {/* Session & Security Info */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Session & Data Security
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      Authenticated
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Database</span>
                      <strong className="text-slate-800 dark:text-slate-200">Local SQLite & Cloud Sync</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Version</span>
                      <strong className="text-slate-800 dark:text-slate-200">NutriSync v2.0 AI</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Status</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">Active Profile</strong>
                    </div>
                  </div>
                </div>

                {/* Session Management Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  {onLogout ? (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      title="Log out and return to starting page"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Session</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleDiscardChanges}
                      disabled={saving}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Discard Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveProfile()}
                      disabled={saving}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Account Info</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EMAIL DIGEST INBOX PREVIEW                                         */}
      {/* ========================================================================= */}
      {showDigestModal && digestResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Inbox className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Live Email Digest Inbox Preview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    To: <span className="text-slate-800 dark:text-slate-200 font-semibold">{digestResponse.targetEmail}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDigestHtml}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Copy HTML to clipboard"
                >
                  {copiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDigest ? "Copied" : "Copy HTML"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDigestModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Metadata Header */}
            <div className="px-5 py-3 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>
                  <strong>Subject:</strong> {digestResponse.subject}
                </span>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                  Status: 200 OK Dispatched
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-3">
                <span>From: <strong>NutriSync AI &lt;digest@nutrisync.ai&gt;</strong></span>
                <span>•</span>
                <span>Sent: {new Date(digestResponse.sentAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Rendered HTML Email Preview */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/90">
              <div
                className="rounded-2xl overflow-hidden shadow-inner"
                dangerouslySetInnerHTML={{ __html: digestResponse.htmlPreview }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Delivered directly to {digestResponse.targetEmail}
              </span>
              <button
                type="button"
                onClick={() => setShowDigestModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
