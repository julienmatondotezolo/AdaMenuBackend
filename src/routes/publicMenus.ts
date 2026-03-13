import { Router, Request, Response } from "express";
import { getSupabase } from "../lib/supabase";

const router = Router();

// ─── GET /api/v1/public/menus/:menuId — Public QR menu access ──────────────
// No authentication required. Returns the published menu snapshot.
router.get("/:menuId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
      .from("published_menus")
      .select("id, title, menu_data, template_data, updated_at")
      .eq("id", req.params.menuId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: "NOT_FOUND", message: "Menu not found or not published" });
      return;
    }

    res.json({
      data: {
        menu: {
          id: data.id,
          title: data.title,
          data: data.menu_data,
          updatedAt: data.updated_at,
        },
        template: data.template_data,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
