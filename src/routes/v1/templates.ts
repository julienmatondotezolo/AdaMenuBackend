import { Router, Request, Response } from "express";
import { requireAuth, requireRestaurantAccess } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { adminLimiter } from "../../middleware/rate-limit";
import { createTemplateSchema, updateTemplateSchema } from "../../validation/schemas";
import { getSupabase } from "../../services/supabase";

const router = Router({ mergeParams: true });

router.use(adminLimiter);
router.use(requireAuth);
router.use(requireRestaurantAccess);

// ─── GET /api/v1/restaurants/:restaurantId/templates ────────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("menu_templates")
      .select("*")
      .eq("restaurant_id", req.params.restaurantId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET /api/v1/restaurants/:restaurantId/templates/:id ────────────────────
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("menu_templates")
      .select("*")
      .eq("id", req.params.id)
      .eq("restaurant_id", req.params.restaurantId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "NOT_FOUND", message: "Template not found" });
      return;
    }

    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── POST /api/v1/restaurants/:restaurantId/templates ───────────────────────
router.post(
  "/",
  validate(createTemplateSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("menu_templates")
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

// ─── PATCH /api/v1/restaurants/:restaurantId/templates/:id ──────────────────
router.patch(
  "/:id",
  validate(updateTemplateSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("menu_templates")
        .update(req.body)
        .eq("id", req.params.id)
        .eq("restaurant_id", req.params.restaurantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Template not found" });
        return;
      }

      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── PATCH /api/v1/restaurants/:restaurantId/templates/:id/set-default ───────
router.patch(
  "/:id/set-default",
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      // Unset any existing default for this restaurant
      const { error: unsetError } = await supabase
        .from("menu_templates")
        .update({ is_default: false })
        .eq("restaurant_id", req.params.restaurantId)
        .eq("is_default", true);

      if (unsetError) throw unsetError;

      // Set the specified template as default
      const { data, error } = await supabase
        .from("menu_templates")
        .update({ is_default: true })
        .eq("id", req.params.id)
        .eq("restaurant_id", req.params.restaurantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Template not found" });
        return;
      }

      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── DELETE /api/v1/restaurants/:restaurantId/templates/:id ─────────────────
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    const { error } = await supabase
      .from("menu_templates")
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
