import { Request, Response, NextFunction } from "express";
import { param } from "express-validator";
import User, { IUser } from "../models/User";
import { Document } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;
      };
      foundUser?: IUser;
    }
  }
}

export const validateParamUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await param("userId")
    .isMongoId()
    .withMessage("Valid userId is required")
    .run(req);
  next();
};

export const userExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      const errorMessage = new Error("User not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    req.foundUser = user; // Attach the found user document to the request object

    next();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const emailExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const errorMessage = new Error("Email already in use");
      return res.status(409).json({ error: errorMessage.message });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
