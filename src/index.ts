import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import menuRoutes from "./routes/menu";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "https://adamenu.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser with 500MB limit
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// Routes
app.use("/api/menu", menuRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "adamenu-backend",
    timestamp: new Date().toISOString(),
  });
});

// EPIPE / ECONNRESET error handlers
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

app.listen(PORT, () => {
  console.log(`🍽️  AdaMenu backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export default app;
