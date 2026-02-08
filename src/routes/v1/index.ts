import { Router } from "express";
import restaurantsRouter from "./restaurants";
import categoriesRouter from "./categories";
import subcategoriesRouter from "./subcategories";
import menuItemsRouter from "./menu-items";
import allergensRouter from "./allergens";
import sideDishesRouter from "./side-dishes";
import supplementsRouter from "./supplements";
import templatesRouter from "./templates";
import publicMenuRouter from "./public-menu";

const router = Router();

// ─── Admin routes (JWT required) ────────────────────────────────────────────

// Restaurant management
router.use("/restaurants", restaurantsRouter);

// Category management (nested under restaurant)
router.use("/restaurants/:restaurantId/categories", categoriesRouter);

// Subcategory management
// Create under a category:
router.use(
  "/restaurants/:restaurantId/categories/:categoryId/subcategories",
  subcategoriesRouter
);
// Update/delete/reorder directly:
router.use("/restaurants/:restaurantId/subcategories", subcategoriesRouter);

// Menu items
router.use("/restaurants/:restaurantId/menu-items", menuItemsRouter);

// Allergens
router.use("/restaurants/:restaurantId/allergens", allergensRouter);

// Side dishes
router.use("/restaurants/:restaurantId/side-dishes", sideDishesRouter);

// Supplements
router.use("/restaurants/:restaurantId/supplements", supplementsRouter);

// Templates
router.use("/restaurants/:restaurantId/templates", templatesRouter);

// ─── Public routes (no auth) ────────────────────────────────────────────────

// Public menu endpoint for widget
router.use("/menu", publicMenuRouter);

export default router;
