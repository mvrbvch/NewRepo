import { Request, Response, NextFunction } from "express";
import { ensureDate } from "../utils/dateUtils";

/**
 * Middleware to parse date strings in request bodies
 */
export function dateParserMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.body) {
    // Parse common date fields
    if (req.body.dueDate) {
      req.body.dueDate = ensureDate(req.body.dueDate);
    }

    if (req.body.nextDueDate) {
      req.body.nextDueDate = ensureDate(req.body.nextDueDate);
    }
  }

  next();
}
