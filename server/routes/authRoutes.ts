import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { authenticateUser, revokeAuthToken, signAuthToken } from "../middleware/auth.js";
import { storage } from "../storage.js";

export const authRoutes = Router();

function validationError(message: string) {
  return { error: message, code: "VALIDATION_ERROR" };
}

authRoutes.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!String(name || "").trim() || !normalizedEmail || !String(password || "")) {
      return res.status(400).json(validationError("Name, email, and password are required"));
    }
    if (String(password).length < 8) {
      return res.status(400).json(validationError("Password must be at least 8 characters"));
    }
    const existing = await storage.findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists", code: "EMAIL_EXISTS" });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = await storage.createUser({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      age: 18,
      weight: 60,
      height: 170,
      gender: "unspecified",
    });
    const token = signAuthToken({ id: user.id, email: normalizedEmail });
    return res.status(201).json({ user: storage.toPublicUser(user), token, isNewUser: true });
  } catch (error: any) {
    console.error("Registration failed:", error);
    return res.status(500).json({ error: "Registration failed", code: "AUTH_SERVER_ERROR" });
  }
});

authRoutes.post("/login", async (req: Request, res: Response) => {
  try {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!normalizedEmail || !password) {
      return res.status(400).json(validationError("Email and password are required"));
    }
    const user = await storage.findUserByEmail(normalizedEmail, true);
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password", code: "AUTH_INVALID" });
    }
    const isNew = !user.gender || user.gender === "unspecified" || (Number(user.age) === 18 && Number(user.weight) === 60 && Number(user.height) === 170 && (user.gender === "unspecified" || !user.gender));
    const token = signAuthToken({ id: user.id, email: user.email });
    return res.status(200).json({ user: storage.toPublicUser(user), token, isNewUser: isNew });
  } catch (error: any) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed", code: "AUTH_SERVER_ERROR" });
  }
});

authRoutes.get("/me", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await storage.findUserByIdOrEmail(req.user!.id, req.user!.email);
    if (!user) return res.status(401).json({ error: "Authenticated user no longer exists", code: "AUTH_INVALID" });
    return res.status(200).json({ user: storage.toPublicUser(user) });
  } catch (error: any) {
    console.error("Get /me failed:", error);
    return res.status(500).json({ error: "Failed to retrieve session user", code: "AUTH_SERVER_ERROR" });
  }
});

authRoutes.post("/logout", authenticateUser, (req: Request, res: Response) => {
  if (req.authToken) revokeAuthToken(req.authToken);
  return res.status(200).json({ success: true });
});
