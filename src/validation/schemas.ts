import { z } from "zod";

// ============================================================================
// Shared schemas
// ============================================================================

/** Multi-language text: at least one language required */
export const multiLangTextSchema = z
  .record(z.string(), z.string())
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one language must be provided",
  });

/** Optional multi-language text */
export const optionalMultiLangTextSchema = z
  .record(z.string(), z.string())
  .optional();

/** UUID */
export const uuidSchema = z.string().uuid();

/** Reorder request */
export const reorderSchema = z.object({
  order: z.array(
    z.object({
      id: uuidSchema,
      sort_order: z.number().int().min(0),
    })
  ),
});

// ============================================================================
// Restaurant schemas
// ============================================================================

export const createRestaurantSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  logo_url: z.string().url().optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  accent_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  font_family: z.string().max(100).optional(),
  languages: z.array(z.string().min(2).max(5)).min(1).optional(),
  default_language: z.string().min(2).max(5).optional(),
  subscription_tier: z
    .enum(["free", "starter", "pro", "enterprise"])
    .optional(),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

// ============================================================================
// Category schemas
// ============================================================================

export const createCategorySchema = z.object({
  name: multiLangTextSchema,
  icon: z.string().max(10).optional(),
  visible: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: optionalMultiLangTextSchema,
  icon: z.string().max(10).optional().nullable(),
  visible: z.boolean().optional(),
});

// ============================================================================
// Subcategory schemas
// ============================================================================

export const createSubcategorySchema = z.object({
  name: multiLangTextSchema,
  visible: z.boolean().optional().default(true),
});

export const updateSubcategorySchema = z.object({
  name: optionalMultiLangTextSchema,
  visible: z.boolean().optional(),
});

// ============================================================================
// Menu item schemas
// ============================================================================

export const createMenuItemSchema = z.object({
  subcategory_id: uuidSchema,
  name: multiLangTextSchema,
  description: optionalMultiLangTextSchema,
  price: z.number().min(0),
  image_url: z.string().url().optional().nullable(),
  available: z.boolean().optional().default(true),
  allergen_ids: z.array(uuidSchema).optional(),
  side_dish_ids: z.array(uuidSchema).optional(),
  supplement_ids: z.array(uuidSchema).optional(),
});

export const updateMenuItemSchema = z.object({
  subcategory_id: uuidSchema.optional(),
  name: optionalMultiLangTextSchema,
  description: optionalMultiLangTextSchema,
  price: z.number().min(0).optional(),
  image_url: z.string().url().optional().nullable(),
  available: z.boolean().optional(),
  allergen_ids: z.array(uuidSchema).optional(),
  side_dish_ids: z.array(uuidSchema).optional(),
  supplement_ids: z.array(uuidSchema).optional(),
});

export const bulkMenuItemSchema = z.object({
  items: z.array(
    z.object({
      id: uuidSchema.optional(),
      subcategory_id: uuidSchema.optional(),
      name: optionalMultiLangTextSchema,
      description: optionalMultiLangTextSchema,
      price: z.number().min(0).optional(),
      image_url: z.string().url().optional().nullable(),
      available: z.boolean().optional(),
      allergen_ids: z.array(uuidSchema).optional(),
      side_dish_ids: z.array(uuidSchema).optional(),
      supplement_ids: z.array(uuidSchema).optional(),
    })
  ).min(1).max(100),
});

// ============================================================================
// Allergen schemas
// ============================================================================

export const createAllergenSchema = z.object({
  name: multiLangTextSchema,
  icon: z.string().max(10).optional(),
});

export const updateAllergenSchema = z.object({
  name: optionalMultiLangTextSchema,
  icon: z.string().max(10).optional().nullable(),
});

// ============================================================================
// Side dish schemas
// ============================================================================

export const createSideDishSchema = z.object({
  name: multiLangTextSchema,
  price: z.number().min(0),
});

export const updateSideDishSchema = z.object({
  name: optionalMultiLangTextSchema,
  price: z.number().min(0).optional(),
});

// ============================================================================
// Supplement schemas
// ============================================================================

export const createSupplementSchema = z.object({
  subcategory_id: uuidSchema.optional().nullable(),
  name: multiLangTextSchema,
  price: z.number().min(0),
});

export const updateSupplementSchema = z.object({
  subcategory_id: uuidSchema.optional().nullable(),
  name: optionalMultiLangTextSchema,
  price: z.number().min(0).optional(),
});

// ============================================================================
// Template schemas
// ============================================================================

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  project_json: z.record(z.string(), z.unknown()),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  project_json: z.record(z.string(), z.unknown()).optional(),
});
