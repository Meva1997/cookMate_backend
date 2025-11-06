jest.mock("slug", () => {
  const fn = (s: unknown) => String(s).toLowerCase().replace(/\s+/g, "-");
  // provide default export compatibility
  (fn as any).default = fn;
  return fn;
});

import request from "supertest";
import server from "../../server";
import { createAccount } from "../../handlers/authHandler";
// import { connectDB } from "../../config/db";

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
      handle: "cooklover",
      name: "John Doe",
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
      name: "John Doe",
      email: "user2@example.com",
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
      name: "John Doe",
      email: "user2@example.com",
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
      name: "John Doe",
      email: "user2@example.com",
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
      handle: "cooklover",
      name: "John Doe",
      email: "user@example.com",
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
      email: "cooklover2@example.com",
      password: "password",
      confirmPassword: "password",
    });

    expect(res.statusCode).toBe(201);
    // Expected: "User registered successfully"
    // Received: "\"User registered successfully\""
    expect(res.body).toEqual("User registered successfully");
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(409);
  });
});
