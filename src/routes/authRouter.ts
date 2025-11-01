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

// Define your auth routes here
router.post(
  "/auth/register",
  registerBody,
  emailExists,
  handleBodyErrors,
  createAccount
);

router.post(
  "/auth/login",
  body("email").notEmpty().isEmail().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  loginEmailExists,
  handleBodyErrors,
  login
);

export default router;
