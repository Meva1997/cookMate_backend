import mongoose, { Types } from "mongoose";

export interface IUser extends mongoose.Document {
  _id: Types.ObjectId;
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
      ref: "Recipe",
    },
  ],
});

const User = mongoose.model<IUser>("User", userSchema); // Create a Mongoose model named "User" using the userSchema
export default User;
