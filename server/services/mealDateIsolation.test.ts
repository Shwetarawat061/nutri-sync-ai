import test from "node:test";
import assert from "node:assert/strict";
import { getDayBoundariesUTC, getLocalDateStringFromDate } from "../utils/dateUtils.js";
import { storage } from "../storage.js";

test("Date Utils - Local Timezone Boundaries", () => {
  // Test timezone boundary for Asia/Kolkata (UTC+5:30) on 2025-05-15
  const boundaries = getDayBoundariesUTC("2025-05-15", "Asia/Kolkata");
  
  // 2025-05-15 00:00:00 IST = 2025-05-14 18:30:00 UTC
  // 2025-05-16 00:00:00 IST = 2025-05-15 18:30:00 UTC (start of next day)
  assert.equal(boundaries.localDateString, "2025-05-15");
  assert.equal(boundaries.timezone, "Asia/Kolkata");
  assert.ok(boundaries.startUTC.toISOString().includes("2025-05-14T18:30:00"));
  assert.ok(boundaries.endUTC.toISOString().includes("2025-05-15T18:30:00"));
});

test("Date Utils - America/New_York (UTC-4 / EDT)", () => {
  const boundaries = getDayBoundariesUTC("2025-07-20", "America/New_York");
  // 2025-07-20 00:00:00 EDT = 2025-07-20 04:00:00 UTC
  // 2025-07-21 00:00:00 EDT = 2025-07-21 04:00:00 UTC
  assert.equal(boundaries.localDateString, "2025-07-20");
  assert.ok(boundaries.startUTC.toISOString().includes("2025-07-20T04:00:00"));
  assert.ok(boundaries.endUTC.toISOString().includes("2025-07-21T04:00:00"));
});

test("Storage - Meal Date Isolation & User Isolation", async () => {
  const testId1 = `test_iso_u1_${Date.now()}`;
  const testId2 = `test_iso_u2_${Date.now()}`;

  // Register User 1 and User 2
  const user1 = await storage.createUser({
    name: "User 1",
    email: `${testId1}@example.com`,
    password: "hashedpassword1",
    calorie_target: 2000,
    protein_target: 150,
  });

  const user2 = await storage.createUser({
    name: "User 2",
    email: `${testId2}@example.com`,
    password: "hashedpassword2",
    calorie_target: 1800,
  });

  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const todayIso = new Date().toISOString();

  // 1. User 1 logs meal yesterday
  const yesterdayMeal = await storage.createMeal(user1, {
    food_name: "Yesterday Dinner",
    calories: 800,
    protein: 40,
    carbs: 80,
    fats: 20,
    meal_type: "Dinner",
    consumed_at: yesterday,
    date_status: "exact",
  });

  // 2. User 1 logs meal today
  const todayMeal = await storage.createMeal(user1, {
    food_name: "Today Lunch",
    calories: 650,
    protein: 45,
    carbs: 60,
    fats: 15,
    meal_type: "Lunch",
    consumed_at: todayIso,
    date_status: "exact",
  });

  // 3. User 2 logs meal today
  const user2Meal = await storage.createMeal(user2, {
    food_name: "User 2 Smoothie",
    calories: 300,
    protein: 20,
    carbs: 40,
    fats: 5,
    meal_type: "Breakfast",
    consumed_at: todayIso,
    date_status: "exact",
  });

  // Test User 1 today dashboard
  const user1Dashboard = await storage.getDashboardToday(user1, { timezone: "UTC" });
  assert.equal(user1Dashboard.mealCount, 1, "User 1 should only have 1 meal counted today");
  assert.equal(user1Dashboard.totals.calories, 650, "User 1 calories today should be 650, NOT 1450");
  assert.equal(user1Dashboard.totals.protein, 45);
  assert.equal(user1Dashboard.meals[0].food_name, "Today Lunch");

  // Test User 2 today dashboard
  const user2Dashboard = await storage.getDashboardToday(user2, { timezone: "UTC" });
  assert.equal(user2Dashboard.mealCount, 1, "User 2 should only have User 2's meal");
  assert.equal(user2Dashboard.totals.calories, 300);
  assert.equal(user2Dashboard.meals[0].food_name, "User 2 Smoothie");

  // Cross-date editing: Update yesterday's meal to today
  await storage.updateMeal(user1, yesterdayMeal.id, {
    consumed_at: todayIso,
    calories: 900,
  });

  const updatedDashboard = await storage.getDashboardToday(user1, { timezone: "UTC" });
  assert.equal(updatedDashboard.mealCount, 2, "After moving to today, User 1 should have 2 meals");
  assert.equal(updatedDashboard.totals.calories, 650 + 900, "Calories should update to 1550");
});
