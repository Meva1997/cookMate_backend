import { validationResult } from "express-validator";
import { Request, Response } from "express";
import { NextFunction } from "express";

export function handleBodyErrors(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}
