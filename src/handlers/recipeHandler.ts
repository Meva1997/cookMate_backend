import { Request, Response } from "express";
import Recipe from "../models/Recipe";
import User from "../models/User";
import mongoose from "mongoose";

export const getAllRecipes = async (req: Request, res: Response) => {
  try {
    const recipies = await Recipe.find();
    res.status(200).json(recipies);
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
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      const errorMessage = new Error("Recipe not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const { recipeId } = req.params;
    const updateData = req.body;

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      const errorMessage = new Error("Recipe not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    //Only author can update the recipe
    if (recipe.author.toString() !== req.user?.id) {
      const errorMessage = new Error("Unauthorized to update this recipe");
      return res.status(403).json({ error: errorMessage.message });
    }

    let hasChanges = false;
    for (const key in updateData) {
      if (JSON.stringify(recipe[key]) !== JSON.stringify(updateData[key])) {
        hasChanges = true;
        break; // Exit loop early if a change is detected
      }
    }

    if (!hasChanges) {
      return res
        .status(200)
        .json("No changes detected, recipie remains the same");
    }

    Object.assign(recipe, updateData); // Merge updateData into the existing recipe

    await recipe.save();

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

    await recipe.deleteOne();

    res.status(200).json("Recipe deleted successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

//? Recipe Actions like liking and favoriting

export const likeRecipe = async (req: Request, res: Response) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      const errorMessage = new Error("Recipe not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    const userObjectId = new mongoose.Types.ObjectId(req.user?.id);

    // Check if user has already liked the recipe
    if (recipe.likes.some((like) => like.equals(userObjectId))) {
      const errorMessage = new Error("Recipe already liked");
      return res.status(400).json({ error: errorMessage.message });
    }

    recipe.likes.push(userObjectId);
    await recipe.save();

    res.status(200).json("Recipe liked successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unlikeRecipe = async (req: Request, res: Response) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      const errorMessage = new Error("Recipe not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    const userObjectId = new mongoose.Types.ObjectId(req.user?.id);

    // Check if user has liked the recipe
    if (!recipe.likes.some((like) => like.equals(userObjectId))) {
      const errorMessage = new Error("Recipe not liked yet");
      return res.status(400).json({ error: errorMessage.message });
    }

    recipe.likes = recipe.likes.filter((like) => !like.equals(userObjectId));
    await recipe.save();

    res.status(200).json("Recipe unliked successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const favoriteRecipe = async (req: Request, res: Response) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user?.id;

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      const errorMessage = new Error("Recipe not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if user has already favorited the recipe
    if (recipe.favorites.some((favorite) => favorite.equals(userObjectId))) {
      const errorMessage = new Error("Recipe already favorited");
      return res.status(400).json({ error: errorMessage.message });
    }

    recipe.favorites.push(userObjectId);
    await recipe.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { favorites: recipe._id },
    });

    res.status(200).json("Recipe favorited successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unfavoriteRecipe = async (req: Request, res: Response) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user?.id;

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      const errorMessage = new Error("Recipe not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if user has favorited the recipe
    if (!recipe.favorites.some((favorite) => favorite.equals(userObjectId))) {
      const errorMessage = new Error("Recipe not favorited yet");
      return res.status(400).json({ error: errorMessage.message });
    }

    recipe.favorites = recipe.favorites.filter(
      (favorite) => !favorite.equals(userObjectId)
    );
    await recipe.save();

    await User.findByIdAndUpdate(userId, {
      $pull: { favorites: recipe._id },
    });

    res.status(200).json("Recipe unfavorited successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
