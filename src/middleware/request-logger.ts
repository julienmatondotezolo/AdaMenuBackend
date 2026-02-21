import { Request, Response, NextFunction } from "express";

/**
 * Lightweight request logger middleware.
 * Logs method, URL, status, and response time for every request.
 * Skips health check pings in production to reduce noise.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip health check logging in production
  if (process.env.NODE_ENV === "production" && req.path === "/health") {
    next();
    return;
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor =
      status >= 500 ? "❌" : status >= 400 ? "⚠️" : status >= 300 ? "↪️" : "✅";

    console.log(
      `${statusColor} ${req.method} ${req.originalUrl || req.url} → ${status} (${duration}ms)`
    );
  });

  next();
}
