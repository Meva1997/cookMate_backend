import { Router } from "express";
import {
  addCommentToRecipe,
  deleteCommentFromRecipe,
  getCommentsByRecipeId,
} from "../handlers/commentHandler";
import { body, param } from "express-validator";
import { authenticateJWT } from "../middleware/authenticateJWT";

const router = Router();

router.get(
  "/recipes/:recipeId/comments",
  param("recipeId").isMongoId().withMessage("Invalid recipe ID"),
  getCommentsByRecipeId
);

router.post(
  "/recipes/:recipeId/comments",
  authenticateJWT,
  param("recipeId").isMongoId().withMessage("Invalid recipe ID"),
  body("text").isString().withMessage("Comment text is required"),
  addCommentToRecipe
);

router.delete(
  "/recipes/:recipeId/comments/:commentId",
  authenticateJWT,
  param("recipeId").isMongoId().withMessage("Invalid recipe ID"),
  param("commentId").isMongoId().withMessage("Invalid comment ID"),
  deleteCommentFromRecipe
);

export default router;
