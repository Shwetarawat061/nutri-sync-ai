# NUTRISYNC PRODUCT SPECIFICATION

## Product

NutriSync is an AI-powered personalized nutrition decision assistant.

## Core Problem

Existing nutrition applications help users record or count food, but users still struggle with the next decision:

"What should I eat next based on what I have already eaten?"

## Core USP

Don't just track what you eat.
Know what to do next.

## Target Audience

Primary:

- College students
- Hostel/mess students
- Young professionals

Especially users who:

- eat variable meals
- use mess/canteen/restaurant food
- have limited budgets
- want simple nutrition guidance
- do not want to manually calculate macros

## Core Product Loop

User Goal
→ Food Scan
→ AI Food Analysis
→ Nutrition Estimate
→ Meal History
→ Nutrition Reasoning
→ Personalized Insight
→ Next Best Action

## MUST HAVE

1. Food Scan
2. AI Food/Nutrition Analysis
3. User Nutrition Goal
4. Basic Profile
5. Meal History
6. Nutrition Reasoning
7. Personalized Insight
8. Next Best Action
9. Nutrition Dashboard
10. Personalized Diet Recommendations

## IMPORTANT AUDIENCE CONTEXT

Support:

- dietary preference
- budget
- hostel/mess context
- available food/menu

These should influence recommendations.

Do NOT make them separate complicated modules.

They are context inputs for the recommendation engine.

## FOOD SCAN

Preserve the existing working Food Scan UX.

Existing functionality:

- image upload
- image preview
- scanning state
- AI analysis
- nutrition result
- meal logging

Do not rewrite the successful Food Scan unnecessarily.

## AI ANALYSIS

Analyze:

- food name
- calories
- protein
- carbohydrates
- fats
- fiber where possible
- metabolic/nutrition explanation

All nutrition values from images must be presented as estimates.

Do not fabricate precision.

## USER GOAL

Initial goals:

- Healthy eating
- Increase protein
- Weight management
- Fitness nutrition

The selected goal MUST affect reasoning and recommendations.

## MEAL HISTORY

Store:

- user
- food
- nutrition
- meal type
- timestamp
- image reference if available
- AI insight
- next best action

History must be persistent in the database.

Do not rely on localStorage as the source of truth.

## NUTRITION REASONING

Combine:

- user goal
- profile
- dietary preference
- budget
- current meal
- today's nutrition
- recent meal history
- nutrition targets

The system should identify meaningful nutrition gaps.

Do not generate an insight just because the AI can generate text.

## PERSONALIZED INSIGHT

Every insight should explain:

WHAT happened
+
WHY it matters
+
WHAT the user should do

Example:

"Your lunch provided a large amount of carbohydrates but relatively little protein compared with your current protein goal."

## NEXT BEST ACTION

This is the primary product differentiator.

Generate ONE clear next action.

Example:

"Make your next meal protein-focused."

Then give 2–3 practical options.

Options should consider:

- goal
- dietary preference
- budget
- available food
- hostel/mess context

## DIET RECOMMENDATIONS

Do not make this a generic static diet-plan generator.

Instead:

Current nutrition
+
Goal
+
Budget
+
Available food
+
Dietary preference

→ Personalized meal recommendation.

## DASHBOARD

Show only useful nutrition information:

- Calories
- Protein
- Carbs
- Fats
- Fiber
- Today's meals
- Nutrition progress
- Latest insight
- Next Best Action

## REMOVE FROM PRODUCT

Remove/deprecate:

- Disease Risk Scan
- Mind Care
- Facial Mood Scan
- Bluetooth Watch Simulator
- Fake health metrics
- Fake HR
- Fake BP
- Fake SpO2
- Fake Health Score
- Judge Demo Trigger
- Excessive sci-fi terminology

## DEFER

- PDF diagnostics report
- Wearable integration
- Advanced micronutrients
- Social features
- Gamification

## PRODUCT PRINCIPLE

Every feature must strengthen:

Food
→ Nutrition
→ Context
→ Reasoning
→ Action

If a feature does not strengthen this loop, do not add it.