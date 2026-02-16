import { Router, Request, Response } from "express";
import { publicLimiter } from "../../middleware/rate-limit";
import { getSupabase } from "../../services/supabase";

const router = Router();

router.use(publicLimiter);

// Simple in-memory cache for public menu responses
interface CacheEntry {
  data: Record<string, unknown>;
  timestamp: number;
}

const menuCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function getCached(key: string): Record<string, unknown> | null {
  const entry = menuCache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete menuCache[key];
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: Record<string, unknown>): void {
  menuCache[key] = { data, timestamp: Date.now() };
}

/**
 * @swagger
 * /api/v1/menu:
 *   get:
 *     summary: Get public menu for restaurant
 *     description: Returns the complete menu structure for a restaurant, including categories, subcategories, menu items, allergens, and side dishes. This endpoint is used by the menu widget and public displays.
 *     tags: [Public Menu]
 *     parameters:
 *       - in: query
 *         name: restaurant
 *         schema:
 *           type: string
 *         required: false
 *         description: Restaurant slug identifier (defaults to 'losteria' for development)
 *         example: losteria
 *     responses:
 *       200:
 *         description: Menu data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicMenu'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const slug = req.query.restaurant as string || "losteria"; // Default to losteria for dev

  if (!slug) {
    res.status(400).json({
      error: "BAD_REQUEST",
      message: "Missing required query parameter: restaurant (slug)",
    });
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.warn("Supabase not configured, returning empty menu");
    const emptyResponse = {
      restaurant: {
        name: slug,
        slug: slug,
        logo_url: null,
        primary_color: "#000000",
        accent_color: "#666666",
        font_family: "Arial, sans-serif",
        languages: ["en"],
        default_language: "en",
        last_updated_at: new Date().toISOString(),
      },
      categories: [],
    };
    res.json(emptyResponse);
    return;
  }

  try {
    // Check cache first
    const cacheKey = `menu:${slug}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // 1. Get restaurant by slug
    const { data: restaurant, error: restError } = await supabase
      .from("restaurants")
      .select(
        "id, name, slug, logo_url, primary_color, accent_color, font_family, languages, default_language"
      )
      .eq("slug", slug)
      .is("deleted_at", null)
      .single();

    if (restError || !restaurant) {
      console.warn(`Restaurant "${slug}" not found, returning empty menu`);
      // Return empty menu structure instead of error for development
      const emptyResponse = {
        restaurant: {
          name: slug,
          slug: slug,
          logo_url: null,
          primary_color: "#000000",
          accent_color: "#666666",
          font_family: "Arial, sans-serif",
          languages: ["en"],
          default_language: "en",
          last_updated_at: new Date().toISOString(),
        },
        categories: [],
      };
      res.json(emptyResponse);
      return;
    }

    // 2. Get categories with subcategories, items, and all relations
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select(`
        id, name, icon, sort_order,
        subcategories (
          id, name, sort_order, visible,
          menu_items (
            id, name, description, price, image_url, sort_order, available,
            menu_item_allergens ( allergen:allergens(id, name, icon) ),
            menu_item_side_dishes ( side_dish:side_dishes(id, name, price) ),
            menu_item_supplements ( supplement:supplements(id, name, price) )
          )
        )
      `)
      .eq("restaurant_id", restaurant.id)
      .eq("visible", true)
      .order("sort_order", { ascending: true });

    if (catError) throw catError;

    // 3. Transform the nested data into the public response shape
    // Track last update time across all items for "last updated" display
    let lastUpdatedAt: string | null = null;

    const transformedCategories = (categories || []).map((cat: Record<string, unknown>) => ({
      id: cat.id as string,
      name: cat.name as Record<string, string>,
      icon: cat.icon as string | null,
      sort_order: cat.sort_order as number,
      subcategories: ((cat.subcategories as Record<string, unknown>[]) || [])
        .filter((sub) => sub.visible !== false)
        .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
        .map((sub) => ({
          id: sub.id as string,
          name: sub.name as Record<string, string>,
          sort_order: sub.sort_order as number,
          items: ((sub.menu_items as Record<string, unknown>[]) || [])
            .filter((item) => {
              // Filter out unavailable items AND currently 86'd items
              if (item.available === false) return false;
              if ((item as any).is_86d === true) return false;
              if ((item as any).deleted_at) return false;
              return true;
            })
            .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
            .map((item) => {
              // Track most recent update for "last updated" timestamp
              const updatedAt = (item as any).updated_at as string | undefined;
              if (updatedAt && (!lastUpdatedAt || updatedAt > lastUpdatedAt)) {
                lastUpdatedAt = updatedAt;
              }

              return {
                id: item.id as string,
                name: item.name as Record<string, string>,
                description: item.description as Record<string, string>,
                price: item.price as number,
                image_url: item.image_url as string | null,
                allergens: ((item.menu_item_allergens as Record<string, unknown>[]) || [])
                  .map((j) => j.allergen)
                  .filter(Boolean),
                side_dishes: ((item.menu_item_side_dishes as Record<string, unknown>[]) || [])
                  .map((j) => j.side_dish)
                  .filter(Boolean),
                supplements: ((item.menu_item_supplements as Record<string, unknown>[]) || [])
                  .map((j) => j.supplement)
                  .filter(Boolean),
              };
            }),
        })),
    }));

    const response = {
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        primary_color: restaurant.primary_color,
        accent_color: restaurant.accent_color,
        font_family: restaurant.font_family,
        languages: restaurant.languages,
        default_language: restaurant.default_language,
        last_updated_at: lastUpdatedAt || new Date().toISOString(),
      },
      categories: transformedCategories,
    };

    // Cache the response
    setCache(cacheKey, response);

    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[public-menu] Error:", message);
    res.status(500).json({ error: "SERVER_ERROR", message });
  }
});

export default router;
