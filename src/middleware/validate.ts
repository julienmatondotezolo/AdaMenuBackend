import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Express middleware factory: validates req.body against a Zod schema.
 * On failure, returns 400 with structured error details.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodError = result.error;
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Request body validation failed",
        details: zodError.issues.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
          code: e.code,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
