import { db } from "../db.js";
import { UserMemoryRow, WeeklyDayStat, WeeklyProgressResponse, TimedReminderItem, MealRow } from "../types.js";
import { getAiClient, callGeminiWithFailover, handleAiError } from "./gemini.js";
import { Type } from "@google/genai";

// 🧠 STRICT MEMORY SCHEMA DEFINITION
export interface MemorySchema {
  preferences: string[];
  dietary_constraints: string[];
  behavioral_patterns: string[];
  goal_trajectory: string;
  past_agreed_actions: string[];
}

export interface StateTrackingVariables {
  current_weight_kg: number;
  weight_goal: string;
  calorie_budget: number;
  protein_target_g: number;
  consumed_calories_today: number;
  consumed_protein_today: number;
  remaining_calorie_deficit: number;
  remaining_protein_deficit: number;
  weekly_adherence_rate: number;
  active_streak_days: number;
  top_deficit_nutrient: string;
  current_time_window: string;
}

// Helper to get or initialize user memories
export function getUserMemories(email: string): UserMemoryRow[] {
  try {
    const memories = db
      .prepare("SELECT * FROM user_memories WHERE user_email = ? ORDER BY updated_at DESC")
      .all(email) as UserMemoryRow[];
    
    if (memories.length === 0) {
      // Seed initial baseline long-term memories
      const initialMemories = [
        { category: "preference", key: "protein_preference", value: "Prefers cost-effective high protein staples like eggs, dal, curd, and sprouts" },
        { category: "habit", key: "peak_fuel_window", value: "Primary caloric window is between 12:30 PM and 8:30 PM" },
        { category: "milestone", key: "weekly_commitment", value: "Targeting 80%+ daily protein adherence for metabolic optimization" }
      ];
      
      const insert = db.prepare(`
        INSERT INTO user_memories (user_email, category, memory_key, memory_value, confidence)
        VALUES (?, ?, ?, ?, 'high')
      `);
      
      for (const m of initialMemories) {
        insert.run(email, m.category, m.key, m.value);
      }

      return db.prepare("SELECT * FROM user_memories WHERE user_email = ?").all(email) as UserMemoryRow[];
    }

    return memories;
  } catch (err) {
    console.warn("⚠️ Memory fetch error:", err);
    return [];
  }
}

// Save or update a specific long-term memory
export function saveUserMemory(
  email: string,
  category: string,
  key: string,
  value: string,
  confidence: string = "high"
): void {
  try {
    const existing = db
      .prepare("SELECT id FROM user_memories WHERE user_email = ? AND memory_key = ?")
      .get(email, key) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE user_memories
        SET memory_value = ?, category = ?, confidence = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(value, category, confidence, existing.id);
    } else {
      db.prepare(`
        INSERT INTO user_memories (user_email, category, memory_key, memory_value, confidence)
        VALUES (?, ?, ?, ?, ?)
      `).run(email, category, key, value, confidence);
    }
  } catch (err) {
    console.warn("⚠️ Error saving user memory:", err);
  }
}

// Log conversation turn with state snapshot
export function logConversationTurn(
  email: string,
  role: "user" | "assistant" | "system",
  content: string,
  stateSnapshot?: any
): void {
  try {
    db.prepare(`
      INSERT INTO conversation_logs (user_email, role, content, state_snapshot)
      VALUES (?, ?, ?, ?)
    `).run(
      email,
      role,
      content,
      stateSnapshot ? JSON.stringify(stateSnapshot) : null
    );
  } catch (err) {
    console.warn("⚠️ Error logging conversation turn:", err);
  }
}

// Extract long-term memories from conversation using AI
export async function extractAndPersistMemories(
  email: string,
  userMessage: string,
  assistantReply: string
): Promise<void> {
  const ai = getAiClient();
  if (!ai || !userMessage || userMessage.length < 5) return;

  try {
    const prompt = `Analyze this nutrition consultation turn and extract any enduring long-term user facts, preferences, allergies, or habits.
User message: "${userMessage}"
Advisor response: "${assistantReply.slice(0, 300)}"

Extract ONLY clear, persistent attributes matching categories: 'preference', 'constraint', 'habit', or 'milestone'.
If no new enduring fact is mentioned, return empty array.`;

    const response = await callGeminiWithFailover(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are NutriSync's Long-Term Memory Extraction Daemon. Return concise JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extracted_memories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ["preference", "constraint", "habit", "milestone", "struggle"] },
                  key: { type: Type.STRING },
                  value: { type: Type.STRING },
                },
                required: ["category", "key", "value"],
              },
            },
          },
          required: ["extracted_memories"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    if (Array.isArray(parsed.extracted_memories)) {
      for (const mem of parsed.extracted_memories) {
        if (mem.key && mem.value) {
          saveUserMemory(email, mem.category || "preference", mem.key, mem.value);
        }
      }
    }
  } catch (err) {
    // Non-blocking memory extraction
  }
}

// 📊 CALCULATE DYNAMIC 7-DAY (MONDAY -> SUNDAY) WEEKLY GOAL PROGRESS
export async function calculateWeeklyProgress(
  email: string,
  userProfile?: any,
  anchorDateStr?: string
): Promise<WeeklyProgressResponse> {
  const targetCal = Number(userProfile?.calorie_target) || 2100;
  const targetProt = Number(userProfile?.protein_target) || 120;
  const targetCarbs = Number(userProfile?.carbs_target) || 200;
  const targetFats = Number(userProfile?.fats_target) || 60;

  // Determine current system date
  const now = anchorDateStr ? new Date(`${anchorDateStr}T12:00:00`) : new Date();
  const todayStr = anchorDateStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Find Monday of the current week (ISO week: Monday = 1 ... Sunday = 7)
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  const sundayStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;

  // Query actual logged meals for this entire Monday-to-Sunday week from SQLite
  const dbMeals = db
    .prepare(`
      SELECT * FROM meals
      WHERE user_email = ? 
        AND (date(created_at) >= date(?) AND date(created_at) <= date(?))
      ORDER BY created_at ASC
    `)
    .all(email, mondayStr, sundayStr) as MealRow[];

  // Group meals by date (YYYY-MM-DD)
  const mealsByDate = new Map<string, MealRow[]>();
  for (const m of dbMeals) {
    const d = m.created_at ? m.created_at.slice(0, 10) : todayStr;
    if (!mealsByDate.has(d)) {
      mealsByDate.set(d, []);
    }
    mealsByDate.get(d)!.push(m);
  }

  const dayNamesShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days: WeeklyDayStat[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;
    const dayName = dayNamesShort[i];
    const isToday = dateStr === todayStr;

    const loggedForDay = mealsByDate.get(dateStr) || [];

    let cal = 0;
    let prot = 0;
    let carbs = 0;
    let fats = 0;
    const mealsCount = loggedForDay.length;

    if (mealsCount > 0) {
      for (const m of loggedForDay) {
        cal += Number(m.calories) || 0;
        prot += Number(m.protein) || 0;
        carbs += Number(m.carbs) || 0;
        fats += Number(m.fats) || 0;
      }
    }

    // Adherence scoring based on actual logs
    let score = 0;
    let status: "perfect" | "on_track" | "under" | "over" | "empty" = "empty";

    if (mealsCount > 0) {
      const calRatio = cal / (targetCal || 1);
      const protRatio = prot / (targetProt || 1);
      score = Math.min(100, Math.round((Math.min(1.1, calRatio) * 0.4 + Math.min(1.1, protRatio) * 0.6) * 100));

      if (prot >= targetProt * 0.9 && cal >= targetCal * 0.85 && cal <= targetCal * 1.1) {
        status = "perfect";
      } else if (cal > targetCal * 1.15) {
        status = "over";
      } else if (prot >= targetProt * 0.7) {
        status = "on_track";
      } else {
        status = "under";
      }
    } else {
      score = 0;
      status = "under";
    }

    days.push({
      date: dateStr,
      dayName,
      calories: Math.round(cal),
      protein: Math.round(prot),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
      calorieTarget: targetCal,
      proteinTarget: targetProt,
      adherenceScore: score,
      mealsCount,
      status: status as any,
      isToday,
    });
  }

  // Calculate true weekly aggregates from logged days
  const loggedDays = days.filter((d) => d.mealsCount > 0);
  const totalCal = loggedDays.reduce((acc, d) => acc + d.calories, 0);
  const totalProt = loggedDays.reduce((acc, d) => acc + d.protein, 0);
  const totalScore = loggedDays.reduce((acc, d) => acc + d.adherenceScore, 0);
  const totalMeals = days.reduce((acc, d) => acc + d.mealsCount, 0);

  const avgCal = loggedDays.length > 0 ? Math.round(totalCal / loggedDays.length) : 0;
  const avgProt = loggedDays.length > 0 ? Math.round(totalProt / loggedDays.length) : 0;
  const avgScore = loggedDays.length > 0 ? Math.round(totalScore / loggedDays.length) : 0;

  const proteinGoalDays = days.filter((d) => d.protein >= targetProt * 0.85).length;
  const calorieGoalDays = days.filter((d) => d.calories >= targetCal * 0.85 && d.calories <= targetCal * 1.15).length;
  
  // Calculate active streak
  let streakDays = 0;
  for (let i = 0; i < 7; i++) {
    if (days[i].mealsCount > 0 && days[i].protein >= targetProt * 0.7) {
      streakDays++;
    }
  }

  // Retrieve Long-Term Memories for AI synthesis
  const userMemories = getUserMemories(email);
  const memoryStrings = userMemories.map((m) => `${m.category.toUpperCase()}: ${m.memory_value}`);

  // Week range label (e.g. "Aug 24 – Aug 30")
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weekRange = `${monthNames[monday.getMonth()]} ${monday.getDate()} – ${monthNames[sunday.getMonth()]} ${sunday.getDate()}`;

  // AI Weekly Synthesis with long-term memory integration
  let aiWeeklySummary = avgProt > 0
    ? `Consistent weekly pacing! You have averaged ${avgProt}g daily protein (${Math.round((avgProt / targetProt) * 100)}% of goal) across your active days this week.`
    : `Your weekly tracker is live for ${weekRange}. Log your meals to track your protein velocity!`;
  let topImprovement = `Maintain protein distribution across breakfast, lunch, and dinner to hit your ${targetProt}g target.`;

  const ai = getAiClient();
  if (ai && loggedDays.length > 0) {
    try {
      const prompt = `Synthesize weekly goal progress for this user for the week of ${weekRange}.
Target: ${targetCal} kcal, ${targetProt}g Protein.
Average Achieved on Logged Days: ${avgCal} kcal, ${avgProt}g Protein.
Days Meeting Protein Goal: ${proteinGoalDays}/7.
User Long-term Memories: ${JSON.stringify(memoryStrings)}
Goal: ${userProfile?.goal || "Healthy eating / Hypertrophy"}

Provide:
1. Concise 2-sentence encouraging weekly summary highlighting trends.
2. ONE actionable improvement for the upcoming fuel window.`;

      const response = await callGeminiWithFailover(ai, {
        primaryModel: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are NutriSync AI's Weekly Performance Analyst. Deliver high-signal, punchy insights.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              weekly_summary: { type: Type.STRING },
              top_improvement: { type: Type.STRING },
            },
            required: ["weekly_summary", "top_improvement"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.weekly_summary) {
        aiWeeklySummary = parsed.weekly_summary;
        topImprovement = parsed.top_improvement || topImprovement;
      }
    } catch {
      // Fallback already assigned
    }
  }

  return {
    weekRange,
    days,
    averageCalories: avgCal,
    averageProtein: avgProt,
    averageScore: avgScore,
    totalMealsLogged: totalMeals,
    streakDays,
    proteinGoalDays,
    calorieGoalDays,
    aiWeeklySummary,
    topImprovement,
    memoryInsights: memoryStrings.slice(0, 4),
  };
}

// ⏰ DYNAMIC TIME-AWARE NUTRITION & HYDRATION REMINDERS
export function getUpcomingReminders(userProfile?: any, isHostelMode?: boolean): TimedReminderItem[] {
  const isVeg = userProfile?.dietary_pref?.toLowerCase().includes("veg") && !userProfile?.dietary_pref?.toLowerCase().includes("non");
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMinutesTotal = currentHour * 60 + currentMinute;

  const reminderSchedules = [
    {
      id: "rem-breakfast",
      title: "Morning Hydration & High-Protein Breakfast",
      timeWindow: "07:30 AM – 09:30 AM",
      startHour: 7,
      startMinute: 30,
      endHour: 9,
      endMinute: 30,
      description: "Kickstart metabolic rate and trigger muscle protein synthesis early.",
      suggestedAction: isVeg 
        ? "Drink 500ml water + Oatmeal with sattu / peanut butter (~22g protein)" 
        : "Drink 500ml water + 3 boiled eggs with whole grain toast (~24g protein)",
      macroFocus: "25g Protein • 350 kcal",
      type: "breakfast" as const,
    },
    {
      id: "rem-hydration",
      title: "Mid-Morning Hydration & Cognitive Focus",
      timeWindow: "11:00 AM – 11:45 AM",
      startHour: 11,
      startMinute: 0,
      endHour: 11,
      endMinute: 45,
      description: "Prevent dehydration-induced metabolic sluggishness and false appetite cues.",
      suggestedAction: "Drink 400-500ml room temperature water or green tea.",
      macroFocus: "0 kcal • 500ml H2O",
      type: "hydration" as const,
    },
    {
      id: "rem-lunch",
      title: isHostelMode ? "Hostel Mess Lunch Optimization" : "Balanced Lunch Fuel Window",
      timeWindow: "12:30 PM – 02:30 PM",
      startHour: 12,
      startMinute: 30,
      endHour: 14,
      endMinute: 30,
      description: "Anchor the day with high-volume complex carbs, bioavailable protein, and fiber.",
      suggestedAction: isHostelMode 
        ? "Ask for double dal + 100g curd / dahi + 2 rotis; limit white rice."
        : isVeg
        ? "2 bowls dal/tofu + 150g greek yogurt + green salad"
        : "Grilled chicken / fish or 3 eggs + brown rice / 2 rotis + salad",
      macroFocus: "35g Protein • 580 kcal",
      type: "lunch" as const,
    },
    {
      id: "rem-snack",
      title: "Pre-Workout / Afternoon Protein Fuel",
      timeWindow: "04:30 PM – 05:30 PM",
      startHour: 16,
      startMinute: 30,
      endHour: 17,
      endMinute: 30,
      description: "Prevent 5 PM energy crashes and sustain pre-workout glycogen levels.",
      suggestedAction: isHostelMode
        ? "50g roasted chana & peanuts with lemon or a banana + whey/sattu."
        : "Greek yogurt bowl with chia seeds or protein shake + apple.",
      macroFocus: "18g Protein • 240 kcal",
      type: "snack" as const,
    },
    {
      id: "rem-dinner",
      title: "Evening Recovery Dinner & Protein Gap Closer",
      timeWindow: "07:30 PM – 09:30 PM",
      startHour: 19,
      startMinute: 30,
      endHour: 21,
      endMinute: 30,
      description: "Close out remaining daily protein deficits for deep nighttime recovery.",
      suggestedAction: isVeg
        ? "Paneer / soya chunks bhurji with 2 phulkas & steamed vegetables."
        : "Grilled chicken / egg bhurji with 2 rotis & mixed seasonal sabzi.",
      macroFocus: "30g Protein • 520 kcal",
      type: "dinner" as const,
    },
    {
      id: "rem-winddown",
      title: "Night Wind-Down & Daily Adherence Review",
      timeWindow: "10:00 PM – 11:30 PM",
      startHour: 22,
      startMinute: 0,
      endHour: 23,
      endMinute: 30,
      description: "Review today's logged macros, calibrate tomorrow's plan, and hydrate.",
      suggestedAction: "Log any final snacks, drink 250ml water, and prepare sleep environment.",
      macroFocus: "Final Review • Recovery",
      type: "recovery" as const,
    },
  ];

  return reminderSchedules.map((rem) => {
    const startMins = rem.startHour * 60 + rem.startMinute;
    const endMins = rem.endHour * 60 + rem.endMinute;

    let urgency: "active" | "upcoming" | "past" = "upcoming";
    let completed = false;

    if (currentMinutesTotal >= startMins && currentMinutesTotal <= endMins) {
      urgency = "active";
    } else if (currentMinutesTotal > endMins) {
      urgency = "past";
      completed = true;
    } else {
      urgency = "upcoming";
    }

    return {
      ...rem,
      urgency,
      completed,
    };
  });
}
