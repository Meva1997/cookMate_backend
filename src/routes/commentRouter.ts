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

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the comment
 *           example: "60c72b2f9b1d8e001c8e4b8a"
 *         recipe:
 *           type: string
 *           description: ID of the recipe the comment belongs to
 *           example: "60c72b2f9b1d8e001c8e4b89"
 *         author:
 *           type: object
 *           description: ID and handle of the user who authored the comment
 *           example: { id: "60c72b2f9b1d8e001c8e4b8b", handle: "john_doe" }
 *         text:
 *           type: string
 *           description: The content of the comment
 *           example: "This recipe is amazing!"
 */

/**
 * @swagger
 * /api/recipes/{recipeId}/comments:
 *   get:
 *     summary: Get comments for a specific recipe
 *     tags:
 *       - Comments
 *     description: Retrieve all comments associated with a specific recipe
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         description: The ID of the recipe to retrieve comments for
 *         schema:
 *           type: string
 *           example: "60c72b2f9b1d8e001c8e4b89"
 *     responses:
 *       200:
 *         description: A list of comments for the specified recipe or an empty array if none exist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Internal server error
 */

router.get(
  "/recipes/:recipeId/comments",
  validateRecipeIdParam,
  handleBodyErrors,
  getCommentsByRecipeId
);

/**
 * @swagger
 * /api/recipes/{recipeId}/comments:
 *   post:
 *     summary: Add a comment to a specific recipe
 *     tags:
 *       - Comments
 *     description: Add a new comment to a specific recipe. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         description: The ID of the recipe to add a comment to
 *         schema:
 *           type: string
 *           example: "60c72b2f9b1d8e001c8e4b89"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The content of the comment
 *                 example: "This recipe is amazing!"
 *     responses:
 *       201:
 *         description: Comment successfully added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         description: Unauthorized, authentication required
 *       500:
 *         description: Internal server error
 */

router.post(
  "/recipes/:recipeId/comments",
  authenticateJWT,
  validateRecipeIdParam,
  body("text").isString().withMessage("Comment text is required"),
  handleBodyErrors,
  addCommentToRecipe
);

/**
 * @swagger
 * /api/recipes/{recipeId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment from a specific recipe
 *     tags:
 *       - Comments
 *     description: Delete a comment from a specific recipe. Requires authentication and must be the comment's author.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         description: The ID of the recipe the comment belongs to
 *         schema:
 *           type: string
 *           example: "60c72b2f9b1d8e001c8e4b89"
 *       - in: path
 *         name: commentId
 *         required: true
 *         description: The ID of the comment to delete
 *         schema:
 *           type: string
 *           example: "60c72b2f9b1d8e001c8e4b8a"
 *     responses:
 *       200:
 *         description: Comment successfully deleted
 *       400:
 *         description: Bad request, comment does not belong to the specified recipe
 *       401:
 *         description: Unauthorized, authentication required
 *       403:
 *         description: Forbidden, insufficient permissions
 *       404:
 *         description: Not found, comment does not exist
 *       500:
 *         description: Internal server error
 */

router.delete(
  "/recipes/:recipeId/comments/:commentId",
  authenticateJWT,
  validateRecipeIdParam,
  validateCommentIdParam,
  handleBodyErrors,
  deleteCommentFromRecipe
);

export default router;
