import { Router } from "express";
import {
  addCommentToRecipe,
  deleteCommentFromRecipe,
  getCommentsByRecipeId,
} from "../handlers/commentHandler";
import { body } from "express-validator";
import { authenticateJWT } from "../middleware/authenticateJWT";
import {
  validateRecipeIdParam,
  validateCommentIdParam,
} from "../middleware/comment";
import { handleBodyErrors } from "../middleware/bodyErrors";

const router = Router();

// router.param("recipeId", validateRecipeIdParam);
// router.param("commentId", validateCommentIdParam);

router.get(
  "/recipes/:recipeId/comments",
  validateRecipeIdParam,
  handleBodyErrors,
  getCommentsByRecipeId
);

router.post(
  "/recipes/:recipeId/comments",
  authenticateJWT,
  validateRecipeIdParam,
  body("text").isString().withMessage("Comment text is required"),
  handleBodyErrors,
  addCommentToRecipe
);

router.delete(
  "/recipes/:recipeId/comments/:commentId",
  authenticateJWT,
  validateRecipeIdParam,
  validateCommentIdParam,
  handleBodyErrors,
  deleteCommentFromRecipe
);

export default router;
