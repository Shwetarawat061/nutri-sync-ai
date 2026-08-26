import { Router, Request, Response } from "express";
import { storage } from "../storage.js";

export const userRoutes = Router();

async function getOwner(req: Request) {
  if (!req.user) return null;
  return storage.findUserByIdOrEmail(req.user.id, req.user.email);
}

async function updateProfile(req: Request, res: Response) {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const body = req.body || {};
    const updated = await storage.updateUser(user, body);
    return res.status(200).json({ success: true, user: storage.toPublicUser(updated) });
  } catch (error: any) {
    return res.status(400).json({ error: "Failed to update profile", code: "VALIDATION_ERROR", details: error.message });
  }
}

userRoutes.post("/onboard", updateProfile);
userRoutes.put("/profile", updateProfile);

userRoutes.post("/email-preferences", async (req: Request, res: Response) => {
  const user = await getOwner(req);
  if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
  const updated = await storage.updateUser(user, req.body || {});
  return res.status(200).json({ success: true, message: "Email preferences saved successfully", user: storage.toPublicUser(updated) });
});

userRoutes.post("/send-verification", async (_req: Request, res: Response) => {
  return res.status(200).json({ success: true, message: "Email verification is managed by the authenticated account provider." });
});

userRoutes.post("/verify-email", async (req: Request, res: Response) => {
  const user = await getOwner(req);
  if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
  const updated = await storage.updateUser(user, { email_verified: true, emailVerified: true });
  return res.status(200).json({ success: true, message: "Email address verified successfully!", user: storage.toPublicUser(updated) });
});

userRoutes.post("/send-digest", async (req: Request, res: Response) => {
  const user = await getOwner(req);
  if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
  return res.status(200).json({
    success: true,
    message: `Daily digest prepared for ${user.email}`,
    targetEmail: user.email,
    subject: req.body.customSubject || "NutriSync Daily Digest",
    sentAt: new Date().toISOString()
  });
});

userRoutes.get("/profile", async (req: Request, res: Response) => {
  const user = await getOwner(req);
  if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
  return res.status(200).json({ success: true, user: storage.toPublicUser(user) });
});
