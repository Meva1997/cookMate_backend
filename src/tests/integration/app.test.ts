jest.mock("slug", () => {
  const fn = (s: unknown) => String(s).toLowerCase().replace(/\s+/g, "-");
  // provide default export compatibility
  (fn as any).default = fn;
  return fn;
});

import request from "supertest";
import server from "../../server";
import User from "../../models/User";
import Recipe from "../../models/Recipe";
import mongoose from "mongoose";

// Global cleanup after all integration tests complete
afterAll(async () => {
  // Clean up both test users created during integration tests
  await User.deleteMany({
    $or: [
      { email: "cooklover2@email.com" }, // from auth registration tests
      { email: { $regex: /^integration-.*@example\.com$/ } }, // dynamic integration users
      { email: { $regex: /^updated-integration-.*@example\.com$/ } }, // updated integration users
    ],
  });
  // Clean up recipes created during integration tests (titles used in tests)
  await Recipe.deleteMany({
    title: {
      $in: [
        "Integration Test Recipe",
        "Fetch Test Recipe",
        "Update Test Recipe",
        "Updated Test Recipe",
      ],
    },
  });
});

describe("Authentication - Create User", () => {
  it("Should display validation errors for missing fields", async () => {
    const res = await request(server).post("/api/auth/register").send({});
    const createAccountMock = jest.spyOn(
      require("../../handlers/authHandler"),
      "createAccount"
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toHaveLength(5);
    expect(res.statusCode).not.toBe(201);
    expect(res.text).not.toEqual("User registered successfully");
    expect(createAccountMock).not.toHaveBeenCalled();
  });
  it("Should return status code 400 for invalid email", async () => {
    const res = await request(server).post("/api/auth/register").send({
      handle: "cooklover2",
      name: "cooklover2",
      email: "invalid-email",
      password: "password",
      confirmPassword: "password",
    });

    const createAccountMock = jest.spyOn(
      require("../../handlers/authHandler"),
      "createAccount"
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0]).toHaveProperty("msg", "Valid email is required");
    expect(createAccountMock).not.toHaveBeenCalled();
    expect(res.statusCode).not.toBe(201);
    expect(res.text).not.toEqual("User registered successfully");
  });
  it("Should return status code 400 if passwords do not match", async () => {
    const res = await request(server).post("/api/auth/register").send({
      handle: "cooklover2",
      name: "cooklover2",
      email: "cooklover2@email.com",
      password: "password",
      confirmPassword: "password2",
    });

    const createAccountMock = jest.spyOn(
      require("../../handlers/authHandler"),
      "createAccount"
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0]).toHaveProperty("msg", "Passwords do not match");
    expect(createAccountMock).not.toHaveBeenCalled();
    expect(res.statusCode).not.toBe(201);
    expect(res.text).not.toEqual("User registered successfully");
  });
  it("Should return status code 400 if password length < 8", async () => {
    const res = await request(server).post("/api/auth/register").send({
      handle: "cooklover2",
      name: "cooklover2",
      email: "cooklover2@email.com",
      password: "pass",
      confirmPassword: "pass",
    });

    const createAccountMock = jest.spyOn(
      require("../../handlers/authHandler"),
      "createAccount"
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0]).toHaveProperty(
      "msg",
      "Password must be at least 8 characters long"
    );
    expect(createAccountMock).not.toHaveBeenCalled();
    expect(res.statusCode).not.toBe(201);
    expect(res.text).not.toEqual("User registered successfully");
  });
  it("Should return status code 409 for existing handle", async () => {
    const res = await request(server).post("/api/auth/register").send({
      handle: "cooklover",
      name: "cooklover2",
      email: "cooklover2@email.com",
      password: "password",
      confirmPassword: "password",
    });

    const createAccountMock = jest.spyOn(
      require("../../handlers/authHandler"),
      "createAccount"
    );

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: "Handle already in use" });
    expect(createAccountMock).not.toHaveBeenCalled();
    expect(res.statusCode).not.toBe(201);
    expect(res.text).not.toEqual("User registered successfully");
  });
  it("Should return status code 409 for existing email", async () => {
    const res = await request(server).post("/api/auth/register").send({
      handle: "cooklover2",
      name: "cooklover2",
      email: "cooklover@email.com",
      password: "password",
      confirmPassword: "password",
    });

    const createAccountMock = jest.spyOn(
      require("../../handlers/authHandler"),
      "createAccount"
    );

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: "Email already in use" });
    expect(createAccountMock).not.toHaveBeenCalled();
    expect(res.statusCode).not.toBe(201);
    expect(res.text).not.toEqual("User registered successfully");
  });
  it("Should return status code 201 for successful registration", async () => {
    const res = await request(server).post("/api/auth/register").send({
      handle: "cooklover2",
      name: "cooklover2",
      email: "cooklover2@email.com",
      password: "password",
      confirmPassword: "password",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual("User registered successfully");
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(409);
  });
});

let token = String; // to store JWT for authenticated requests

describe("Authentication - Login User", () => {
  it("Should return status code 400 if email is not provided", async () => {
    const res = await request(server).post("/api/auth/login").send({
      email: "",
      password: "password",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Email is required" });
  });

  it("Should return status code 400 if password is not provided", async () => {
    const res = await request(server).post("/api/auth/login").send({
      email: "cooklover@email.com",
      password: "",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0]).toHaveProperty("msg", "Password is required");
  });

  it("Should return status code 404 if credentials are invalid", async () => {
    const res = await request(server).post("/api/auth/login").send({
      email: "email@email.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });

  it("Should return status code 200 and jwt for successful login", async () => {
    const res = await request(server).post("/api/auth/login").send({
      email: "cooklover2@email.com",
      password: "password",
    });

    token =
      typeof res.body === "string"
        ? res.body
        : res.body && (res.body.token || res.body);

    expect(res.statusCode).toBe(200);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });
});

let existingUserId: string; // to store user ID for user action tests

describe("Users - User actions", () => {
  //mock user to use for tests
  const unique = Date.now();
  const testEmail = `integration-${unique}@example.com`;
  const testHandle = `integrationUser${unique}`;

  beforeAll(async () => {
    // create a dedicated user for these integration tests
    await request(server).post("/api/auth/register").send({
      handle: testHandle,
      name: "Integration User",
      email: testEmail,
      password: "password",
      confirmPassword: "password",
    });

    const user = await User.findOne({ email: testEmail });
    existingUserId = user ? user._id.toString() : "";

    // Login to get a token for this user (use real auth flow)
    const loginRes = await request(server).post("/api/auth/login").send({
      email: testEmail,
      password: "password",
    });

    token =
      typeof loginRes.body === "string"
        ? loginRes.body
        : loginRes.body && (loginRes.body.token || loginRes.body);
  });

  // Note: cleanup handled by global afterAll hook

  it("Should return status code 404 if user is not found", async () => {
    // generate an ObjectId that won't exist
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(server).get(`/api/user/${fakeId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return status code 200 and user data for valid user", async () => {
    const res = await request(server).get(`/api/user/${existingUserId}`);

    expect(res.statusCode).toBe(200);
    // handler returns `id` (string) instead of `_id` — match the response shape
    expect(res.body).toHaveProperty("id", existingUserId);
    expect(res.body).toHaveProperty("email", testEmail);
    expect(res.body).toHaveProperty("name", "Integration User");
    // createAccount slugifies handle, so it will be lowercased
    expect(res.body).toHaveProperty("handle", testHandle.toLowerCase());

    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return status code 200 when updating user profile successfully", async () => {
    const res = await request(server)
      .put(`/api/user/${existingUserId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        handle: `${testHandle}Updated`,
        name: "Integration User Updated",
        email: `updated-${testEmail}`,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual("User profile updated successfully");

    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return status code 200 and an array of user recipes", async () => {
    const res = await request(server).get(
      `/api/user/${existingUserId}/recipes`
    );

    expect(res.statusCode).toBe(200);
    //If user has no recipes
    // "No recipes found for this user, start creating some!"
    expect(Array.isArray(res.body) || typeof res.body === "string").toBe(true);

    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });
});

describe("Recipes - Recipe actions", () => {
  it("Should return status code 200 and an array of all recipes", async () => {
    const res = await request(server).get("/api/recipes");

    expect(res.statusCode).toBe(200);
    //array may be empty if no recipes exist
    expect(Array.isArray(res.body)).toBe(true);

    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });
  it("Should return status code 201 when creating a recipe successfully", async () => {
    const res = await request(server)
      .post("/api/recipes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Integration Test Recipe",
        description: "This is a test recipe",
        ingredients: ["1 cup flour", "2 eggs", "1/2 cup sugar"],
        instructions: ["Mix ingredients", "Bake for 30 minutes"],
        category: "Dessert",
        author: existingUserId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual("Recipe created successfully");

    expect(res.statusCode).not.toBe(400);
    expect(res.body).not.toEqual("Invalid recipe data");
    expect(res.statusCode).not.toBe(401);
    expect(res.body).not.toEqual({ error: "Unauthorized" });

    expect(res.statusCode).not.toBe(500);
    expect(res.statusCode).not.toEqual({ error: "Internal server error" });
  });
  it("Should return status code 200 when fetching a recipe by id", async () => {
    // First, create a recipe to fetch
    const createRes = await request(server)
      .post("/api/recipes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Fetch Test Recipe",
        description: "This recipe is for fetch testing",
        ingredients: ["1 cup water", "1 tsp salt"],
        instructions: ["Boil water", "Add salt"],
        category: "Beverage",
        author: existingUserId,
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toEqual("Recipe created successfully");

    // determine created recipe id (handler may return message only)
    let createdId: string | undefined =
      (createRes.body && (createRes.body as any).id) ||
      (createRes.body && (createRes.body as any)._id);

    if (!createdId) {
      // fallback: list recipes and find the one we just created by title
      const listRes = await request(server).get("/api/recipes");
      const found = Array.isArray(listRes.body)
        ? listRes.body.find((r: any) => r.title === "Fetch Test Recipe")
        : undefined;
      createdId = found ? found.id || found._id : undefined;
    }

    expect(createdId).toBeDefined();

    // Now fetch the created recipe by ID
    const fetchRes = await request(server).get(`/api/recipes/${createdId}`);
    expect(fetchRes.statusCode).toBe(200);
    // handler may return `id` or `_id` depending on implementation — accept either
    const returnedId = fetchRes.body.id || fetchRes.body._id;
    expect(returnedId).toBeDefined();
    expect(returnedId.toString()).toBe(createdId.toString());
    expect(fetchRes.body).toHaveProperty("title", "Fetch Test Recipe");
    expect(fetchRes.statusCode).not.toBe(404);
    expect(fetchRes.statusCode).not.toBe(500);
  });

  it("Should return status code 200 when updating a recipe", async () => {
    // First, create a recipe to update
    const createRes = await request(server)
      .post("/api/recipes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Update Test Recipe",
        description: "This recipe is for update testing",
        ingredients: ["1 cup milk", "2 tbsp cocoa powder"],
        instructions: ["Mix ingredients", "Heat gently"],
        category: "Beverage",
        author: existingUserId,
      });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toEqual("Recipe created successfully");

    // determine created recipe id (handler may return message only)
    let createdId: string | undefined =
      (createRes.body && (createRes.body as any).id) ||
      (createRes.body && (createRes.body as any)._id);

    if (!createdId) {
      // fallback: list recipes and find the one we just created by title
      const listRes = await request(server).get("/api/recipes");
      const found = Array.isArray(listRes.body)
        ? listRes.body.find((r: any) => r.title === "Update Test Recipe")
        : undefined;
      createdId = found ? found.id || found._id : undefined;
    }

    expect(createdId).toBeDefined();

    // Now update the created recipe by ID
    const updateRes = await request(server)
      .put(`/api/recipes/${createdId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Test Recipe",
        description: "This recipe has been updated",
        ingredients: ["1 cup almond milk", "2 tbsp cocoa powder"],
        instructions: ["Mix ingredients thoroughly", "Heat gently"],
        category: "Beverage",
      });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body).toEqual("Recipe updated successfully");
    // In case of no changes detected
    expect(updateRes.body).not.toEqual(
      "No changes detected, recipe remains the same"
    );

    expect(updateRes.statusCode).not.toBe(400);
    expect(updateRes.statusCode).not.toBe(401);
    expect(updateRes.body).not.toEqual({
      error: "Unauthorized to update this recipe",
    });
    expect(updateRes.statusCode).not.toBe(403);
    expect(updateRes.statusCode).not.toBe(404);
    expect(updateRes.statusCode).not.toBe(500);
  });
  it("Should return status code 200 when deleting a recipe", async () => {
    //search for the recipe titled "Updated Test Recipe" to delete
    const listRes = await request(server).get("/api/recipes");
    const found = Array.isArray(listRes.body)
      ? listRes.body.find((r: any) => r.title === "Updated Test Recipe")
      : undefined;
    const createdId = found ? found.id || found._id : undefined;

    expect(createdId).toBeDefined();
    // Now delete the created recipe by ID
    const deleteRes = await request(server)
      .delete(`/api/recipes/${createdId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body).toEqual("Recipe deleted successfully");

    expect(deleteRes.statusCode).not.toBe(400);
    expect(deleteRes.statusCode).not.toBe(401);
    expect(deleteRes.statusCode).not.toBe(403);
    expect(deleteRes.statusCode).not.toBe(404);
    expect(deleteRes.statusCode).not.toBe(500);
  });
});
