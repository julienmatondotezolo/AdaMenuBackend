import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { getSupabase } from "../lib/supabase";

const router = Router();

// ─── POST /api/v1/menus/publish — Publish a menu for QR code access ─────────
// Requires auth. Stores a snapshot of menu data + template design.
router.post("/publish", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { menu_id, restaurant_id, title, menu_data, template_data } = req.body;

  if (!menu_id || !restaurant_id || !title || !menu_data || !template_data) {
    res.status(400).json({
      error: "BAD_REQUEST",
      message: "menu_id, restaurant_id, title, menu_data, and template_data are required",
    });
    return;
  }

  try {
    const supabase = getSupabase();

    // Upsert — update if already published, insert if new
    const { data, error } = await supabase
      .from("published_menus")
      .upsert(
        {
          id: menu_id,
          restaurant_id,
          title,
          menu_data,
          template_data,
          published_by: req.auth?.userId || null,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── DELETE /api/v1/menus/:menuId/unpublish — Remove published menu ─────────
router.delete("/:menuId/unpublish", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await getSupabase()
      .from("published_menus")
      .delete()
      .eq("id", req.params.menuId);

    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET /api/v1/menus/:menuId/publish-status — Check if published ──────────
router.get("/:menuId/publish-status", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
      .from("published_menus")
      .select("id, title, updated_at, menu_data")
      .eq("id", req.params.menuId)
      .maybeSingle();

    if (error) throw error;
    res.json({ published: !!data, data: data || null });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
