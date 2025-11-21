import mongoose from "mongoose";

export interface IComment extends mongoose.Document {
  recipe: mongoose.Types.ObjectId; // Reference to Recipe model
  author: mongoose.Types.ObjectId; // Reference to User model
  text: string;
  createdAt?: Date;
  authorImage?: string;
}

const commentSchema = new mongoose.Schema({
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recipe",
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  authorImage: {
    type: String,
    default: null,
  },
});

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
