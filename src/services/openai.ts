import OpenAI from "openai";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120_000,
  maxRetries: 2,
});

// ---------------------------------------------------------------------------
// Types for parsed tags
// ---------------------------------------------------------------------------

interface TagBase {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BgTag {
  type: "BG";
  color: string;
}

interface ShapeTag extends TagBase {
  type: "SHAPE";
  shape: "rect" | "circle" | "triangle";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  opacity?: number;
}

interface TextTag extends TagBase {
  type: "TEXT";
  content: string;
  size: number;
  fill: string;
  weight?: "normal" | "bold";
  style?: "normal" | "italic";
  align?: "left" | "center" | "right";
}

interface DataTag extends TagBase {
  type: "DATA";
  textColor?: string;
  fontSize?: number;
  bgColor?: string;
}

interface ImageTag extends TagBase {
  type: "IMAGE";
}

type ParsedTag = BgTag | ShapeTag | TextTag | DataTag | ImageTag;

// ---------------------------------------------------------------------------
// Tag prompt — compact output format for GPT
// ---------------------------------------------------------------------------

function buildTagPrompt(pageFormat: "A4" | "A5"): string {
  const dim =
    pageFormat === "A4"
      ? { w: 2480, h: 3508 }
      : { w: 1748, h: 2480 };

  return `You are an expert menu designer. Analyze a photo of a restaurant menu and output a compact tag list describing every visual element.

## CANVAS
${dim.w}×${dim.h} pixels. Origin (0,0) = top-left. All values in pixels.

## TAG FORMAT
One tag per line. Return ONLY tags — no explanation, no markdown, no numbering.

Available tags:

[BG color=#HEXCOLOR]
  → The page background color. Exactly one.

[SHAPE rect x=N y=N w=N h=N fill=#HEX]
[SHAPE circle x=N y=N w=N h=N fill=#HEX]
[SHAPE triangle x=N y=N w=N h=N fill=#HEX]
  → Colored blocks, panels, dividers, decorative shapes.
  → Optional attrs: stroke=#HEX strokeWidth=N radius=N opacity=0.N

[TEXT x=N y=N w=N h=N size=N fill=#HEX "The actual text content"]
  → Headers, titles, section names, taglines, decorative text.
  → Optional attrs: weight=bold style=italic align=center

[DATA x=N y=N w=N h=N]
  → Area where menu items are listed (name + price). One per section/column.
  → Optional attrs: textColor=#HEX fontSize=N bgColor=#HEX

[IMAGE x=N y=N w=N h=N]
  → Photo or illustration placeholder.

## RULES
1. Be THOROUGH — capture EVERY section, column, panel, header, divider
2. For multi-column layouts, use separate DATA tags per column
3. For colored panels/sidebars, use SHAPE rect with the correct fill
4. For horizontal dividers, use SHAPE rect with small h (5-15px)
5. Read ALL text from the image — section headers, restaurant name, taglines, subtitles
6. Estimate positions carefully — elements should not overlap unless intended
7. Font sizes: titles 80-150, section headers 50-80, subtitles 30-50 (on ${dim.w}×${dim.h} canvas)
8. A complex menu should have 15-40 tags. If you have fewer than 10, you're missing content.
9. Put the text content in quotes at the END of the TEXT tag
10. All coordinates must be within canvas bounds (0-${dim.w} for x, 0-${dim.h} for y)`;
}

// ---------------------------------------------------------------------------
// Tag parser — converts GPT tag output into structured elements
// ---------------------------------------------------------------------------

export function parseTags(raw: string): ParsedTag[] {
  const tags: ParsedTag[] = [];
  const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("["));

  for (const line of lines) {
    try {
      // Remove surrounding brackets
      const inner = line.replace(/^\[/, "").replace(/\]$/, "").trim();

      // BG tag
      if (inner.startsWith("BG ")) {
        const color = extractAttr(inner, "color") || "#FFFFFF";
        tags.push({ type: "BG", color });
        continue;
      }

      // SHAPE tag
      if (inner.startsWith("SHAPE ")) {
        const parts = inner.split(/\s+/);
        const shape = (parts[1] || "rect") as "rect" | "circle" | "triangle";
        tags.push({
          type: "SHAPE",
          shape,
          x: num(inner, "x"),
          y: num(inner, "y"),
          w: num(inner, "w"),
          h: num(inner, "h"),
          fill: extractAttr(inner, "fill") || "#000000",
          stroke: extractAttr(inner, "stroke") || undefined,
          strokeWidth: optNum(inner, "strokeWidth"),
          radius: optNum(inner, "radius"),
          opacity: optNum(inner, "opacity"),
        });
        continue;
      }

      // TEXT tag
      if (inner.startsWith("TEXT ")) {
        // Extract quoted content (last quoted string in the tag)
        const contentMatch = inner.match(/"([^"]*)"(?:\s*$)/);
        const content = contentMatch?.[1] || "";
        tags.push({
          type: "TEXT",
          x: num(inner, "x"),
          y: num(inner, "y"),
          w: num(inner, "w"),
          h: num(inner, "h"),
          size: num(inner, "size"),
          fill: extractAttr(inner, "fill") || "#000000",
          weight: (extractAttr(inner, "weight") as "normal" | "bold") || undefined,
          style: (extractAttr(inner, "style") as "normal" | "italic") || undefined,
          align: (extractAttr(inner, "align") as "left" | "center" | "right") || undefined,
          content,
        });
        continue;
      }

      // DATA tag
      if (inner.startsWith("DATA ")) {
        tags.push({
          type: "DATA",
          x: num(inner, "x"),
          y: num(inner, "y"),
          w: num(inner, "w"),
          h: num(inner, "h"),
          textColor: extractAttr(inner, "textColor") || undefined,
          fontSize: optNum(inner, "fontSize"),
          bgColor: extractAttr(inner, "bgColor") || undefined,
        });
        continue;
      }

      // IMAGE tag
      if (inner.startsWith("IMAGE ")) {
        tags.push({
          type: "IMAGE",
          x: num(inner, "x"),
          y: num(inner, "y"),
          w: num(inner, "w"),
          h: num(inner, "h"),
        });
        continue;
      }
    } catch (err) {
      console.warn(`[Parser] Skipping malformed tag: ${line}`);
    }
  }

  return tags;
}

// Extract attr=value from tag string
function extractAttr(s: string, key: string): string | undefined {
  const re = new RegExp(`${key}=([^\\s"\\]]+)`);
  const m = s.match(re);
  return m?.[1];
}

function num(s: string, key: string): number {
  const v = extractAttr(s, key);
  return v ? parseInt(v, 10) || 0 : 0;
}

function optNum(s: string, key: string): number | undefined {
  const v = extractAttr(s, key);
  if (!v) return undefined;
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
}

// ---------------------------------------------------------------------------
// Build MenuProject JSON from parsed tags
// ---------------------------------------------------------------------------

export function buildMenuProject(
  tags: ParsedTag[],
  restaurantName?: string,
  pageFormat: "A4" | "A5" = "A4"
): object {
  const dim =
    pageFormat === "A4"
      ? { width: 2480, height: 3508, printWidth: 210, printHeight: 297 }
      : { width: 1748, height: 2480, printWidth: 148, printHeight: 210 };

  // Extract background color
  const bgTag = tags.find((t) => t.type === "BG") as BgTag | undefined;
  const bgColor = bgTag?.color || "#FFFFFF";

  // Group elements by type into layers
  const shapes: any[] = [];
  const texts: any[] = [];
  const dataEls: any[] = [];
  const images: any[] = [];

  let zIndex = 0;

  for (const tag of tags) {
    if (tag.type === "BG") continue;

    zIndex++;
    const id = randomUUID().slice(0, 8);
    const base = {
      id,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex,
      locked: false,
      visible: true,
      opacity: 1,
    };

    if (tag.type === "SHAPE") {
      shapes.push({
        ...base,
        type: "shape",
        shapeType: tag.shape === "rect" ? "rectangle" : tag.shape,
        x: tag.x,
        y: tag.y,
        width: tag.w,
        height: tag.h,
        fill: tag.fill,
        stroke: tag.stroke || "",
        strokeWidth: tag.strokeWidth || 0,
        radius: tag.radius || 0,
        opacity: tag.opacity ?? 1,
      });
    } else if (tag.type === "TEXT") {
      texts.push({
        ...base,
        type: "text",
        x: tag.x,
        y: tag.y,
        width: tag.w,
        height: tag.h,
        content: tag.content,
        fontSize: tag.size,
        fontFamily: "Arial",
        fontWeight: tag.weight || "normal",
        fontStyle: tag.style || "normal",
        textDecoration: "none",
        fill: tag.fill,
        stroke: "",
        strokeWidth: 0,
        align: tag.align || "left",
        verticalAlign: "top",
        lineHeight: 1.2,
        letterSpacing: 0,
        padding: 0,
      });
    } else if (tag.type === "DATA") {
      dataEls.push({
        ...base,
        type: "data",
        dataType: "menuitem",
        x: tag.x,
        y: tag.y,
        width: tag.w,
        height: tag.h,
        backgroundColor: tag.bgColor || bgColor,
        backgroundOpacity: 0,
        borderColor: "#000000",
        borderSize: 0,
        borderType: "solid",
        borderRadius: 0,
        textColor: tag.textColor || "#000000",
        fontSize: tag.fontSize || 40,
        fontFamily: "Arial",
        fontWeight: "normal",
        lineSpacing: 1.5,
        itemNameLanguage: "en",
        showSubcategoryTitle: false,
        showMenuDescription: true,
        showPrice: true,
        showCurrencySign: true,
        priceColor: tag.textColor || "#000000",
        priceFontFamily: "Arial",
        priceFontWeight: "bold",
        priceSeparator: ",",
        menuLayout: "left",
      });
    } else if (tag.type === "IMAGE") {
      images.push({
        ...base,
        type: "image",
        x: tag.x,
        y: tag.y,
        width: tag.w,
        height: tag.h,
        fileName: "placeholder.jpg",
        src: "/placeholders/food.png",
        originalWidth: tag.w,
        originalHeight: tag.h,
      });
    }
  }

  // Build layers (only include non-empty ones)
  const layers: any[] = [];
  const addLayer = (name: string, elements: any[]) => {
    if (elements.length === 0) return;
    layers.push({
      id: randomUUID().slice(0, 8),
      name,
      visible: true,
      locked: false,
      opacity: 1,
      elements,
    });
  };

  addLayer("Background Shapes", shapes);
  addLayer("Text", texts);
  addLayer("Menu Items", dataEls);
  addLayer("Images", images);

  const now = new Date().toISOString();
  const projectId = randomUUID().slice(0, 12);

  return {
    id: projectId,
    name: restaurantName || "Menu Template",
    createdAt: now,
    updatedAt: now,
    pages: [
      {
        id: randomUUID().slice(0, 8),
        name: "Page 1",
        format: {
          name: pageFormat,
          width: dim.width,
          height: dim.height,
          printWidth: dim.printWidth,
          printHeight: dim.printHeight,
        },
        backgroundColor: bgColor,
        layers,
      },
    ],
    fonts: {
      defaultFonts: [],
      customFonts: [],
      googleFonts: [],
      loadedFonts: [],
    },
    settings: {
      defaultFormat: pageFormat,
      zoom: 0.3,
    },
  };
}

// ---------------------------------------------------------------------------
// Main function: GPT Vision → tags → MenuProject
// ---------------------------------------------------------------------------

export async function generateMenuTemplate(
  imageBase64: string,
  restaurantName?: string,
  pageFormat: "A4" | "A5" = "A4"
): Promise<object> {
  const systemPrompt = buildTagPrompt(pageFormat);

  const userMessage = restaurantName
    ? `Analyze this restaurant menu photo for "${restaurantName}". Output ALL visual elements as tags.`
    : `Analyze this restaurant menu photo. Output ALL visual elements as tags.`;

  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userMessage },
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
    max_tokens: 4096,
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("GPT returned empty response");
  }

  // Log the raw tags for debugging
  const tagLines = content.trim().split("\n").filter((l) => l.trim().startsWith("["));
  console.log(`[GPT] Received ${tagLines.length} tags`);

  // Check for refusal
  if (content.includes("I'm unable") || content.includes("I cannot")) {
    // Check if there are still some tags in the response
    if (tagLines.length < 3) {
      throw new Error("GPT was unable to analyze this image. Make sure the photo shows a restaurant menu.");
    }
  }

  // Parse tags
  const tags = parseTags(content);
  console.log(`[GPT] Parsed ${tags.length} valid tags: ${tags.filter(t => t.type === "SHAPE").length} shapes, ${tags.filter(t => t.type === "TEXT").length} texts, ${tags.filter(t => t.type === "DATA").length} data, ${tags.filter(t => t.type === "IMAGE").length} images`);

  if (tags.length < 2) {
    throw new Error("GPT returned too few elements. The image may not be a readable menu photo.");
  }

  // Build MenuProject JSON from tags
  const project = buildMenuProject(tags, restaurantName, pageFormat);

  return project;
}
