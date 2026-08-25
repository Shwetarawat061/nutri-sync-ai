import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { UserRow } from "../types.js";

export const userRoutes = Router();

function saveOrUpdateUser(body: any, res: Response) {
  const {
    name,
    email,
    currentEmail,
    oldEmail,
    age,
    weight,
    height,
    gender,
    bmi,
    bmr,
    tdee,
    goal,
    dietary_pref,
    dietaryPreference,
    activity_level,
    calorie_target,
    protein_target,
    carbs_target,
    fats_target,
    budget,
    hostel_context,
    email_daily_digest,
    email_weekly_recap,
    email_deficit_alerts,
    email_hostel_hacks,
  } = body;

  if (!email || !name || !String(name).trim() || !String(email).trim()) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const userAge = Number(age);
  const userWeight = Number(weight);
  const userHeight = Number(height);

  if (isNaN(userAge) || userAge <= 0 || isNaN(userWeight) || userWeight <= 0 || isNaN(userHeight) || userHeight <= 0) {
    return res.status(400).json({
      error: "Profile entries cannot be zero or empty. Age, weight, and height must be valid positive numbers greater than 0."
    });
  }

  const userCalTarget = Number(calorie_target);
  const userProteinTarget = Number(protein_target);
  const userCarbsTarget = Number(carbs_target);
  const userFatsTarget = Number(fats_target);

  if (
    (calorie_target !== undefined && (isNaN(userCalTarget) || userCalTarget <= 0)) ||
    (protein_target !== undefined && (isNaN(userProteinTarget) || userProteinTarget <= 0)) ||
    (carbs_target !== undefined && (isNaN(userCarbsTarget) || userCarbsTarget <= 0)) ||
    (fats_target !== undefined && (isNaN(userFatsTarget) || userFatsTarget <= 0))
  ) {
    return res.status(400).json({
      error: "Nutrition target entries cannot be zero. Calorie, protein, carbs, and fats targets must be greater than 0."
    });
  }

  const effectiveOldEmail = (currentEmail || oldEmail || "").trim().toLowerCase();
  const normalizedNewEmail = email.trim().toLowerCase();
  const dietPref = dietaryPreference || dietary_pref || "Omnivore";
  const userGoal = goal || "Healthy eating";
  const userBmi = Number(bmi) || Number((userWeight / Math.pow(userHeight / 100, 2)).toFixed(1));
  const userBmr = bmr !== undefined && bmr !== null ? Number(bmr) : null;
  const userTdee = tdee !== undefined && tdee !== null ? Number(tdee) : null;
  const finalCalTarget = userCalTarget > 0 ? userCalTarget : 2100;
  const finalProteinTarget = userProteinTarget > 0 ? userProteinTarget : 120;
  const finalCarbsTarget = userCarbsTarget > 0 ? userCarbsTarget : 200;
  const finalFatsTarget = userFatsTarget > 0 ? userFatsTarget : 60;
  const userBudget = budget || "medium";
  const userHostelContext = hostel_context || "";
  const userGender = gender || "male";
  const userActivity = activity_level || "moderate";

  const dailyDig = email_daily_digest !== undefined ? (email_daily_digest ? 1 : 0) : 1;
  const weeklyRec = email_weekly_recap !== undefined ? (email_weekly_recap ? 1 : 0) : 1;
  const deficitAlt = email_deficit_alerts !== undefined ? (email_deficit_alerts ? 1 : 0) : 1;
  const hostelHacks = email_hostel_hacks !== undefined ? (email_hostel_hacks ? 1 : 0) : 1;

  // Check if we are updating an existing user whose email changed
  if (effectiveOldEmail && effectiveOldEmail !== normalizedNewEmail) {
    const existingOldUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(effectiveOldEmail) as UserRow | undefined;
    const emailConflict = db.prepare("SELECT id FROM users WHERE LOWER(email) = ? AND LOWER(email) != ?").get(normalizedNewEmail, effectiveOldEmail);
    if (emailConflict) {
      return res.status(400).json({ error: `The email address ${normalizedNewEmail} is already in use by another account.` });
    }

    if (existingOldUser) {
      // Migrate child records to the new email address
      try {
        db.prepare("UPDATE meals SET user_email = ? WHERE LOWER(user_email) = ?").run(normalizedNewEmail, effectiveOldEmail);
        db.prepare("UPDATE nutrition_targets SET user_email = ? WHERE LOWER(user_email) = ?").run(normalizedNewEmail, effectiveOldEmail);
        db.prepare("UPDATE recommendations SET user_email = ? WHERE LOWER(user_email) = ?").run(normalizedNewEmail, effectiveOldEmail);
        db.prepare("UPDATE diet_plans SET user_email = ? WHERE LOWER(user_email) = ?").run(normalizedNewEmail, effectiveOldEmail);
      } catch (migrateErr) {
        console.warn("⚠️ Error migrating records to new email:", migrateErr);
      }

      const updateStmt = db.prepare(`
        UPDATE users 
        SET email = ?, name = ?, age = ?, weight = ?, height = ?, gender = ?, bmi = ?,
            bmr = COALESCE(?, bmr), tdee = COALESCE(?, tdee), goal = ?,
            dietary_pref = ?, activity_level = ?,
            calorie_target = ?, protein_target = ?,
            carbs_target = ?, fats_target = ?,
            budget = ?, hostel_context = ?,
            email_daily_digest = ?, email_weekly_recap = ?, email_deficit_alerts = ?, email_hostel_hacks = ?,
            email_verified = 1
        WHERE LOWER(email) = ?
      `);
      updateStmt.run(
        normalizedNewEmail,
        name,
        userAge,
        userWeight,
        userHeight,
        userGender,
        userBmi,
        userBmr,
        userTdee,
        userGoal,
        dietPref,
        userActivity,
        finalCalTarget,
        finalProteinTarget,
        finalCarbsTarget,
        finalFatsTarget,
        userBudget,
        userHostelContext,
        dailyDig,
        weeklyRec,
        deficitAlt,
        hostelHacks,
        effectiveOldEmail
      );

      const updatedUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(normalizedNewEmail) as UserRow;
      return res.status(200).json({ success: true, user: updatedUser });
    }
  }

  const checkUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(normalizedNewEmail) as UserRow | undefined;

  if (checkUser) {
    const updateStmt = db.prepare(`
      UPDATE users 
      SET name = ?, age = ?, weight = ?, height = ?, gender = ?, bmi = ?,
          bmr = COALESCE(?, bmr), tdee = COALESCE(?, tdee), goal = ?,
          dietary_pref = ?, activity_level = ?,
          calorie_target = ?, protein_target = ?,
          carbs_target = ?, fats_target = ?,
          budget = ?, hostel_context = ?,
          email_daily_digest = ?, email_weekly_recap = ?, email_deficit_alerts = ?, email_hostel_hacks = ?,
          email_verified = 1
      WHERE LOWER(email) = ?
    `);
    updateStmt.run(
      name,
      userAge,
      userWeight,
      userHeight,
      userGender,
      userBmi,
      userBmr,
      userTdee,
      userGoal,
      dietPref,
      userActivity,
      finalCalTarget,
      finalProteinTarget,
      finalCarbsTarget,
      finalFatsTarget,
      userBudget,
      userHostelContext,
      dailyDig,
      weeklyRec,
      deficitAlt,
      hostelHacks,
      normalizedNewEmail
    );
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO users (
        name, email, age, weight, height, gender, bmi, bmr, tdee, goal,
        dietary_pref, activity_level, calorie_target, protein_target, carbs_target, fats_target,
        budget, hostel_context, email_daily_digest, email_weekly_recap, email_deficit_alerts, email_hostel_hacks, email_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    insertStmt.run(
      name,
      normalizedNewEmail,
      userAge,
      userWeight,
      userHeight,
      userGender,
      userBmi,
      userBmr,
      userTdee,
      userGoal,
      dietPref,
      userActivity,
      finalCalTarget,
      finalProteinTarget,
      finalCarbsTarget,
      finalFatsTarget,
      userBudget,
      userHostelContext,
      dailyDig,
      weeklyRec,
      deficitAlt,
      hostelHacks
    );
  }

  const updatedUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(normalizedNewEmail) as UserRow;

  // Sync nutrition_targets table
  try {
    const existingTarget = db.prepare("SELECT id FROM nutrition_targets WHERE LOWER(user_email) = ?").get(normalizedNewEmail);
    if (existingTarget) {
      db.prepare(`
        UPDATE nutrition_targets 
        SET goal = ?, calorie_target = ?, protein_target = ?, carbs_target = ?, fats_target = ?, updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(user_email) = ?
      `).run(
        updatedUser.goal || userGoal,
        updatedUser.calorie_target || finalCalTarget,
        updatedUser.protein_target || finalProteinTarget,
        updatedUser.carbs_target || finalCarbsTarget,
        updatedUser.fats_target || finalFatsTarget,
        normalizedNewEmail
      );
    } else {
      db.prepare(`
        INSERT INTO nutrition_targets (user_email, goal, calorie_target, protein_target, carbs_target, fats_target)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        normalizedNewEmail,
        updatedUser.goal || userGoal,
        updatedUser.calorie_target || finalCalTarget,
        updatedUser.protein_target || finalProteinTarget,
        updatedUser.carbs_target || finalCarbsTarget,
        updatedUser.fats_target || finalFatsTarget
      );
    }
  } catch (targetErr) {
    console.warn("⚠️ Failed to sync nutrition_targets table:", targetErr);
  }

  return res.status(200).json({ success: true, user: updatedUser });
}

// POST /api/user/onboard
userRoutes.post("/onboard", (req: Request, res: Response) => {
  try {
    return saveOrUpdateUser(req.body, res);
  } catch (error: any) {
    console.error("❌ Error in /api/user/onboard:", error);
    return res.status(500).json({ error: "Failed to persist user profile", details: error.message });
  }
});

// PUT /api/user/profile
userRoutes.put("/profile", (req: Request, res: Response) => {
  try {
    return saveOrUpdateUser(req.body, res);
  } catch (error: any) {
    console.error("❌ Error in PUT /api/user/profile:", error);
    return res.status(500).json({ error: "Failed to update user profile", details: error.message });
  }
});

// POST /api/user/send-verification
userRoutes.post("/send-verification", (req: Request, res: Response) => {
  try {
    const { email, newEmail } = req.body;
    const targetEmail = (newEmail || email || "").trim().toLowerCase();
    const currentEmail = (email || "").trim().toLowerCase();

    if (!targetEmail) {
      return res.status(400).json({ error: "Email address is required" });
    }

    // Check if newEmail is already taken by someone else
    if (newEmail && newEmail.toLowerCase() !== currentEmail) {
      const exists = db.prepare("SELECT id FROM users WHERE LOWER(email) = ? AND LOWER(email) != ?").get(newEmail.toLowerCase(), currentEmail);
      if (exists) {
        return res.status(400).json({ error: `The email address ${newEmail} is already registered.` });
      }
    }

    // Generate random 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in users table for the current user
    if (currentEmail) {
      const user = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(currentEmail);
      if (user) {
        db.prepare(`
          UPDATE users 
          SET verification_code = ?, pending_email = ?, code_expires_at = datetime('now', '+15 minutes')
          WHERE LOWER(email) = ?
        `).run(verificationCode, newEmail ? newEmail.trim().toLowerCase() : null, currentEmail);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Verification code dispatched to ${targetEmail}`,
      previewCode: verificationCode,
      targetEmail,
    });
  } catch (error: any) {
    console.error("❌ Error in /api/user/send-verification:", error);
    return res.status(500).json({ error: "Failed to generate verification code", details: error.message });
  }
});

// POST /api/user/verify-email
userRoutes.post("/verify-email", (req: Request, res: Response) => {
  try {
    const { email, code, newEmail } = req.body;
    const currentEmail = (email || "").trim().toLowerCase();
    const inputCode = (code || "").trim();

    if (!currentEmail || !inputCode) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(currentEmail) as UserRow | undefined;
    if (!user) {
      return res.status(404).json({ error: "User account not found" });
    }

    if (!user.verification_code || user.verification_code !== inputCode) {
      return res.status(400).json({ error: "Invalid verification code. Please check and try again." });
    }

    const targetEmail = (newEmail || user.pending_email || currentEmail).trim().toLowerCase();

    // If changing email address
    if (targetEmail !== currentEmail) {
      const conflict = db.prepare("SELECT id FROM users WHERE LOWER(email) = ? AND LOWER(email) != ?").get(targetEmail, currentEmail);
      if (conflict) {
        return res.status(400).json({ error: `The email ${targetEmail} is already taken.` });
      }

      // Migrate all child records
      try {
        db.prepare("UPDATE meals SET user_email = ? WHERE LOWER(user_email) = ?").run(targetEmail, currentEmail);
        db.prepare("UPDATE nutrition_targets SET user_email = ? WHERE LOWER(user_email) = ?").run(targetEmail, currentEmail);
        db.prepare("UPDATE recommendations SET user_email = ? WHERE LOWER(user_email) = ?").run(targetEmail, currentEmail);
        db.prepare("UPDATE diet_plans SET user_email = ? WHERE LOWER(user_email) = ?").run(targetEmail, currentEmail);
      } catch (migErr) {
        console.warn("⚠️ Meal migration error on email verification:", migErr);
      }

      db.prepare(`
        UPDATE users 
        SET email = ?, email_verified = 1, verification_code = NULL, pending_email = NULL, code_expires_at = NULL
        WHERE LOWER(email) = ?
      `).run(targetEmail, currentEmail);
    } else {
      db.prepare(`
        UPDATE users 
        SET email_verified = 1, verification_code = NULL, pending_email = NULL, code_expires_at = NULL
        WHERE LOWER(email) = ?
      `).run(currentEmail);
    }

    const updatedUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(targetEmail) as UserRow;
    return res.status(200).json({
      success: true,
      message: "Email address verified successfully!",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("❌ Error in /api/user/verify-email:", error);
    return res.status(500).json({ error: "Failed to verify email", details: error.message });
  }
});

// POST /api/user/email-preferences
userRoutes.post("/email-preferences", (req: Request, res: Response) => {
  try {
    const { email, email_daily_digest, email_weekly_recap, email_deficit_alerts, email_hostel_hacks } = req.body;
    const userEmail = (email || "").trim().toLowerCase();
    if (!userEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(userEmail) as UserRow | undefined;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    db.prepare(`
      UPDATE users 
      SET email_daily_digest = ?, email_weekly_recap = ?, email_deficit_alerts = ?, email_hostel_hacks = ?
      WHERE LOWER(email) = ?
    `).run(
      email_daily_digest !== undefined ? (email_daily_digest ? 1 : 0) : (user.email_daily_digest ?? 1),
      email_weekly_recap !== undefined ? (email_weekly_recap ? 1 : 0) : (user.email_weekly_recap ?? 1),
      email_deficit_alerts !== undefined ? (email_deficit_alerts ? 1 : 0) : (user.email_deficit_alerts ?? 1),
      email_hostel_hacks !== undefined ? (email_hostel_hacks ? 1 : 0) : (user.email_hostel_hacks ?? 1),
      userEmail
    );

    const updatedUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(userEmail) as UserRow;
    return res.status(200).json({ success: true, message: "Email preferences saved successfully", user: updatedUser });
  } catch (error: any) {
    console.error("❌ Error in POST /api/user/email-preferences:", error);
    return res.status(500).json({ error: "Failed to update email preferences", details: error.message });
  }
});

// POST /api/user/send-digest
userRoutes.post("/send-digest", (req: Request, res: Response) => {
  try {
    const { email, customSubject } = req.body;
    const userEmail = (email || "").trim().toLowerCase();
    if (!userEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(userEmail) as UserRow | undefined;
    if (!user) {
      return res.status(404).json({ error: "User account not found" });
    }

    // Fetch today's meals
    const today = new Date().toISOString().split("T")[0];
    const meals = db.prepare(`
      SELECT * FROM meals 
      WHERE LOWER(user_email) = ? AND date(created_at) = date('now')
      ORDER BY created_at ASC
    `).all(userEmail) as any[];

    const totalCals = Math.round(meals.reduce((sum, m) => sum + (m.calories || 0), 0));
    const totalProt = Math.round(meals.reduce((sum, m) => sum + (m.protein || 0), 0));
    const totalCarbs = Math.round(meals.reduce((sum, m) => sum + (m.carbs || 0), 0));
    const totalFats = Math.round(meals.reduce((sum, m) => sum + (m.fats || 0), 0));

    const targetCals = user.calorie_target || 2100;
    const targetProt = user.protein_target || 120;
    const targetCarbs = user.carbs_target || 200;
    const targetFats = user.fats_target || 60;

    const remainingProt = Math.max(0, targetProt - totalProt);
    const calPercentage = Math.min(100, Math.round((totalCals / targetCals) * 100));
    const protPercentage = Math.min(100, Math.round((totalProt / targetProt) * 100));

    const subject = customSubject || `⚡ NutriSync Daily Digest: ${user.name || "Champion"} • ${totalCals}/${targetCals} kcal • ${totalProt}g/${targetProt}g Protein`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #0f172a; color: #f8fafc; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; max-width: 600px; margin: 0 auto; }
    .header { border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .title { font-size: 22px; font-weight: 900; margin: 8px 0 4px 0; color: #ffffff; }
    .subtitle { font-size: 13px; color: #94a3b8; }
    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
    .metric-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 14px; text-align: center; }
    .metric-label { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .metric-val { font-size: 20px; font-weight: 900; margin-top: 4px; color: #f8fafc; }
    .progress-bar { height: 8px; border-radius: 4px; background: #334155; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .action-box { background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 16px; margin-top: 20px; }
    .action-title { font-size: 13px; font-weight: 800; color: #34d399; text-transform: uppercase; }
    .action-desc { font-size: 13px; color: #e2e8f0; margin-top: 6px; line-height: 1.5; }
    .meals-list { margin-top: 20px; border-top: 1px solid #334155; padding-top: 16px; }
    .meal-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 13px; }
    .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">NutriSync Decision Engine</span>
      <h1 class="title">Daily Metabolic Velocity Digest</h1>
      <p class="subtitle">Hello ${user.name || "there"}, here is your calibrated nutrition summary for today.</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-label">Energy Consumed</div>
        <div class="metric-val" style="color: #38bdf8;">${totalCals} <span style="font-size:12px; color:#64748b;">/ ${targetCals} kcal</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${calPercentage}%; background: #38bdf8;"></div></div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Protein Target</div>
        <div class="metric-val" style="color: #fb923c;">${totalProt}g <span style="font-size:12px; color:#64748b;">/ ${targetProt}g</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${protPercentage}%; background: #fb923c;"></div></div>
      </div>
    </div>

    <div class="action-box">
      <div class="action-title">🎯 AI Recommended Next Best Action</div>
      <div class="action-desc">
        ${
          remainingProt > 20
            ? `You have a ${remainingProt}g protein deficit remaining today. We recommend adding 1 cup of Greek yogurt or a 2-egg omelette / paneer serving for your next meal or evening snack.`
            : `Phenomenal pacing! You've achieved ${protPercentage}% of your protein goal. Maintain healthy hydration (2.5L+) and focus on a restful sleep recovery.`
        }
      </div>
    </div>

    <div class="meals-list">
      <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Logged Meals (${meals.length})</div>
      ${
        meals.length > 0
          ? meals
              .map(
                (m) =>
                  `<div class="meal-item"><span style="font-weight:600; color:#f1f5f9;">${m.food_name} <span style="font-size:11px; color:#94a3b8;">(${m.meal_type})</span></span><span style="color:#38bdf8; font-weight:700;">${m.calories} kcal • ${m.protein}g P</span></div>`
              )
              .join("")
          : `<div style="font-size:12px; color:#64748b; font-style:italic;">No meals logged yet today. Snap a photo or log your breakfast to start!</div>`
      }
    </div>

    <div class="footer">
      <p>Delivered by <strong>NutriSync AI Decision Engine</strong> • Context Mode: ${user.hostel_context || "Hostel & Canteen"}</p>
      <p>To modify your notification preferences, open your NutriSync Profile Settings.</p>
    </div>
  </div>
</body>
</html>
    `;

    return res.status(200).json({
      success: true,
      message: `Daily digest dispatched to ${userEmail}`,
      targetEmail: userEmail,
      subject,
      htmlPreview: htmlContent,
      stats: {
        totalCalories: totalCals,
        targetCalories: targetCals,
        totalProtein: totalProt,
        targetProtein: targetProt,
        remainingProtein: remainingProt,
        mealsCount: meals.length,
      },
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Error in POST /api/user/send-digest:", error);
    return res.status(500).json({ error: "Failed to dispatch email digest", details: error.message });
  }
});

// GET /api/user/profile?email=
userRoutes.get("/profile", (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(email) as UserRow | undefined;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error("❌ Error in /api/user/profile:", error);
    return res.status(500).json({ error: "Failed to retrieve user profile", details: error.message });
  }
});

