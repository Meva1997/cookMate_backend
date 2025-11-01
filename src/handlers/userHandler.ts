import { Request, Response } from "express";
import User from "../models/User";
import slug from "slug";

export const getUserProfile = async (req: Request, res: Response) => {
  res.status(200).json({
    id: req.foundUser._id.toString(),
    handle: req.foundUser?.handle,
    name: req.foundUser?.name,
    email: req.foundUser?.email,
  });
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { handle, name, email } = req.body;

    const handleSlug = slug(handle, "");
    const handleExists = await User.findOne({ handle: handleSlug });

    if (handleExists && handleExists._id.toString() !== userId) {
      const errorMessage = new Error("Handle already in use");
      return res.status(409).json({ error: errorMessage.message });
    }

    if (
      req.foundUser.handle === handleSlug &&
      req.foundUser.email === email &&
      req.foundUser.name === name
    ) {
      return res.status(200).json("No changes detected in profile");
    }

    req.foundUser.handle = handle || handleSlug;
    req.foundUser.name = name || req.foundUser.name;
    req.foundUser.email = email || req.foundUser.email;

    await req.foundUser.save();

    res.status(200).json("User profile updated successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserRecipes = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("recipes");

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
