import mongoose from "mongoose";

export interface IRecipe extends mongoose.Document {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  category: string;
  image: string;
  author: mongoose.Types.ObjectId; // Reference to User model
  likes: mongoose.Types.ObjectId[]; // Array of references to User model
  favorites: mongoose.Types.ObjectId[]; // Array of references to User model
}

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  ingredients: [
    {
      type: String,
      required: true,
    },
  ],
  instructions: [
    {
      type: String,
      required: true,
    },
  ],
  category: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
    default: "",
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const Recipe = mongoose.model<IRecipe>("Recipe", recipeSchema);
export default Recipe;
