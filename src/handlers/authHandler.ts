import { Request, Response } from "express";
import slug from "slug";
import User from "../models/User";
import { comparePassword, hashPassword } from "../utils/auth";
import { genereateJWT } from "../utils/jwt";

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { password, handle, confirmPassword } = req.body;

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
    const { password } = req.body;

    if (!password) {
      const errorMessage = new Error("Password is required");
      return res.status(400).json({ error: errorMessage.message });
    }

    const isPasswordValid = await comparePassword(
      password,
      req.foundUser.password
    );

    if (!isPasswordValid) {
      const errorMessage = new Error("Invalid password");
      return res.status(401).json({ error: errorMessage.message });
    }

    const payload = {
      _id: req.foundUser._id,
      handle: req.foundUser.handle,
      email: req.foundUser.email,
    };

    const token = genereateJWT(payload);

    res.status(200).json({ token, user: payload });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      const errorMessage = new Error("User not authenticated");
      return res.status(401).json({ error: errorMessage.message });
    }

    const user = await User.findById(userId).lean(); // Use lean() for a plain JavaScript object

    if (!user) {
      const errorMessage = new Error("User not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    const payload = {
      id: user._id,
      handle: user.handle,
      email: user.email,
    };

    return res.status(200).json({ user: payload });
  } catch (error) {
    const errorMessage = new Error("Internal server error");
    return res.status(500).json({ error: errorMessage.message });
  }
};
