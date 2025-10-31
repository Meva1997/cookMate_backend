import mongoose from "mongoose";

export interface IComment {
  recipe: mongoose.Types.ObjectId; // Reference to Recipie model
  author: mongoose.Types.ObjectId; // Reference to User model
  text: string;
}

const commentSchema = new mongoose.Schema({
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recipie",
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
});

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
