import { Request, Response, NextFunction } from "express";
import { param } from "express-validator";

export const validateRecipeIdParam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await param("recipeId").isMongoId().withMessage("Invalid recipe ID").run(req);
  next();
};

export const validateCommentIdParam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await param("commentId")
    .isMongoId()
    .withMessage("Invalid comment ID")
    .run(req);
  next();
};
