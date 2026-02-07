export interface RestaurantConfig {
  slug: string;
  name: string;
  menuApiUrl: string;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    hoverColor: string;
    textColor: string;
    fontFamily: string;
    headerFontFamily: string;
  };
  languages: string[];
  defaultLanguage: string;
  excludeCategoryIds?: string[];
  supplements?: Record<string, SupplementConfig>;
}

export interface SupplementConfig {
  title: Record<string, string>;
  items: Array<{
    name: string;
    descriptions: Record<string, string>;
    price: string;
  }>;
}

export const restaurants: Record<string, RestaurantConfig> = {
  losteria: {
    slug: "losteria",
    name: "L'Osteria Deerlijk",
    menuApiUrl: "https://ada.mindgen.app/api/v1/menu",
    theme: {
      primaryColor: "#861b2d",
      backgroundColor: "#f7f2e6",
      hoverColor: "#e7e0d0",
      textColor: "#333",
      fontFamily: "'Poppins', sans-serif",
      headerFontFamily: "'Celine Sans', sans-serif",
    },
    languages: ["nl", "fr", "en"],
    defaultLanguage: "nl",
    excludeCategoryIds: [
      "f07f0619-08ab-4e96-bc17-3f2cbd65989b", // NoCat
      "f865cdff-2d4c-4a6a-9f07-31ccd997385e", // Extra
    ],
    supplements: {
      "39984c83-6bd2-4d38-83a0-0d966b8f351e": {
        // Carne (Rundsvlees)
        title: { nl: "Sauzen", fr: "Sauce", en: "Sauce" },
        items: [
          {
            name: "Al pepe",
            descriptions: {
              nl: "Peperroomsaus",
              fr: "Sauce au poivre et à la crème",
              en: "Pepper cream sauce",
            },
            price: "4.5",
          },
          {
            name: "Pizzaiola",
            descriptions: {
              nl: "Tomatensaus, knoflook, kappertjes, ansjovis met witte wijn",
              fr: "Sauce tomate, à l'ail, aux câpres, anchois avec vin blanc",
              en: "Tomato sauce, garlic, capers, anchovies with white wine",
            },
            price: "4.5",
          },
          {
            name: "Archiduc",
            descriptions: {
              nl: "Roomsaus en champignons",
              fr: "Sauce à la crème et aux champignons",
              en: "Cream sauce and mushrooms",
            },
            price: "4.5",
          },
          {
            name: "Dello Chef",
            descriptions: {
              nl: "Tomatenroomsaus, champignons, ham en cognac",
              fr: "Sauce tomate à la crème, aux champignons, jambon et cognac",
              en: "Tomato cream sauce, mushrooms, ham with cognac",
            },
            price: "5",
          },
        ],
      },
      "a1426770-286d-4f22-9d09-a8d9fc911a58": {
        // Pizze
        title: { nl: "Supplementen", fr: "Suppléments", en: "Supplements" },
        items: [
          {
            name: "parma / salame / spek / ananas / gorgonzola",
            descriptions: {},
            price: "3",
          },
          {
            name: "tonno / scampi / frutti di mare / salmone",
            descriptions: {},
            price: "4",
          },
          {
            name: "Burrata",
            descriptions: {},
            price: "6",
          },
        ],
      },
    },
  },
};
