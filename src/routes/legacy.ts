import { Router, Request, Response } from "express";
import { getSupabaseAdmin } from "../lib/supabase";
import { mockCategories, mockAllergens, mockSideDishes, mockSupplements } from "../data/mock-data";

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
      console.warn("Supabase not configured, returning mock categories for development");
      res.json(mockCategories);
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", DEFAULT_RESTAURANT_ID)
      .order("position");

    if (error) {
      console.error("Error fetching categories:", error.message);
      console.warn("Returning mock categories due to database error");
      res.json(mockCategories);
      return;
    }

    res.json(data || []);
  } catch (error) {
    console.error("Unexpected error fetching categories:", error);
    console.warn("Returning mock categories due to unexpected error");
    res.json(mockCategories);
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
      console.warn("Supabase not configured, returning mock allergens for development");
      res.json(mockAllergens);
      return;
    }

    const { data, error } = await supabase
      .from("allergens")
      .select("*")
      .eq("restaurant_id", DEFAULT_RESTAURANT_ID)
      .order("name");

    if (error) {
      console.error("Error fetching allergens:", error.message);
      console.warn("Returning mock allergens due to database error");
      res.json(mockAllergens);
      return;
    }

    res.json(data || []);
  } catch (error) {
    console.error("Unexpected error fetching allergens:", error);
    console.warn("Returning mock allergens due to unexpected error");
    res.json(mockAllergens);
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
      console.warn("Supabase not configured, returning mock side dishes for development");
      res.json(mockSideDishes);
      return;
    }

    const { data, error } = await supabase
      .from("side_dishes")
      .select("*")
      .eq("restaurant_id", DEFAULT_RESTAURANT_ID)
      .order("name");

    if (error) {
      console.error("Error fetching side dishes:", error.message);
      console.warn("Returning mock side dishes due to database error");
      res.json(mockSideDishes);
      return;
    }

    res.json(data || []);
  } catch (error) {
    console.error("Unexpected error fetching side dishes:", error);
    console.warn("Returning mock side dishes due to unexpected error");
    res.json(mockSideDishes);
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
      console.warn("Supabase not configured, returning mock supplements for development");
      res.json(mockSupplements);
      return;
    }

    const { data, error } = await supabase
      .from("supplements")
      .select("*")
      .eq("restaurant_id", DEFAULT_RESTAURANT_ID)
      .order("name");

    if (error) {
      console.error("Error fetching supplements:", error.message);
      console.warn("Returning mock supplements due to database error");
      res.json(mockSupplements);
      return;
    }

    res.json(data || []);
  } catch (error) {
    console.error("Unexpected error fetching supplements:", error);
    console.warn("Returning mock supplements due to unexpected error");
    res.json(mockSupplements);
  }
});

export default router;