import { Router, Request, Response } from "express";
import { requireAuth, requireRestaurantAccess } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { adminLimiter } from "../../middleware/rate-limit";
import { createAllergenSchema, updateAllergenSchema } from "../../validation/schemas";
import { getSupabase } from "../../services/supabase";

const router = Router({ mergeParams: true });

router.use(adminLimiter);
router.use(requireAuth);
router.use(requireRestaurantAccess);

// ─── GET /api/v1/restaurants/:restaurantId/allergens ────────────────────────
// Returns both EU standard allergens (restaurant_id IS NULL) and custom ones.
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    // Fetch EU standard allergens + restaurant-specific
    const { data: euAllergens, error: euError } = await supabase
      .from("allergens")
      .select("*")
      .is("restaurant_id", null)
      .eq("is_eu_standard", true);

    if (euError) throw euError;

    const { data: customAllergens, error: customError } = await supabase
      .from("allergens")
      .select("*")
      .eq("restaurant_id", req.params.restaurantId);

    if (customError) throw customError;

    res.json({ data: [...(euAllergens || []), ...(customAllergens || [])] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── POST /api/v1/restaurants/:restaurantId/allergens ───────────────────────
router.post(
  "/",
  validate(createAllergenSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("allergens")
        .insert({
          ...req.body,
          restaurant_id: req.params.restaurantId,
          is_eu_standard: false,
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

// ─── PATCH /api/v1/restaurants/:restaurantId/allergens/:id ──────────────────
router.patch(
  "/:id",
  validate(updateAllergenSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      // Don't allow editing EU standard allergens
      const { data: existing } = await supabase
        .from("allergens")
        .select("is_eu_standard")
        .eq("id", req.params.id)
        .single();

      if (existing?.is_eu_standard) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "EU standard allergens cannot be modified",
        });
        return;
      }

      const { data, error } = await supabase
        .from("allergens")
        .update(req.body)
        .eq("id", req.params.id)
        .eq("restaurant_id", req.params.restaurantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Allergen not found" });
        return;
      }

      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── DELETE /api/v1/restaurants/:restaurantId/allergens/:id ─────────────────
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    // Don't allow deleting EU standard allergens
    const { data: existing } = await supabase
      .from("allergens")
      .select("is_eu_standard")
      .eq("id", req.params.id)
      .single();

    if (existing?.is_eu_standard) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: "EU standard allergens cannot be deleted",
      });
      return;
    }

    const { error } = await supabase
      .from("allergens")
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
