# NutriSync — Autonomous Metabolic Intelligence

NutriSync is an AI-powered metabolic tracking and bio-hacking platform that helps you scan meals with computer vision, track macronutrients, monitor metabolic balance scores, and generate personalized nutrition protocols.

---

## Features

- **AI Food & Meal Scanner**: Analyze meal photos via camera or file upload using Gemini AI for instant caloric, macro, and metabolic breakdown.
- **Autonomous Metabolic Intelligence**: Real-time metabolic score calculations, glycemic impact assessments, and fasting window recommendations.
- **Personalized Diet Protocols**: Dynamic nutrition plans generated based on fitness goals, dietary restrictions, and biomarkers.
- **Macro & Nutrient Tracking**: Daily logging with visual breakdown charts for proteins, fats, carbs, and micronutrients.
- **Export Reports**: Generate and download comprehensive PDF wellness reports.
- **Local Persistence**: Built-in SQLite database storing user profiles, meal history, and daily logs.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons, Chart.js
- **Backend**: Express.js, Node.js, TypeScript (with `tsx` in development & `esbuild` for production bundling)
- **Database**: SQLite (via `better-sqlite3`)
- **AI Engine**: Google Gen AI SDK (`@google/genai` / Gemini models)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version **18.x** or higher, Node 20+ recommended)
- [npm](https://www.npmjs.com/) (or `pnpm` / `bun` / `yarn`)
- A [Google Gemini API Key](https://aistudio.google.com/) for AI meal scanning and protocol generation features.

---

## Getting Started Locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nutrisync.git
cd nutrisync
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory by copying the sample configuration:

```bash
cp .env.example .env
```

Open `.env` and add your Gemini API key:

```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
JWT_SECRET="your_long_random_secret_at_least_32_characters"
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/nutrisync"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

Authentication uses bcrypt password hashes and 7-day JWT sessions. The browser stores the JWT locally and sends it as a Bearer token. Protected user, meal, and AI routes always derive ownership from the token, never from a frontend-supplied user ID or email.

Persistent data is stored in MongoDB Atlas through Mongoose. On startup, the migration-safe initializer imports legacy SQLite users, meals, and nutrition goals once, recording the `sqlite-to-mongo-v1` marker in MongoDB. Keep `.env` out of source control.

Food scan images are uploaded server-side to Cloudinary; only their URLs are stored with new meals. Configure the three Cloudinary variables before enabling food scans.

*(Optional)* Set `PORT` (defaults to `3000`) or `APP_URL` if customizing the host URL.

### 4. Start the development server

```bash
npm run dev
```

The application and API server will start up on:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server with Vite middleware in development mode on port 3000 |
| `npm run build` | Builds the client static assets with Vite and bundles the backend with esbuild to `dist/` |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Removes the `dist/` build directory |
| `npm run preview` | Previews the Vite production build |

---

## Project Structure

```text
├── client/
│   └── src/
│       ├── api/          # Client API fetchers & server endpoints
│       ├── components/   # UI components (MealScanner, Dashboard, Charts, etc.)
│       ├── constants.ts  # Application constants & defaults
│       ├── types.ts      # Client TypeScript interfaces
│       ├── utils/        # Helper functions & PDF export utilities
│       ├── App.tsx       # Main React app component
│       ├── main.tsx      # React DOM entrypoint
│       └── index.css     # Global styles with Tailwind CSS v4
├── server/
│   ├── routes/           # Express API routes (user, meal logs, diet plans)
│   ├── db.ts             # SQLite database connection and initialization
│   ├── index.ts          # Express server with Vite middleware integration
│   └── types.ts          # Server-side TypeScript definitions
├── index.html            # Main HTML document
├── metabolic.db          # Local SQLite database (created automatically)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript compiler configuration
└── vite.config.ts        # Vite configuration
```

---

## Notes & Troubleshooting

- **SQLite Database**: The local database file `metabolic.db` will be automatically initialized when the server starts.
- **Camera Access**: To use the live camera scanner, ensure your browser has granted camera permissions to `localhost`.
- **API Key**: If the Gemini API key is missing or invalid, the app will still run, but AI scanning and smart protocol features will return an error prompting for a valid key.
