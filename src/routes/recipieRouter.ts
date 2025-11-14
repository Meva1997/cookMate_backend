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
  uploadRecipeImage,
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

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The recipe's unique ID
 *           example: 60d0fe4f5311236168a109cb
 *         title:
 *           type: string
 *           description: The title of the recipe
 *           example: Food Recipe
 *         description:
 *           type: string
 *           description: A brief description of the recipe
 *           example: A delicious and easy-to-make recipe.
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *           description: List of ingredients required for the recipe
 *           example: ["2 cups of flour", "1 cup of sugar", "1/2 cup of butter"]
 *         instructions:
 *           type: array
 *           items:
 *             type: string
 *           description: Step-by-step instructions to prepare the recipe
 *           example: ["Preheat the oven to 350°F (175°C).", "Mix all ingredients in a bowl.", "Bake for 30 minutes."]
 *         category:
 *           type: string
 *           description: The category of the recipe
 *           example: Dinner
 *         author:
 *           type: string
 *           description: The ID of the user who created the recipe
 *           example: 60d0fe4f5311236168a109ca
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: List of user IDs who liked the recipe
 *           example: ["60d0fe4f5311236168a109cc", "60d0fe4f5311236168a109cd"]
 *         favorites:
 *           type: array
 *           items:
 *             type: string
 *           description: List of user IDs who favorited the recipe
 *           example: ["60d0fe4f5311236168a109ce", "60d0fe4f5311236168a109cf"]
 *         __v:
 *           type: integer
 *           description: The version number of the recipe document
 *           example: 0
 */

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes
 *     tags:
 *       - Recipes
 *     description: Retrieve a list of all recipes
 *     responses:
 *       200:
 *         description: List of recipes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: No recipes found
 *       500:
 *         description: Internal server error
 */

router.get("/recipes", getAllRecipes);

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags:
 *       - Recipes
 *     description: Create a new recipe with the provided details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the recipe
 *                 example: Pasta Carbonara
 *               description:
 *                 type: string
 *                 description: A brief description of the recipe
 *                 example: A classic Italian pasta dish.
 *               ingredients:
 *                 type: array
 *                 description: List of ingredients required for the recipe
 *                 example: ["200g spaghetti", "100g pancetta", "2 large eggs", "50g pecorino cheese", "Black pepper"]
 *               instructions:
 *                 type: array
 *                 description: Step-by-step instructions to prepare the recipe
 *                 example: ["Cook the spaghetti according to package instructions.", "Fry the pancetta until crispy.", "Beat the eggs and mix with cheese.", "Combine everything and season with black pepper."]
 *               category:
 *                 type: string
 *                 description: The category of the recipe
 *                 example: Dinner
 *               author:
 *                 type: string
 *                 description: The ID of the user who is creating the recipe
 *                 example: 60d0fe4f5311236168a109ca
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       500:
 *         description: Internal server error
 */

router.post(
  "/recipes",
  authenticateJWT,
  validateRecipeBody,
  handleBodyErrors,
  createRecipe
);

/**
 * @swagger
 * /api/recipes/{recipeId}:
 *   get:
 *     summary: Get a recipe by ID
 *     tags:
 *       - Recipes
 *     description: Retrieve a specific recipe by its ID
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe to retrieve
 *         example: 6908b5849c50a864a0f0bb13
 *     responses:
 *       200:
 *         description: Recipe retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Internal server error
 */

router.get("/recipes/:recipeId", findRecipeById, getRecipeById);

/**
 * @swagger
 * /api/recipes/{recipeId}:
 *   put:
 *     summary: Author update a recipe by ID
 *     tags:
 *       - Recipes
 *     description: Update a specific recipe by its ID. Only the author of the recipe can perform this action.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe to update
 *         example: 6908b5849c50a864a0f0bb13
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the recipe
 *                 example: Updated Pasta Carbonara
 *               description:
 *                 type: string
 *                 description: A brief description of the recipe
 *                 example: An updated classic Italian pasta dish.
 *               ingredients:
 *                 type: array
 *                 description: List of ingredients required for the recipe
 *                 example: ["250g spaghetti", "150g pancetta", "2 large eggs", "70g pecorino cheese", "Black pepper"]
 *               instructions:
 *                 type: array
 *                 description: Step-by-step instructions to prepare the recipe
 *                 example: ["Cook the spaghetti according to package instructions.", "Fry the pancetta until crispy.", "Beat the eggs and mix with cheese.", "Combine everything and season with black pepper."]
 *               category:
 *                 type: string
 *                 description: The category of the recipe
 *                 example: Dinner
 *               author:
 *                 type: string
 *                 description: The ID of the user who is updating the recipe
 *                 example: 60d0fe4f5311236168a109ca
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - user is not the author of the recipe
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Internal server error
 */

router.put(
  "/recipes/:recipeId",
  authenticateJWT,
  validateRecipeBody,
  findRecipeById,
  updateRecipe
);

/**
 * @swagger
 * /api/recipes/{recipeId}:
 *   delete:
 *     summary: Delete a recipe by ID
 *     tags:
 *       - Recipes
 *     description: Delete a specific recipe by its ID. Only the author of the recipe can perform this action.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe to delete
 *         example: 6908b5849c50a864a0f0bb13
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - user is not the author of the recipe
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Internal server error
 */

router.delete("/recipes/:recipeId", authenticateJWT, deleteRecipe);

//? Recipe action for uploading images

router.post(
  "/recipes/:recipeId/upload-image",
  authenticateJWT,
  findRecipeById,
  uploadRecipeImage
);

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
