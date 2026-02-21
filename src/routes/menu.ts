import { Router, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { compressImageForGPT } from "../utils/image";
import { generateMenuTemplate } from "../services/openai";

const router = Router();

// Multer config — store in memory for processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file
  },
});

/**
 * POST /api/menu/generate-template
 *
 * Takes a photo of a physical menu page and generates a MenuProject JSON
 * that can be imported into the menumaker.
 *
 * Input: multipart/form-data
 *   - photo: image file
 *   - restaurantName: string (optional)
 *   - pageFormat: "A4" | "A5" (default "A4")
 */
router.post(
  "/generate-template",
  upload.any(),
  async (req: Request, res: Response): Promise<void> => {
    const requestId = randomUUID().slice(0, 8);
    console.log(`[${requestId}] POST /api/menu/generate-template`);

    try {
      // Extract the photo file
      const files = req.files as Express.Multer.File[];
      const photoFile = files?.find((f) => f.fieldname === "photo");

      if (!photoFile) {
        res.status(400).json({
          error: "Missing required field: photo",
          message: "Please upload a menu photo as 'photo' field.",
        });
        return;
      }

      console.log(
        `[${requestId}] Received photo: ${photoFile.originalname} (${(
          photoFile.size /
          1024 /
          1024
        ).toFixed(2)}MB, ${photoFile.mimetype})`
      );

      // Extract optional fields
      const restaurantName = req.body?.restaurantName as string | undefined;
      const pageFormat = (req.body?.pageFormat as "A4" | "A5") || "A4";

      if (pageFormat !== "A4" && pageFormat !== "A5") {
        res.status(400).json({
          error: "Invalid pageFormat",
          message: 'pageFormat must be "A4" or "A5".',
        });
        return;
      }

      console.log(
        `[${requestId}] Restaurant: ${restaurantName || "(not specified)"}, Format: ${pageFormat}`
      );

      // Compress image for GPT Vision (1024px max)
      console.log(`[${requestId}] Compressing image for GPT Vision...`);
      const imageBase64 = await compressImageForGPT(photoFile.buffer, 1024);
      console.log(
        `[${requestId}] Compressed to base64 (${(imageBase64.length / 1024).toFixed(1)}KB)`
      );

      // Call GPT-4o Vision to generate template
      console.log(`[${requestId}] Sending to GPT-4o Vision for analysis...`);
      const startTime = Date.now();

      const menuProject = await generateMenuTemplate(
        imageBase64,
        restaurantName,
        pageFormat
      );

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${requestId}] GPT response received in ${elapsed}s`);

      // Return the generated MenuProject JSON
      res.json({
        success: true,
        data: menuProject,
        meta: {
          requestId,
          generationTime: `${elapsed}s`,
          pageFormat,
          restaurantName: restaurantName || null,
        },
      });
    } catch (error: any) {
      console.error(`[${requestId}] Error:`, error.message || error);

      // Handle specific OpenAI errors
      if (error.code === "insufficient_quota") {
        res.status(429).json({
          error: "API quota exceeded",
          message: "OpenAI API quota has been exceeded. Please try again later.",
        });
        return;
      }

      if (error.code === "rate_limit_exceeded") {
        res.status(429).json({
          error: "Rate limit exceeded",
          message: "Too many requests. Please wait a moment and try again.",
        });
        return;
      }

      res.status(500).json({
        error: "Template generation failed",
        message: error.message || "An unexpected error occurred during menu analysis.",
        requestId,
      });
    }
  }
);

export default router;
