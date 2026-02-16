// Development mock data when Supabase is not available
export const mockRestaurant = {
  id: "losteria-dev",
  name: "L'Osteria Deerlijk",
  slug: "losteria", 
  logo_url: null,
  primary_color: "#861b2d",
  accent_color: "#d4af37",
  font_family: "serif",
  languages: ["en", "nl", "fr", "it"],
  default_language: "en"
};

export const mockCategories = [
  {
    id: "cat-1",
    name: {
      en: "Antipasti",
      nl: "Voorgerechten", 
      fr: "Entrées",
      it: "Antipasti"
    },
    icon: "appetizer",
    sort_order: 1,
    visible: true,
    restaurant_id: "losteria-dev"
  },
  {
    id: "cat-2", 
    name: {
      en: "Primi Piatti",
      nl: "Eerste Gangen",
      fr: "Premiers Plats", 
      it: "Primi Piatti"
    },
    icon: "pasta",
    sort_order: 2,
    visible: true,
    restaurant_id: "losteria-dev"
  },
  {
    id: "cat-3",
    name: {
      en: "Secondi Piatti", 
      nl: "Hoofdgerechten",
      fr: "Plats Principaux",
      it: "Secondi Piatti"
    },
    icon: "meat",
    sort_order: 3,
    visible: true,
    restaurant_id: "losteria-dev"
  }
];

export const mockSubcategories = [
  {
    id: "sub-1",
    name: {
      en: "Cold Appetizers",
      nl: "Koude Voorgerechten",
      fr: "Entrées Froides", 
      it: "Antipasti Freddi"
    },
    sort_order: 1,
    visible: true,
    category_id: "cat-1"
  },
  {
    id: "sub-2",
    name: {
      en: "Pasta",
      nl: "Pasta", 
      fr: "Pâtes",
      it: "Pasta"
    },
    sort_order: 1,
    visible: true,
    category_id: "cat-2"
  },
  {
    id: "sub-3",
    name: {
      en: "Meat Dishes",
      nl: "Vleesgerechten",
      fr: "Plats de Viande",
      it: "Carne"
    },
    sort_order: 1, 
    visible: true,
    category_id: "cat-3"
  }
];

export const mockMenuItems = [
  {
    id: "item-1",
    name: {
      en: "Bruschetta Classica",
      nl: "Klassieke Bruschetta", 
      fr: "Bruschetta Classique",
      it: "Bruschetta Classica"
    },
    description: {
      en: "Toasted bread with fresh tomatoes, basil and garlic",
      nl: "Geroosterd brood met verse tomaten, basilicum en knoflook",
      fr: "Pain grillé avec tomates fraîches, basilic et ail", 
      it: "Pane tostato con pomodori freschi, basilico e aglio"
    },
    price: 8.50,
    image_url: null,
    available: true,
    sort_order: 1,
    subcategory_id: "sub-1"
  },
  {
    id: "item-2",
    name: {
      en: "Spaghetti Carbonara",
      nl: "Spaghetti Carbonara",
      fr: "Spaghetti à la Carbonara",
      it: "Spaghetti alla Carbonara"
    },
    description: {
      en: "Traditional Roman pasta with eggs, cheese, pancetta and black pepper",
      nl: "Traditionele Romeinse pasta met eieren, kaas, pancetta en zwarte peper",
      fr: "Pâtes romaines traditionnelles aux œufs, fromage, pancetta et poivre noir",
      it: "Pasta romana tradizionale con uova, formaggio, pancetta e pepe nero"
    },
    price: 14.50,
    image_url: null,
    available: true,
    sort_order: 1,
    subcategory_id: "sub-2"
  },
  {
    id: "item-3", 
    name: {
      en: "Osso Buco alla Milanese",
      nl: "Osso Buco à la Milanese",
      fr: "Osso Buco à la Milanaise", 
      it: "Osso Buco alla Milanese"
    },
    description: {
      en: "Slow-cooked veal shanks with vegetables and saffron risotto",
      nl: "Langzaam gegaarde kalfschenkel met groenten en saffraan risotto",
      fr: "Jarret de veau mijoté avec légumes et risotto au safran",
      it: "Stinco di vitello brasato con verdure e risotto allo zafferano"
    },
    price: 26.50,
    image_url: null,
    available: true,
    sort_order: 1,
    subcategory_id: "sub-3"
  }
];

export const mockAllergens = [
  {
    id: "allergen-1",
    name: "Gluten",
    icon: "🌾"
  },
  {
    id: "allergen-2", 
    name: "Dairy",
    icon: "🥛"
  },
  {
    id: "allergen-3",
    name: "Eggs", 
    icon: "🥚"
  }
];

export const mockSideDishes = [
  {
    id: "side-1",
    name: "Parmigiano Reggiano",
    price: 3.50
  },
  {
    id: "side-2",
    name: "Extra Virgin Olive Oil",
    price: 1.00
  }
];

export const mockSupplements = [
  {
    id: "supp-1", 
    name: "Truffle Oil",
    price: 4.50
  },
  {
    id: "supp-2",
    name: "Fresh Mozzarella", 
    price: 3.00
  }
];