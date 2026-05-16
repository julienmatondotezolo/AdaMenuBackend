import { Router, Request, Response } from "express";
import { getSupabase } from "../lib/supabase";

const router = Router();

// ─── GET /api/v1/legacy/allergens ───────────────────────────────────────────
// Public, no auth. Returns allergen assignments for the V1 (legacy) menu so
// the customer-facing menu (l-osteria.be/menu, ada.mindgen.app) can render
// allergen chips client-side. The V1 Java backend's Spring cache cannot
// round-trip populated AllergenResponse objects (no default constructor),
// so we expose the mapping out-of-band and merge in the frontend.
//
// Response shape:
//   {
//     "items": {
//       "<menu_item_uuid>": [
//         { "id": "<uuid>", "name": "gluten", "names": { "en": "...", "fr": "...", ... } },
//         ...
//       ]
//     }
//   }
//
// `name` is the lowercase English name (used as a key for client-side
// emoji/color metadata). `names` is the full i18n map.
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();

    const [linksRes, namesRes, allergensRes] = await Promise.all([
      supabase.from("menu_item_allergens").select("menu_item_id, allergen_id"),
      supabase.from("allergen_names").select("allergen_id, language, name"),
      supabase.from("allergens").select("id"),
    ]);

    if (linksRes.error) throw linksRes.error;
    if (namesRes.error) throw namesRes.error;
    if (allergensRes.error) throw allergensRes.error;

    type Allergen = { id: string; name: string; names: Record<string, string> };
    const byId: Record<string, Allergen> = {};
    for (const a of allergensRes.data || []) {
      byId[a.id] = { id: a.id, name: "", names: {} };
    }
    for (const n of namesRes.data || []) {
      const allergen = byId[n.allergen_id];
      if (!allergen) continue;
      allergen.names[n.language] = n.name;
      if (n.language === "en") allergen.name = n.name;
    }

    const items: Record<string, Allergen[]> = {};
    for (const link of linksRes.data || []) {
      const allergen = byId[link.allergen_id];
      if (!allergen) continue;
      (items[link.menu_item_id] ||= []).push(allergen);
    }
    for (const list of Object.values(items)) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.set("Cache-Control", "public, max-age=300");
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
