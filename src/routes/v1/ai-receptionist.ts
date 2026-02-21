import { Router, Request, Response } from "express";
import { adminLimiter } from "../../middleware/rate-limit";
import { getSupabase } from "../../services/supabase";
import OpenAI from "openai";

const router = Router({ mergeParams: true });

router.use(adminLimiter);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/ai-receptionist/call:
 *   post:
 *     summary: Process incoming voice call for order taking
 *     tags: [AI Receptionist]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 */
router.post("/call", async (req: Request, res: Response): Promise<void> => {
  try {
    const { audio_data, phone_number, call_id } = req.body;
    
    // For MVP, simulate the AI receptionist response
    const mockOrder = {
      call_id: call_id || `call-${Date.now()}`,
      phone_number: phone_number || "+32 56 25 63 83",
      order_items: [
        {
          name: "Spaghetti Carbonara",
          quantity: 1,
          price: 14.50,
          notes: "Extra cheese"
        },
        {
          name: "Bruschetta Classica", 
          quantity: 2,
          price: 8.50,
          notes: ""
        }
      ],
      customer_info: {
        name: "Mario Rossi",
        phone: phone_number || "+32 56 25 63 83"
      },
      pickup_time: "19:30",
      total_amount: 31.50,
      status: "confirmed",
      timestamp: new Date().toISOString()
    };

    console.log("AI Receptionist processed order:", mockOrder);

    res.json({
      success: true,
      order: mockOrder,
      response_text: "Perfect! Your order for Spaghetti Carbonara and 2 Bruschetta is confirmed for pickup at 19:30. Total is €31.50. Thank you for calling L'Osteria!"
    });
  } catch (error) {
    console.error("Error processing call:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to process call" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/ai-receptionist/orders:
 *   get:
 *     summary: Get recent phone orders
 *     tags: [AI Receptionist]
 */
router.get("/orders", async (req: Request, res: Response): Promise<void> => {
  try {
    const mockOrders = [
      {
        id: "order-1",
        call_id: "call-1234",
        customer_name: "Mario Rossi",
        customer_phone: "+32 56 25 63 83",
        items: [
          { name: "Spaghetti Carbonara", quantity: 1, price: 14.50 },
          { name: "Bruschetta Classica", quantity: 2, price: 8.50 }
        ],
        total_amount: 31.50,
        pickup_time: "19:30",
        status: "confirmed",
        timestamp: "2026-02-16T18:15:00Z"
      },
      {
        id: "order-2", 
        call_id: "call-5678",
        customer_name: "Anna Bianchi",
        customer_phone: "+32 56 78 90 12",
        items: [
          { name: "Osso Buco alla Milanese", quantity: 1, price: 26.50 }
        ],
        total_amount: 26.50,
        pickup_time: "20:00",
        status: "preparing",
        timestamp: "2026-02-16T17:45:00Z"
      }
    ];

    res.json(mockOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch orders" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/ai-receptionist/orders/{orderId}/status:
 *   put:
 *     summary: Update order status
 *     tags: [AI Receptionist]
 */
router.put("/orders/:orderId/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    console.log(`Order ${orderId} status updated to: ${status}`);
    
    res.json({
      success: true,
      order_id: orderId,
      new_status: status,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update order status" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/ai-receptionist/menu-context:
 *   get:
 *     summary: Get current menu for AI context
 *     tags: [AI Receptionist]
 */
router.get("/menu-context", async (req: Request, res: Response): Promise<void> => {
  try {
    // Get menu data for AI context (simplified for voice orders)
    const menuContext = {
      restaurant_name: "L'Osteria Deerlijk",
      phone_number: "+32 56 25 63 83", 
      address: "Stationsstraat 232, 8540 Deerlijk",
      popular_items: [
        { name: "Spaghetti Carbonara", price: 14.50, description: "Traditional Roman pasta" },
        { name: "Bruschetta Classica", price: 8.50, description: "Toasted bread with tomatoes" },
        { name: "Osso Buco alla Milanese", price: 26.50, description: "Slow-cooked veal shanks" }
      ],
      typical_pickup_times: ["30 minutes", "45 minutes", "1 hour"],
      payment_methods: ["Cash on pickup", "Card on pickup"],
      language_preference: "Italian accent, friendly tone",
      special_instructions: [
        "Always confirm order details",
        "Ask for pickup time preference", 
        "Get customer name and phone number",
        "Mention total price clearly"
      ]
    };

    res.json(menuContext);
  } catch (error) {
    console.error("Error fetching menu context:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch menu context" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/ai-receptionist/kitchen-notify:
 *   post:
 *     summary: Send order to kitchen display/printer
 *     tags: [AI Receptionist]
 */
router.post("/kitchen-notify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { order_id, order_details } = req.body;
    
    // Simulate kitchen notification
    const kitchenNotification = {
      notification_id: `kitchen-${Date.now()}`,
      order_id: order_id,
      type: "PHONE_ORDER",
      priority: "normal",
      estimated_prep_time: "25 minutes",
      kitchen_display: {
        title: "📞 PHONE ORDER",
        items: order_details.items || [],
        customer: order_details.customer_name || "Phone Customer",
        pickup_time: order_details.pickup_time || "ASAP",
        total: `€${order_details.total_amount || 0}`
      },
      sent_at: new Date().toISOString()
    };

    console.log("Kitchen notification sent:", kitchenNotification);

    res.json({
      success: true,
      notification: kitchenNotification
    });
  } catch (error) {
    console.error("Error sending kitchen notification:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to send kitchen notification" });
  }
});

export default router;