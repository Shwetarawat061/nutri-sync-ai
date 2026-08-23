import Database from "better-sqlite3";
import path from "path";

// Initialize SQLite database instance
const dbPath = path.resolve(process.cwd(), "metabolic.db");
export const db = new Database(dbPath);

// Enable WAL mode for high performance and concurrency
db.pragma("journal_mode = WAL");

// Initialize database schema tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      age INTEGER NOT NULL,
      weight REAL NOT NULL,
      height REAL NOT NULL,
      gender TEXT NOT NULL,
      bmi REAL NOT NULL,
      bmr REAL,
      tdee REAL,
      goal TEXT DEFAULT 'Maintenance',
      dietary_pref TEXT DEFAULT 'Omnivore',
      activity_level TEXT DEFAULT 'Moderate',
      calorie_target REAL DEFAULT 2100,
      protein_target REAL DEFAULT 120,
      carbs_target REAL DEFAULT 200,
      fats_target REAL DEFAULT 60,
      budget TEXT DEFAULT 'medium',
      hostel_context TEXT DEFAULT '',
      email_verified INTEGER DEFAULT 0,
      verification_code TEXT,
      pending_email TEXT,
      code_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fats REAL NOT NULL,
      fiber REAL DEFAULT 0,
      glycemic_index TEXT DEFAULT 'Medium',
      metabolic_impact TEXT,
      nutrition_reasoning TEXT,
      meal_type TEXT NOT NULL,
      image_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_meals_user_created ON meals (user_email, created_at);

    CREATE TABLE IF NOT EXISTS diet_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS nutrition_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      goal TEXT NOT NULL,
      calorie_target REAL NOT NULL,
      protein_target REAL NOT NULL,
      carbs_target REAL NOT NULL,
      fats_target REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      recommendation_type TEXT NOT NULL,
      content_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );
  `);

  // Run safe migrations for existing tables if budget or hostel_context missing
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const columnNames = tableInfo.map((c) => c.name);
    if (!columnNames.includes("budget")) {
      db.exec("ALTER TABLE users ADD COLUMN budget TEXT DEFAULT 'medium'");
    }
    if (!columnNames.includes("hostel_context")) {
      db.exec("ALTER TABLE users ADD COLUMN hostel_context TEXT DEFAULT ''");
    }
    if (!columnNames.includes("email_verified")) {
      db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0");
    }
    if (!columnNames.includes("verification_code")) {
      db.exec("ALTER TABLE users ADD COLUMN verification_code TEXT");
    }
    if (!columnNames.includes("pending_email")) {
      db.exec("ALTER TABLE users ADD COLUMN pending_email TEXT");
    }
    if (!columnNames.includes("code_expires_at")) {
      db.exec("ALTER TABLE users ADD COLUMN code_expires_at DATETIME");
    }
    if (!columnNames.includes("email_daily_digest")) {
      db.exec("ALTER TABLE users ADD COLUMN email_daily_digest INTEGER DEFAULT 1");
    }
    if (!columnNames.includes("email_weekly_recap")) {
      db.exec("ALTER TABLE users ADD COLUMN email_weekly_recap INTEGER DEFAULT 1");
    }
    if (!columnNames.includes("email_deficit_alerts")) {
      db.exec("ALTER TABLE users ADD COLUMN email_deficit_alerts INTEGER DEFAULT 1");
    }
    if (!columnNames.includes("email_hostel_hacks")) {
      db.exec("ALTER TABLE users ADD COLUMN email_hostel_hacks INTEGER DEFAULT 1");
    }
  } catch (err) {
    console.warn("⚠️ User table migration note:", err);
  }

  console.log("⚡ [Database] SQLite metabolic schema initialized with users, meals, and diet_plans tables.");
}
