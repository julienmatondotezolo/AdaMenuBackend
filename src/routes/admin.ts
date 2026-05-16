import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { getSupabase } from "../lib/supabase";

const router = Router();

router.use(requireAuth, requireAdmin);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── PATCH /api/v1/admin/menus/:menuId/restaurant ───────────────────────────
// Move a menu (and its categories + items) to a different restaurant.
// Blocked if the menu is currently published.
router.patch("/menus/:menuId/restaurant", async (req: Request, res: Response): Promise<void> => {
  const menuId = String(req.params.menuId);
  const { restaurant_id } = req.body ?? {};

  if (!UUID_RE.test(menuId)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "menuId must be a UUID" });
    return;
  }
  if (typeof restaurant_id !== "string" || !UUID_RE.test(restaurant_id)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "restaurant_id must be a UUID" });
    return;
  }

  const supabase = getSupabase();

  try {
    const { data: menuRow, error: menuErr } = await supabase
      .from("menus")
      .select("id, restaurant_id")
      .eq("id", menuId)
      .single();

    if (menuErr || !menuRow) {
      res.status(404).json({ error: "NOT_FOUND", message: "Menu not found" });
      return;
    }

    if (menuRow.restaurant_id === restaurant_id) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Menu already belongs to this restaurant" });
      return;
    }

    const { data, error } = await supabase.rpc("admin_reassign_menu", {
      p_menu_id: menuId,
      p_new_restaurant_id: restaurant_id,
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("MENU_PUBLISHED")) {
        res.status(409).json({ error: "MENU_PUBLISHED", message: "Unpublish the menu before reassigning it" });
        return;
      }
      if (msg.includes("MENU_NOT_FOUND")) {
        res.status(404).json({ error: "NOT_FOUND", message: "Menu not found" });
        return;
      }
      if (msg.includes("RESTAURANT_NOT_FOUND")) {
        res.status(404).json({ error: "NOT_FOUND", message: "Target restaurant not found" });
        return;
      }
      throw error;
    }

    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
