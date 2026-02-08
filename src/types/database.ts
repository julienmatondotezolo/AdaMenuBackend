// ============================================================================
// Database entity types — mirrors the Supabase schema
// ============================================================================

/** Multi-language text field: { nl: "...", fr: "...", en: "..." } */
export type MultiLangText = Record<string, string>;

// --- Core entities ---

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  primary_color: string;
  accent_color: string;
  font_family: string;
  languages: string[];
  default_language: string;
  subscription_tier: "free" | "starter" | "pro" | "enterprise";
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantUser {
  id: string;
  user_id: string;
  restaurant_id: string;
  role: "owner" | "manager" | "staff";
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: MultiLangText;
  icon: string | null;
  sort_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: MultiLangText;
  sort_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  subcategory_id: string;
  restaurant_id: string;
  name: MultiLangText;
  description: MultiLangText;
  price: number;
  price_takeaway: number | null;
  vat_rate: number; // 6, 12, or 21 (Belgian VAT rates)
  vat_rate_takeaway: number | null;
  image_url: string | null;
  available: boolean;
  has_variants: boolean;
  sort_order: number;
  // 86-ing support
  is_86d: boolean;
  eighty_sixed_at: string | null;
  eighty_sixed_until: string | null; // auto un-86 time
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItemVariant {
  id: string;
  menu_item_id: string;
  restaurant_id: string;
  label: MultiLangText; // e.g., { nl: "Klein", fr: "Petit", en: "Small" }
  price: number;
  price_takeaway: number | null;
  vat_rate: number;
  vat_rate_takeaway: number | null;
  sort_order: number;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailySpecial {
  id: string;
  restaurant_id: string;
  name: MultiLangText;
  description: MultiLangText;
  price: number;
  vat_rate: number;
  image_url: string | null;
  date_from: string; // ISO date
  date_to: string;
  recurring_day: number | null; // 0=Sun, 1=Mon, ..., 6=Sat
  available: boolean;
  allergen_ids: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  restaurant_id: string;
  user_id: string;
  entity_type: "menu_item" | "category" | "subcategory" | "allergen" | "side_dish" | "supplement" | "restaurant" | "daily_special";
  entity_id: string;
  action: "create" | "update" | "delete" | "86" | "un86" | "publish" | "reorder";
  changes: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
}

export interface Allergen {
  id: string;
  restaurant_id: string | null;
  name: MultiLangText;
  icon: string | null;
  is_eu_standard: boolean;
  created_at: string;
}

export interface SideDish {
  id: string;
  restaurant_id: string;
  name: MultiLangText;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Supplement {
  id: string;
  restaurant_id: string;
  subcategory_id: string | null;
  name: MultiLangText;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface MenuTemplate {
  id: string;
  restaurant_id: string;
  name: string;
  project_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// --- Enriched types for API responses ---

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

export interface MenuItemWithRelations extends MenuItem {
  allergens: Allergen[];
  side_dishes: SideDish[];
  supplements: Supplement[];
}

export interface SubcategoryWithItems extends Subcategory {
  items: MenuItemWithRelations[];
}

export interface CategoryWithFullMenu extends Category {
  subcategories: SubcategoryWithItems[];
}

export interface PublicMenuResponse {
  restaurant: Pick<
    Restaurant,
    "name" | "slug" | "logo_url" | "primary_color" | "accent_color" | "font_family" | "languages" | "default_language"
  >;
  categories: CategoryWithFullMenu[];
}

// --- Pagination ---

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
