import { Router, Request, Response } from "express";
import { requireAuth, requireRestaurantAccess, requireOwner } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { adminLimiter } from "../../middleware/rate-limit";
import { createRestaurantSchema, updateRestaurantSchema } from "../../validation/schemas";
import { getSupabase } from "../../services/supabase";

const router = Router();

router.use(adminLimiter);

// ─── POST /api/v1/restaurants ───────────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  validate(createRestaurantSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("restaurants")
        .select("id")
        .eq("slug", req.body.slug)
        .maybeSingle();

      if (existing) {
        res.status(409).json({
          error: "CONFLICT",
          message: `Restaurant with slug "${req.body.slug}" already exists`,
        });
        return;
      }

      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .insert(req.body)
        .select()
        .single();

      if (error) throw error;

      const { error: linkError } = await supabase
        .from("restaurant_users")
        .insert({
          user_id: req.auth!.userId,
          restaurant_id: restaurant.id,
          role: "owner",
        });

      if (linkError) {
        console.error("[restaurants] Failed to link owner:", linkError);
      }

      res.status(201).json({ data: restaurant });
    } catch (err: any) {
      console.error("[restaurants] Create error:", err.message);
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── GET /api/v1/restaurants/:restaurantId ──────────────────────────────────
router.get(
  "/:restaurantId",
  requireAuth,
  requireRestaurantAccess,
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", req.params.restaurantId)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Restaurant not found" });
        return;
      }

      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── PATCH /api/v1/restaurants/:restaurantId ────────────────────────────────
router.patch(
  "/:restaurantId",
  requireAuth,
  requireRestaurantAccess,
  requireOwner,
  validate(updateRestaurantSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      if (req.body.slug) {
        const { data: existing } = await supabase
          .from("restaurants")
          .select("id")
          .eq("slug", req.body.slug)
          .neq("id", req.params.restaurantId)
          .maybeSingle();

        if (existing) {
          res.status(409).json({
            error: "CONFLICT",
            message: `Slug "${req.body.slug}" is already taken`,
          });
          return;
        }
      }

      const { data, error } = await supabase
        .from("restaurants")
        .update(req.body)
        .eq("id", req.params.restaurantId)
        .select()
        .single();

      if (error) throw error;

      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── DELETE /api/v1/restaurants/:restaurantId ───────────────────────────────
router.delete(
  "/:restaurantId",
  requireAuth,
  requireRestaurantAccess,
  requireOwner,
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", req.params.restaurantId);

      if (error) throw error;

      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

export default router;
