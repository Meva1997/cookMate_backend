import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../utils/jwt";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyJWT(token);
    req.user = { id: decoded["_id"] }; // Attach user ID to request object
    next();
  } catch (error) {
    return res.status(403).json({ error: "Forbidden" });
  }
};
