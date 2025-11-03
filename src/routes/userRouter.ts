import { body, param } from "express-validator";
import { Router } from "express";
import { handleBodyErrors } from "../middleware/bodyErrors";
import {
  getUserFavorites,
  getUserProfile,
  getUserRecipes,
  updateUserProfile,
} from "../handlers/userHandler";
import { authenticateJWT } from "../middleware/authenticateJWT";
import {
  emailExists,
  userExistsId,
  validateParamUserId,
} from "../middleware/user";

const router = Router();

router.param("userId", validateParamUserId);
router.param("userId", userExistsId);

/**
 * @swagger
 * components:
 *  schemas:
 *    UserProfile:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *         description: The user's unique ID
 *         example: 60d0fe4f5311236168a109ca
 *       handle:
 *           type: string
 *           description: The user's unique handle
 *           example: cooklover
 *       name:
 *           type: string
 *           description: The user's name
 *           example: John Doe
 *       email:
 *           type: string
 *           description: The user's email address
 *           example: user@example.com
 */

/**
 * @swagger
 * /api/user/{userId}:
 *   get:
 *     summary: Get user profile by ID
 *     tags:
 *        - Users
 *     description: Retrieve the profile information of a user by their ID
 *     parameters:
 *      - in: path
 *        name: userId
 *        description: ID of the user to retrieve
 *        required: true
 *        schema:
 *          type: string
 *        example: 6906472297471b72a45bb1b4
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error or invalid user ID
 */

router.get("/user/:userId", getUserProfile);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/user/{userId}:
 *   put:
 *     summary: Update user profile
 *     tags:
 *       - Users
 *     description: Update the profile information of a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         description: ID of the user to update
 *         required: true
 *         schema:
 *           type: string
 *         example: 6906472297471b72a45bb1b4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               handle:
 *                 type: string
 *                 description: The user's unique handle
 *                 example: cooklover
 *               name:
 *                 type: string
 *                 description: The user's name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 description: The user's email address
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: User profile updated successfully or no changes made
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error or invalid user ID
 */

router.put(
  "/user/:userId",
  authenticateJWT,
  body("handle").notEmpty().withMessage("Handle is required"),
  body("name").notEmpty().withMessage("Name is required"),
  body("email").notEmpty().isEmail().withMessage("Valid email is required"),
  emailExists,
  handleBodyErrors,
  updateUserProfile
);

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRecipe:
 *       type: object
 *       properties:
 *        _id:
 *          type: string
 *          description: The recipe's unique ID
 *          example: 690625c622a3fccd708689d9
 *        title:
 *          type: string
 *          description: The title of the recipe
 *          example: Food
 *        description:
 *          type: string
 *          description: A brief description of the recipe
 *          example: This is a test recipe
 *        ingredients:
 *          type: array
 *          items:
 *            type: string
 *          description: The ingredients required for the recipe
 *          example: [ "ingredient1", "ingredient2" ]
 *        instructions:
 *          type: array
 *          items:
 *            type: string
 *          description: The step-by-step instructions to prepare the recipe
 *          example: [ "step1", "step2" ]
 *        category:
 *          type: string
 *          description: The category of the recipe
 *          example: Dinner
 *        author:
 *          type: string
 *          description: The ID of the user who created the recipe
 *          example: 6906259b22a3fccd708689d6
 *        likes:
 *          type: array
 *          items:
 *            type: string
 *          description: The users who liked the recipe
 *          example: []
 *        favorites:
 *          type: array
 *          items:
 *            type: string
 *          description: The users who favorited the recipe
 *          example: []
 *        __v:
 *          type: integer
 *          description: The version number of the recipe document
 *          example: 1
 */

/**
 * @swagger
 * /api/user/{userId}/recipes:
 *   get:
 *     summary: Get recipes created by a user
 *     tags:
 *       - Users
 *     description: Retrieve a list of recipes created by the specified user
 *     parameters:
 *       - in: path
 *         name: userId
 *         description: ID of the user whose recipes to retrieve
 *         required: true
 *         schema:
 *           type: string
 *         example: 6906472297471b72a45bb1b4
 *     responses:
 *       200:
 *         description: List of recipes retrieved successfully or empty list if none found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error or invalid user ID
 */

router.get("/user/:userId/recipes", getUserRecipes);

router.get("/user/:userId/favorites", getUserFavorites);

export default router;
