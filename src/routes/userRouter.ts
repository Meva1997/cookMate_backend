import { body, param } from "express-validator";
import { Router } from "express";
import { handleBodyErrors } from "../middleware/bodyErrors";
import {
  getUserFavorites,
  getUserProfile,
  getUserRecipes,
  updateUserProfile,
} from "../handlers/userHandler";

const router = Router();

router.get(
  "/user/:userId",
  param("userId").isString().withMessage("Valid userId is required"),
  handleBodyErrors,
  getUserProfile
);

router.put(
  "/user/:userId",
  param("userId").isString().withMessage("Valid userId is required"),
  body("handle").notEmpty().withMessage("Handle is required"),
  body("name").notEmpty().withMessage("Name is required"),
  body("email").notEmpty().isEmail().withMessage("Valid email is required"),
  handleBodyErrors,
  updateUserProfile
);

router.get(
  "/user/:userId/recipes",
  param("userId").isString().withMessage("Valid userId is required"),
  handleBodyErrors,
  getUserRecipes
);

router.get(
  "/user/:userId/favorites",
  param("userId").isString().withMessage("Valid userId is required"),
  handleBodyErrors,
  getUserFavorites
);

export default router;
