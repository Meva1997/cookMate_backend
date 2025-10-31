import { Router } from "express";
import { createAccount, login } from "../handlers/authHandler";
import { body } from "express-validator";
import { handleBodyErrors } from "../middleware/bodyErrors";

const router = Router();

// Define your auth routes here
router.post(
  "/auth/register",
  body("handle").notEmpty().withMessage("Handle is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm Password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  handleBodyErrors,
  createAccount
);

router.post(
  "/auth/login",
  body("email").notEmpty().isEmail().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleBodyErrors,
  login
);

export default router;
