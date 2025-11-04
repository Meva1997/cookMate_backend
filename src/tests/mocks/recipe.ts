import { Types } from "mongoose";

export const recipesMock = [
  {
    _id: new Types.ObjectId("6908b5849c50a864a0f0bb13"),
    title: "Pasta Carbonara",
    description: "A classic Italian pasta dish.",
    ingredients: [
      "200g spaghetti",
      "100g pancetta",
      "2 large eggs",
      "50g pecorino cheese",
      "Black pepper",
    ],
    instructions: [
      "Boil the pasta.",
      "Fry the pancetta.",
      "Mix eggs and cheese.",
      "Combine everything and season.",
    ],
    category: "Dinner",
    author: new Types.ObjectId("60d0fe4f5311236168a109ca"),
    likes: [],
    favorites: [],
    __v: 0,
  },
  {
    _id: new Types.ObjectId("6908b5849c50a864a0f0bb14"),
    title: "Chicken Curry",
    description: "Spicy and flavorful chicken curry.",
    ingredients: [
      "500g chicken breast",
      "2 onions",
      "3 garlic cloves",
      "2 tbsp curry powder",
      "400ml coconut milk",
    ],
    instructions: [
      "Sauté onions and garlic.",
      "Add chicken and brown.",
      "Stir in curry powder.",
      "Pour coconut milk and simmer.",
    ],
    category: "Dinner",
    author: new Types.ObjectId("60d0fe4f5311236168a109cb"),
    likes: [],
    favorites: [],
    __v: 0,
  },
];
