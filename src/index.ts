import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import restaurantRoutes from "./routes/restaurants";
import templateRoutes from "./routes/templates";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const startTime = Date.now();

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

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/v1/restaurants", restaurantRoutes);
app.use("/api/v1/restaurants/:restaurantId/templates", templateRoutes);

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AdaMenu backend running on http://localhost:${PORT}`);
});

export default app;
