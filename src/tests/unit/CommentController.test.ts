jest.mock("slug", () => {
  // commonjs mock compatible with ESM importers
  const fn = (s: unknown) => String(s).toLowerCase().replace(/\s+/g, "-");
  (fn as any).default = fn;
  return fn;
});

jest.mock("../../models/Comment", () => {
  const CommentMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ _id: "mocked-recipe-id", ...data }),
    _id: "mocked-recipe-id",
  }));
  // If you also need static methods in other tests:
  (CommentMock as any).find = jest.fn();
  (CommentMock as any).findById = jest.fn();
  (CommentMock as any).findOne = jest.fn();
  (CommentMock as any).findByIdAndUpdate = jest.fn();
  (CommentMock as any).create = jest.fn();
  (CommentMock as any).save = jest.fn();
  (CommentMock as any).deleteOne = jest.fn();
  return CommentMock;
});

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

import { createRequest, createResponse } from "node-mocks-http";
import { commentsMock } from "../mocks/comment";
import Comment from "../../models/Comment";
import {
  addCommentToRecipe,
  deleteCommentFromRecipe,
  getCommentsByRecipeId,
} from "../../handlers/commentHandler";
import { body } from "express-validator";
import { handleBodyErrors } from "../../middleware/bodyErrors";
import { authenticateJWT } from "../../middleware/authenticateJWT";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CommentController - getCommentsByRecipeId", () => {
  it("should get a comment by recipe id", async () => {
    const req = createRequest({
      method: "GET",
      url: "api/recipes/6908b5849c50a864a0f0bb13/comments",
      params: {
        recipeId: "6908b5849c50a864a0f0bb13",
      },
    });

    const res = createResponse();

    const findCommentsByRecipeIdMock = commentsMock.filter(
      (comment) => comment.recipe === req.params.recipeId
    );

    (Comment.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(findCommentsByRecipeIdMock),
      }),
    });

    // await validateRecipeIdParam(req as any, res as any, () => {});

    await getCommentsByRecipeId(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data).toEqual(findCommentsByRecipeIdMock);
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual({
      _id: "60c72b2f9b1d8e001c8e4b8a",
      recipe: "6908b5849c50a864a0f0bb13",
      author: { id: "60d0fe4f5311236168a109ca", handle: "john_doe" },
      text: "This recipe is amazing!",
    });

    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(500);
  });
  it("should return status code 500 for server error", async () => {
    const req = createRequest({
      method: "GET",
      url: "api/recipes/6908b5849c50a864a0f0bb13/comments",
      params: {
        recipeId: "6908b5849c50a864a0f0bb13",
      },
    });

    const res = createResponse();

    (Comment.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error()),
      }),
    });

    await getCommentsByRecipeId(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });

    expect(res.statusCode).not.toBe(200);
  });

  describe("CommentController - addCommentToRecipe", () => {
    it("Should create a comment and return 201 status", async () => {
      const req = createRequest({
        method: "POST",
        url: "/api/recipes/60d0fe4f5311236168a109ca/comments",
        params: {
          recipeId: "60d0fe4f5311236168a109ca",
        },
        authorization: {
          bearer: "mocked-jwt-token",
        },
        body: {
          text: "This is a test comment",
        },
      });

      const res = createResponse();

      (Comment.create as jest.Mock).mockResolvedValue({
        _id: "mocked-comment-id",
        recipe: req.params.recipeId,
        author: { id: "mocked-user-id", handle: "john_doe" },
        text: req.body.text,
      });

      req.user = { id: "mocked-user-id", handle: "john_doe" } as any;

      await addCommentToRecipe(req, res);

      const data = res._getJSONData();

      expect(res.statusCode).toBe(201);
      expect(data).toBeDefined();
      expect(data).toEqual("Comment added successfully");

      expect(res.statusCode).not.toBe(400);
      expect(res.statusCode).not.toBe(401);
      expect(res.statusCode).not.toBe(500);
    });

    it("Should return status code 400 for invalid input", async () => {
      const req = createRequest({
        method: "POST",
        url: "/api/recipes/60d0fe4f5311236168a109ca/comments",
        params: {
          recipeId: "60d0fe4f5311236168a109ca",
        },
        authorization: {
          bearer: "mocked-jwt-token",
        },
        body: {
          text: "", // Invalid input: empty text
        },
      });
      const res = createResponse();

      req.user = { id: "mocked-user-id", handle: "john_doe" } as any;

      await body("text")
        .notEmpty()
        .withMessage("Comment text is required")
        .run(req);

      await handleBodyErrors(req, res, () => {});

      const data = res._getJSONData();

      expect(res.statusCode).toBe(400);
      expect(data).toBeDefined();
      expect(data.errors).toBeInstanceOf(Array);
      expect(data.errors[0].msg).toBe("Comment text is required");

      expect(res.statusCode).not.toBe(201);
      expect(res.statusCode).not.toBe(401);
      expect(res.statusCode).not.toBe(500);
    });

    it("Should return status code 401 for unauthorized user", async () => {
      const req = createRequest({
        method: "POST",
        url: "/api/recipes/60d0fe4f5311236168a109ca/comments",
        params: {
          recipeId: "60d0fe4f5311236168a109ca",
        },
        authorization: {
          bearer: "",
        },
        body: {
          text: "amazing", // Invalid input: empty text
        },
      });
      const res = createResponse();

      req.user = undefined; // No user info, simulating unauthorized access

      await authenticateJWT(req, res, () => {});

      const data = res._getJSONData();

      expect(res.statusCode).toBe(401);
      expect(data).toBeDefined();
      expect(data).toEqual({ error: "Unauthorized" });

      expect(res.statusCode).not.toBe(201);
      expect(res.statusCode).not.toBe(400);
      expect(res.statusCode).not.toBe(500);
    });

    it("Should handle internal server error and return status code 500", async () => {
      const req = createRequest({
        method: "POST",
        url: "/api/recipes/60d0fe4f5311236168a109ca/comments",
        params: {
          recipeId: "60d0fe4f5311236168a109ca",
        },
        authorization: {
          bearer: "mocked-jwt-token",
        },
        body: {
          text: "This is a test comment",
        },
      });

      const res = createResponse();

      const mockCommentInstance = {
        save: jest.fn().mockRejectedValue(new Error()),
      };

      (Comment as any).mockImplementation(() => mockCommentInstance);

      req.user = { id: "mocked-user-id", handle: "john_doe" } as any;

      await addCommentToRecipe(req, res);

      const data = res._getJSONData();

      expect(res.statusCode).toBe(500);
      expect(data).toBeDefined();
      expect(data).toEqual({ error: "Internal server error" });

      expect(res.statusCode).not.toBe(201);
      expect(res.statusCode).not.toBe(400);
      expect(res.statusCode).not.toBe(401);
    });
  });

  describe("CommentController - delete comment", () => {
    it("Should delete a comment and return 200 status", async () => {
      const req = createRequest({
        method: "DELETE",
        url: "/api/recipes/6908b5849c50a864a0f0bb13/comments/60c72b2f9b1d8e001c8e4b8a",
        params: {
          recipeId: "6908b5849c50a864a0f0bb13",
          commentId: "60c72b2f9b1d8e001c8e4b8a",
        },
        authorization: {
          bearer: "mocked-jwt-token",
        },
      });

      const findComment = commentsMock.find(
        (comment) => comment._id === req.params.commentId
      );

      req.user = {
        id: String(findComment?.author.id),
        handle: findComment?.author.handle,
      } as any;

      const res = createResponse();

      (Comment.findById as jest.Mock).mockResolvedValue({
        ...findComment,
        author: String(findComment?.author.id),
        recipe: findComment?.recipe,
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await deleteCommentFromRecipe(req, res);

      const data = res._getJSONData();

      expect(res.statusCode).toBe(200);
      expect(data).toEqual("Comment deleted successfully");

      expect(res.statusCode).not.toBe(400);
      expect(res.statusCode).not.toBe(401);
      expect(res.statusCode).not.toBe(403);
      expect(res.statusCode).not.toBe(404);
      expect(res.statusCode).not.toBe(500);
    });

    it("Should return status code 400 when comment doesn't belong to the recipe", async () => {
      const req = createRequest({
        method: "DELETE",
        url: "/api/recipes/6908b5849c50a864a0f0bb14/comments/60c72b2f9b1d8e001c8e4b8a",
        params: {
          recipeId: "6908b5849c50a864a0f0bb14",
          commentId: "60c72b2f9b1d8e001c8e4b8a",
        },
        authorization: {
          bearer: "mocked-jwt-token",
        },
      });

      const findComment = commentsMock.find(
        (comment) => comment._id === req.params.commentId
      );

      req.user = {
        id: String(findComment?.author.id),
        handle: findComment?.author.handle,
      } as any;

      const res = createResponse();

      (Comment.findById as jest.Mock).mockResolvedValue({
        ...findComment,
        author: String(findComment?.author.id),
        recipe: findComment?.recipe,
      });

      await deleteCommentFromRecipe(req, res);

      const data = res._getJSONData();

      expect(res.statusCode).toBe(400);
      expect(data).toEqual({
        error: "Comment does not belong to the specified recipe",
      });

      expect(res.statusCode).not.toBe(200);
      expect(res.statusCode).not.toBe(401);
      expect(res.statusCode).not.toBe(403);
      expect(res.statusCode).not.toBe(404);
      expect(res.statusCode).not.toBe(500);
    });

    it("Should return status code 401 when user is not authorized", async () => {
      const req = createRequest({
        method: "DELETE",
        url: "/api/recipes/6908b5849c50a864a0f0bb14/comments/60c72b2f9b1d8e001c8e4b8a",
        params: {
          recipeId: "6908b5849c50a864a0f0bb13",
          commentId: "60c72b2f9b1d8e001c8e4b8a",
        },
        authorization: {
          bearer: "",
        },
      });

      const findComment = commentsMock.find(
        (comment) => comment._id === req.params.commentId
      );

      req.user = undefined; // No user info, simulating unauthorized access
      const res = createResponse();

      (Comment.findById as jest.Mock).mockResolvedValue({
        ...findComment,
        author: String(findComment?.author.id),
        recipe: findComment?.recipe,
      });

      await authenticateJWT(req, res, () => {});

      const data = res._getJSONData();

      expect(res.statusCode).toBe(401);
      expect(data).toBeDefined();
      expect(data).toEqual({ error: "Unauthorized" });

      expect(res.statusCode).not.toBe(200);
      expect(res.statusCode).not.toBe(400);
      expect(res.statusCode).not.toBe(403);
      expect(res.statusCode).not.toBe(404);
      expect(res.statusCode).not.toBe(500);
    });
    it("Should return status code 403 when user is not authorized to delete comment", async () => {
      const req = createRequest({
        method: "DELETE",
        url: "/api/recipes/6908b5849c50a864a0f0bb14/comments/60c72b2f9b1d8e001c8e4b8a",
        params: {
          recipeId: "6908b5849c50a864a0f0bb13",
          commentId: "60c72b2f9b1d8e001c8e4b8a",
        },
        authorization: {
          bearer: "",
        },
      });

      const findComment = commentsMock.find(
        (comment) => comment._id === req.params.commentId
      );

      req.user = undefined; // No user info, simulating unauthorized access
      const res = createResponse();

      (Comment.findById as jest.Mock).mockResolvedValue({
        ...findComment,
        author: String(findComment?.author.id),
        recipe: findComment?.recipe,
      });

      await deleteCommentFromRecipe(req, res);

      const data = res._getJSONData();

      expect(res.statusCode).toBe(403);
      expect(data).toBeDefined();
      expect(data).toEqual({ error: "Unauthorized to delete this comment" });

      expect(res.statusCode).not.toBe(200);
      expect(res.statusCode).not.toBe(400);
      expect(res.statusCode).not.toBe(401);
      expect(res.statusCode).not.toBe(404);
      expect(res.statusCode).not.toBe(500);
    });
    it("Should return status code 404 when comment is not found", async () => {
      const req = createRequest({
        method: "DELETE",
        url: "/api/recipes/6908b5849c50a864a0f0bb14/comments/60c72b2f9b1d8e001c8e4b8b",
        params: {
          recipeId: "6908b5849c50a864a0f0bb13",
          commentId: "60c72b2f9b1d8e001c8e4b8b",
        },
        authorization: {
          bearer: "mocked-jwt-token",
        },
      });

      const findComment = commentsMock.find(
        (comment) => comment._id === req.params.commentId
      );

      req.user = {
        id: String(findComment?.author.id),
        handle: findComment?.author.handle,
      } as any;

      const res = createResponse();

      (Comment.findById as jest.Mock).mockResolvedValue(null);

      await deleteCommentFromRecipe(req, res);

      const data = res._getJSONData();

      expect(res.statusCode).toBe(404);
      expect(data).toBeDefined();
      expect(data).toEqual({ error: "Comment not found" });

      expect(res.statusCode).not.toBe(200);
      expect(res.statusCode).not.toBe(400);
      expect(res.statusCode).not.toBe(401);
      expect(res.statusCode).not.toBe(403);
      expect(res.statusCode).not.toBe(500);
    });
  });

  it("Should return status code 500 when there is a server error", async () => {
    const req = createRequest({
      method: "DELETE",
      url: "/api/recipes/6908b5849c50a864a0f0bb14/comments/60c72b2f9b1d8e001c8e4b8a",
      params: {
        recipeId: "6908b5849c50a864a0f0bb13",
        commentId: "60c72b2f9b1d8e001c8e4b8a",
      },
      authorization: {
        bearer: "mocked-jwt-token",
      },
    });

    const findComment = commentsMock.find(
      (comment) => comment._id === req.params.commentId
    );

    req.user = {
      id: String(findComment?.author.id),
      handle: findComment?.author.handle,
    } as any;

    const res = createResponse();

    (Comment.findById as jest.Mock).mockRejectedValue(new Error());

    await deleteCommentFromRecipe(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data).toBeDefined();
    expect(data).toEqual({ error: "Internal server error" });

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(403);
    expect(res.statusCode).not.toBe(404);
  });
});
