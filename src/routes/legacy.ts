import { Router, Request, Response } from "express";
import { getSupabaseAdmin } from "../lib/supabase";

const router = Router();

// Default restaurant for legacy compatibility (L'Osteria - paying customer)
const DEFAULT_RESTAURANT_ID = "losteria";

// Legacy compatibility routes for old frontend

/**
 * @swagger
 * /api/v1/category/parents:
 *   get:
 *     summary: Get categories (Legacy API)
 *     description: Legacy endpoint that returns categories for the default restaurant (L'Osteria). Maintained for backward compatibility.
 *     tags: [Legacy API]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get("/category/parents", async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.warn("Supabase not configured, returning empty categories");
      res.json([]);
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", DEFAULT_RESTAURANT_ID)
      .order("position");

    if (error) {
      console.error("Error fetching categories:", error.message);
      console.warn("Returning empty categories array due to database error");
      res.json([]);
      return;
    }

    res.json(data || []);
  } catch (error) {
    console.error("Unexpected error fetching categories:", error);
    console.warn("Returning empty categories array due to unexpected error");
    res.json([]);
  }
});

/**
 * @swagger
 * /api/v1/allergen:
 *   get:
 *     summary: Get allergens (Legacy API)
 *     description: Legacy endpoint that returns allergens for the default restaurant. Maintained for backward compatibility.
 *     tags: [Legacy API]
 *     responses:
 *       200:
 *         description: List of allergens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Allergen'
 */
router.get("/allergen", async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.warn("Supabase not configured, returning empty allergens");
      res.json([]);
      return;
    }

    const { data, error } = await supabase
      .from("allergens")
      .select("*")
      .eq("restaurant_id", DEFAULT_RESTAURANT_ID)
      .order("name");

    if (error) {
      console.error("Error fetching allergens:", error.message);
      console.warn("Returning empty allergens array due to database error");
      res.json([]);
      return;
    }

    res.json(data || []);
  } catch (error) {
    console.error("Unexpected error fetching allergens:", error);
    console.warn("Returning empty allergens array due to unexpected error");
    res.json([]);
  }
});

/**
 * @swagger
 * /api/v1/sidedish:
 *   get:
 *     summary: Get side dishes (Legacy API)
 *     description: Legacy endpoint that returns side dishes for the default restaurant. Maintained for backward compatibility.
 *     tags: [Legacy API]
 *     responses:
 *       200:
 *         description: List of side dishes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/sidedish", async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.warn("Supabase not configured, returning empty side dishes");
      res.json([]);
      return;
    }

    const { data, error } = await supabase
      .from("side_dishes")
      .select("*")
      .eq("restaurant_id", DEFAULT_RESTAURANT_ID)
      .order("name");

    if (error) {
      console.error("Error fetching side dishes:", error.message);
      console.warn("Returning empty side dishes array due to database error");
      res.json([]);
      return;
    }

    res.json(data || []);
  } catch (error) {
    console.error("Unexpected error fetching side dishes:", error);
    console.warn("Returning empty side dishes array due to unexpected error");
    res.json([]);
  }
});

/**
 * @swagger
 * /api/v1/supplement:
 *   get:
 *     summary: Get supplements (Legacy API)
 *     description: Legacy endpoint that returns supplements for the default restaurant. Maintained for backward compatibility.
 *     tags: [Legacy API]
 *     responses:
 *       200:
 *         description: List of supplements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/supplement", async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.warn("Supabase not configured, returning empty supplements");
      res.json([]);
      return;
    }

    const { data, error } = await supabase
      .from("supplements")
      .select("*")
      .eq("restaurant_id", DEFAULT_RESTAURANT_ID)
      .order("name");

    if (error) {
      console.error("Error fetching supplements:", error.message);
      console.warn("Returning empty supplements array due to database error");
      res.json([]);
      return;
    }

    res.json(data || []);
  } catch (error) {
    console.error("Unexpected error fetching supplements:", error);
    console.warn("Returning empty supplements array due to unexpected error");
    res.json([]);
  }
});

export default router;