import { Request, Response, NextFunction } from "express";

/**
 * Global error handler — catches unhandled errors in route handlers.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[ERROR]", err.message, err.stack);

  const supaErr = err as any;
  if (supaErr.code === "PGRST116") {
    res.status(404).json({
      error: "NOT_FOUND",
      message: "Resource not found",
    });
    return;
  }

  if (supaErr.code === "23505") {
    res.status(409).json({
      error: "CONFLICT",
      message: "A resource with this identifier already exists",
      details: supaErr.details || supaErr.message,
    });
    return;
  }

  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
}
