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

// Single-tenant database - no restaurant ID needed

async function buildMenuFromDatabase(): Promise<unknown> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('[public-menu] Supabase not configured');
    return [];
  }

  try {
    console.log('[public-menu] Querying L\'Osteria database with correct schema...');
    
    // Build multilingual name object from translations
    function buildNameObject(translations: any[] | null): any {
      const nameObj: any = {};
      translations?.forEach((trans: any) => {
        nameObj[trans.language] = trans.name;
      });
      return nameObj;
    }
    
    // Get top-level categories (main categories)
    const { data: topCategories, error: topError } = await supabase
      .from("categories")
      .select("id, hidden, order, display_order")
      .is("parent_category_id", null)
      .eq("hidden", false)
      .order("display_order", { ascending: true });

    if (topError) {
      console.error('[public-menu] Error fetching top categories:', topError);
      return [];
    }

    console.log(`[public-menu] Found ${topCategories?.length || 0} top-level categories`);

    const menuData = [];

    for (const category of topCategories || []) {
      // Get category names in all languages
      const { data: categoryNames } = await supabase
        .from("category_names")
        .select("language, name")
        .eq("category_id", category.id);

      // Get subcategories
      const { data: subCategories } = await supabase
        .from("categories")
        .select("id, hidden, order, display_order")
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

        // Get menu items for this subcategory
        const { data: menuItems } = await supabase
          .from("menu_items")
          .select("id, hidden, order, price, display_order")
          .eq("category_id", subCategory.id)
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

    console.log(`[public-menu] Built menu with ${menuData.length} categories, ${menuData.reduce((sum, cat) => sum + cat.subCategories.length, 0)} subcategories`);
    return menuData;
  } catch (error) {
    console.error('[public-menu] Error building menu from database:', error);
    return [];
  }
}

/**
 * @swagger
 * /api/v1/menu:
 *   get:
 *     summary: Get public menu for L'Osteria restaurant
 *     description: Returns the complete L'Osteria menu structure from Supabase database in the exact format expected by the frontend widget.
 *     tags: [Public Menu]
 *     responses:
 *       200:
 *         description: L'Osteria menu data retrieved successfully from database
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
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  
  try {
    // Check cache first
    const cacheKey = 'losteria-menu-database';
    const cached = getCached(cacheKey);
    if (cached) {
      console.log('[public-menu] Serving cached menu from database');
      res.json(cached);
      return;
    }

    // Build menu from Supabase database
    const menuData = await buildMenuFromDatabase();
    
    // Cache the response
    setCache(cacheKey, menuData);
    
    console.log('[public-menu] Serving fresh menu from database, cached for', CACHE_TTL_MS / 1000, 'seconds');
    res.json(menuData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[public-menu] Error loading L'Osteria menu from database:", message);
    res.status(500).json({ 
      error: "SERVER_ERROR", 
      message: "Failed to load menu data from database" 
    });
  }
});

export default router;
