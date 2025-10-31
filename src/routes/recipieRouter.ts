import { Router } from "express";
import {
  createRecipe,
  deleteRecipe,
  favoriteRecipe,
  getAllRecipes,
  getRecipeById,
  likeRecipe,
  unfavoriteRecipe,
  unlikeRecipe,
  updateRecipe,
} from "../handlers/recipeHandler";
import { body, param } from "express-validator";
import { handleBodyErrors } from "../middleware/bodyErrors";
import { authenticateJWT } from "../middleware/authenticateJWT";

const router = Router();

// Define your recipe routes here

router.get("/recipes", getAllRecipes);

router.post(
  "/recipes",
  authenticateJWT,
  body("title").isString().notEmpty().withMessage("Title is required"),
  body("description")
    .isString()
    .notEmpty()
    .withMessage("Description is required"),
  body("ingredients")
    .isArray({ min: 1 })
    .withMessage("At least one ingredient is required"),
  body("instructions")
    .isArray({ min: 1 })
    .withMessage("At least one instruction is required"),
  body("category").isString().notEmpty().withMessage("Category is required"),
  body("author").isMongoId().withMessage("Invalid author ID"),
  handleBodyErrors,
  createRecipe
);

router.get(
  "/recipes/:recipeId",
  param("recipeId").isMongoId().withMessage("Invalid recipe ID"),
  getRecipeById
);

router.put(
  "/recipes/:recipeId",
  authenticateJWT,
  body("title")
    .isString()
    .notEmpty()
    .withMessage("Title must be a non-empty input"),
  body("description")
    .isString()
    .notEmpty()
    .withMessage("Description must be a non-empty input"),
  body("ingredients")
    .isArray({ min: 1 })
    .withMessage("Ingredients must be a non-empty input"),
  body("instructions")
    .isArray({ min: 1 })
    .withMessage("Instructions must be a non-empty input"),
  body("category")
    .isString()
    .notEmpty()
    .withMessage("Category must be a non-empty input"),
  body("author").isMongoId().withMessage("Invalid author ID"),
  handleBodyErrors,
  updateRecipe
);

router.delete(
  "/recipes/:recipeId",
  authenticateJWT,
  param("recipeId").isMongoId().withMessage("Invalid recipe ID"),
  handleBodyErrors,
  deleteRecipe
);

//? Recipe Actions like liking and favoriting

router.post("/recipes/:recipeId/like", likeRecipe);
router.delete("/recipes/:recipeId/like", unlikeRecipe);
router.post("/recipes/:recipeId/favorite", favoriteRecipe);
router.delete("/recipes/:recipeId/favorite", unfavoriteRecipe);

export default router;
