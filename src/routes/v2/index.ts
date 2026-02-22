import { Router } from "express";
import { publicLimiter } from "../../middleware/rate-limit";
import { getSupabaseAdmin } from "../../lib/supabase";

const router = Router();

// Simple in-memory cache for public menu responses
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const menuCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function getCached(key: string): unknown | null {
  const entry = menuCache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete menuCache[key];
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown): void {
  menuCache[key] = { data, timestamp: Date.now() };
}

async function buildMenuFromDatabase(restaurantId: string): Promise<unknown> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('[v2-public-menu] Supabase not configured');
    return [];
  }

  try {
    console.log(`[v2-public-menu] Querying database for restaurant: ${restaurantId} (resolved to: ${actualRestaurantId})`);
    
    // Build multilingual name object from translations
    function buildNameObject(translations: any[] | null): any {
      const nameObj: any = {};
      translations?.forEach((trans: any) => {
        nameObj[trans.language] = trans.name;
      });
      return nameObj;
    }
    
    // First, try to find the restaurant by slug or ID
    let actualRestaurantId = restaurantId;
    
    if (restaurantId === 'losteria') {
      // For L'Osteria, use the known UUID
      actualRestaurantId = 'c1cbea71-ece5-4d63-bb12-fe06b03d1140';
    } else {
      // Try to lookup restaurant by slug
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("slug", restaurantId)
        .single();
      
      if (restaurant) {
        actualRestaurantId = restaurant.id;
      }
    }

    // Get top-level categories for the specific restaurant
    const { data: topCategories, error: topError } = await supabase
      .from("categories")
      .select("id, hidden, order, display_order")
      .eq("restaurant_id", actualRestaurantId)
      .is("parent_category_id", null)
      .eq("hidden", false)
      .order("display_order", { ascending: true });

    if (topError) {
      console.error('[v2-public-menu] Error fetching top categories:', topError);
      return [];
    }

    console.log(`[v2-public-menu] Found ${topCategories?.length || 0} top-level categories for restaurant ${restaurantId}`);

    const menuData = [];

    for (const category of topCategories || []) {
      // Get category names in all languages
      const { data: categoryNames } = await supabase
        .from("category_names")
        .select("language, name")
        .eq("category_id", category.id);

      // Get subcategories for this restaurant
      const { data: subCategories } = await supabase
        .from("categories")
        .select("id, hidden, order, display_order")
        .eq("restaurant_id", actualRestaurantId)
        .eq("parent_category_id", category.id)
        .eq("hidden", false)
        .order("display_order", { ascending: true });

      const subCategoriesData = [];

      for (const subCategory of subCategories || []) {
        // Get subcategory names
        const { data: subCategoryNames } = await supabase
          .from("category_names")
          .select("language, name")
          .eq("category_id", subCategory.id);

        // Get menu items for this subcategory and restaurant
        const { data: menuItems } = await supabase
          .from("menu_items")
          .select("id, hidden, order, price, display_order")
          .eq("category_id", subCategory.id)
          .eq("restaurant_id", actualRestaurantId)
          .eq("hidden", false)
          .order("display_order", { ascending: true });

        const menuItemsData = [];

        for (const menuItem of menuItems || []) {
          // Get menu item names
          const { data: itemNames } = await supabase
            .from("menu_item_names")
            .select("language, name")
            .eq("menu_item_id", menuItem.id);

          // Get menu item descriptions
          const { data: itemDescriptions } = await supabase
            .from("menu_item_descriptions")
            .select("language, description")
            .eq("menu_item_id", menuItem.id);

          // Build descriptions object with empty strings as fallback
          const descriptions = buildNameObject(itemDescriptions?.map(desc => ({ 
            language: desc.language, 
            name: desc.description || "" 
          })));
          
          // Ensure all languages have empty string fallback
          const standardDescriptions = {
            en: descriptions.en || "",
            it: descriptions.it || "",
            fr: descriptions.fr || "",
            nl: descriptions.nl || ""
          };

          menuItemsData.push({
            id: menuItem.id,
            names: buildNameObject(itemNames),
            descriptions: standardDescriptions,
            price: menuItem.price,
            allergens: [], // TODO: Add allergen relationships if needed
            sideDishes: [], // TODO: Add side dishes if needed
            supplements: [], // TODO: Add supplements if needed
            hidden: false,
            order: menuItem.display_order || menuItem.order || 1
          });
        }

        subCategoriesData.push({
          id: subCategory.id,
          names: buildNameObject(subCategoryNames),
          menuItems: menuItemsData,
          hidden: false,
          order: subCategory.display_order || subCategory.order || 1
        });
      }

      menuData.push({
        id: category.id,
        names: buildNameObject(categoryNames),
        subCategories: subCategoriesData,
        hidden: false,
        order: category.display_order || category.order || 1
      });
    }

    console.log(`[v2-public-menu] Built menu for restaurant ${restaurantId} (${actualRestaurantId}) with ${menuData.length} categories`);
    return menuData;
  } catch (error) {
    console.error('[v2-public-menu] Error building menu from database:', error);
    return [];
  }
}

// ─── V2 Public routes (multi-tenant, restaurant ID required) ───────────────

/**
 * @swagger
 * /api/v2/restaurants/{restaurantId}/menu:
 *   get:
 *     summary: Get public menu for a specific restaurant (V2 - Multi-tenant)
 *     description: Returns the complete menu structure for the specified restaurant from Supabase database.
 *     tags: [Public Menu V2]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The restaurant ID or slug
 *     responses:
 *       200:
 *         description: Restaurant menu data retrieved successfully
 *       400:
 *         description: Restaurant ID is required
 *       500:
 *         description: Server error
 */
router.get("/restaurants/:restaurantId/menu", publicLimiter, async (req, res) => {
  const restaurantId = req.params.restaurantId;
  
  if (!restaurantId) {
    return res.status(400).json({ 
      error: "BAD_REQUEST", 
      message: "Restaurant ID is required" 
    });
  }

  try {
    // Check cache first
    const cacheKey = `restaurant-${restaurantId}-menu-database-v2`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[v2-public-menu] Serving cached menu for restaurant ${restaurantId}`);
      return res.json(cached);
    }

    // Build menu from Supabase database
    const menuData = await buildMenuFromDatabase(restaurantId);
    
    // Cache the response
    setCache(cacheKey, menuData);
    
    console.log(`[v2-public-menu] Serving fresh menu for restaurant ${restaurantId}, cached for ${CACHE_TTL_MS / 1000} seconds`);
    res.json(menuData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[v2-public-menu] Error loading menu for restaurant ${restaurantId}:`, message);
    res.status(500).json({ 
      error: "SERVER_ERROR", 
      message: "Failed to load menu data from database" 
    });
  }
});

// Legacy endpoint for backward compatibility (redirects to require restaurant ID)
router.get("/menu", (req, res) => {
  res.status(400).json({
    error: "BAD_REQUEST",
    message: "V2 API requires restaurant ID. Use /api/v2/restaurants/{restaurantId}/menu instead",
    example: "/api/v2/restaurants/losteria/menu"
  });
});

export default router;