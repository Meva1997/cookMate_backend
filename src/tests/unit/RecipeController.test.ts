import { createRequest, createResponse } from "node-mocks-http";
import { recipesMock } from "../mocks/recipe";
import {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "../../handlers/recipeHandler";
import Recipe from "../../models/Recipe";
import { findRecipeById } from "../../middleware/recipe";
import User from "../../models/User";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

jest.mock("../../models/Recipe", () => {
  const RecipeMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ _id: "mocked-recipe-id", ...data }),
    _id: "mocked-recipe-id",
  }));
  // If you also need static methods in other tests:
  (RecipeMock as any).find = jest.fn();
  (RecipeMock as any).findById = jest.fn();
  (RecipeMock as any).create = jest.fn();
  (RecipeMock as any).deleteOne = jest.fn();
  return RecipeMock;
});

jest.mock("../../models/User", () => ({
  findByIdAndUpdate: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (jwt.verify as jest.Mock).mockImplementation(() => ({
    id: "60d0fe4f5311236168a109ca",
    email: "test@example.com",
  }));
});

describe("RecipeController.getAll", () => {
  it("should return all 2 recipes", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/recipes",
    });

    const res = createResponse();

    (Recipe.find as jest.Mock).mockResolvedValue(recipesMock);

    await getAllRecipes(req, res);

    const data = res._getJSONData();

    expect(data).toHaveLength(2);
    expect(data).not.toHaveLength(0);

    expect(res.statusCode).toBe(200);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("should return a recipe by id", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/recipes",
      params: { recipeId: "6908b5849c50a864a0f0bb13" },
    });

    const res = createResponse();

    const recipe = recipesMock.find(
      (r) => r._id.toString() === req.params.recipeId
    );

    req.recipe = recipe as any;

    (Recipe.findById as jest.Mock).mockResolvedValue(recipe);

    await getRecipeById(req, res);

    const data = res._getJSONData();

    expect(data).toBeDefined();
    expect(data._id).toBe("6908b5849c50a864a0f0bb13");

    expect(res.statusCode).toBe(200);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("should return 0 recipes if not found with non-existent id", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/recipes",
      params: { recipeId: "6908b5849c50a864a0f0bb19" }, // ID que no existe
    });

    const res = createResponse();

    const recipe = recipesMock.find(
      (r) => r._id.toString() === req.params.recipeId
    );

    req.recipe = recipe as any;

    (Recipe.findById as jest.Mock).mockResolvedValue(recipe);

    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await findRecipeById(req, res, next);

    const data = res._getJSONData();

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(404);
    expect(data).toEqual({ error: "Recipe not found" });

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(500);
  });

  it("should handle errors when retrieving recipes", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/recipes",
    });

    const res = createResponse();

    (Recipe.find as jest.Mock).mockRejectedValue(new Error());
    await getAllRecipes(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ error: "Internal server error" });

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(404);
  });
});

describe("RecipeController.create", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should create a new recipe and respond with status 201", async () => {
    const mockRecipe = {
      create: jest.fn().mockResolvedValue(true),
    };

    (Recipe.create as jest.Mock).mockResolvedValue(mockRecipe);

    const req = createRequest({
      method: "POST",
      url: "/api/recipes",
      body: {
        title: "New Recipe",
        description: "A delicious new recipe",
        ingredients: ["Ingredient 1", "Ingredient 2"],
        instructions: ["Some instructions"],
        category: "Dinner",
        author: "60d0fe4f5311236168a109ca",
      },
    });

    const res = createResponse();

    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    await createRecipe(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(201);
    expect(data).toEqual("Recipe created successfully");
    const RecipeMock = Recipe as unknown as jest.Mock;
    expect(RecipeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Recipe",
        description: "A delicious new recipe",
        ingredients: ["Ingredient 1", "Ingredient 2"],
        instructions: ["Some instructions"],
        category: "Dinner",
        author: "60d0fe4f5311236168a109ca",
      })
    );

    const createdInstance = RecipeMock.mock.results[0].value;
    expect(createdInstance.save).toHaveBeenCalled();
    expect(createdInstance.save).toHaveBeenCalledTimes(1);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "60d0fe4f5311236168a109ca",
      { $push: { recipes: "mocked-recipe-id" } }
    );
    expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(1);

    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should handle errors during recipe creation", async () => {
    const RecipeMock = Recipe as unknown as jest.Mock;

    const saveMock = jest.fn().mockRejectedValue(new Error());

    RecipeMock.mockImplementationOnce((data) => ({
      ...data,
      save: saveMock,
      _id: "mocked-recipe-id",
    }));

    const req = createRequest({
      method: "POST",
      url: "/api/recipes",
      body: {
        title: "New Recipe",
        description: "A delicious new recipe",
        ingredients: ["Ingredient 1", "Ingredient 2"],
        instructions: ["Some instructions"],
        category: "Dinner",
        author: "60d0fe4f5311236168a109ca",
      },
    });

    const res = createResponse();

    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    await createRecipe(req, res);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });
    expect(saveMock).toHaveBeenCalled();
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();

    expect(res.statusCode).not.toBe(201);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(401);
  });
});

describe("RecipeController.update", () => {
  it("Should update an existing recipe and respond with status 200", async () => {
    const req = createRequest({
      method: "PUT",
      url: "/api/recipes",
      params: { recipeId: "6908b5849c50a864a0f0bb13" },
      body: {
        title: "Updated Recipe Title",
        description: "Updated description",
        ingredients: ["Updated Ingredient 1", "Updated Ingredient 2"],
        instructions: ["Updated instruction 1", "Updated instruction 2"],
        category: "Updated Category",
        author: "60d0fe4f5311236168a109ca",
      },
    });

    const res = createResponse();

    const recipe = recipesMock.find(
      (r) => r._id.toString() === req.params.recipeId
    );

    const updatedRecipe = { ...recipe, ...req.body };

    req.recipe = {
      ...recipe,
      save: jest.fn().mockResolvedValue(updatedRecipe),
    } as any;

    (Recipe.findById as jest.Mock).mockResolvedValue(req.recipe);

    await updateRecipe(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data).toEqual("Recipe updated successfully");

    expect(req.recipe.save).toHaveBeenCalled();
    expect(req.recipe.save).toHaveBeenCalledTimes(1);

    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should handle errors during recipe update", async () => {
    const req = createRequest({
      method: "PUT",
      url: "/api/recipes",
      params: { recipeId: "6908b5849c50a864a0f0bb13" },
      body: {
        title: "Updated Recipe Title",
        description: "Updated description",
        ingredients: ["Updated Ingredient 1", "Updated Ingredient 2"],
        instructions: ["Updated instruction 1", "Updated instruction 2"],
        category: "Updated Category",
        author: "60d0fe4f5311236168a109ca",
      },
    });

    const res = createResponse();

    const recipe = recipesMock.find(
      (r) => r._id.toString() === req.params.recipeId
    );

    req.recipe = {
      ...recipe,
      save: jest.fn().mockRejectedValue(new Error()),
    } as any;

    (Recipe.findById as jest.Mock).mockResolvedValue(req.recipe);

    await updateRecipe(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });

    expect(req.recipe.save).toHaveBeenCalled();

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(404);
  });
});

describe("RecipeController.delete", () => {
  it("Should delete an existing recipe and respond with status 200", async () => {
    const req = createRequest({
      method: "DELETE",
      url: "/api/recipes",
      params: { recipeId: "6908b5849c50a864a0f0bb13" },
      headers: {
        authorization: "Bearer token",
      },
    });

    const res = createResponse();

    const recipe = recipesMock.find(
      (r) => r._id.toString() === req.params.recipeId
    );

    req.user = { id: "60d0fe4f5311236168a109ca" } as any;

    req.recipe = {
      ...recipe,
      author: "60d0fe4f5311236168a109ca",
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    } as any;

    (Recipe.findById as jest.Mock).mockResolvedValue(req.recipe);

    await deleteRecipe(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data).toEqual("Recipe deleted successfully");

    expect(req.recipe.deleteOne).toHaveBeenCalled();
    expect(req.recipe.deleteOne).toHaveBeenCalledTimes(1);

    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(403);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });
  it("Should try to delete an existing recipe without authentication and return 403", async () => {
    const req = createRequest({
      method: "DELETE",
      url: "/api/recipes",
      params: { recipeId: "6908b5849c50a864a0f0bb13" },
    });

    const res = createResponse();

    const recipe = recipesMock.find(
      (r) => r._id.toString() === req.params.recipeId
    );

    (Recipe.findById as jest.Mock).mockResolvedValue(recipe);

    await deleteRecipe(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(403);
    expect(data).toEqual({ error: "Unauthorized to delete this recipe" });

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should try to delete a non-existing recipe and return 404", async () => {
    const req = createRequest({
      method: "DELETE",
      url: "/api/recipes",
      params: { recipeId: "6908b5849c50a864a0f0bb20" },
    });

    const res = createResponse();

    const recipe = recipesMock.find(
      (r) => r._id.toString() === req.params.recipeId
    );

    (Recipe.findById as jest.Mock).mockResolvedValue(recipe);

    await deleteRecipe(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(404);
    expect(data).toEqual({ error: "Recipe not found" });

    expect(data).not.toEqual("Recipe deleted successfully");
    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should handle errors during recipe deletion", async () => {
    const req = createRequest({
      method: "DELETE",
      url: "/api/recipes",
      params: { recipeId: "6908b5849c50a864a0f0bb13" },
    });

    const res = createResponse();

    const recipe = recipesMock.find(
      (r) => r._id.toString() === req.params.recipeId
    );
    req.user = { id: "60d0fe4f5311236168a109ca" } as any;

    req.recipe = {
      ...recipe,
      deleteOne: jest.fn().mockRejectedValue(new Error()),
    } as any;

    (Recipe.findById as jest.Mock).mockResolvedValue(req.recipe);

    await deleteRecipe(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });

    expect(req.recipe.deleteOne).toHaveBeenCalled();

    expect(data).not.toEqual("Recipe deleted successfully");
    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(404);
  });
});
