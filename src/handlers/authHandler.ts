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

    const isPasswordValid = await comparePassword(
      password,
      req.foundUser.password
    );

    if (!isPasswordValid) {
      const errorMessage = new Error("Invalid password");
      return res.status(401).json({ error: errorMessage.message });
    }

    const token = genereateJWT({
      _id: req.foundUser._id,
      handle: req.foundUser.handle,
      email: req.foundUser.email,
    });

    res.status(200).json(token);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
