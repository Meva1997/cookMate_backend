import { Request, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import Recipe, { IRecipe } from "../models/Recipe";

declare global {
  namespace Express {
    interface Request {
      recipe?: IRecipe;
    }
  }
}

export const validateRecipeBody = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await body("title")
    .isString()
    .notEmpty()
    .withMessage("Title is required")
    .run(req);
  await body("description")
    .isString()
    .notEmpty()
    .withMessage("Description is required")
    .run(req);
  await body("ingredients")
    .isArray({ min: 1 })
    .withMessage("At least one ingredient is required")
    .run(req);
  await body("instructions")
    .isArray({ min: 1 })
    .withMessage("At least one instruction is required")
    .run(req);
  await body("category")
    .isString()
    .notEmpty()
    .withMessage("Category is required")
    .run(req);
  await body("author").isMongoId().withMessage("Invalid author ID").run(req);

  next();
};

export const validateParamId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await param("recipeId").isMongoId().withMessage("Invalid recipe ID").run(req);
  next();
};

export const findRecipeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      const errorMessage = new Error("Recipe not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    req.recipe = recipe;

    next();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
