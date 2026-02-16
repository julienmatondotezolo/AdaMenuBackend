import { Router, Request, Response } from "express";
import { adminLimiter } from "../../middleware/rate-limit";
import { getSupabase } from "../../services/supabase";

const router = Router({ mergeParams: true });

router.use(adminLimiter);

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/planning/employees:
 *   get:
 *     summary: Get all employees for planning
 *     tags: [Staff Planning]
 */
router.get("/employees", async (req: Request, res: Response): Promise<void> => {
  try {
    const mockEmployees = [
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
        name: "Luca Rossi",
        role: "Waiter",
        email: "luca@losteria.be", 
        phone: "+32 56 77 88 99",
        availability: {
          monday: "unavailable",
          tuesday: { start: "17:00", end: "23:00" },
          wednesday: { start: "17:00", end: "23:00" },
          thursday: { start: "17:00", end: "23:00" },
          friday: { start: "17:00", end: "23:00" },
          saturday: { start: "17:00", end: "23:00" },
          sunday: { start: "17:00", end: "22:00" }
        },
        hourly_rate: 12.50,
        active: true
      }
    ];

    res.json(mockEmployees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch employees" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/planning/shifts:
 *   get:
 *     summary: Get shifts for a date range
 *     tags: [Staff Planning]
 */
router.get("/shifts", async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    
    // Generate mock shifts for the current week
    const mockShifts = [
      {
        id: "shift-1",
        employee_id: "emp-1",
        employee_name: "Marco Ferrari",
        role: "Head Chef",
        date: "2026-02-17",
        start_time: "09:00",
        end_time: "17:00",
        duration_hours: 8,
        status: "confirmed",
        notes: "Opening shift"
      },
      {
        id: "shift-2",
        employee_id: "emp-2", 
        employee_name: "Sofia Lombardi",
        role: "Sous Chef",
        date: "2026-02-17",
        start_time: "14:00",
        end_time: "22:00", 
        duration_hours: 8,
        status: "confirmed",
        notes: "Evening service"
      },
      {
        id: "shift-3",
        employee_id: "emp-3",
        employee_name: "Luca Rossi", 
        role: "Waiter",
        date: "2026-02-17",
        start_time: "17:00",
        end_time: "23:00",
        duration_hours: 6,
        status: "confirmed",
        notes: "Dinner service"
      },
      {
        id: "shift-4",
        employee_id: "emp-1",
        employee_name: "Marco Ferrari",
        role: "Head Chef", 
        date: "2026-02-18",
        start_time: "09:00",
        end_time: "17:00",
        duration_hours: 8,
        status: "draft",
        notes: ""
      }
    ];

    res.json(mockShifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch shifts" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/planning/shifts:
 *   post:
 *     summary: Create new shift
 *     tags: [Staff Planning]
 */
router.post("/shifts", async (req: Request, res: Response): Promise<void> => {
  try {
    const { employee_id, date, start_time, end_time, notes } = req.body;
    
    // Calculate duration
    const start = new Date(`${date}T${start_time}`);
    const end = new Date(`${date}T${end_time}`);
    const duration_hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    const newShift = {
      id: `shift-${Date.now()}`,
      employee_id,
      date,
      start_time,
      end_time,
      duration_hours: Math.round(duration_hours * 100) / 100,
      status: "draft",
      notes: notes || "",
      created_at: new Date().toISOString()
    };

    console.log("New shift created:", newShift);
    
    res.status(201).json(newShift);
  } catch (error) {
    console.error("Error creating shift:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to create shift" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/planning/shifts/{shiftId}:
 *   put:
 *     summary: Update shift
 *     tags: [Staff Planning]
 */
router.put("/shifts/:shiftId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { shiftId } = req.params;
    const updates = req.body;
    
    console.log(`Shift ${shiftId} updated with:`, updates);
    
    res.json({
      success: true,
      shift_id: shiftId,
      updates: updates,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating shift:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update shift" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/planning/shifts/{shiftId}:
 *   delete:
 *     summary: Delete shift
 *     tags: [Staff Planning]
 */
router.delete("/shifts/:shiftId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { shiftId } = req.params;
    
    console.log(`Shift ${shiftId} deleted`);
    
    res.json({
      success: true,
      shift_id: shiftId,
      deleted_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error deleting shift:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to delete shift" });
  }
});

/**
 * @swagger
 * /api/v1/restaurants/{restaurantId}/planning/templates:
 *   get:
 *     summary: Get recurring schedule templates
 *     tags: [Staff Planning]
 */
router.get("/templates", async (req: Request, res: Response): Promise<void> => {
  try {
    const mockTemplates = [
      {
        id: "template-1",
        name: "Standard Week",
        description: "Regular weekly schedule",
        shifts: [
          { day: "monday", employee_role: "Head Chef", start_time: "09:00", end_time: "17:00" },
          { day: "monday", employee_role: "Sous Chef", start_time: "14:00", end_time: "22:00" },
          { day: "tuesday", employee_role: "Head Chef", start_time: "09:00", end_time: "17:00" },
          { day: "tuesday", employee_role: "Sous Chef", start_time: "14:00", end_time: "22:00" }
        ],
        active: true
      },
      {
        id: "template-2",
        name: "Weekend Special",
        description: "Extended weekend hours", 
        shifts: [
          { day: "saturday", employee_role: "Head Chef", start_time: "10:00", end_time: "22:00" },
          { day: "saturday", employee_role: "Waiter", start_time: "17:00", end_time: "23:00" },
          { day: "sunday", employee_role: "Head Chef", start_time: "12:00", end_time: "22:00" }
        ],
        active: true
      }
    ];

    res.json(mockTemplates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch templates" });
  }
});

export default router;