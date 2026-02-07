import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120_000, // 2 min
  maxRetries: 2,
});

/**
 * Build the system prompt for menu template generation.
 * This is the most critical piece — it tells GPT-4o Vision exactly
 * what JSON structure to produce for a MenuProject.
 */
function buildSystemPrompt(pageFormat: "A4" | "A5"): string {
  const dimensions =
    pageFormat === "A4"
      ? { width: 2480, height: 3508, printWidth: 210, printHeight: 297 }
      : { width: 1748, height: 2480, printWidth: 148, printHeight: 210 };

  return `You are an expert menu designer and layout analyst. Your job is to analyze a photograph of a physical restaurant menu page and generate a JSON structure that recreates its layout digitally.

## OUTPUT FORMAT
You MUST return ONLY valid JSON — no markdown, no code fences, no explanation. Just the raw JSON object.

## CANVAS DIMENSIONS
The digital canvas is ${dimensions.width}×${dimensions.height} pixels (${pageFormat} at 300 DPI, ${dimensions.printWidth}×${dimensions.printHeight}mm).
All x, y, width, height values must be in pixels within this canvas.

## COORDINATE SYSTEM
- Origin (0,0) is the top-left corner
- x increases to the right, y increases downward
- Elements must stay within the canvas boundaries (0 to ${dimensions.width} for x/width, 0 to ${dimensions.height} for y/height)

## WHAT TO ANALYZE
1. **Background color** — detect the dominant background color of the menu
2. **Text elements** — titles, headers, section names, decorative text, restaurant name, taglines. Read the actual text from the menu.
3. **Shape elements** — decorative rectangles, circles, lines, dividers, borders, colored sections/blocks
4. **Data placeholders** — where menu items are listed (name + description + price). These become "data" elements with dataType="menuitem"
5. **Image placeholders** — where photos or illustrations appear on the menu

## ELEMENT TYPES & REQUIRED FIELDS

### Text Element (for titles, headers, decorative text)
{
  "id": "<unique-string>",
  "type": "text",
  "x": <number>,
  "y": <number>,
  "width": <number>,
  "height": <number>,
  "rotation": 0,
  "scaleX": 1,
  "scaleY": 1,
  "zIndex": <number>,
  "locked": false,
  "visible": true,
  "opacity": 1,
  "content": "<the actual text>",
  "fontSize": <number 20-200>,
  "fontFamily": "Arial",
  "fontWeight": "normal" | "bold",
  "fontStyle": "normal",
  "textDecoration": "none",
  "fill": "<hex color>",
  "stroke": "",
  "strokeWidth": 0,
  "align": "left" | "center" | "right",
  "verticalAlign": "top",
  "lineHeight": 1.2,
  "letterSpacing": 0,
  "padding": 0
}

### Shape Element (for decorative elements, dividers, colored blocks)
{
  "id": "<unique-string>",
  "type": "shape",
  "shapeType": "rectangle" | "circle" | "triangle",
  "x": <number>,
  "y": <number>,
  "width": <number>,
  "height": <number>,
  "rotation": 0,
  "scaleX": 1,
  "scaleY": 1,
  "zIndex": <number>,
  "locked": false,
  "visible": true,
  "opacity": 1,
  "fill": "<hex or rgba color>",
  "stroke": "<hex color or empty>",
  "strokeWidth": <number>,
  "radius": <number for rounded corners>
}

### Data Element (placeholder for menu items — CRITICAL)
{
  "id": "<unique-string>",
  "type": "data",
  "dataType": "menuitem",
  "x": <number>,
  "y": <number>,
  "width": <number>,
  "height": <number>,
  "rotation": 0,
  "scaleX": 1,
  "scaleY": 1,
  "zIndex": <number>,
  "locked": false,
  "visible": true,
  "opacity": 1,
  "backgroundColor": "<hex color matching area background>",
  "backgroundOpacity": 0,
  "borderColor": "#000000",
  "borderSize": 0,
  "borderType": "solid",
  "borderRadius": 0,
  "textColor": "<hex color of menu item text>",
  "fontSize": <number 30-60>,
  "fontFamily": "Arial",
  "fontWeight": "normal",
  "lineSpacing": 1.5,
  "itemNameLanguage": "en",
  "showSubcategoryTitle": false,
  "showMenuDescription": true,
  "showPrice": true,
  "showCurrencySign": true,
  "priceColor": "<hex color>",
  "priceFontFamily": "Arial",
  "priceFontWeight": "bold",
  "priceSeparator": ",",
  "menuLayout": "left"
}

### Image Element (placeholder for photos/images on the menu)
{
  "id": "<unique-string>",
  "type": "image",
  "x": <number>,
  "y": <number>,
  "width": <number>,
  "height": <number>,
  "rotation": 0,
  "scaleX": 1,
  "scaleY": 1,
  "zIndex": <number>,
  "locked": false,
  "visible": true,
  "opacity": 1,
  "fileName": "placeholder.jpg",
  "src": "/placeholders/food.png",
  "originalWidth": <same as width>,
  "originalHeight": <same as height>
}

## LAYER ORGANIZATION
Organize elements into logical layers:
- "Background Shapes" layer — large colored rectangles/shapes that form the background structure
- "Decorations" layer — dividers, lines, small decorative shapes
- "Text" layer — all text elements (titles, headers)
- "Menu Items" layer — data elements (menu item placeholders)
- "Images" layer — image placeholders (only if the menu has photos)

## JSON STRUCTURE TO RETURN
{
  "id": "<random-id>",
  "name": "<restaurant name or 'Menu Template'>",
  "createdAt": "<ISO timestamp>",
  "updatedAt": "<ISO timestamp>",
  "pages": [
    {
      "id": "<random-id>",
      "name": "Page 1",
      "format": {
        "name": "${pageFormat}",
        "width": ${dimensions.width},
        "height": ${dimensions.height},
        "printWidth": ${dimensions.printWidth},
        "printHeight": ${dimensions.printHeight}
      },
      "backgroundColor": "<detected background color>",
      "layers": [ ...layers with elements... ]
    }
  ],
  "fonts": {
    "defaultFonts": [],
    "customFonts": [],
    "googleFonts": [],
    "loadedFonts": []
  },
  "settings": {
    "defaultFormat": "${pageFormat}",
    "zoom": 0.3
  }
}

## IMPORTANT GUIDELINES
- Generate UNIQUE ids for every element (use random alphanumeric strings like "a1b2c3d4e")
- Use realistic font sizes: titles 80-150px, section headers 50-80px, body text 35-50px (on the ${dimensions.width}×${dimensions.height} canvas)
- Detect colors from the menu photo — use the actual color scheme, not generic ones
- Position data elements precisely where menu items appear — estimate the bounding box of each menu section
- For horizontal divider lines, use a rectangle shape with a very small height (5-15px) and full width
- If the menu has multiple columns, create separate data elements for each column
- The "fonts.loadedFonts" must be an empty array [] (not a Set)
- Only use system fonts: Arial, Helvetica, Times New Roman, Georgia, Verdana, Tahoma, Trebuchet MS, Courier New
- All element ids must be unique strings`;
}

/**
 * Call GPT-4o Vision to analyze a menu photo and generate a MenuProject JSON.
 */
export async function generateMenuTemplate(
  imageBase64: string,
  restaurantName?: string,
  pageFormat: "A4" | "A5" = "A4"
): Promise<object> {
  const systemPrompt = buildSystemPrompt(pageFormat);

  const userMessage = restaurantName
    ? `Analyze this restaurant menu photo for "${restaurantName}" and generate the MenuProject JSON template. Recreate the layout, colors, typography, and structure as accurately as possible.`
    : `Analyze this restaurant menu photo and generate the MenuProject JSON template. Recreate the layout, colors, typography, and structure as accurately as possible.`;

  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userMessage,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
    max_tokens: 16000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("GPT returned empty response");
  }

  // Strip any markdown code fences if GPT added them
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  // Parse and validate
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("[GPT] Failed to parse JSON response:", jsonStr.substring(0, 500));
    throw new Error(`GPT returned invalid JSON: ${(e as Error).message}`);
  }

  // Basic structural validation
  if (!parsed.id || !parsed.pages || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    throw new Error("GPT response missing required fields (id, pages)");
  }

  const page = parsed.pages[0];
  if (!page.id || !page.format || !page.layers || !Array.isArray(page.layers)) {
    throw new Error("GPT response page missing required fields (id, format, layers)");
  }

  // Ensure fonts.loadedFonts is an array (GPT might output a Set)
  if (parsed.fonts) {
    if (
      parsed.fonts.loadedFonts &&
      !Array.isArray(parsed.fonts.loadedFonts)
    ) {
      parsed.fonts.loadedFonts = [];
    }
  } else {
    parsed.fonts = {
      defaultFonts: [],
      customFonts: [],
      googleFonts: [],
      loadedFonts: [],
    };
  }

  // Ensure settings exist
  if (!parsed.settings) {
    parsed.settings = {
      defaultFormat: pageFormat,
      zoom: 0.3,
    };
  }

  return parsed;
}
