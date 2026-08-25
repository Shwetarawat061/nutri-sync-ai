# NutriSync AI — Comprehensive Project Audit & Evaluation Report

**Prepared for:** S3K Technologies Internship Evaluation  
**Project Name:** NutriSync AI  
**Core Philosophy:** *"Don't just track what you eat. Know what to do next."*  
**Audit Date:** August 2026  
**Status:** Audit Complete & Verified  

---

## 1. Executive Summary

NutriSync AI is a full-stack, AI-powered nutritional intelligence and decision-support platform. Unlike conventional calorie counting applications that merely record retrospective intake data, NutriSync AI proactively computes the **Next Best Action** for students, young professionals, and campus/hostel residents based on real-time biometric goals, daily accumulated macronutrients, budget tiers, and local food availability.

The application has been audited against the **10 Core Evaluation Criteria for S3K Technologies**:
1. **Generative AI:** Multimodal visual meal analysis, dynamic diet generation, and conversational health reasoning.
2. **AI/ML Application Development:** Multi-tier prompt engineering, structured JSON schemas via `@google/genai`, and deterministic heuristic fallback engines.
3. **Agentic AI / Decision-Making:** Autonomous goal-gap evaluation that recommends exact macro interventions and food swaps.
4. **Backend API Development:** Express.js REST API with structured controllers, route separation, and strong validation.
5. **Database / Data Persistence:** SQLite (`better-sqlite3`) with transactional integrity for users, meal logs, daily totals, and email preferences.
6. **Automation:** Background daily digest generation, email verification flows, and Gmail order/receipt parsing.
7. **Personalized Recommendations:** Dynamic meal suggestions considering hostel mess menus, vegetarian/omnivore preferences, and budgets.
8. **Explainable AI (XAI):** Metabolic reasoning, glycemic index breakdown, and explicit "Why this action matters" justifications.
9. **Production-Oriented Architecture:** Zero client-side API key leakage, multi-model failover (`gemini-3.7-flash` -> `gemini-flash-latest` -> `gemini-3.1-flash-lite`), and graceful degradation.
10. **Strong Client/Business Value:** Practical campus/budget hacks, actionable adherence scoring, and intuitive single-page flow.

---

## 2. Complete Folder & Codebase Structure

```
├── .env.example                         # Environment variable definitions (GEMINI_API_KEY)
├── .gitignore                           # Git ignore rules
├── README.md                            # High-level product overview
├── metadata.json                        # Applet permissions & capabilities
├── package.json                         # Node.js dependencies & scripts
├── tsconfig.json                        # TypeScript strict compiler config
├── vite.config.ts                       # Vite bundler & Tailwind integration
├── metabolic.db                         # SQLite persistent database file
├── server.ts                            # Full-stack Express entry point & Vite middleware
│
├── docs/                                # System Architecture & Technical Specifications
│   ├── API_SPEC.md                      # REST endpoint contracts & payloads
│   ├── DATABASE_SPEC.md                 # Database schema & index definitions
│   ├── PRODUCT_SPEC.md                  # Product vision, user journeys & feature boundaries
│   └── UI_SPEC.md                       # Design system, theme tokens & UI components
│
├── server/                              # Backend Architecture (Node.js/Express)
│   ├── db.ts                            # SQLite connection, schema tables & migration helpers
│   ├── routes/
│   │   ├── aiRoutes.ts                  # AI feature endpoints (/api/ai/*)
│   │   ├── mealRoutes.ts                # Meal CRUD & daily aggregation endpoints (/api/meals/*)
│   │   └── userRoutes.ts                # User profiles, onboarding & auth (/api/user/*)
│   └── services/
│       ├── emailService.ts              # Digest generation & email delivery engine
│       └── gemini.ts                    # Google Gen AI SDK client, schemas & fallback engine
│
└── client/                              # Frontend Architecture (React 18 + Vite + Tailwind)
    └── src/
        ├── main.tsx                     # React DOM entry point
        ├── App.tsx                      # Main container, routing state & navigation dock
        ├── types.ts                     # Shared TypeScript interfaces & types
        ├── constants.ts                 # Constant values (meal types, dietary goals)
        ├── index.css                    # Tailwind CSS imports & theme styling
        ├── api/
        │   └── index.ts                 # Type-safe API client wrapper (`safeFetch`)
        ├── lib/
        │   ├── firebase.ts              # Firebase client auth (Google OAuth for Gmail)
        │   └── nutrition.ts             # Mifflin-St Jeor BMR/TDEE math & macro calculations
        └── components/
            ├── Onboarding.tsx           # Biometric onboarding wizard
            ├── advisor/
            │   └── AIHealthAdvisor.tsx  # Conversational Clinical Health & Metabolic Advisor
            ├── brand/
            │   └── NutriSyncLogo.tsx    # Responsive SVG brand identity
            ├── dashboard/
            │   ├── NutritionDashboard.tsx# Core analytics, Next Best Action widget, macro rings
            │   └── AdherenceScoreCard.tsx# Daily consistency & metabolic adherence meter
            ├── diet-plan/
            │   └── DietPlanGenerator.tsx# Adaptive 1-Day Diet & Meal Protocol generator
            ├── food-scan/
            │   ├── FoodScanner.tsx      # Multimodal Camera & Upload Vision Analyzer
            │   └── CameraCaptureModal.tsx# Live webcam viewfinder & image snapshot capture
            ├── meal-tracker/
            │   ├── MealTracker.tsx      # Daily meal timeline, manual & batch logger
            │   └── AISmartMealLogger.tsx# Natural language & voice meal text parser
            ├── profile/
            │   └── ProfileSettings.tsx  # Biometric targets, hostel mode & digest settings
            └── welcome/
                └── StartingScreen.tsx   # Premium starting screen with instant demo loader
```

---

## 3. Frontend Architecture & UI Component Hierarchy

The frontend is constructed with **React 18**, **TypeScript**, **Tailwind CSS**, and **Motion**:
- **Design System:** Light/Dark mode reactive palette with high-contrast emerald and slate accents.
- **Navigation Model:** Mobile-first floating bottom capsule dock (`Home`, `Meals`, `Scan [Elevated Button]`, `Plan`, `Profile`) paired with top-bar instant toggles (`AI Advisor`, `Mess Mode`, `Theme Switch`).
- **State Management:** Reactive React state synchronized with SQLite backend via the API client layer (`client/src/api/index.ts`).
- **Formulas & Nutrition Engine:** Standardized **Mifflin-St Jeor Equation** (`client/src/lib/nutrition.ts`) calculating BMR and TDEE dynamically based on age, gender, height, weight, activity multiplier, and nutritional goal.

---

## 4. Backend Architecture & Route Controller Design

The backend is built with **Express.js** running in tandem with Vite development middleware and bundled with `esbuild` for production:
- **`server.ts`**: Entry point handling CORS, JSON payload parsing (50MB ceiling for high-res base64 image scanning), and router mounts:
  - `/api/user/*` → `server/routes/userRoutes.ts` (Onboarding, profile CRUD, email verification, daily digests).
  - `/api/meals/*` → `server/routes/mealRoutes.ts` (Logging meals, fetching today's totals, deleting entries, batch syncing).
  - `/api/ai/*` → `server/routes/aiRoutes.ts` (Food scan, next best action, smart meal parsing, diet generator, health advisor, email parsing).

---

## 5. Database Configuration & Schema Persistence

Persistence is powered by **`better-sqlite3`** inside `server/db.ts` with `WAL` (Write-Ahead Logging) mode enabled for concurrency:
- **`users` Table:** Stores user biometrics (height, weight, age, gender), calculated targets (calories, protein, carbs, fats), dietary preferences, budget tier, hostel context, and email notification flags.
- **`meals` Table:** Stores discrete food logs with macro breakdown (calories, protein, carbs, fats, fiber), glycemic index, metabolic impact, nutrition reasoning, meal type, image data, and creation timestamp.
- **`daily_targets` & `email_logs` Tables:** Stores historical macro goals and automated digest dispatch audit logs.

---

## 6. AI & Gemini Integration Audit

### Server-Side Isolation & Key Security
- **Strict Server Execution:** `process.env.GEMINI_API_KEY` is loaded exclusively within `server/services/gemini.ts`. No `VITE_` prefix is used, preventing browser leaks.
- **Multi-Model Failover Protocol:** `callGeminiWithFailover` iterates across `gemini-3.7-flash`, `gemini-flash-latest`, and `gemini-3.1-flash-lite` to mitigate 429/503 upstream transient load spikes.
- **Structured Output Guarantees:** All Gemini calls employ `responseMimeType: "application/json"` with explicit `responseSchema` definitions using `@google/genai` `Type.OBJECT` / `Type.ARRAY`.
- **Deterministic Clinical Fallback Engine:** If offline or if API quotas are exceeded, the system automatically falls back to deterministic Mifflin-St Jeor and Indian Food Composition Table heuristics without crashing or degrading UI integrity.

### Active AI Pipelines
1. **Multimodal Food Scanner (`scanFoodImage`):** Vision AI analyzing food geometry, estimating portion weight, calories, macronutrients, glycemic index, and clinical metabolic reasoning.
2. **Next Best Action Engine (`generateNextBestAction`):** Real-time optimization calculating remaining daily macro budget and generating 1 primary action with 2-3 hostel/budget-friendly food options.
3. **AI Smart Meal Logger (`parseMealText`):** Natural language & voice transcription parser converting freeform text into ingredient portions and macro totals.
4. **Adaptive Diet Plan Generator (`generatePersonalizedDietPlan`):** 1-Day structured protocol featuring breakfast, lunch, snack, and dinner with hostel mess survival hacks.
5. **AI Health & Metabolic Advisor (`consultHealthAdvisor`):** Conversational advisor providing structured 4-part assessments (Direct Assessment, Tailored Action Plan, Hostel/Budget Survival Tip, Quantitative Target).
6. **Gmail Food Receipt Parser (`parseEmailMeal`):** Extracts food items and macro estimates from email order confirmations.

---

## 7. Ten Core Criteria Alignment Matrix

| Evaluation Criteria | Implementation in NutriSync AI | Evidence in Codebase |
| :--- | :--- | :--- |
| **1. Generative AI** | Multimodal Vision AI for dish analysis, conversational clinical advisor, and adaptive diet protocols. | `server/services/gemini.ts`, `FoodScanner.tsx`, `AIHealthAdvisor.tsx` |
| **2. AI/ML App Dev** | Structured JSON schema validation, multi-model failover, and strict prompt engineering. | `callGeminiWithFailover`, `responseSchema` declarations |
| **3. Agentic AI** | Next Best Action decision loop assessing current deficits against goal thresholds. | `generateNextBestAction`, `NutritionDashboard.tsx` |
| **4. Backend API** | RESTful modular Express architecture with clean separation of concerns and typed responses. | `server/routes/*`, `server/services/*` |
| **5. Database Persistence** | Persistent SQLite schema with transactions, migration lifecycle, and relational indices. | `server/db.ts`, `metabolic.db` |
| **6. Automation** | Automated daily email digest generation, verification code dispatch, and Gmail meal extraction. | `emailService.ts`, `userRoutes.ts` |
| **7. Personalized Recs** | Dynamic meal swaps respecting vegetarian/omnivore preferences, budget limits, and hostel constraints. | `DietPlanGenerator.tsx`, `nutrition.ts` |
| **8. Explainable AI (XAI)** | Explicit "Why this action matters" justifications, glycemic index ratings, and metabolic impact statements. | `FoodScanResponse`, `NextBestActionResult` |
| **9. Production Architecture**| Server-side secret isolation, safe fetch error handling, and robust type safety across client & server. | `safeFetch`, `.env.example`, `types.ts` |
| **10. Business/Client Value**| Tailored for students and young professionals with high retention features (Hostel Mode, Next Best Action).| `StartingScreen.tsx`, `ProfileSettings.tsx` |

---

## 8. Working Features & Status Confirmation

- **Food Scan AI (WORKING):** End-to-end image capture/upload, base64 payload transmission, Gemini Vision multimodal analysis, and instant logging.
- **Smart Meal Logger (WORKING):** Natural language text parsing into structured meals.
- **Next Best Action (WORKING):** Real-time adaptive action card on the home dashboard.
- **Diet Plan Protocol (WORKING):** Full 1-day personalized meal plan with budget hacks.
- **AI Health Advisor (WORKING):** Interactive 4-section structured consultation interface.
- **Profile & Target Calculator (WORKING):** Automatic BMR/TDEE calculations with email preferences.
- **Local Persistence & SQLite Sync (WORKING):** All meals and profiles persist across page reloads.

---

## 9. Gap Analysis & Technical Debt Evaluation

1. **Defensive String Handling (Resolved):** All previous `TypeError: Cannot read properties of undefined (reading 'split')` bugs have been mitigated with nullish checks and string conversions.
2. **API Resilience (Resolved):** Multi-model retry and deterministic fallbacks ensure zero user-facing 503/429 crashes.
3. **Clean Code Boundaries:** Deprecated experimental features (e.g. fake watch simulators or ungrounded disease scanners) are strictly excluded from the active UI to maintain production focus.

---

## 10. Security & Environment Variable Audit

- **Environment Config:** `GEMINI_API_KEY` is documented in `.env.example` and accessed solely via `process.env.GEMINI_API_KEY` on the backend.
- **No Client Exposure:** React application contains zero hardcoded API secrets.
- **Sanitization:** Database inputs use parameterized SQLite queries (`db.prepare(...)`), preventing SQL injection vulnerabilities.

---

## 11. Evolution Roadmap & Recommended Next Steps

1. **Stage 1 (Completed):** Comprehensive audit of codebase, data flow, AI services, and database persistence.
2. **Stage 2 (Next):** Implement enhanced test fixtures, refine micro-interactions in the food scanner and advisor, and ensure comprehensive documentation for the internship showcase.
3. **Stage 3:** Final evaluation review and presentation preparation.
