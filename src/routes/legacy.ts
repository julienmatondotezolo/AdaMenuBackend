import { Router, Request, Response } from "express";

const router = Router();

// Legacy compatibility routes for old frontend

/**
 * Legacy route: /category/parents
 * Maps to: /restaurants/:restaurantId/categories
 */
router.get("/category/parents", async (req: Request, res: Response): Promise<void> => {
  // For now, return empty array for compatibility
  res.json([]);
});

/**
 * Legacy route: /allergen
 * Maps to: /restaurants/:restaurantId/allergens
 */
router.get("/allergen", async (req: Request, res: Response): Promise<void> => {
  // For now, return empty array for compatibility
  res.json([]);
});

/**
 * Legacy route: /sidedish
 * Maps to: /restaurants/:restaurantId/side-dishes
 */
router.get("/sidedish", async (req: Request, res: Response): Promise<void> => {
  // For now, return empty array for compatibility
  res.json([]);
});

export default router;