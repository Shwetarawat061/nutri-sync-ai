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
} from "lucide-react";
import { UserProfile, EmailDigestResponse } from "../../types";
import { calculateMacroTargets, ACTIVITY_MULTIPLIERS } from "../../lib/nutrition";
import { api } from "../../api";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface ProfileSettingsProps {
  userProfile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  userProfile,
  onProfileUpdated,
}) => {
  const [name, setName] = useState<string>(userProfile?.name || "");
  const [email, setEmail] = useState<string>(userProfile?.email || "");
  const [age, setAge] = useState<number>(userProfile?.age || 21);
  const [weight, setWeight] = useState<number>(userProfile?.weight || 68);
  const [height, setHeight] = useState<number>(userProfile?.height || 172);
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
    calculateMacroTargets(weight, height, age, gender, activityLevel, goal)
  );

  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setEmail(userProfile.email || "");
      setAge(userProfile.age || 21);
      setWeight(userProfile.weight || 68);
      setHeight(userProfile.height || 172);
      setGender(userProfile.gender || "male");
      setGoal(userProfile.goal || "Healthy eating");
      setDietaryPref(userProfile.dietaryPreference || userProfile.dietary_pref || "Vegetarian");
      setBudget(userProfile.budget || "medium");
      setHostelContext(userProfile.hostel_context || "Hostel mess & canteen food");
      setEmailDailyDigest(userProfile.email_daily_digest !== 0);
      setEmailWeeklyRecap(userProfile.email_weekly_recap !== 0);
      setEmailDeficitAlerts(userProfile.email_deficit_alerts !== 0);
      setEmailHostelHacks(userProfile.email_hostel_hacks !== 0);
    }
  }, [userProfile]);

  // Re-calculate targets whenever inputs change
  const updateTargets = (
    newWeight = weight,
    newHeight = height,
    newAge = age,
    newGender = gender,
    newActivity = activityLevel,
    newGoal = goal
  ) => {
    const computed = calculateMacroTargets(
      newWeight,
      newHeight,
      newAge,
      newGender,
      newActivity,
      newGoal
    );
    setTargets(computed);
  };

  const handleWeightChange = (v: number) => {
    setWeight(v);
    updateTargets(v, height, age, gender, activityLevel, goal);
  };

  const handleHeightChange = (v: number) => {
    setHeight(v);
    updateTargets(weight, v, age, gender, activityLevel, goal);
  };

  const handleAgeChange = (v: number) => {
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

  const bmi = Number((weight / Math.pow(height / 100, 2)).toFixed(1));

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
      setErrorMsg("Please enter and save your email address first.");
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setErrorMsg("Name and email are required.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const updatedProfile: Partial<UserProfile> & { currentEmail?: string } = {
        name,
        email: email.trim(),
        currentEmail: userProfile?.email,
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        gender,
        bmi,
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="profile-settings-container" className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Account & Sync Center
            </span>
            <span className="text-xs text-slate-400">NutriSync Engine</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            Profile & Nutrition Calibration
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure your personal details, email address, automated AI digests, caloric ceiling, and dietary parameters.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: EMAIL & AUTOMATED DIGEST HUB                                    */}
      {/* ========================================================================= */}
      <div
        id="email-integration-hub"
        className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Email & Digest Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Recipient: <span className="font-semibold text-slate-200">{email || "Not configured"}</span>
              </p>
            </div>
          </div>

          {/* Test / Send Digest Instant Action */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="send-instant-digest-btn"
              type="button"
              onClick={handleSendInstantDigest}
              disabled={sendingDigest}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
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
        </div>

        {/* Tactile Email Notification Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Automated Notification Schedules
            </span>
            {prefSaveStatus && (
              <span className="text-[11px] font-bold text-emerald-400 animate-in fade-in flex items-center gap-1">
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

      {/* Metabolic Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Body Mass Index
          </div>
          <div className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <span>{bmi}</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                bmi >= 18.5 && bmi <= 24.9
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : bmi < 18.5
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {bmi < 18.5 ? "Underweight" : bmi <= 24.9 ? "Optimal Range" : "Overweight"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Normal healthy range is 18.5 – 24.9</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Basal Metabolic Rate
          </div>
          <div className="text-2xl font-black text-slate-100 flex items-baseline gap-1">
            <span>{targets.bmr}</span>
            <span className="text-xs font-semibold text-slate-400">kcal/day</span>
          </div>
          <p className="text-[11px] text-slate-400">Calories burned at absolute rest</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Daily Energy Expenditure
          </div>
          <div className="text-2xl font-black text-slate-100 flex items-baseline gap-1">
            <span>{targets.tdee}</span>
            <span className="text-xs font-semibold text-slate-400">kcal/day</span>
          </div>
          <p className="text-[11px] text-slate-400">Daily maintenance requirement</p>
        </div>
      </div>

      {/* Target Macros Overview */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Calibrated Daily Target Macros
            </h3>
          </div>
          <span className="text-xs text-slate-400">Calculated via Mifflin-St Jeor</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-400">Daily Energy</span>
            <div className="text-lg font-bold text-emerald-400 mt-1">{targets.calories} kcal</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
            <span className="text-[11px] text-blue-400">Protein Target</span>
            <div className="text-lg font-bold text-blue-400 mt-1">{targets.protein}g</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
            <span className="text-[11px] text-amber-400">Carbs Target</span>
            <div className="text-lg font-bold text-amber-400 mt-1">{targets.carbs}g</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
            <span className="text-[11px] text-emerald-400">Fats Target</span>
            <div className="text-lg font-bold text-emerald-400 mt-1">{targets.fats}g</div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Account & Personal Details
          </h3>
          <span className="text-xs text-slate-500">Live database sync enabled</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              placeholder="e.g. Alex Miller"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              placeholder="user@domain.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Age</label>
            <input
              type="number"
              min={12}
              max={110}
              value={age}
              onChange={(e) => handleAgeChange(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Gender</label>
            <select
              value={gender}
              onChange={(e) => handleGenderChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min={30}
              max={250}
              value={weight}
              onChange={(e) => handleWeightChange(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Height (cm)</label>
            <input
              type="number"
              min={100}
              max={240}
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Goal & Dietary Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Primary Nutrition Goal
            </label>
            <select
              value={goal}
              onChange={(e) => handleGoalChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="Healthy eating">Healthy eating (Clean Energy & Vitality)</option>
              <option value="Increase protein">Increase protein (Muscle Protein Synthesis)</option>
              <option value="Weight management">Weight management (Fat Loss / Calorie Deficit)</option>
              <option value="Fitness nutrition">Fitness nutrition (Athletic Performance & Fuel)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Dietary Preference
            </label>
            <select
              value={dietaryPref}
              onChange={(e) => setDietaryPref(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="Vegetarian">Vegetarian (Lacto-Ovo)</option>
              <option value="Non-Vegetarian">Non-Vegetarian (Eggs & Meat)</option>
              <option value="Eggetarian">Eggetarian (Vegetarian + Eggs)</option>
              <option value="Vegan">Vegan (100% Plant-Based)</option>
              <option value="Omnivore">Omnivore / Flexible</option>
            </select>
          </div>
        </div>

        {/* Activity & Student/Budget Context */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Activity Multiplier
            </label>
            <select
              value={activityLevel}
              onChange={(e: any) => handleActivityChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="sedentary">Sedentary (Desk job)</option>
              <option value="light">Light Activity (1–3 days/wk)</option>
              <option value="moderate">Moderate Activity (3–5 days/wk)</option>
              <option value="active">Active (6–7 days/wk)</option>
              <option value="very_active">Very Active (Heavy training)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Budget Preference
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="low">Budget-Friendly (₹/Student Thrift)</option>
              <option value="medium">Standard / Balanced</option>
              <option value="high">Premium / Flexible</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Food Environment
            </label>
            <select
              value={hostelContext}
              onChange={(e) => setHostelContext(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="Hostel mess & canteen food">Hostel Mess & Canteen</option>
              <option value="Home cooked food">Home Cooked Food</option>
              <option value="Restaurant & food delivery">Food Delivery & Dining</option>
              <option value="Self cooking / dorm">Self Cooking in Dorm</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Profile, email & targets saved successfully!
              </span>
            )}
            {errorMsg && (
              <span className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Calibration"}</span>
          </button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* MODAL: EMAIL DIGEST INBOX PREVIEW                                         */}
      {/* ========================================================================= */}
      {showDigestModal && digestResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Inbox className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Live Email Digest Inbox Preview
                  </h3>
                  <p className="text-xs text-slate-400">
                    To: <span className="text-slate-200 font-semibold">{digestResponse.targetEmail}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDigestHtml}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Copy HTML to clipboard"
                >
                  {copiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDigest ? "Copied" : "Copy HTML"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDigestModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Metadata Header */}
            <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>
                  <strong>Subject:</strong> {digestResponse.subject}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Status: 200 OK Dispatched
                </span>
              </div>
              <div className="text-slate-400 text-[11px] flex items-center gap-3">
                <span>From: <strong>NutriSync AI &lt;digest@nutrisync.ai&gt;</strong></span>
                <span>•</span>
                <span>Sent: {new Date(digestResponse.sentAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Rendered HTML Email Preview */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/90">
              <div
                className="rounded-2xl overflow-hidden shadow-inner"
                dangerouslySetInnerHTML={{ __html: digestResponse.htmlPreview }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
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
