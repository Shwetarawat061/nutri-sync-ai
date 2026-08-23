# NUTRISYNC API SPECIFICATION

BASE:

/api

## HEALTH

GET /api/health

## USER

POST /api/user/onboard

GET /api/user/profile?email=

PUT /api/user/profile

Profile must include:

- name
- email
- age
- weight
- height
- gender
- goal
- dietaryPreference
- budget
- hostel/mess context if provided

## AI

POST /api/ai/scan-food

Input:

{
  imageBase64,
  mimeType
}

Output:

{
  food_name,
  calories,
  protein,
  carbs,
  fats,
  fiber,
  metabolic_impact,
  confidence
}

## AI REASONING

POST /api/ai/nutrition-insight

Input:

{
  userProfile,
  currentMeal,
  todayNutrition,
  recentMeals,
  nutritionTargets
}

Output:

{
  insight,
  next_best_action
}

## MEALS

POST /api/meals

Save analyzed meal.

GET /api/meals

Return meal history.

GET /api/meals/today

Return today's meals and totals.

GET /api/meals/:id

Return one meal.

DELETE /api/meals/:id

Delete meal.

## DIET RECOMMENDATION

POST /api/ai/recommend-next-meal

Input:

{
  userProfile,
  nutritionGoal,
  todayNutrition,
  recentMeals,
  budget,
  dietaryPreference,
  hostelMenu,
  availableFood
}

Output:

{
  recommendation,
  options,
  rationale
}

## RULE

Frontend must never call Gemini directly.

All AI requests must go:

React
→ Express
→ Gemini
→ Structured response
→ Validation
→ React