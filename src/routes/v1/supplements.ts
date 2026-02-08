import { Router, Request, Response } from "express";
import { requireAuth, requireRestaurantAccess } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { adminLimiter } from "../../middleware/rate-limit";
import { createSupplementSchema, updateSupplementSchema } from "../../validation/schemas";
import { getSupabase } from "../../services/supabase";

const router = Router({ mergeParams: true });

router.use(adminLimiter);
router.use(requireAuth);
router.use(requireRestaurantAccess);

// ─── GET /api/v1/restaurants/:restaurantId/supplements ──────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    let query = supabase
      .from("supplements")
      .select("*")
      .eq("restaurant_id", req.params.restaurantId)
      .order("name", { ascending: true });

    // Optional filter by subcategory
    const subcategoryId = req.query.subcategory_id as string | undefined;
    if (subcategoryId) {
      query = query.eq("subcategory_id", subcategoryId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── POST /api/v1/restaurants/:restaurantId/supplements ─────────────────────
router.post(
  "/",
  validate(createSupplementSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("supplements")
        .insert({
          ...req.body,
          restaurant_id: req.params.restaurantId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── PATCH /api/v1/restaurants/:restaurantId/supplements/:id ────────────────
router.patch(
  "/:id",
  validate(updateSupplementSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("supplements")
        .update(req.body)
        .eq("id", req.params.id)
        .eq("restaurant_id", req.params.restaurantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Supplement not found" });
        return;
      }

      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── DELETE /api/v1/restaurants/:restaurantId/supplements/:id ───────────────
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    const { error } = await supabase
      .from("supplements")
      .delete()
      .eq("id", req.params.id)
      .eq("restaurant_id", req.params.restaurantId);

    if (error) throw error;

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
