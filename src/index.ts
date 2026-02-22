import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

import menuRoutes from "./routes/menu";
import widgetRoutes from "./routes/widget";
import v1Routes from "./routes/v1";
import v2Routes from "./routes/v2";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { setupSwagger } from "./config/swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const startTime = Date.now();

// ─── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : undefined; // undefined = allow all

app.use(
  cors({
    origin: allowedOrigins || true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "X-API-Key",
      "ngrok-skip-browser-warning",
      "X-Requested-With",
      "Accept",
      "Origin"
    ],
    credentials: true,
  })
);

// ─── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Request logging ───────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Serve static files (widget.js, widget-test.html) ──────────────────────
app.use(express.static(path.join(__dirname, "../public")));

// ─── Swagger API Documentation ─────────────────────────────────────────────
setupSwagger(app);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status and basic information about the service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "adamenu-backend",
    version: "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/v1:
 *   description: Single-tenant API endpoints (backward compatibility)
 */
app.use("/api/v1", v1Routes);

/**
 * @swagger
 * /api/v2:
 *   description: Multi-tenant API endpoints - restaurant ID required
 */
app.use("/api/v2", v2Routes);

/**
 * @swagger
 * /api/menu:
 *   description: Legacy single-tenant menu endpoints for backward compatibility
 */
app.use("/api/menu", menuRoutes);

/**
 * @swagger
 * /api/widget:
 *   description: Widget-related endpoints for menu displays
 */
app.use("/api/widget", widgetRoutes);

// ─── Global error handler (must be last) ───────────────────────────────────
app.use(errorHandler);

// ─── Process-level error handling ──────────────────────────────────────────
process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  if (err.code === "EPIPE" || err.code === "ECONNRESET") {
    console.warn(`[WARN] ${err.code} — client disconnected, ignoring.`);
    return;
  }
  console.error("[FATAL] Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled rejection:", reason);
});

// ─── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍽️  AdaMenu backend running on http://localhost:${PORT}`);
  console.log(`   Health:    http://localhost:${PORT}/health`);
  console.log(`   API:       http://localhost:${PORT}/api/v1`);
  console.log(`   Widget:    http://localhost:${PORT}/widget-test.html`);
  console.log(`   📚 API Docs: http://localhost:${PORT}/api-docs`);
});

export default app;
