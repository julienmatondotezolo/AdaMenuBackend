import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "../middleware/auth";
import { getSupabase } from "../lib/supabase";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const SYSTEM_PROMPT = `You are a helpful AI assistant for a restaurant menu editor. You help users create, update, and delete menu categories, items, and menu metadata.

You MUST respond with valid JSON only. No markdown, no explanation outside JSON.

The JSON response must have this structure:
{
  "message": "A friendly description of what changes you're proposing (in the same language the user wrote in)",
  "actions": [
    {
      "type": "create_category" | "update_category" | "delete_category" | "create_item" | "update_item" | "delete_item" | "update_menu",
      ...action-specific fields
    }
  ]
}

Action types and their fields:

1. create_category: { "type": "create_category", "name": "Category Name", "addToPageId": "page-id-or-null" }
   - IMPORTANT: If there is exactly 1 page in the menu, ALWAYS set addToPageId to that page's id so the new category is automatically assigned to it.
   - If there are multiple pages and the user DOES NOT specify which page, you MUST ASK the user which page they want the category on. Return your question in "message" and an EMPTY "actions" array. List the available pages by their index (Page 1, Page 2, etc.) so the user can choose.
   - If there are multiple pages and the user specifies the page (e.g. "on page 2", "add to the first page"), set addToPageId to the matching page id.
   - In your message, always mention which page the new category will be added to (e.g. "I'll add the Desserts category to Page 2").
2. update_category: { "type": "update_category", "categoryId": "existing-id", "updates": { "name": "New Name" } }
3. delete_category: { "type": "delete_category", "categoryId": "existing-id" }
4. create_item: { "type": "create_item", "categoryId": "existing-id-or-new", "categoryName": "Category Name if new", "addToPageId": "page-id-or-null", "item": { "name": "Item Name", "price": 12.50, "description": "Optional description", "featured": false } }
   - If the category doesn't exist yet, use categoryId: "new" and provide categoryName. The frontend will create the category first.
   - addToPageId follows the same rule as create_category: if 1 page, always set it. If multiple pages and user didn't specify, ASK which page.
5. update_item: { "type": "update_item", "categoryId": "existing-id", "itemId": "existing-id", "updates": { "name": "New Name", "price": 15.00, "description": "New desc", "featured": true } }
   - Only include fields that should change.
   - IMPORTANT: For each update action, also include "oldValues" with the current values being changed, e.g.: "oldValues": { "name": "Old Name", "price": 10.00 }
6. delete_item: { "type": "delete_item", "categoryId": "existing-id", "itemId": "existing-id" }
7. update_menu: { "type": "update_menu", "updates": { "title": "New Title", "subtitle": "New Subtitle" }, "oldValues": { "title": "Old Title", "subtitle": "Old Subtitle" } }
   - Include oldValues with the current values being changed.

For update_category actions, also include "oldValues": { "name": "Old Name" } alongside "updates".

Rules:
- Always respond in the same language the user writes in.
- When the user asks to translate, translate ALL category names, item names, and item descriptions.
- When updating prices, match items by name if IDs aren't obvious.
- For bulk operations (e.g. "make all pasta €14"), apply to all matching items.
- If the user's request is unclear, ask for clarification in your message and return an empty actions array.
- Be smart about matching: "pasta" should match "Spaghetti Carbonara", "Penne Arrabiata", etc. only if the user clearly means pasta dishes.
- When creating multiple items, group them logically into categories.
- For translations, update all names and descriptions — create update actions for every category and item.
- The menu state includes a "pages" array. Each page has an id and categoryIds (categories assigned to that page). Categories NOT in any page appear as "unassigned" which is bad UX. Always assign new categories to a page.
- IMPORTANT: Pay close attention to the FULL conversation history. Every message includes its status: accepted, rejected, or pending. Use this to understand what the user wants.
- The current menu state (in the system prompt) always reflects the LIVE menu including all accepted changes. Base your actions on this current state.
- When the user REJECTS a proposal, it does NOT mean everything was wrong. A rejection can be partial — some parts may be fine, others not. When the user follows up after a rejection, read their feedback carefully to understand which parts to keep, modify, or drop. Propose a revised set of actions that addresses their feedback.
- When the user sends a follow-up message, consider ALL prior context: what was originally requested, what was proposed, what was accepted/rejected, and what the user is now asking for. Build on the conversation, don't start from scratch.
- NEVER lose track of items the user mentioned earlier. If the user gave you a list of items at the start, ALL those items must end up somewhere in the menu unless the user explicitly says to remove them.`;

// ─── POST / — AI assist (chat with menu context) ───────────────────────────
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { message, menuData, menuId, pages, chatHistory, language } = req.body as {
      message: string;
      menuData: any;
      menuId?: string;
      pages?: any[];
      chatHistory?: { role: string; content: string; actions?: any[]; status?: string }[];
      language?: string;
    };

    if (!message) {
      res.status(400).json({ error: "BAD_REQUEST", message: "message is required" });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: "CONFIG_ERROR", message: "OPENAI_API_KEY not configured" });
      return;
    }

    // Build OpenAI messages
    const menuState = { ...menuData, pages: pages || [] };

    const gptMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}
${language && language !== "en" ? `\nIMPORTANT: The user's preferred language is "${language}". You MUST respond in ${language === "fr" ? "French" : language === "nl" ? "Dutch" : language}. Write your "message" field in ${language === "fr" ? "French" : language === "nl" ? "Dutch" : language}.\n` : ""}
Current menu state (always reflects the latest data, including any previously applied changes):
${JSON.stringify(menuState, null, 2)}`,
      },
    ];

    // Build conversation history from frontend chat messages
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory) {
        if (msg.role === "user") {
          gptMessages.push({ role: "user", content: msg.content });
        } else if (msg.role === "assistant") {
          // Build a rich context message including what was proposed and whether it was accepted/rejected
          let content = msg.content;
          if (msg.actions && msg.actions.length > 0) {
            const summary = msg.actions.map((a: any) => {
              switch (a.type) {
                case "create_category": return `  - Create category "${a.name}"`;
                case "update_category": return `  - Rename category "${a.oldValues?.name || a.categoryId}" → "${a.updates?.name}"`;
                case "delete_category": return `  - Delete category (id: ${a.categoryId})`;
                case "create_item": return `  - Create item "${a.item?.name}" €${a.item?.price} in "${a.categoryName || a.categoryId}"`;
                case "update_item": return `  - Update item: ${Object.entries(a.oldValues || {}).map(([k, v]) => `${k}: "${v}"`).join(", ")} → ${Object.entries(a.updates || {}).map(([k, v]) => `${k}: "${v}"`).join(", ")}`;
                case "delete_item": return `  - Delete item (id: ${a.itemId})`;
                case "update_menu": return `  - Update menu: ${Object.entries(a.oldValues || {}).map(([k, v]) => `${k}: "${v}"`).join(", ")} → ${Object.entries(a.updates || {}).map(([k, v]) => `${k}: "${v}"`).join(", ")}`;
                default: return `  - ${a.type}`;
              }
            }).join("\n");

            const statusLabel = msg.status === "accepted"
              ? "[USER ACCEPTED THESE CHANGES — they are now applied in the current menu state]"
              : msg.status === "rejected"
                ? "[USER REJECTED THESE CHANGES — they were NOT applied. The user may follow up with what they want instead. A rejection can be partial — some parts may be okay, others not. If the user sends a new message after rejecting, treat it as feedback on what to change.]"
                : "[PENDING — user has not yet decided]";

            content += `\n\nProposed actions:\n${summary}\n\n${statusLabel}`;
          }
          gptMessages.push({ role: "assistant", content });
        }
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: gptMessages,
      max_tokens: 4096,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { message: responseText, actions: [] };
    }

    // Save messages to DB for persistence across page reloads
    if (menuId) {
      try {
        await getSupabase().from("menu_chat_messages").insert([
          { menu_id: menuId, role: "user", content: message },
          { menu_id: menuId, role: "assistant", content: parsed.message || "" },
        ]);
      } catch {}
    }

    res.json({
      message: parsed.message || "",
      actions: parsed.actions || [],
    });
  } catch (err: any) {
    console.error("AI assist error:", err);
    res.status(500).json({ error: "AI_ERROR", message: err.message || "Failed to process AI request" });
  }
});

// ─── GET /history/:menuId — Load chat history ──────────────────────────────
router.get("/history/:menuId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await getSupabase()
      .from("menu_chat_messages")
      .select("*")
      .eq("menu_id", req.params.menuId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── DELETE /history/:menuId — Clear chat history ──────────────────────────
router.delete("/history/:menuId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { error } = await getSupabase()
      .from("menu_chat_messages")
      .delete()
      .eq("menu_id", req.params.menuId);

    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
