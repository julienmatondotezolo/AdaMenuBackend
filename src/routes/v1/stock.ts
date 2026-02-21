import { Router, Request, Response } from "express";
import { requireAuth, requireRestaurantAccess } from "../../middleware/auth";
import { adminLimiter } from "../../middleware/rate-limit";
import { getSupabase } from "../../services/supabase";

const router = Router({ mergeParams: true });

router.use(adminLimiter);
// TODO: Add auth middleware when ready
// router.use(requireAuth);
// router.use(requireRestaurantAccess);

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/stock/products:
 *   get:
 *     summary: Get all products for stock management
 *     tags: [Stock Management]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 */
router.get("/products", async (req: Request, res: Response): Promise<void> => {
  try {
    // For now, return mock data until Supabase is configured
    const mockProducts = [
      {
        id: "prod-1",
        name: "San Marzano Tomatoes",
        category: "Vegetables",
        unit: "kg",
        current_quantity: 25,
        min_threshold: 5,
        max_threshold: 50,
        cost_per_unit: 4.50,
        supplier: "Italian Imports Ltd",
        last_updated: new Date().toISOString()
      },
      {
        id: "prod-2", 
        name: "Parmigiano Reggiano DOP",
        category: "Dairy",
        unit: "kg",
        current_quantity: 8,
        min_threshold: 2,
        max_threshold: 15,
        cost_per_unit: 32.00,
        supplier: "Cheese Masters",
        last_updated: new Date().toISOString()
      },
      {
        id: "prod-3",
        name: "Extra Virgin Olive Oil",
        category: "Condiments", 
        unit: "L",
        current_quantity: 12,
        min_threshold: 3,
        max_threshold: 20,
        cost_per_unit: 15.00,
        supplier: "Tuscany Oils",
        last_updated: new Date().toISOString()
      }
    ];

    res.json(mockProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch products" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/stock/products:
 *   post:
 *     summary: Add new product
 *     tags: [Stock Management]
 */
router.post("/products", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category, unit, current_quantity, min_threshold, max_threshold, cost_per_unit, supplier } = req.body;
    
    const newProduct = {
      id: `prod-${Date.now()}`,
      name,
      category,
      unit,
      current_quantity: Number(current_quantity),
      min_threshold: Number(min_threshold),
      max_threshold: Number(max_threshold), 
      cost_per_unit: Number(cost_per_unit),
      supplier,
      last_updated: new Date().toISOString()
    };

    // TODO: Save to database when Supabase is configured
    console.log("New product would be saved:", newProduct);
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to create product" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/stock/products/{productId}:
 *   put:
 *     summary: Update product quantity
 *     tags: [Stock Management]
 */
router.put("/products/:productId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { current_quantity, adjustment_reason } = req.body;
    
    // Create stock movement record
    const stockMovement = {
      id: `mov-${Date.now()}`,
      product_id: productId,
      quantity_change: Number(current_quantity),
      reason: adjustment_reason || "Manual adjustment",
      timestamp: new Date().toISOString(),
      user: "admin" // TODO: Get from auth
    };

    console.log("Stock movement would be saved:", stockMovement);
    
    res.json({ success: true, movement: stockMovement });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update product" });
  }
});

/**
 * @swagger  
 * /api/v1/restaurants/{restaurantId}/stock/history:
 *   get:
 *     summary: Get stock movement history
 *     tags: [Stock Management]
 */
router.get("/history", async (req: Request, res: Response): Promise<void> => {
  try {
    const mockHistory = [
      {
        id: "mov-1",
        product_name: "San Marzano Tomatoes",
        quantity_change: -5,
        previous_quantity: 30,
        new_quantity: 25,
        reason: "Used for pasta sauce",
        timestamp: "2026-02-16T10:30:00Z",
        user: "Chef Marco"
      },
      {
        id: "mov-2",
        product_name: "Parmigiano Reggiano DOP", 
        quantity_change: +3,
        previous_quantity: 5,
        new_quantity: 8,
        reason: "New delivery",
        timestamp: "2026-02-15T14:15:00Z",
        user: "Manager"
      }
    ];

    res.json(mockHistory);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch history" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/stock/analytics:
 *   get:
 *     summary: Get stock analytics and insights
 *     tags: [Stock Management]  
 */
router.get("/analytics", async (req: Request, res: Response): Promise<void> => {
  try {
    const mockAnalytics = {
      total_products: 3,
      low_stock_alerts: 0,
      total_inventory_value: 1347.50,
      top_usage: [
        { product: "San Marzano Tomatoes", usage_week: 15, trend: "up" },
        { product: "Olive Oil", usage_week: 8, trend: "stable" },
        { product: "Parmigiano", usage_week: 4, trend: "down" }
      ],
      monthly_summary: {
        month: "February 2026",
        purchases: 850.00,
        usage_value: 420.00,
        waste_value: 25.00
      }
    };

    res.json(mockAnalytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch analytics" });
  }
});

export default router;