import { Router } from "express";

const router = Router();

// Mock data for development when Supabase is unavailable
const mockMenu = {
  restaurant: {
    name: "losteria",
    slug: "losteria", 
    logo_url: null,
    primary_color: "#000000",
    accent_color: "#666666",
    font_family: "Arial, sans-serif",
    languages: ["en"],
    default_language: "en",
    last_updated_at: new Date().toISOString(),
  },
  categories: [
    {
      id: "cat1",
      name: { en: "Appetizers", fr: "Entrées", nl: "Voorgerechten" },
      icon: "utensils",
      sort_order: 1,
      subcategories: [
        {
          id: "sub1",
          name: { en: "Cold Starters", fr: "Entrées Froides", nl: "Koude Voorgerechten" },
          sort_order: 1,
          items: [
            {
              id: "item1",
              name: { en: "Bruschetta", fr: "Bruschetta", nl: "Bruschetta" },
              description: { en: "Fresh tomatoes on grilled bread", fr: "Tomates fraîches sur pain grillé", nl: "Verse tomaten op geroosterd brood" },
              price: 8.50,
              image_url: null,
              allergens: [],
              side_dishes: [],
              supplements: []
            }
          ]
        }
      ]
    }
  ]
};

const mockCategories = [
  { id: "cat1", name: "Appetizers", sort_order: 1 },
  { id: "cat2", name: "Main Courses", sort_order: 2 },
  { id: "cat3", name: "Desserts", sort_order: 3 }
];

const mockAllergens = [
  { id: "gluten", name: "Gluten", icon: "wheat" },
  { id: "dairy", name: "Dairy", icon: "milk" },
  { id: "nuts", name: "Nuts", icon: "peanut" }
];

const mockSidedishes = [
  { id: "fries", name: "French Fries", price: 3.50 },
  { id: "salad", name: "Side Salad", price: 4.00 },
  { id: "rice", name: "Rice", price: 2.50 }
];

// Fallback route for menu
router.get("/menu", (req, res) => {
  console.log("🔄 Using mock menu data (Supabase unavailable)");
  res.json(mockMenu);
});

// Fallback route for categories  
router.get("/category/parents", (req, res) => {
  console.log("🔄 Using mock categories data (Supabase unavailable)");
  res.json(mockCategories);
});

// Fallback route for allergens
router.get("/allergen", (req, res) => {
  console.log("🔄 Using mock allergen data (Supabase unavailable)");
  res.json(mockAllergens);
});

// Fallback route for sidedishes
router.get("/sidedish", (req, res) => {
  console.log("🔄 Using mock sidedish data (Supabase unavailable)");
  res.json(mockSidedishes);
});

export default router;