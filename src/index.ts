import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { requireAuth } from "./middleware/auth";
import templateRoutes from "./routes/templates";
import builtInTemplateRoutes from "./routes/builtInTemplates";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5006;
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

// ─── Swagger ─────────────────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Health ─────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "adamenu-backend",
    version: "2.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// ─── GET /api/v1/restaurants — fetch from AdaAuth /auth/profile ──────────────
app.get("/api/v1/restaurants", requireAuth, async (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Missing token" });
    return;
  }

  try {
    const authRes = await fetch(`${AUTH_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!authRes.ok) {
      res.status(authRes.status).json({ error: "AUTH_ERROR", message: "Failed to fetch profile" });
      return;
    }

    const profile = await authRes.json();
    const restaurants = (profile.user_restaurant_access || []).map((access: any) => ({
      id: access.restaurants?.id,
      slug: access.restaurants?.slug,
      name: access.restaurants?.name,
      role: access.role,
    })).filter((r: any) => r.id);

    res.json({ restaurants });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET /api/v1/templates/publish-status?name=... ──────────────────────────
// Returns which restaurants have this template published and their default status
app.get("/api/v1/templates/publish-status", requireAuth, async (req, res) => {
  const name = req.query.name as string;
  if (!name) {
    res.status(400).json({ error: "BAD_REQUEST", message: "name query param required" });
    return;
  }

  try {
    const { getSupabase } = await import("./lib/supabase");
    const { data, error } = await getSupabase()
      .from("menu_templates")
      .select("id, restaurant_id, is_default, updated_at")
      .eq("name", name);

    if (error) throw error;

    const status: Record<string, { id: string; is_default: boolean; updated_at: string }> = {};
    for (const row of data || []) {
      status[row.restaurant_id] = {
        id: row.id,
        is_default: row.is_default,
        updated_at: row.updated_at,
      };
    }
    res.json({ status });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── Built-in templates (global) ────────────────────────────────────────────
app.use("/api/v1/built-in-templates", builtInTemplateRoutes);

// ─── Templates (per-restaurant, published) ──────────────────────────────────
app.use("/api/v1/restaurants/:restaurantId/templates", templateRoutes);

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AdaMenu backend running on http://localhost:${PORT}`);
});

export default app;
