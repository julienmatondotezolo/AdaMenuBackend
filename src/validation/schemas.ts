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
// Menu item variant schema
// ============================================================================

export const menuItemVariantSchema = z.object({
  label: multiLangTextSchema, // { nl: "Klein", fr: "Petit", en: "Small" }
  price: z.number().min(0),
  price_takeaway: z.number().min(0).optional().nullable(),
  vat_rate: z.number().min(0).max(100).default(12),
  vat_rate_takeaway: z.number().min(0).max(100).default(6).optional(),
  available: z.boolean().optional().default(true),
});

// ============================================================================
// Menu item schemas
// ============================================================================

export const createMenuItemSchema = z.object({
  subcategory_id: uuidSchema,
  name: multiLangTextSchema,
  description: optionalMultiLangTextSchema,
  price: z.number().min(0),
  price_takeaway: z.number().min(0).optional().nullable(),
  vat_rate: z.number().min(0).max(100).default(12), // Belgian VAT: 6%, 12%, 21%
  vat_rate_takeaway: z.number().min(0).max(100).default(6).optional(),
  image_url: z.string().url().optional().nullable(),
  available: z.boolean().optional().default(true),
  has_variants: z.boolean().optional().default(false),
  variants: z.array(menuItemVariantSchema).optional(),
  allergen_ids: z.array(uuidSchema).optional(),
  side_dish_ids: z.array(uuidSchema).optional(),
  supplement_ids: z.array(uuidSchema).optional(),
});

export const updateMenuItemSchema = z.object({
  subcategory_id: uuidSchema.optional(),
  name: optionalMultiLangTextSchema,
  description: optionalMultiLangTextSchema,
  price: z.number().min(0).optional(),
  price_takeaway: z.number().min(0).optional().nullable(),
  vat_rate: z.number().min(0).max(100).optional(),
  vat_rate_takeaway: z.number().min(0).max(100).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  available: z.boolean().optional(),
  has_variants: z.boolean().optional(),
  variants: z.array(menuItemVariantSchema).optional(),
  allergen_ids: z.array(uuidSchema).optional(),
  side_dish_ids: z.array(uuidSchema).optional(),
  supplement_ids: z.array(uuidSchema).optional(),
  // 86-ing
  is_86d: z.boolean().optional(),
  eighty_sixed_until: z.string().datetime().optional().nullable(),
});

export const bulkMenuItemSchema = z.object({
  items: z.array(
    z.object({
      id: uuidSchema.optional(),
      subcategory_id: uuidSchema.optional(),
      name: optionalMultiLangTextSchema,
      description: optionalMultiLangTextSchema,
      price: z.number().min(0).optional(),
      price_takeaway: z.number().min(0).optional().nullable(),
      vat_rate: z.number().min(0).max(100).optional(),
      vat_rate_takeaway: z.number().min(0).max(100).optional().nullable(),
      image_url: z.string().url().optional().nullable(),
      available: z.boolean().optional(),
      has_variants: z.boolean().optional(),
      variants: z.array(menuItemVariantSchema).optional(),
      allergen_ids: z.array(uuidSchema).optional(),
      side_dish_ids: z.array(uuidSchema).optional(),
      supplement_ids: z.array(uuidSchema).optional(),
    })
  ).min(1).max(100),
});

// ============================================================================
// 86-ing schema
// ============================================================================

export const eightySixSchema = z.object({
  is_86d: z.boolean(),
  eighty_sixed_until: z.string().datetime().optional().nullable(),
});

// ============================================================================
// Daily Specials schemas
// ============================================================================

export const createDailySpecialSchema = z.object({
  name: multiLangTextSchema,
  description: optionalMultiLangTextSchema,
  price: z.number().min(0),
  vat_rate: z.number().min(0).max(100).default(12),
  image_url: z.string().url().optional().nullable(),
  date_from: z.string(), // ISO date
  date_to: z.string(),
  recurring_day: z.number().int().min(0).max(6).optional().nullable(),
  available: z.boolean().optional().default(true),
  allergen_ids: z.array(uuidSchema).optional(),
});

export const updateDailySpecialSchema = z.object({
  name: optionalMultiLangTextSchema,
  description: optionalMultiLangTextSchema,
  price: z.number().min(0).optional(),
  vat_rate: z.number().min(0).max(100).optional(),
  image_url: z.string().url().optional().nullable(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  recurring_day: z.number().int().min(0).max(6).optional().nullable(),
  available: z.boolean().optional(),
  allergen_ids: z.array(uuidSchema).optional(),
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
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  project_json: z.record(z.string(), z.unknown()),
  is_default: z.boolean().optional(),
  published_by: z.string().uuid().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  project_json: z.record(z.string(), z.unknown()).optional(),
  is_default: z.boolean().optional(),
  published_by: z.string().uuid().optional(),
});
