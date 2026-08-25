import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  Activity,
  Flame,
  Scale,
  RotateCcw,
  Lightbulb,
  ShieldCheck,
  ChevronRight,
  Utensils,
  Droplets,
  HeartPulse,
  Brain,
  MessageSquare,
  ArrowRight,
  Info,
} from "lucide-react";
import { UserProfile, MealItem, HealthAdvisorMessage } from "../../types";
import { api } from "../../api";

interface AIHealthAdvisorProps {
  userProfile: UserProfile | null;
  meals: MealItem[];
  budgetHostelMode: boolean;
  onNavigateToScan?: () => void;
  onNavigateToDietPlan?: () => void;
  onNavigateToTracker?: () => void;
}

export const AIHealthAdvisor: React.FC<AIHealthAdvisorProps> = ({
  userProfile,
  meals,
  budgetHostelMode,
  onNavigateToScan,
  onNavigateToDietPlan,
  onNavigateToTracker,
}) => {
  const [messages, setMessages] = useState<HealthAdvisorMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What should I eat for dinner to clear my remaining protein deficit?",
    "Give me 3 high-protein hostel mess hacks under ₹30.",
    "Compare 40g sattu drink vs 3 boiled eggs for budget macros.",
    "How can I fortify hostel canteen food without cooking equipment?",
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute live day nutrition stats
  const totalCalories = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0);
  const totalFats = meals.reduce((sum, m) => sum + (Number(m.fats) || 0), 0);

  const targetCalories = userProfile?.calorie_target || 2100;
  const targetProtein = userProfile?.protein_target || 120;
  const remCalories = Math.max(0, targetCalories - totalCalories);
  const remProtein = Math.max(0, targetProtein - totalProtein);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const name = userProfile?.name ? String(userProfile.name).trim().split(" ")[0] || "there" : "there";
      const goal = userProfile?.goal || "Hypertrophy & Metabolic Health";
      const isHostel = budgetHostelMode || Boolean(userProfile?.hostel_context);

      const welcomeContent = `### Direct Assessment
Welcome ${name} — I am **NutriSync AI**, your clinical sports nutritionist and pragmatic diet strategist calibrated specifically for students and young professionals.

### Tailored Action Plan
- **Current Energy Reserve**: **${remCalories} kcal** remaining to hit your daily ceiling of **${targetCalories} kcal**.
- **Protein Deficit**: **${remProtein}g** left to reach your **${targetProtein}g** target.
${isHostel ? "- **Hostel Mess Protocol**: Active — all suggestions prioritize mess dining hacks, local affordable sources (sattu, eggs, curd, paneer, chana), and zero-waste budget efficiency." : "- **Workplace/Home Protocol**: Active — prioritizing high bioavailable protein density with minimal prep friction."}

### Hostel/Budget Survival Tip
Keep an airtight jar of roasted chana and sattu powder in your room — 40g of either gives you **~10–12g of protein** for **under ₹15** with zero cooking or fridge needed.

### Quantitative Target
- **Remaining Calories**: ${remCalories} kcal
- **Remaining Protein**: ${remProtein}g (Goal: ${targetProtein}g/day)
- **Ready for Advice**: Ask any hyper-specific food swap, mess meal question, or macro strategy!`;

      setMessages([
        {
          id: "welcome-1",
          role: "model",
          content: welcomeContent,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [userProfile?.email, budgetHostelMode, totalCalories, totalProtein]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: HealthAdvisorMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);

    try {
      const recentMealsSummary = meals.map((m) => ({
        food_name: m.food_name,
        meal_type: m.meal_type,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fats: m.fats,
      }));

      const res = await api.consultHealthAdvisor({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        userProfile,
        todayNutrition: {
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fats: totalFats,
        },
        recentMeals: recentMealsSummary,
        budgetHostelMode,
      });

      const aiMsg: HealthAdvisorMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        content: res?.reply || "I have analyzed your query and updated your metabolic context.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (res?.suggested_questions && res.suggested_questions.length > 0) {
        setSuggestedQuestions(res.suggested_questions);
      }
    } catch (err: any) {
      console.error("AI Advisor consultation error:", err);
      const errorMsg: HealthAdvisorMessage = {
        id: `error-${Date.now()}`,
        role: "model",
        content: `⚠️ I encountered a temporary connection issue. Here is a quick metabolic tip: You currently have **${remProtein}g protein** remaining today. Consider a high-protein source like boiled eggs, paneer, thick dal, or curd for your upcoming meal.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  // Render markdown helper (bold, lists, headings) with distinct styles for the 4 core sections
  const renderFormattedContent = (content: string | undefined | null) => {
    const safeContent = typeof content === "string" ? content : (content ? String(content) : "");
    const lines = safeContent.split("\n");
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith("### Direct Assessment")) {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 rounded-lg w-fit mt-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Direct Assessment
              </div>
            );
          }
          if (line.startsWith("### Tailored Action Plan")) {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-1 rounded-lg w-fit mt-3">
                <Zap className="w-3.5 h-3.5 text-indigo-500" />
                Tailored Action Plan
              </div>
            );
          }
          if (line.startsWith("### Hostel/Budget Survival Tip") || line.startsWith("### Budget Survival Tip")) {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-lg w-fit mt-3">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Hostel / Budget Survival Tip
              </div>
            );
          }
          if (line.startsWith("### Quantitative Target")) {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 px-2.5 py-1 rounded-lg w-fit mt-3">
                <Scale className="w-3.5 h-3.5 text-sky-500" />
                Quantitative Target
              </div>
            );
          }
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="text-base font-black text-slate-900 dark:text-white pt-2 pb-0.5">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("#### ")) {
            return (
              <h5 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-1.5">
                {line.replace("#### ", "")}
              </h5>
            );
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatBold(line.substring(2)),
                  }}
                />
              </div>
            );
          }
          if (line.trim() === "") {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{
                __html: formatBold(line),
              }}
            />
          );
        })}
      </div>
    );
  };

  const formatBold = (str: string | undefined | null) => {
    const safeStr = typeof str === "string" ? str : (str ? String(str) : "");
    return safeStr.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
  };

  return (
    <div id="ai-health-advisor-view" className="max-w-4xl mx-auto space-y-4 pb-20">
      {/* Top Banner & Metabolic Context Pill */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/20 backdrop-blur-md shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  AI Health & Metabolic Advisor
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live Context Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                24/7 personalized clinical nutritional intelligence calibrated to your body & mess reality
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Deficit Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2 shadow-xs">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {remCalories} kcal left
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {remProtein}g prot deficit
              </span>
            </div>

            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-[560px] sm:h-[600px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center text-white shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xs ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-tr-xs"
                      : "bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}

                  {msg.timestamp && (
                    <div
                      className={`text-[10px] mt-2 text-right ${
                        isUser ? "text-emerald-200" : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white shadow-xs text-xs font-bold">
                    {userProfile?.name ? userProfile.name[0].toUpperCase() : "U"}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center text-white animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs font-bold text-slate-500">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
                NutriSync AI is computing metabolic recommendations...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        {suggestedQuestions.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
              <Lightbulb className="w-3 h-3 text-amber-500" /> Suggested:
            </span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex-shrink-0 cursor-pointer shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask your AI Health Advisor (e.g., 'What can I eat in hostel mess today for 30g protein?')"
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
