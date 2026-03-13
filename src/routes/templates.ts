import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { getSupabase } from "../lib/supabase";

const router = Router({ mergeParams: true });

router.use(requireAuth);

// ─── GET /api/v1/restaurants/:restaurantId/templates ────────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
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

// ─── GET /api/v1/restaurants/:restaurantId/templates/default ────────────────
router.get("/default", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
      .from("menu_templates")
      .select("*")
      .eq("restaurant_id", req.params.restaurantId)
      .eq("is_default", true)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "NOT_FOUND", message: "No default template" });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET /api/v1/restaurants/:restaurantId/templates/:id ────────────────────
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
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

// ─── POST /api/v1/restaurants/:restaurantId/templates (admin only) ──────────
router.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, description, thumbnail, project_json, is_default, published_by } = req.body;

  if (!name || !project_json) {
    res.status(400).json({ error: "BAD_REQUEST", message: "name and project_json are required" });
    return;
  }

  try {
    const supabase = getSupabase();
    const restaurantId = req.params.restaurantId;

    // If setting as default, unset existing default first
    if (is_default) {
      await supabase
        .from("menu_templates")
        .update({ is_default: false })
        .eq("restaurant_id", restaurantId)
        .eq("is_default", true);
    }

    const { data, error } = await supabase
      .from("menu_templates")
      .insert({
        restaurant_id: restaurantId,
        name,
        description: description || null,
        thumbnail: thumbnail || null,
        project_json,
        is_default: is_default || false,
        published_by: published_by || req.auth?.userId || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── PATCH /api/v1/restaurants/:restaurantId/templates/:id (admin only) ─────
router.patch("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
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
});

// ─── PATCH set-default (admin only) ─────────────────────────────────────────
router.patch("/:id/set-default", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const restaurantId = req.params.restaurantId;

    await supabase
      .from("menu_templates")
      .update({ is_default: false })
      .eq("restaurant_id", restaurantId)
      .eq("is_default", true);

    const { data, error } = await supabase
      .from("menu_templates")
      .update({ is_default: true })
      .eq("id", req.params.id)
      .eq("restaurant_id", restaurantId)
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
});

// ─── DELETE /api/v1/restaurants/:restaurantId/templates/:id (admin only) ────
router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await getSupabase()
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
