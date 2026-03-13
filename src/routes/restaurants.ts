import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";

const AUTH_URL = process.env.AUTH_URL || "https://auth.adasystems.app";

const router = Router();

router.use(requireAuth);

// ─── GET /api/v1/restaurants ────────────────────────────────────────────────
// Proxies AdaAuth /owner/restaurants to fetch restaurants the user has access to
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Missing token" });
    return;
  }

  try {
    const authRes = await fetch(`${AUTH_URL}/owner/restaurants`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!authRes.ok) {
      res.status(authRes.status).json({ error: "AUTH_ERROR", message: "Failed to fetch restaurants from AdaAuth" });
      return;
    }

    const data = await authRes.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
