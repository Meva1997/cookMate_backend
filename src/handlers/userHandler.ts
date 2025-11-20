import { Request, Response } from "express";
import User from "../models/User";
import slug from "slug";
import Recipe from "../models/Recipe";
import formidable from "formidable";
import cloudinary from "../config/cloudinary";
import { v4 as uuid } from "uuid";

export const getUserProfile = async (req: Request, res: Response) => {
  res.status(200).json({
    id: req.foundUser._id.toString(),
    handle: req.foundUser?.handle,
    name: req.foundUser?.name,
    email: req.foundUser?.email,
    description: req.foundUser?.description,
    recipes: req.foundUser?.recipes,
    favorites: req.foundUser?.favorites,
  });
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? "20"), 10))
    );
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(),
      User.find({}, "_id handle name email description favorites recipes")
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const hasMore = page * limit < total;

    res.status(200).json({ users, page, limit, total, hasMore });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { handle, name, email, description } = req.body;

    const handleSlug = slug(handle, "");
    const handleExists = await User.findOne({ handle: handleSlug });

    if (handleExists && handleExists._id.toString() !== userId) {
      const errorMessage = new Error("Handle already in use");
      return res.status(409).json({ error: errorMessage.message });
    }

    if (
      req.foundUser.handle === handleSlug &&
      req.foundUser.email === email &&
      req.foundUser.name === name &&
      req.foundUser.description === description
    ) {
      return res.status(200).json("No changes detected in profile");
    }

    req.foundUser.handle = handle || handleSlug;
    req.foundUser.name = name || req.foundUser.name;
    req.foundUser.email = email || req.foundUser.email;
    req.foundUser.description = description || req.foundUser.description;

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

    if (!user) {
      const errorMessage = new Error("User not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    const favIds = Array.isArray(user.favorites) ? user.favorites : [];

    if (favIds.length === 0) {
      return res.status(200).json([]);
    }

    // Return all recipes whose ids are in the user's favorites.
    // Do not filter by likes — favorites should show regardless of like count.
    const recipes = await Recipe.find({ _id: { $in: favIds } }).lean();

    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addUserImage = async (req: Request, res: Response) => {
  const form = formidable({ multiples: false });

  try {
    form.parse(req, async (error, fields, files) => {
      const filesObj = files as any;
      // Try common field name 'file' first, otherwise take the first file entry available
      const fileEntryCandidate =
        filesObj?.file ?? Object.values(filesObj || {})[0];
      const fileItem = Array.isArray(fileEntryCandidate)
        ? fileEntryCandidate[0]
        : fileEntryCandidate;

      if (!fileItem || !fileItem.filepath) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      try {
        const result = await cloudinary.uploader.upload(fileItem.filepath, {
          folder: "cookMate-users",
          public_id: uuid(),
        });

        if (!result || !result.secure_url) {
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }

        // Persist the image url into the user document so it survives reloads
        const { userId } = req.params;
        if (!userId) {
          return res.status(400).json({ error: "Missing userId parameter" });
        }

        // Attempt to delete previous image from Cloudinary if present
        try {
          const existingUser = await User.findById(userId).lean();
          if (existingUser && existingUser.image) {
            // Try to extract the public_id from the existing URL. We expect it to include the folder 'cookMate-users'.
            const match = existingUser.image.match(
              /\/cookMate-users\/([^\.\/]+)(?:\.[a-z0-9]+)?$/i
            );
            let publicId: string | null = match
              ? `cookMate-users/${match[1]}`
              : null;

            // Fallback: take the last path segment if the first pattern didn't match
            if (!publicId) {
              const fallback = existingUser.image.match(
                /\/([^\.\/]+)(?:\.[a-z0-9]+)?$/i
              );
              if (fallback) {
                publicId = `cookMate-users/${fallback[1]}`;
              }
            }

            if (publicId) {
              try {
                await cloudinary.uploader.destroy(publicId);
              } catch (delErr) {
                // don't fail the upload if deletion of previous image fails
                console.warn(
                  "Failed to delete previous user image from Cloudinary",
                  delErr
                );
              }
            }
          }
        } catch (findErr) {
          console.warn(
            "Could not lookup existing user image for deletion",
            findErr
          );
        }

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { image: result.secure_url },
          { new: true }
        ).lean();

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        return res
          .status(200)
          .json({ imageUrl: result.secure_url, user: updatedUser });
      } catch (uploadErr) {
        const errorMessage = new Error("Image upload failed");
        return res.status(500).json({ error: errorMessage.message });
      }
    });
  } catch (error) {
    const errorMessage = new Error("Image upload failed");
    res.status(500).json({ error: errorMessage.message });
  }
};

export const getUserImage = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();

    if (!user || !user.image) {
      const errorMessage = new Error("User image not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    res.status(200).json({ imageUrl: user.image });
  } catch (error) {
    const errorMessage = new Error("Internal server error");
    res.status(500).json({ error: errorMessage.message });
  }
};
