import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { getSupabase } from "../lib/supabase";

const router = Router();

router.use(requireAuth);

// ─── GET /api/v1/built-in-templates ─────────────────────────────────────────
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
      .from("built_in_templates")
      .select("*")
      .order("name");

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET /api/v1/built-in-templates/:id ─────────────────────────────────────
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
      .from("built_in_templates")
      .select("*")
      .eq("id", req.params.id)
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

// ─── PATCH /api/v1/built-in-templates/:id (admin only) ─────────────────────
router.patch("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, description, thumbnail, format, orientation, colors, fonts, spacing, page_variants } = req.body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (thumbnail !== undefined) updates.thumbnail = thumbnail;
  if (format !== undefined) updates.format = format;
  if (orientation !== undefined) updates.orientation = orientation;
  if (colors !== undefined) updates.colors = colors;
  if (fonts !== undefined) updates.fonts = fonts;
  if (spacing !== undefined) updates.spacing = spacing;
  if (page_variants !== undefined) updates.page_variants = page_variants;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "BAD_REQUEST", message: "No fields to update" });
    return;
  }

  // Bump version on every edit
  try {
    const supabase = getSupabase();

    // Get current version
    const { data: current } = await supabase
      .from("built_in_templates")
      .select("version")
      .eq("id", req.params.id)
      .single();

    if (!current) {
      res.status(404).json({ error: "NOT_FOUND", message: "Template not found" });
      return;
    }

    updates.version = (current.version || 1) + 1;

    const { data, error } = await supabase
      .from("built_in_templates")
      .update(updates)
      .eq("id", req.params.id)
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

export default router;
