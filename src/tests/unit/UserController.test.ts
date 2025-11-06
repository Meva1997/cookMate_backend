jest.mock("slug", () => {
  // commonjs mock compatible with ESM importers
  const fn = (s: unknown) => String(s).toLowerCase().replace(/\s+/g, "-");
  (fn as any).default = fn;
  return fn;
});

import { createRequest, createResponse } from "node-mocks-http";
import {
  getUserProfile,
  getUserRecipes,
  updateUserProfile,
} from "../../handlers/userHandler";
import { userExistsId } from "../../middleware/user";
import { usersMock } from "../mocks/user";
import User from "../../models/User";
import { authenticateJWT } from "../../middleware/authenticateJWT";
import { recipesMock } from "../mocks/recipe";

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock("../../models/User", () => {
  const UserMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ _id: "mocked-recipe-id", ...data }),
    _id: "mocked-recipe-id",
  }));
  // If you also need static methods in other tests:
  (UserMock as any).find = jest.fn();
  (UserMock as any).findById = jest.fn();
  (UserMock as any).findOne = jest.fn();
  (UserMock as any).findByIdAndUpdate = jest.fn();
  (UserMock as any).create = jest.fn();
  (UserMock as any).save = jest.fn();
  (UserMock as any).deleteOne = jest.fn();
  return UserMock;
});

describe("UserController - getUser", () => {
  it("should return user data for a valid user ID", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/user/{userId}",
      params: {
        userId: "60d0fe4f5311236168a109ca",
      },
    });

    const res = createResponse();

    const findUserByIdMock = usersMock.find(
      (user) => user._id.toString() === req.params.userId
    );

    (User.findById as jest.Mock).mockResolvedValue(findUserByIdMock);

    await userExistsId(req as any, res as any, () => {});

    await getUserProfile(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data).toHaveProperty("id", findUserByIdMock._id.toString());
    expect(data).toHaveProperty("handle", findUserByIdMock.handle);
    expect(data).toHaveProperty("name", findUserByIdMock.name);
    expect(data).toHaveProperty("email", findUserByIdMock.email);

    expect(res.statusCode).not.toBe(404);
    expect(data).not.toEqual({ error: "Internal server error" });
    expect(res.statusCode).not.toBe(500);
  });

  it("should return status code 404 for a non-existent user", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/user/{userId}",
      params: {
        userId: "60d0fe4f5311236168a109cc",
      },
    });

    const res = createResponse();

    const findUserByIdMock = usersMock.find(
      (user) => user._id.toString() === req.params.userId
    );

    (User.findById as jest.Mock).mockResolvedValue(findUserByIdMock);

    await userExistsId(req as any, res as any, () => {});

    const data = res._getJSONData();

    expect(res.statusCode).toBe(404);
    expect(data).toEqual({ error: "User not found" });

    expect(res.statusCode).not.toBe(200);
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("handle");
    expect(data).not.toHaveProperty("name");
    expect(data).not.toHaveProperty("email");
    expect(res.statusCode).not.toBe(500);
    expect(data).not.toEqual({ error: "Internal server error" });
  });

  it("should return status code 500 for a server error", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/user/{userId}",
      params: {
        userId: "60d0fe4f5311236168a109ca",
      },
    });
    const res = createResponse();

    (User.findById as jest.Mock).mockRejectedValue(new Error());

    await userExistsId(req as any, res as any, () => {});

    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });

    expect(res.statusCode).not.toBe(200);
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("handle");
    expect(data).not.toHaveProperty("name");
    expect(data).not.toHaveProperty("email");
    expect(res.statusCode).not.toBe(404);
    expect(data).not.toEqual({ error: "User not found" });
  });
});

describe("UserController - updateUserProfile by userId", () => {
  it("Should return status code 200 and updated user data for a valid update request", async () => {
    const req = createRequest({
      method: "PUT",
      url: "/api/user/{userId}",
      params: {
        userId: "60d0fe4f5311236168a109ca",
      },
      authorization: {
        bearer: "valid-token",
      },
      body: {
        name: "Jane Doe",
        handle: "foodie123",
        email: "jane.doe@example.com",
      },
    });

    const res = createResponse();

    const userDoc = usersMock.find(
      (user) => user._id.toString() === req.params.userId
    );

    // prepare a save mock we can assert later
    const saveMock = jest.fn().mockResolvedValue({
      _id: req.params.userId,
      handle: req.body.handle,
      name: req.body.name,
      email: req.body.email,
    });

    // findById returns a document-like object with save()
    (User.findById as jest.Mock).mockResolvedValue({
      ...userDoc,
      save: saveMock,
    });

    (User.findOne as jest.Mock).mockResolvedValue(null); // no handle conflict

    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
      _id: req.params.userId,
      ...req.body,
    });

    // simulate authenticated user
    req.user = { id: req.params.userId } as any;

    await userExistsId(req as any, res as any, () => {});

    await updateUserProfile(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data).toEqual("User profile updated successfully");
    expect(saveMock).toHaveBeenCalled();

    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return status code 401 for unauthorized user", async () => {
    const req = createRequest({
      method: "PUT",
      url: "/api/user/{userId}",
      params: {
        userId: "60d0fe4f5311236168a109ca",
      },
      body: {
        name: "Jane Doe",
        handle: "foodie123",
        email: "jane.doe@example.com",
      },
    });

    const res = createResponse();

    await authenticateJWT(req, res, () => {});

    const data = res._getJSONData();

    expect(res.statusCode).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });

    expect(res.statusCode).not.toBe(200);
    expect(data).not.toEqual("User profile updated successfully");
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });
  it("Should return status code 404 for user not found", async () => {
    const req = createRequest({
      method: "PUT",
      url: "/api/user/{userId}",
      params: {
        userId: "60d0fe4f5311236168a109cc",
      },
      body: {
        name: "Jane Doe",
        handle: "foodie123",
        email: "jane.doe@example.com",
      },
    });

    const res = createResponse();

    const findUserByIdMock = usersMock.find(
      (user) => user._id.toString() === req.params.userId
    );

    (User.findById as jest.Mock).mockResolvedValue(findUserByIdMock);

    await userExistsId(req as any, res as any, () => {});

    const data = res._getJSONData();

    expect(res.statusCode).toBe(404);
    expect(data).toEqual({ error: "User not found" });

    expect(res.statusCode).not.toBe(200);
    expect(data).not.toEqual("User profile updated successfully");
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return status code 500 for internal server error", async () => {
    const req = createRequest({
      method: "PUT",
      url: "/api/user/{userId}",
      params: {
        userId: "60d0fe4f5311236168a109cc",
      },
      authorization: {
        bearer: "valid-token",
      },
      body: {
        name: "Jane Doe",
        handle: "foodie123",
        email: "jane.doe@example.com",
      },
    });

    const res = createResponse();

    (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error());

    await updateUserProfile(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });

    expect(res.statusCode).not.toBe(200);
    expect(data).not.toEqual("User profile updated successfully");
    expect(res.statusCode).not.toBe(401);
    expect(data).not.toEqual({ error: "Unauthorized" });
    expect(res.statusCode).not.toBe(404);
    expect(data).not.toEqual({ error: "User not found" });
  });
});

describe("UserController - Get Recipes created by a User", () => {
  it("Should return status code 200 and user recipes for a valid user ID", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/user/{userId}/recipes",
      params: {
        userId: "60d0fe4f5311236168a109ca",
      },
    });

    const res = createResponse();

    const userDoc = usersMock.find(
      (user) => user._id.toString() === req.params.userId
    );

    const userRecipes = recipesMock.filter(
      (recipe) => recipe.author.toString() === req.params.userId
    );

    (User.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        ...userDoc,
        recipes: userRecipes,
      }),
    });

    await getUserRecipes(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data).toHaveLength(userRecipes.length);
    expect(data[0]).toHaveProperty("title", userRecipes[0].title);
    expect(data[0]).toHaveProperty("description", userRecipes[0].description);
    expect(data[0]).toHaveProperty("ingredients", userRecipes[0].ingredients);
    expect(data[0]).toHaveProperty("instructions", userRecipes[0].instructions);
    expect(data[0]).toHaveProperty("category", userRecipes[0].category);
    expect(String(data[0].author)).toBe(String(userRecipes[0].author));
    expect(data[0]).toHaveProperty("likes", userRecipes[0].likes);
    expect(data[0]).toHaveProperty("favorites", userRecipes[0].favorites);

    expect(res.statusCode).not.toBe(404);
    expect(data).not.toEqual({ error: "User not found" });
    expect(res.statusCode).not.toBe(500);
    expect(data).not.toEqual({ error: "Internal server error" });
  });

  it("Should return status code 404 for user not found", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/user/{userId}/recipes",
      params: {
        userId: "60d0fe4f5311236168a109cc",
      },
    });

    const res = createResponse();

    const userDoc = usersMock.find(
      (user) => user._id.toString() === req.params.userId
    );

    (User.findById as jest.Mock).mockResolvedValue(userDoc);

    await userExistsId(req as any, res as any, () => {});

    const data = res._getJSONData();

    expect(res.statusCode).toBe(404);
    expect(data).toEqual({ error: "User not found" });

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(500);
    expect(data).not.toEqual({ error: "Internal server error" });
  });

  it("Should return status code 500 for internal server error", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/user/{userId}/recipes",
      params: {
        userId: "60d0fe4f5311236168a109ca",
      },
    });

    const res = createResponse();
    await getUserRecipes(req, res);

    (User.findById as jest.Mock).mockRejectedValue(new Error());

    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(404);
    expect(data).not.toEqual({ error: "User not found" });
  });
});
