// Mocks MUST be declared before importing the module under test
jest.mock("slug", () => {
  // commonjs mock compatible with ESM importers
  const fn = (s: unknown) => String(s).toLowerCase().replace(/\s+/g, "-");
  (fn as any).default = fn;
  return fn;
});

jest.mock("../../models/User", () => {
  const UserMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ _id: "mocked-user-id", ...data }),
    _id: "mocked-user-id",
  }));
  (UserMock as any).findOne = jest.fn();
  (UserMock as any).create = jest.fn();
  return UserMock;
});

jest.mock("../../utils/auth", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashed-password"),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../utils/jwt", () => ({
  // usa el nombre exacto que exporta tu módulo
  genereateJWT: jest.fn().mockReturnValue("mocked-jwt-token"),
}));

import { createRequest, createResponse } from "node-mocks-http";
import User from "../../models/User";
import { hashPassword } from "../../utils/auth";
import { createAccount, login } from "../../handlers/authHandler";
import { handleBodyErrors } from "../../middleware/bodyErrors";
import {
  emailExists,
  loginEmailExists,
  registerBody,
} from "../../middleware/user";
import { usersMock } from "../mocks/user";
import { body } from "express-validator";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AuthController - createAccount", () => {
  it("should create a new user account successfully", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue({
      _id: "60d0fe4f5311236168a109ca",
      handle: "cooklover",
      email: "john@example.com",
    });

    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        handle: "cooklover",
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
    });

    const res = createResponse();

    (User.findOne as jest.Mock).mockResolvedValue(null);

    await createAccount(req, res);

    const data = res._getJSONData();

    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(res.statusCode).toBe(201);
    expect(data).toEqual("User registered successfully");
    expect(User.findOne).toHaveBeenCalledWith({ handle: "cooklover" });
    expect(User.findOne).toHaveBeenCalled();

    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(409);
    expect(res.statusCode).not.toBe(500);
  });

  it("should return status code 400 if handle is missing", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        handle: "",
        name: "John Doe",
        email: "email@email.com",
        password: "password",
        confirmPassword: "password",
      },
    });

    const res = createResponse();

    await registerBody(req as any, res as any, () => {});

    await handleBodyErrors(req, res, () => {});

    const data = res._getJSONData();

    expect(data).toHaveProperty("errors");
    expect(data.errors[0].msg).toBe("Handle is required");
    expect(data.errors).toHaveLength(1);
    expect(res.statusCode).toBe(400);

    expect(data).not.toEqual("User registered successfully");
    expect(res.statusCode).not.toBe(201);
    expect(res.statusCode).not.toBe(409);
    expect(res.statusCode).not.toBe(500);
  });

  it("should return status code 400 if email is invalid", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        handle: "cooklover",
        name: "John Doe",
        email: "invalid-email",
        password: "password",
        confirmPassword: "password",
      },
    });

    const res = createResponse();

    await registerBody(req as any, res as any, () => {});

    await handleBodyErrors(req, res, () => {});

    const data = res._getJSONData();

    expect(data).toHaveProperty("errors");
    expect(data.errors[0].msg).toBe("Valid email is required");
    expect(data.errors).toHaveLength(1);
    expect(res.statusCode).toBe(400);

    expect(data).not.toEqual("User registered successfully");
    expect(res.statusCode).not.toBe(201);
    expect(res.statusCode).not.toBe(409);
    expect(res.statusCode).not.toBe(500);
  });

  it("should return status code 400 if name is missing", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        handle: "cooklover",
        name: "",
        email: "email@email.com",
        password: "password",
        confirmPassword: "password",
      },
    });

    const res = createResponse();

    await registerBody(req as any, res as any, () => {});

    await handleBodyErrors(req, res, () => {});

    const data = res._getJSONData();

    expect(data).toHaveProperty("errors");
    expect(data.errors[0].msg).toBe("Name is required");
    expect(data.errors).toHaveLength(1);
    expect(res.statusCode).toBe(400);

    expect(data).not.toEqual("User registered successfully");
    expect(res.statusCode).not.toBe(201);
    expect(res.statusCode).not.toBe(409);
    expect(res.statusCode).not.toBe(500);
  });

  it("should return status code 400 if password is missing or passwords do not match", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        handle: "cooklover",
        name: "John Doe",
        email: "email@email.com",
        password: "",
        confirmPassword: "password",
      },
    });

    const res = createResponse();

    await registerBody(req as any, res as any, () => {});

    await handleBodyErrors(req, res, () => {});

    const data = res._getJSONData();

    expect(data).toHaveProperty("errors");
    expect(data.errors[0].msg).toBe(
      "Password must be at least 8 characters long"
    );
    expect(data.errors[1].msg).toBe("Passwords do not match");
    expect(data.errors).toHaveLength(2);
    expect(res.statusCode).toBe(400);

    expect(data).not.toEqual("User registered successfully");
    expect(res.statusCode).not.toBe(201);
    expect(res.statusCode).not.toBe(409);
    expect(res.statusCode).not.toBe(500);
  });

  it("should return status code 409 if handle already exists", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        handle: "cooklover",
        name: "John Doe",
        email: "email@email.com",
        password: "password123",
        confirmPassword: "password123",
      },
    });

    const res = createResponse();

    const findUser = usersMock.find((user) => user.handle === req.body.handle);

    (User.findOne as jest.Mock).mockResolvedValue(findUser);

    await createAccount(req, res);

    const data = res._getJSONData();

    expect(data).toEqual({ error: "Handle already in use" });
    expect(res.statusCode).toBe(409);

    expect(data).not.toEqual("User registered successfully");
    expect(res.statusCode).not.toBe(201);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(500);
  });

  it("should return status code 409 if email already exists", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: { handle: "newhandle", email: "john@example.com" },
    });
    const res = createResponse();
    const next = jest.fn();

    const existingUser = usersMock.find((u) => u.email === "john@example.com");

    // Si antes se comprueba handle: primera llamada null, segunda devuelve usuario por email
    (User.findOne as jest.Mock).mockResolvedValueOnce(existingUser); // check email -> existe

    await emailExists(req as any, res as any, next);

    const data = res._getJSONData();

    expect(data).toEqual({ error: "Email already in use" });
    expect(res.statusCode).toBe(409);

    expect(data).not.toEqual("User registered successfully");
    expect(res.statusCode).not.toBe(201);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(500);
  });

  it("should return status code 500 on server error", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        handle: "cooklover",
        name: "John Doe",
        email: "email@email.com",
        password: "password123",
        confirmPassword: "password123",
      },
    });

    const res = createResponse();

    (User.findOne as jest.Mock).mockRejectedValue(new Error());
    await createAccount(req, res);

    const data = res._getJSONData();

    expect(data).toEqual({ error: "Internal server error" });
    expect(res.statusCode).toBe(500);

    expect(data).not.toEqual("User registered successfully");
    expect(data).not.toEqual({ error: "Handle already in use" });
    expect(data).not.toEqual({ error: "Email already in use" });
    expect(res.statusCode).not.toBe(201);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(409);
  });
});

describe("AuthController - login", () => {
  it("Should login successfully and return a JWT token", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "john@example.com",
        password: "hashed-password",
      },
    });

    const res = createResponse();

    const findUser = usersMock.find((user) => user.email === req.body.email);

    req.foundUser = findUser as any;

    (User.findOne as jest.Mock).mockResolvedValue(findUser);

    await login(req, res);

    const dataRaw = res._getData();

    expect(res.statusCode).toBe(200);
    expect(typeof dataRaw === "string").toBe(true);
    expect(dataRaw).toBe('"mocked-jwt-token"');

    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return 400 if missing or invalid fields", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "invalid-email",
        password: "",
      },
    });

    const res = createResponse();

    // run the same validators used in the router
    await body("email")
      .notEmpty()
      .isEmail()
      .withMessage("Email is required")
      .run(req);
    await body("password")
      .notEmpty()
      .withMessage("Password is required")
      .run(req);

    await handleBodyErrors(req, res, () => {});

    const data = res._getJSONData();

    expect(data).toHaveProperty("errors");
    expect(data.errors).toHaveLength(2);
    expect(data.errors[0].msg).toBe("Email is required");
    expect(data.errors[1].msg).toBe("Password is required");
    expect(res.statusCode).toBe(400);

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return 401 if email does not exist (user not found)", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "wrong@example.com",
        password: "hashed-password",
      },
    });

    const res = createResponse();

    const findUser = usersMock.find((user) => user.email === req.body.email);

    (User.findOne as jest.Mock).mockResolvedValue(findUser);

    req.foundUser = findUser as any;

    // Simula que la contraseña no coincide
    const { comparePassword } = require("../../utils/auth");
    (comparePassword as jest.Mock).mockResolvedValue(true);

    await loginEmailExists(req as any, res as any, () => {});

    const data = res._getJSONData();
    expect(data).toEqual({ error: "User not found" });
    expect(res.statusCode).toBe(404);

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return 401 if password is incorrect", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "john@example.com",
        password: "wrong-password",
      },
    });

    const res = createResponse();

    const findUser = usersMock.find((user) => user.email === req.body.email);

    (User.findOne as jest.Mock).mockResolvedValue(findUser);

    req.foundUser = findUser as any;

    // Simula que la contraseña no coincide
    const { comparePassword } = require("../../utils/auth");
    (comparePassword as jest.Mock).mockResolvedValue(false);

    await loginEmailExists(req as any, res as any, () => {});

    await login(req, res);

    await handleBodyErrors(req, res, () => {});

    const data = res._getJSONData();

    expect(data).toEqual({ error: "Invalid password" });
    expect(res.statusCode).toBe(401);

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return 404 if user not found in loginEmailExists middleware", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "wrong@example.com",
        password: "hashed-password",
      },
    });

    const res = createResponse();

    const findUser = usersMock.find((user) => user.email === req.body.email);

    (User.findOne as jest.Mock).mockResolvedValue(findUser);

    req.foundUser = findUser as any;

    await loginEmailExists(req as any, res as any, () => {});

    const data = res._getJSONData();
    expect(data).toEqual({ error: "User not found" });
    expect(res.statusCode).toBe(404);

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(500);
  });

  it("Should return 500 on server error", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "john@example.com",
        password: "hashed-password",
      },
    });

    const res = createResponse();

    (User.findOne as jest.Mock).mockRejectedValue(new Error());

    await login(req, res);

    const data = res._getJSONData();

    expect(data).toEqual({ error: "Internal server error" });
    expect(res.statusCode).toBe(500);

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(404);
  });
});
