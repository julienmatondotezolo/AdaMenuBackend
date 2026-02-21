import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// Auth middleware — validates Supabase JWT and attaches user context
// ============================================================================

/**
 * Require authentication. Verifies the Supabase JWT from Authorization header
 * and attaches user info to req.auth.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Missing or invalid Authorization header. Expected: Bearer <token>",
    });
    return;
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({
      error: "SERVER_ERROR",
      message: "Supabase not configured",
    });
    return;
  }

  // Create a Supabase client with the user's JWT — this automatically
  // enforces RLS as the authenticated user
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  // Verify the token by calling getUser
  supabaseClient.auth
    .getUser(token)
    .then(({ data, error }) => {
      if (error || !data.user) {
        res.status(401).json({
          error: "UNAUTHORIZED",
          message: "Invalid or expired token",
        });
        return;
      }

      req.auth = {
        userId: data.user.id,
        email: data.user.email || "",
        restaurantId: null,
        role: null,
      };

      // Attach authenticated Supabase client for RLS-aware queries
      req.supabaseClient = supabaseClient;

      next();
    })
    .catch(() => {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token verification failed",
      });
    });
}

/**
 * Require that the authenticated user belongs to the restaurant specified
 * in the route params (:restaurantId). Must be used AFTER requireAuth.
 */
export function requireRestaurantAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.auth) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Not authenticated" });
    return;
  }

  const restaurantId = Array.isArray(req.params.restaurantId)
    ? req.params.restaurantId[0]
    : req.params.restaurantId;
  if (!restaurantId) {
    res.status(400).json({
      error: "BAD_REQUEST",
      message: "Missing restaurantId parameter",
    });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  // Use service key for this lookup to bypass RLS
  const adminClient = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : req.supabaseClient!;

  adminClient
    .from("restaurant_users")
    .select("role")
    .eq("user_id", req.auth.userId)
    .eq("restaurant_id", restaurantId)
    .single()
    .then(({ data, error }) => {
      if (error || !data) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "You do not have access to this restaurant",
        });
        return;
      }

      req.auth!.restaurantId = restaurantId;
      req.auth!.role = data.role as "owner" | "manager" | "staff";

      next();
    })
    .then(undefined, () => {
      res.status(500).json({
        error: "SERVER_ERROR",
        message: "Failed to verify restaurant access",
      });
    });
}

/**
 * Require owner role. Must be used AFTER requireRestaurantAccess.
 */
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (req.auth?.role !== "owner") {
    res.status(403).json({
      error: "FORBIDDEN",
      message: "Only restaurant owners can perform this action",
    });
    return;
  }
  next();
}
