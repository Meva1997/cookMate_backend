import { Request, Response } from "express";
import User from "../models/User";
import slug from "slug";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      const errorMessage = new Error("User not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    res.status(200).json({
      id: user._id,
      handle: user.handle,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { handle, name, email } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      const errorMessage = new Error("User not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    const handleSlug = slug(handle, "");
    const handleExists = await User.findOne({ handle: handleSlug });

    if (handleExists && handleExists._id.toString() !== userId) {
      const errorMessage = new Error("Handle already in use");
      return res.status(409).json({ error: errorMessage.message });
    }

    const emailExists = await User.findOne({ email });

    if (emailExists && emailExists._id.toString() !== userId) {
      const errorMessage = new Error("Email already in use");
      return res.status(409).json({ error: errorMessage.message });
    }

    if (
      user.handle === handleSlug &&
      user.email === email &&
      user.name === name
    ) {
      return res.status(200).json("No changes detected in profile");
    }

    user.handle = handle || handleSlug;
    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    res.status(200).json("User profile updated successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserRecipes = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("recipes");

    if (!user) {
      const errorMessage = new Error("User not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    if (user.recipes.length === 0) {
      return res
        .status(200)
        .json("No recipes found for this user, start creating some!");
    }

    res.status(200).json(user.recipes);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("favorites");

    if (!user) {
      const errorMessage = new Error("User not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    if (user.favorites.length === 0) {
      return res
        .status(200)
        .json("No favorites found for this user, start adding some!");
    }

    res.status(200).json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
