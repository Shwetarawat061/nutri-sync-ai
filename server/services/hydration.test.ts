import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateHydrationGoal,
  computeHydrationProgress,
  HydrationUserProfile,
} from "./hydrationService.js";

test("Hydration Engine - Baseline for Adult Male", () => {
  const maleProfile: HydrationUserProfile = {
    gender: "male",
    age: 28,
    weight: 75,
    height: 178,
    activityLevel: "sedentary",
    climate: "temperate",
  };

  const goal = calculateHydrationGoal(maleProfile);

  // Adult Male: Total water AI = 3.7 L/day, ~3.0 L from beverages, ~700 ml from food (~20%)
  assert.equal(goal.totalWaterGoalMl, 3700, "Male total water goal should be 3700 ml (3.7 L)");
  assert.equal(goal.beverageGoalMl, 3000, "Male beverage goal should be 3000 ml (3.0 L)");
  assert.equal(goal.foodWaterEstimateMl, 700, "Male food water estimate should be ~700 ml (~20%)");
  assert.equal(goal.isSpecialCategory, "standard");
});

test("Hydration Engine - Baseline for Adult Female", () => {
  const femaleProfile: HydrationUserProfile = {
    gender: "female",
    age: 26,
    weight: 60,
    height: 165,
    activityLevel: "sedentary",
    climate: "temperate",
  };

  const goal = calculateHydrationGoal(femaleProfile);

  // Adult Female: Total water AI = 2.7 L/day, ~2.2 L from beverages, ~500 ml from food (~20%)
  assert.equal(goal.totalWaterGoalMl, 2700, "Female total water goal should be 2700 ml (2.7 L)");
  assert.equal(goal.beverageGoalMl, 2200, "Female beverage goal should be 2200 ml (2.2 L)");
  assert.equal(goal.foodWaterEstimateMl, 500, "Female food water estimate should be ~500 ml (~20%)");
  assert.equal(goal.isSpecialCategory, "standard");
});

test("Hydration Engine - Pregnancy Status Adjustment", () => {
  const pregnantProfile: HydrationUserProfile = {
    gender: "female",
    age: 29,
    weight: 65,
    pregnancyStatus: true,
    activityLevel: "sedentary",
    climate: "temperate",
  };

  const goal = calculateHydrationGoal(pregnantProfile);

  // Pregnancy: +300 ml/day => Total 3000 ml (3.0 L), Beverage 2300 ml (~2.3 L)
  assert.equal(goal.totalWaterGoalMl, 3000, "Pregnancy total water should be 3000 ml");
  assert.equal(goal.beverageGoalMl, 2300, "Pregnancy beverage water should be 2300 ml");
  assert.equal(goal.isSpecialCategory, "pregnancy");
});

test("Hydration Engine - Lactation Status Adjustment", () => {
  const lactatingProfile: HydrationUserProfile = {
    gender: "female",
    age: 30,
    weight: 62,
    lactationStatus: true,
    activityLevel: "sedentary",
    climate: "temperate",
  };

  const goal = calculateHydrationGoal(lactatingProfile);

  // Lactation: +1,100 ml/day => Total 3800 ml (3.8 L), Beverage 3100 ml (~3.1 L)
  assert.equal(goal.totalWaterGoalMl, 3800, "Lactation total water should be 3800 ml");
  assert.equal(goal.beverageGoalMl, 3100, "Lactation beverage water should be 3100 ml");
  assert.equal(goal.isSpecialCategory, "lactation");
});

test("Hydration Engine - Climate and Activity Contextual Adjustments", () => {
  const activeHotProfile: HydrationUserProfile = {
    gender: "male",
    age: 24,
    weight: 78,
    activityLevel: "active",
    climate: "hot",
  };

  const goal = calculateHydrationGoal(activeHotProfile);

  // Baseline male: 3700 ml total, 3000 ml beverage, with contextual notes for physical activity and environment
  assert.equal(goal.totalWaterGoalMl, 3700);
  assert.equal(goal.beverageGoalMl, 3000);
  assert.ok(goal.contextualFactors.length >= 2);
  const factorNames = goal.contextualFactors.map((f) => f.factor);
  assert.ok(factorNames.includes("Physical Activity"));
  assert.ok(factorNames.includes("Environment & Climate"));
});

test("Hydration Engine - Progress Tracking with Drinks and Food Water", () => {
  const profile: HydrationUserProfile = {
    gender: "male",
    age: 25,
    weight: 70,
    activityLevel: "sedentary",
  };

  const entries = [
    { id: "1", userEmail: "male@example.com", amountMl: 500, beverageType: "Water", consumedAt: new Date().toISOString() },
    { id: "2", userEmail: "male@example.com", amountMl: 250, beverageType: "Tea", consumedAt: new Date().toISOString() },
    { id: "3", userEmail: "male@example.com", amountMl: 300, beverageType: "Milk", consumedAt: new Date().toISOString() },
  ];

  const meals = [
    { id: "m1", foodName: "Watermelon Slice", waterContentMl: 280, waterContentConfidence: 0.9 },
    { id: "m2", foodName: "Vegetable Soup", waterContentMl: 200, waterContentConfidence: 0.85 },
    { id: "m3", foodName: "Plain Rice", waterContentMl: null, waterContentConfidence: null },
  ];

  const progress = computeHydrationProgress(profile, entries, meals);

  // Consumed drinks = 500 + 250 + 300 = 1050 ml
  assert.equal(progress.consumedFromDrinksMl, 1050);
  // Estimated food water = 280 + 200 = 480 ml
  assert.equal(progress.estimatedFoodWaterMl, 480);
  // Total consumed = 1050 + 480 = 1530 ml
  assert.equal(progress.totalWaterConsumedMl, 1530);
  // Beverage % = (1050 / 3000) * 100 = 35%
  assert.equal(progress.beveragePercentage, 35);
  // Total % = (1530 / 3700) * 100 = 41% => Status: "Getting there" (>= 40%)
  assert.equal(progress.status, "Getting there");
  // Food water tracking had 1 incomplete meal
  assert.equal(progress.foodWaterTrackingIncomplete, true);
  // Beverage breakdown
  assert.equal(progress.beverageBreakdown["Water"], 500);
  assert.equal(progress.beverageBreakdown["Tea"], 250);
  assert.equal(progress.beverageBreakdown["Milk"], 300);
});

test("Hydration Engine - Status Thresholds", () => {
  const profile: HydrationUserProfile = {
    gender: "female",
    age: 22,
    weight: 55,
    activityLevel: "sedentary",
  };

  // Female beverage goal = 2200 ml, total goal = 2700 ml

  // 1. Needs attention (<40%)
  const lowEntries = [{ id: "l1", userEmail: "f@example.com", amountMl: 500, beverageType: "Water", consumedAt: new Date().toISOString() }];
  const lowProg = computeHydrationProgress(profile, lowEntries, []);
  assert.equal(lowProg.status, "Needs attention");

  // 2. Getting there (40% - 79%)
  const midEntries = [{ id: "m1", userEmail: "f@example.com", amountMl: 1200, beverageType: "Water", consumedAt: new Date().toISOString() }];
  const midProg = computeHydrationProgress(profile, midEntries, []);
  assert.equal(midProg.status, "Getting there");

  // 3. Good (>=80%)
  const highEntries = [{ id: "h1", userEmail: "f@example.com", amountMl: 1900, beverageType: "Water", consumedAt: new Date().toISOString() }];
  const highProg = computeHydrationProgress(profile, highEntries, []);
  assert.equal(highProg.status, "Good");
});
