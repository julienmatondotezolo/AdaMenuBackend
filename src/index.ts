import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requireAuth } from "./middleware/auth";
import templateRoutes from "./routes/templates";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const startTime = Date.now();
const AUTH_URL = process.env.AUTH_URL || "https://auth.adasystems.app";

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : undefined;

app.use(
  cors({
    origin: allowedOrigins || true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// ─── Health ─────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "adamenu-backend",
    version: "2.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// ─── GET /api/v1/restaurants — proxy AdaAuth /owner/restaurants ─────────────
app.get("/api/v1/restaurants", requireAuth, async (req, res) => {
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
      res.status(authRes.status).json({ error: "AUTH_ERROR", message: "Failed to fetch restaurants" });
      return;
    }

    const data = await authRes.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── Templates ──────────────────────────────────────────────────────────────
app.use("/api/v1/restaurants/:restaurantId/templates", templateRoutes);

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AdaMenu backend running on http://localhost:${PORT}`);
});

export default app;
