import { Router, Request, Response } from "express";
import { adminLimiter } from "../../middleware/rate-limit";

const router = Router();

router.use(adminLimiter);

/**
 * @swagger
 * /api/v1/staff:
 *   get:
 *     summary: Get all staff members (global endpoint)
 *     tags: [Staff]
 *     parameters:
 *       - in: query
 *         name: active_only
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter to only active staff members
 *     responses:
 *       200:
 *         description: List of staff members
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { active_only } = req.query;
    
    // Mock staff data for L'Osteria (same as planning.ts)
    const mockStaff = [
      {
        id: "emp-1",
        name: "Marco Ferrari",
        role: "Head Chef",
        email: "marco@losteria.be",
        phone: "+32 56 11 22 33",
        availability: {
          monday: { start: "09:00", end: "17:00" },
          tuesday: { start: "09:00", end: "17:00" },
          wednesday: { start: "09:00", end: "17:00" },
          thursday: { start: "09:00", end: "17:00" },
          friday: { start: "09:00", end: "17:00" },
          saturday: { start: "10:00", end: "22:00" },
          sunday: "unavailable"
        },
        hourly_rate: 18.50,
        active: true
      },
      {
        id: "emp-2",
        name: "Sofia Lombardi",
        role: "Sous Chef", 
        email: "sofia@losteria.be",
        phone: "+32 56 44 55 66",
        availability: {
          monday: { start: "14:00", end: "22:00" },
          tuesday: { start: "14:00", end: "22:00" },
          wednesday: { start: "14:00", end: "22:00" },
          thursday: { start: "14:00", end: "22:00" },
          friday: { start: "14:00", end: "22:00" },
          saturday: { start: "14:00", end: "22:00" },
          sunday: "unavailable"
        },
        hourly_rate: 16.00,
        active: true
      },
      {
        id: "emp-3",
        name: "Giuseppe Rossi",
        role: "Server",
        email: "giuseppe@losteria.be", 
        phone: "+32 56 77 88 99",
        availability: {
          monday: { start: "11:00", end: "15:00" },
          tuesday: { start: "11:00", end: "15:00" },
          wednesday: { start: "18:00", end: "23:00" },
          thursday: { start: "18:00", end: "23:00" },
          friday: { start: "18:00", end: "23:00" },
          saturday: { start: "11:00", end: "23:00" },
          sunday: "unavailable"
        },
        hourly_rate: 14.50,
        active: true
      },
      {
        id: "emp-4", 
        name: "Luna Martinez",
        role: "Server",
        email: "luna@losteria.be",
        phone: "+32 56 33 44 55",
        availability: {
          monday: { start: "18:00", end: "23:00" },
          tuesday: { start: "18:00", end: "23:00" },
          wednesday: { start: "11:00", end: "15:00" },
          thursday: { start: "11:00", end: "15:00" },
          friday: { start: "18:00", end: "23:00" },
          saturday: { start: "18:00", end: "23:00" },
          sunday: "unavailable"
        },
        hourly_rate: 14.50,
        active: true
      },
      {
        id: "emp-5",
        name: "Diego Santos", 
        role: "Kitchen Assistant",
        email: "diego@losteria.be",
        phone: "+32 56 22 33 44",
        availability: {
          monday: { start: "09:00", end: "17:00" },
          tuesday: { start: "09:00", end: "17:00" },
          wednesday: { start: "09:00", end: "17:00" },
          thursday: { start: "14:00", end: "22:00" },
          friday: { start: "14:00", end: "22:00" },
          saturday: { start: "09:00", end: "22:00" },
          sunday: "unavailable"
        },
        hourly_rate: 13.00,
        active: false  // inactive staff member
      }
    ];

    let filteredStaff = mockStaff;
    
    // Filter by active status if requested
    if (active_only === "true") {
      filteredStaff = mockStaff.filter(staff => staff.active);
    }
    
    res.json({
      success: true,
      data: filteredStaff,
      count: filteredStaff.length
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch staff" });
  }
});

/**
 * @swagger
 * /api/v1/staff:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Staff]
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    // Mock creation - in production this would save to database
    const newStaff = {
      id: `emp-${Date.now()}`,
      ...req.body,
      created_at: new Date().toISOString(),
      active: true
    };
    
    res.status(201).json({
      success: true,
      data: newStaff
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to create staff" });
  }
});

/**
 * @swagger
 * /api/v1/staff/{staffId}:
 *   put:
 *     summary: Update staff member
 *     tags: [Staff]
 */
router.put("/:staffId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId } = req.params;
    
    // Mock update
    const updatedStaff = {
      id: staffId,
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: updatedStaff
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update staff" });
  }
});

/**
 * @swagger
 * /api/v1/staff/{staffId}:
 *   delete:
 *     summary: Delete staff member
 *     tags: [Staff]
 */
router.delete("/:staffId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId } = req.params;
    
    res.json({
      success: true,
      message: `Staff member ${staffId} deleted`,
      deleted_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to delete staff" });
  }
});

export default router;