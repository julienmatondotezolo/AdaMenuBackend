import { Router, Request, Response } from "express";
import { getSupabaseAdmin } from "../lib/supabase";

const router = Router();

// Default restaurant for legacy compatibility (L'Osteria - paying customer)
const DEFAULT_RESTAURANT_ID = "losteria";

// Legacy compatibility routes for old frontend

/**
 * Legacy route: /category/parents
 * Maps to: /restaurants/:restaurantId/categories
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
 * Legacy route: /allergen
 * Maps to: /restaurants/:restaurantId/allergens
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
 * Legacy route: /sidedish
 * Maps to: /restaurants/:restaurantId/side-dishes
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
 * Legacy route: /supplement
 * Maps to: /restaurants/:restaurantId/supplements
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