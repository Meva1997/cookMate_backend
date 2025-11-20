import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import formidable from "formidable";
import { v4 as uuid } from "uuid";
import Recipe from "../models/Recipe";
import User from "../models/User";
import cloudinary from "../config/cloudinary";

export const getAllRecipes = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? "20"), 10))
    );
    const skip = (page - 1) * limit;

    const [total, recipes] = await Promise.all([
      Recipe.countDocuments(),
      Recipe.find()
        .populate({ path: "author", select: "name id" })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const hasMore = page * limit < total;

    // const recipies = await Recipe.find()
    //   .populate({ path: "author", select: "name id" })
    //   .lean();
    res.status(200).json({ recipes, page, limit, total, hasMore });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createRecipe = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      ingredients,
      instructions,
      category,
      image,
      author,
    } = req.body;

    const newRecipe = new Recipe({
      title,
      description,
      ingredients,
      instructions,
      category,
      image,
      author,
    });

    await newRecipe.save();

    await User.findByIdAndUpdate(author, {
      $push: { recipes: newRecipe._id },
    });

    res.status(201).json("Recipe created successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRecipeById = async (req: Request, res: Response) => {
  res.status(200).json(req.recipe);
};

export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const updateData = req.body;

    // Only author can update the recipe
    // Handle cases where `req.recipe.author` may be an ObjectId, a populated user object,
    // or a string. Also tolerate `req.user.id` or `req.user._id`.
    const recipeAuthorRaw = req.recipe.author;
    const recipeAuthorId = recipeAuthorRaw
      ? typeof recipeAuthorRaw === "object"
        ? String(recipeAuthorRaw._id ?? recipeAuthorRaw.id ?? recipeAuthorRaw)
        : String(recipeAuthorRaw)
      : "";
    // const currentUserId = String(req.user?.id ?? (req.user as any)?._id ?? "");
    const currentUserId = String(req.user?.id);

    if (!currentUserId || recipeAuthorId !== currentUserId) {
      // helpful debug log for development (remove or lower log level in production)
      // console.warn("Unauthorized update attempt", {
      //   recipeAuthorId,
      //   currentUserId,
      //   recipeAuthorRaw,
      //   user: req.user,
      // });
      const errorMessage = new Error("Unauthorized to update this recipe");
      return res.status(403).json({ error: errorMessage.message });
    }

    let hasChanges = false;
    for (const key in updateData) {
      if (JSON.stringify(req.recipe[key]) !== JSON.stringify(updateData[key])) {
        hasChanges = true;
        break; // Exit loop early if a change is detected
      }
    }

    if (!hasChanges) {
      return res
        .status(200)
        .json("No changes detected, recipe remains the same");
    }

    try {
      const prevImage: string = req.recipe.image;
      const newImage: string = updateData.image;

      if (prevImage && newImage && prevImage !== newImage) {
        // if you stored public_id separately use that; here we try to extract it from the URL
        const match = prevImage.match(/\/recipes\/([^\.\/]+)(?:\.[a-z0-9]+)?$/);
        const publicId = match ? `recipes/${match[1]}` : null;
        if (publicId) {
          // ignore errors from cloudinary deletion
          await cloudinary.uploader.destroy(publicId).catch(() => {});
        }
      }
    } catch (error) {
      const errorMessage = new Error("Previous image deletion failed");
      res.status(500).json({ error: errorMessage.message });
    }

    Object.assign(req.recipe, updateData); // Merge updateData into the existing recipe

    await req.recipe.save();

    res.status(200).json("Recipe updated successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      const errorMessage = new Error("Recipe not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    if (recipe.author.toString() !== req.user?.id) {
      const errorMessage = new Error("Unauthorized to delete this recipe");
      return res.status(403).json({ error: errorMessage.message });
    }

    try {
      if (recipe.image) {
        // if you stored public_id separately use that; here we try to extract it from the URL
        const match = recipe.image.match(
          /\/recipes\/([^\.\/]+)(?:\.[a-z0-9]+)?$/
        );
        const publicId = match ? `recipes/${match[1]}` : null;
        if (publicId) {
          // ignore errors from cloudinary deletion
          await cloudinary.uploader.destroy(publicId).catch(() => {});
        }
      }
    } catch (err) {
      // don't fail deletion if cloudinary removal fails
      console.warn("Cloudinary delete failed", err);
    }

    await recipe.deleteOne();

    await User.findByIdAndUpdate(recipe.author, {
      $pull: { recipes: recipe._id },
    });

    await User.updateMany(
      { favorites: recipe._id },
      { $pull: { favorites: recipe._id } }
    );

    await User.updateMany(
      { "likedRecipes.recipeId": recipe._id },
      { $pull: { likedRecipes: { recipeId: recipe._id } } }
    );

    res.status(200).json("Recipe deleted successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

//? Recipe Actions like liking and favoriting

export const likeRecipe = async (req: Request, res: Response) => {
  try {
    const recipeId = (req.params as any).recipeId ?? (req.params as any).id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // prefer recipe from middleware if available
    const recipe = req.recipe ?? (await Recipe.findById(recipeId));
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    if (
      !recipe.likes.some((u: any) => u.toString() === userObjectId.toString())
    ) {
      recipe.likes.push(userObjectId);
      await recipe.save();
    }

    res.status(200).json({ likes: recipe.likes.length });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unlikeRecipe = async (req: Request, res: Response) => {
  try {
    const recipeId = (req.params as any).recipeId ?? (req.params as any).id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const recipe = req.recipe ?? (await Recipe.findById(recipeId));
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    recipe.likes = recipe.likes.filter((uid) => uid.toString() !== userId);
    await recipe.save();

    res.status(200).json({ likes: recipe.likes.length });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const favoriteRecipe = async (req: Request, res: Response) => {
  try {
    const recipeId = (req.params as any).recipeId ?? (req.params as any).id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const recipe = req.recipe ?? (await Recipe.findById(recipeId));
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    if (
      !recipe.favorites.some(
        (u: any) => u.toString() === userObjectId.toString()
      )
    ) {
      recipe.favorites.push(userObjectId);
      await recipe.save();
    }

    // Also add this recipe id to the user's favorites array
    try {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { favorites: recipe._id },
      });
    } catch (e) {
      // don't fail the request if updating the user's favorites fails
      console.warn("Failed to update user favorites", e);
    }

    res.status(200).json({ favorites: recipe.favorites.length });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unfavoriteRecipe = async (req: Request, res: Response) => {
  try {
    const recipeId = (req.params as any).recipeId ?? (req.params as any).id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const recipe = req.recipe ?? (await Recipe.findById(recipeId));
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    recipe.favorites = recipe.favorites.filter(
      (uid) => uid.toString() !== userId
    );
    await recipe.save();

    // Also remove this recipe id from the user's favorites array
    try {
      await User.findByIdAndUpdate(userId, {
        $pull: { favorites: recipe._id },
      });
    } catch (e) {
      // don't fail the request if updating the user's favorites fails
      console.warn("Failed to remove recipe from user favorites", e);
    }

    res.status(200).json({ favorites: recipe.favorites.length });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadRecipeImage = async (req: Request, res: Response) => {
  const form = formidable({ multiples: false });

  try {
    form.parse(req, (error, fields, files) => {
      cloudinary.uploader.upload(
        files.file[0].filepath,
        { folder: "recipes", public_id: uuid() },
        async (err, result) => {
          if (err) {
            const errorMessage = new Error("Cloudinary upload failed");
            return res.status(500).json({ error: errorMessage.message });
          }
          if (result) {
            return res.status(200).json({ imageUrl: result.secure_url });
          }
        }
      );
    });
  } catch (error) {
    const errorMessage = new Error("Image upload failed");
    res.status(500).json({ error: errorMessage.message });
  }
};
