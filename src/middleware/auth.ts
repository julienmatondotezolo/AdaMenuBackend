import { Request, Response, NextFunction } from "express";

const AUTH_URL = process.env.AUTH_URL || "https://auth.adasystems.app";

/**
 * Validates the Bearer token against AdaAuth and attaches user info to req.auth.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Missing Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const validateRes = await fetch(`${AUTH_URL}/auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: token }),
    });

    const data = await validateRes.json();
    if (!data.valid || !data.user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or expired token" });
      return;
    }

    req.auth = {
      userId: data.user.id,
      email: data.user.email || "",
      role: data.user.role || null,
    };

    next();
  } catch {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Token verification failed" });
  }
}
