import mongoose from "mongoose";

export interface IUser {
  handle: string;
  name: string;
  email: string;
  password: string;
  favorites: string[];
  recipes: string[];
}

//User schema definition

const userSchema = new mongoose.Schema({
  handle: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  favorites: [
    {
      type: String,
    },
  ],
  recipes: [
    {
      type: String,
      ref: "Recipie",
    },
  ],
});

const User = mongoose.model<IUser>("User", userSchema); // Create a Mongoose model named "User" using the userSchema
export default User;
