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

router.get("/user/:userId", getUserProfile);

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

router.get("/user/:userId/recipes", getUserRecipes);

router.get("/user/:userId/favorites", getUserFavorites);

export default router;
