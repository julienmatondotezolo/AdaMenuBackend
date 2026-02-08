import { Router, Request, Response } from "express";
import { restaurants } from "../config/restaurants";
import { publicLimiter } from "../middleware/rate-limit";

const router = Router();

// Apply rate limiting to widget routes (public-facing)
router.use(publicLimiter);

// Simple in-memory cache
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const menuCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

/**
 * GET /api/widget/:slug/menu
 * Returns menu data + restaurant config for the widget
 */
router.get("/:slug/menu", async (req: Request, res: Response): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const config = restaurants[slug];

  if (!config) {
    res.status(404).json({ error: "Restaurant not found", slug });
    return;
  }

  try {
    // Check cache first
    const cacheKey = `menu:${slug}`;
    let menuData = getCached(cacheKey);

    if (!menuData) {
      // Fetch fresh menu data
      const response = await fetch(config.menuApiUrl);
      if (!response.ok) {
        throw new Error(`Menu API returned ${response.status}`);
      }
      menuData = await response.json();
      setCache(cacheKey, menuData);
      console.log(`[widget] Fetched fresh menu data for ${slug}`);
    } else {
      console.log(`[widget] Serving cached menu data for ${slug}`);
    }

    res.json({
      restaurant: config,
      menu: menuData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[widget] Error fetching menu for ${slug}:`, message);
    res.status(502).json({
      error: "Failed to fetch menu data",
      message,
    });
  }
});

/**
 * GET /api/widget/:slug/config
 * Returns just the restaurant config (theme, languages, etc.)
 */
router.get("/:slug/config", (req: Request, res: Response): void => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const config = restaurants[slug];

  if (!config) {
    res.status(404).json({ error: "Restaurant not found", slug });
    return;
  }

  // Return config without the menuApiUrl (internal detail)
  const { menuApiUrl, ...publicConfig } = config;
  res.json(publicConfig);
});

export default router;
