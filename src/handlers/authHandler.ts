import { Request, Response } from "express";
import slug from "slug";
import User from "../models/User";
import { comparePassword, hashPassword } from "../utils/auth";
import { genereateJWT } from "../utils/jwt";

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { email, password, handle, confirmPassword } = req.body;

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      const errorMessage = new Error("Email already in use");
      return res.status(409).json({ error: errorMessage.message });
    }

    const handleSlug = slug(handle, "");
    const handleExists = await User.findOne({ handle: handleSlug });

    if (handleExists) {
      const errorMessage = new Error("Handle already in use");
      return res.status(409).json({ error: errorMessage.message });
    }

    if (password !== confirmPassword) {
      const errorMessage = new Error("Passwords do not match");
      return res.status(409).json({ error: errorMessage.message });
    }

    const user = new User(req.body);
    user.password = await hashPassword(password);
    user.handle = handleSlug;
    await user.save();

    res.status(201).json("User registered successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      const errorMessage = new Error("User not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      const errorMessage = new Error("Invalid password");
      return res.status(401).json({ error: errorMessage.message });
    }

    const token = genereateJWT({
      id: user._id,
      handle: user.handle,
      email: user.email,
    });

    res.status(200).json(token);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
