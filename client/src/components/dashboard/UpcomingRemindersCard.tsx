import React, { useState, useEffect } from "react";
import {
  Bell,
  Clock,
  Sparkles,
  Droplets,
  Utensils,
  CheckCircle2,
  Circle,
  Zap,
  Camera,
  ChevronRight,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { TimedReminderItem, UserProfile } from "../../types";
import { api } from "../../api";

interface UpcomingRemindersCardProps {
  userProfile: UserProfile | null;
  budgetHostelMode: boolean;
  onNavigateToScan: () => void;
  onNavigateToAdvisor?: () => void;
}

export const UpcomingRemindersCard: React.FC<UpcomingRemindersCardProps> = ({
  userProfile,
  budgetHostelMode,
  onNavigateToScan,
  onNavigateToAdvisor,
}) => {
  const [reminders, setReminders] = useState<TimedReminderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchReminders = async () => {
      try {
        setLoading(true);
        const data = await api.getTimedReminders(
          userProfile?.email,
          budgetHostelMode
        );
        if (isMounted && Array.isArray(data)) {
          setReminders(data);
        }
      } catch (err) {
        console.warn("Notice while fetching timed reminders:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReminders();
    return () => {
      isMounted = false;
    };
  }, [userProfile?.email, budgetHostelMode]);

  const toggleComplete = (id: string) => {
    setCompletedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const activeReminder = reminders.find((r) => r.urgency === "active");
  const upcomingReminders = reminders.filter((r) => r.urgency === "upcoming");
  const pastReminders = reminders.filter((r) => r.urgency === "past");

  return (
    <div id="upcoming-reminders-card" className="genz-card p-6 space-y-5 flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  Upcoming Metabolic Reminders
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold shrink-0">
                  {currentTimeStr}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Time-aware meal & hydration pacing triggers
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 whitespace-nowrap">
            {budgetHostelMode ? "Hostel Mess Clock" : "Standard Routine"}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
            <p>Syncing scheduled fuel windows...</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {/* Live Active Trigger Highlight */}
            {activeReminder && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 relative overflow-hidden shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                      {activeReminder.type === "hydration" ? (
                        <Droplets className="w-4 h-4" />
                      ) : (
                        <Utensils className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                          Active Now
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          {activeReminder.timeWindow}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {activeReminder.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-1">
                        {activeReminder.suggestedAction}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateToScan}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition shrink-0 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Log Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of upcoming and past windows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {reminders
                .filter((r) => r.id !== activeReminder?.id)
                .slice(0, 4)
                .map((rem) => {
                  const isDone = completedMap[rem.id] || rem.completed;

                  return (
                    <div
                      key={rem.id}
                      className={`py-3 flex items-center justify-between gap-4 transition ${
                        isDone ? "opacity-60" : ""
                      }`}
                    >
                      {/* Left: Checkbox, Title & Subtitle */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleComplete(rem.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-500 transition cursor-pointer shrink-0"
                          title="Toggle completion"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isDone
                                ? "line-through text-slate-400"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                            title={rem.title}
                          >
                            {rem.title}
                          </h4>
                          <p
                            className="text-[11px] text-slate-400 dark:text-slate-500 truncate"
                            title={rem.suggestedAction}
                          >
                            {rem.suggestedAction}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Time window & Macro focus badge */}
                      <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {rem.timeWindow}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap">
                          {rem.macroFocus}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          Calibrated to {userProfile?.dietary_pref || "Omnivore"} guidelines
        </span>

        {onNavigateToAdvisor && (
          <button
            type="button"
            onClick={onNavigateToAdvisor}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ask Advisor to Adjust Times</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
