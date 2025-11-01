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
import {
  findRecipeById,
  validateParamId,
  validateRecipeBody,
} from "../middleware/recipe";

const router = Router();

// Define your recipe routes here
router.param("recipeId", validateParamId);
router.param("recipeId", handleBodyErrors);

router.get("/recipes", getAllRecipes);

router.post(
  "/recipes",
  authenticateJWT,
  validateRecipeBody,
  handleBodyErrors,
  createRecipe
);

router.get("/recipes/:recipeId", findRecipeById, getRecipeById);

router.put(
  "/recipes/:recipeId",
  authenticateJWT,
  validateRecipeBody,
  findRecipeById,
  updateRecipe
);

router.delete("/recipes/:recipeId", authenticateJWT, deleteRecipe);

//? Recipe Actions like liking and favoriting

router.post(
  "/recipes/:recipeId/like",
  authenticateJWT,
  findRecipeById,
  likeRecipe
);
router.delete(
  "/recipes/:recipeId/like",
  authenticateJWT,
  findRecipeById,
  unlikeRecipe
);
router.post(
  "/recipes/:recipeId/favorite",
  authenticateJWT,
  findRecipeById,
  favoriteRecipe
);
router.delete(
  "/recipes/:recipeId/favorite",
  authenticateJWT,
  findRecipeById,
  unfavoriteRecipe
);

export default router;
