import { Router } from "express";
import { createAccount, login } from "../handlers/authHandler";
import { body } from "express-validator";
import { handleBodyErrors } from "../middleware/bodyErrors";
import {
  emailExists,
  registerBody,
  loginEmailExists,
} from "../middleware/user";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterUser:
 *       type: object
 *       properties:
 *
 *         handle:
 *           type: string
 *           description: The user's unique handle
 *           example: cooklover
 *         name:
 *           type: string
 *           description: The user's name
 *           example: John Doe
 *         email:
 *           type: string
 *           description: The user's email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           description: The user's password
 *           example: password
 *         confirmPassword:
 *           type: string
 *           description: Confirmation of the user's password
 *           example: password
 *       required:
 *        - handle
 *        - name
 *        - email
 *        - password
 *        - confirmPassword
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *    summary: Register a new user
 *    tags:
 *      - Authentication
 *    description: Create a new user account
 *    requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *            type: object
 *            properties:
 *              handle:
 *                type: string
 *                example: cooklover
 *              name:
 *                type: string
 *                example: John Doe
 *              email:
 *                type: string
 *                example: user@example.com
 *              password:
 *                type: string
 *                example: password
 *              confirmPassword:
 *                type: string
 *                example: password
 *    responses:
 *      201:
 *        description: User registered successfully
 *        content:
 *          application/json:
 *            schema:
 *                $ref: '#/components/schemas/RegisterUser'
 *      400:
 *        description: Bad request - Missing or invalid fields, or passwords do not match
 *      409:
 *        description: Conflict - Email or handle already exists
 *      500:
 *        description: Internal Server Error
 */

// Define your auth routes here
router.post(
  "/auth/register",
  registerBody,
  emailExists,
  handleBodyErrors,
  createAccount
);

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginUser:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           description: The user's email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           description: The user's password
 *           example: password
 *       required:
 *         - email
 *         - password
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *    summary: Login an existing user
 *    tags:
 *      - Authentication
 *    description: Authenticate a user and return a JWT token
 *    requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                example: user@example.com
 *              password:
 *                type: string
 *                example: password
 *    responses:
 *      200:
 *        description: User logged in successfully
 *        content:
 *          application/json:
 *            schema:
 *                $ref: '#/components/schemas/LoginUser'
 *      400:
 *        description: Bad request - Missing or invalid fields
 *      401:
 *        description: Unauthorized - Invalid email or password
 *      404:
 *        description: Not Found - User not found
 *      500:
 *        description: Internal Server Error
 */

router.post(
  "/auth/login",
  body("email").notEmpty().isEmail().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  loginEmailExists,
  handleBodyErrors,
  login
);

export default router;
