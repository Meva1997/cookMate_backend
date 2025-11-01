import { Request, Response } from "express";
import Comment from "../models/Comment";

export const getCommentsByRecipeId = async (req: Request, res: Response) => {
  try {
    const { recipeId } = req.params;

    const comments = await Comment.find({ recipe: recipeId })
      .populate("author", "handle")
      .sort({ createdAt: -1 }); // Latest comments first

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addCommentToRecipe = async (req: Request, res: Response) => {
  try {
    const { recipeId } = req.params;
    const { text } = req.body;

    const newComment = new Comment({
      recipe: recipeId,
      text,
      author: req.user?.id,
    });

    await newComment.save();
    res.status(201).json("Comment added successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.error(error);
  }
};

export const deleteCommentFromRecipe = async (req: Request, res: Response) => {
  try {
    const { recipeId, commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      const errorMessage = new Error("Comment not found");
      return res.status(404).json({ error: errorMessage.message });
    }

    // Check if the comment belongs to the specified recipe
    if (comment.recipe.toString() !== recipeId) {
      const errorMessage = new Error(
        "Comment does not belong to the specified recipe"
      );
      return res.status(400).json({ error: errorMessage.message });
    }

    // Check if the requesting user is the author of the comment
    if (comment.author.toString() !== req.user?.id) {
      const errorMessage = new Error("Unauthorized to delete this comment");
      return res.status(403).json({ error: errorMessage.message });
    }

    await comment.deleteOne();

    res.status(200).json("Comment deleted successfully");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
