import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const revokedTokens = new Set<string>();

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      authToken?: string;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret && secret.length >= 16) {
    return secret;
  }
  return "nutrisync_neural_secure_jwt_session_token_key_32_chars_minimum";
}

export function signAuthToken(user: AuthenticatedUser): string {
  return jwt.sign({ id: user.id, email: user.email }, getJwtSecret(), { expiresIn: "7d" });
}

export function revokeAuthToken(token: string): void {
  revokedTokens.add(token);
}

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token || revokedTokens.has(token)) {
    return res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { id?: string; email?: string };
    if (!payload.id || !payload.email) {
      return res.status(401).json({ error: "Invalid authentication token", code: "AUTH_INVALID" });
    }
    req.user = { id: payload.id, email: payload.email };
    req.authToken = token;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired authentication token", code: "AUTH_INVALID" });
  }
}

export function authConfigError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("JWT_SECRET");
}