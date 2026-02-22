import { Router, Request, Response } from "express";
import { publicLimiter } from "../../middleware/rate-limit";
import { getSupabaseAdmin } from "../../lib/supabase";

const router = Router();

router.use(publicLimiter);

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
    console.log(`[v2-public-menu] Querying database for restaurant: ${restaurantId}`);
    
    // Build multilingual name object from translations
    function buildNameObject(translations: any[] | null): any {
      const nameObj: any = {};
      translations?.forEach((trans: any) => {
        nameObj[trans.language] = trans.name;
      });
      return nameObj;
    }
    
    // Get top-level categories for the specific restaurant
    const { data: topCategories, error: topError } = await supabase
      .from("categories")
      .select("id, hidden, order, display_order")
      .eq("restaurant_id", restaurantId)
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
        .eq("restaurant_id", restaurantId)
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
          .eq("restaurant_id", restaurantId)
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

    console.log(`[v2-public-menu] Built menu for restaurant ${restaurantId} with ${menuData.length} categories`);
    return menuData;
  } catch (error) {
    console.error('[v2-public-menu] Error building menu from database:', error);
    return [];
  }
}

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
 *         description: The restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant menu data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   names:
 *                     type: object
 *                     properties:
 *                       en:
 *                         type: string
 *                       it:
 *                         type: string
 *                       fr:
 *                         type: string
 *                       nl:
 *                         type: string
 *                   subCategories:
 *                     type: array
 *                   hidden:
 *                     type: boolean
 *                   order:
 *                     type: number
 *       404:
 *         description: Restaurant not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const restaurantId = req.params.restaurantId;
  
  if (!restaurantId) {
    res.status(400).json({ 
      error: "BAD_REQUEST", 
      message: "Restaurant ID is required" 
    });
    return;
  }

  try {
    // Check cache first
    const cacheKey = `restaurant-${restaurantId}-menu-database`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[v2-public-menu] Serving cached menu for restaurant ${restaurantId}`);
      res.json(cached);
      return;
    }

    // Build menu from Supabase database
    const menuData = await buildMenuFromDatabase(restaurantId);
    
    // Cache the response
    setCache(cacheKey, menuData);
    
    console.log(`[v2-public-menu] Serving fresh menu for restaurant ${restaurantId}, cached for ${CACHE_TTL_MS / 1000} seconds`);
    res.json(menuData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[v2-public-menu] Error loading menu for restaurant ${restaurantId}:`, message);
    res.status(500).json({ 
      error: "SERVER_ERROR", 
      message: "Failed to load menu data from database" 
    });
  }
});

export default router;