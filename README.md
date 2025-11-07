# CookMate Backend

A RESTful API for managing recipes, user authentication, favorites, likes, and comments. Built with Node.js, Express, and MongoDB. This backend powers the CookMate app, enabling users to create, edit, and share recipes, as well as interact with other users.

## Features

- User registration and authentication (JWT)
- Recipe creation, editing, and deletion (only by the author)
- Add and remove recipes from favorites
- Like and unlike recipes
- Comment on recipes (only authenticated users)
- View user profiles and their favorite recipes
- Secure endpoints and data validation

## Technologies

- Node.js
- Express
- MongoDB & Mongoose
- JWT for authentication

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Meva1997/cookMate_backend.git
   cd cookMate_backend/backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   - Create a `.env` file with your MongoDB URI and JWT secret:
     ```
     MONGODB_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     ```

4. **Run the server:**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:4000`.

## API Documentation

Interactive API documentation is available via Swagger UI:

![Swagger UI Screenshot](./src/public/backendScreenShots/CookMate-swagger.png)

- **URL:** [http://localhost:4000/docs](http://localhost:4000/docs)

You can explore all endpoints, view request/response schemas, and test API calls directly from the browser. For protected endpoints, use the "Authorize" button to enter your JWT token.

### Endpoints and middleware covered by unit tests

The test suite includes focused unit tests that exercise handlers and middlewares without touching the database or external services (those are mocked). Current coverage includes the following endpoints and related middleware logic:

- Auth endpoints

  - POST /auth/register
    - createAccount handler
    - Validation flow (registerBody + handleBodyErrors)
    - Duplicate handle/email checks (user existence middleware)
    - Password hashing flow is mocked to avoid bcrypt I/O
  - POST /auth/login
    - login handler
    - Validation flow for email/password
    - loginEmailExists middleware (email existence)
    - JWT generation and comparison are mocked

- User endpoints

  - GET /user/:userId
    - getUserProfile handler
    - userExistsId middleware behavior (user found / not found / server error)
  - PUT /user/:userId
    - updateUserProfile handler
    - Authorization checks (authenticated user vs target user)
    - Handle/email uniqueness checks
    - Save/update flow using a document-like mock (instance.save mocked)
  - GET /user/:userId/recipes
    - getUserRecipes handler
    - Mocks populate() behavior to return user's recipes

- Recipe endpoints (unit-level)

  - Tests exercise recipe handlers for create/read/update/delete operations
  - Authorization and ownership checks (only author can edit/delete)
  - Likes/favorites behavior is covered in unit tests with mocked model methods

- Middleware & utilities
  - Validation error handler (handleBodyErrors)
  - authenticateJWT middleware is exercised in tests (success/unauthorized cases)
  - email/handle existence middlewares (emailExists, userExistsId)
  - Utilities like slug, jwt, and password helpers are mocked to isolate handlers

Notes:

- Tests use fixtures in `src/tests/mocks/*` and mock `../../models/*` to avoid DB access.
- Some ESM modules (e.g. `slug`) are mocked in tests to prevent runtime syntax issues.
- For edge-case behavior, tests include success, validation failure (400), conflict (409), unauthorized (401), and internal error (500) paths.

## Unit testing

Run the test suite with Jest:

- Run all tests:

  ```bash
  npm test
  ```

- Run a single test file:

  ```bash
  npx jest src/tests/unit/UserController.test.ts
  # or
  npm test -- src/tests/unit/UserController.test.ts
  ```

- Watch mode (re-run tests on file changes):

  ```bash
  npm test -- --watch
  ```

- Run with coverage report:

  ```bash
  npm test -- --coverage
  ```

- Troubleshooting and tips

  - If a test times out or you need to diagnose handles:
    ```bash
    npm test -- --detectOpenHandles
    ```
  - ts-jest warning (TS151002): either enable isolatedModules in tsconfig.json:
    ```json
    {
      "compilerOptions": {
        "isolatedModules": true
      }
    }
    ```
    or silence the diagnostic in jest.config.js:
    ```javascript
    // jest.config.js
    module.exports = {
      globals: {
        "ts-jest": {
          diagnostics: {
            ignoreCodes: [151002],
          },
        },
      },
    };
    ```
  - Some third‑party ESM modules (e.g. `slug`) may need mocking in tests. Options:
    - Add a per-test mock at the top of the test file:
      ```typescript
      jest.mock("slug", () => {
        const fn = (s: unknown) => String(s).toLowerCase().replace(/\s+/g, "-");
        (fn as any).default = fn;
        return fn;
      });
      ```
    - Or create a module mock and map it in jest.config.js:
      ```javascript
      moduleNameMapper: { "^slug$": "<rootDir>/src/tests/__mocks__/slug.js" }
      ```
  - Use `setupFilesAfterEnv` or a shared test setup file to centralize common mocks and fixtures.

- Run tests on macOS terminal (example):
  ```bash
  # from project root
  cd /Users/$(whoami)/Desktop/cookmate/backend
  npm test
  ```

## Integration testing

This project includes an integration test suite that exercises the real HTTP server using SuperTest and Jest. The main integration test file is:

- `src/tests/integration/app.test.ts`

Purpose and highlights of `app.test.ts`:

- Registers and authenticates users (auth endpoints) using the full API flow to obtain valid JWTs.
- Creates, reads, updates, and deletes recipes (the `recipes` endpoints), testing both public and protected routes.
- Exercises recipe actions: like/unlike and favorite/unfavorite.
- Validates user routes: get profile, update profile, list user recipes and favorites.
- Covers edge cases and expected error responses (400, 401, 403, 404, 409, 500).
- Cleans up test data in an `afterAll` hook by deleting users and recipes created during the tests to keep the database tidy.

Covered endpoints (summary):

- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — login and obtain a JWT
- `GET /api/user/:userId` — get user profile
- `PUT /api/user/:userId` — update profile (protected)
- `GET /api/user/:userId/recipes` — list a user's recipes
- `GET /api/recipes` — list recipes
- `POST /api/recipes` — create a recipe (protected)
- `GET /api/recipes/:recipeId` — get a recipe by ID
- `PUT /api/recipes/:recipeId` — update a recipe (author only)
- `DELETE /api/recipes/:recipeId` — delete a recipe (author only)

How to run integration tests only:

```bash
# Run the specific integration test file from the `backend` folder
npm test -- src/tests/integration/app.test.ts

# Alternative using npx/jest directly:
npx jest src/tests/integration/app.test.ts --runInBand
```

Important notes:

- Integration tests import the server (`src/server`) and typically require access to the database. Make sure test environment variables are configured, or use a test/in-memory database (for example, MongoDB Memory Server) to avoid polluting your development database.
- The `app.test.ts` file includes an `afterAll` cleanup that deletes users and recipes created by the tests. If you add more tests that create different data shapes or naming patterns, update the cleanup logic accordingly.
- For CI or parallel test runs, consider running tests `--runInBand` or providing isolated database instances to prevent collisions.

## Latest test run (coverage)

Below are the results from a recent test run (integration + unit tests) executed on 2025-11-07. This output includes a coverage summary and the overall test suite results.

```
---------------------|---------|----------|---------|---------|------------------------------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------|---------|----------|---------|---------|------------------------------------------
All files            |   84.86 |    63.01 |   74.35 |   84.84 |
 src                 |      95 |      100 |       0 |      95 |
  server.ts          |      95 |      100 |       0 |      95 | 32
 src/config          |    87.5 |      100 |     100 |   86.66 |
  db.ts              |      80 |      100 |     100 |   77.77 | 10-11
  swagger.ts         |     100 |      100 |     100 |     100 |
 src/handlers        |    73.8 |     50.9 |      65 |   73.65 |
  authHandler.ts     |   88.88 |       75 |     100 |   88.23 | 20-21,40-41
  commentHandler.ts  |     100 |      100 |     100 |     100 |
  recipeHandler.ts   |   58.58 |    31.81 |   45.45 |   58.33 | 59-60,72,114-123,146-154,179-189,220-230
  userHandler.ts     |    75.6 |    47.36 |      75 |   72.97 | 23-24,32,66-79
 src/middleware      |   92.38 |      100 |   84.61 |   91.48 |
  authenticateJWT.ts |   91.66 |      100 |     100 |    90.9 | 22
  bodyErrors.ts      |     100 |      100 |     100 |     100 |
  comment.ts         |   55.55 |      100 |       0 |   42.85 | 9-10,18-22
  recipe.ts          |   96.15 |      100 |     100 |   95.65 | 74
  user.ts            |   96.15 |      100 |     100 |   95.74 | 71,99
 src/models          |     100 |      100 |     100 |     100 |
  Comment.ts         |     100 |      100 |     100 |     100 |
  Recipe.ts          |     100 |      100 |     100 |     100 |
  User.ts            |     100 |      100 |     100 |     100 |
 src/routes          |     100 |      100 |     100 |     100 |
  authRouter.ts      |     100 |      100 |     100 |     100 |
  commentRouter.ts   |     100 |      100 |     100 |     100 |
  recipieRouter.ts   |     100 |      100 |     100 |     100 |
  userRouter.ts      |     100 |      100 |     100 |     100 |
 src/tests/mocks     |     100 |      100 |     100 |     100 |
  comment.ts         |     100 |      100 |     100 |     100 |
  recipe.ts          |     100 |      100 |     100 |     100 |
  user.ts            |     100 |      100 |     100 |     100 |
 src/utils           |     100 |      100 |     100 |     100 |
  auth.ts            |     100 |      100 |     100 |     100 |
  jwt.ts             |     100 |      100 |     100 |     100 |
---------------------|---------|----------|---------|---------|------------------------------------------


## API Endpoints

### Auth

- `POST /auth/register` – Register a new user
- `POST /auth/login` – Login and receive JWT

### User

- `GET /user/:userId` – Get user profile
- `PUT /user/:userId` – Update user profile (authenticated)
- `GET /user/:userId/recipes` – Get user's recipes
- `GET /user/:userId/favorites` – Get user's favorite recipes

### Recipe

- `GET /recipes` – List all recipes
- `POST /recipes` – Create a recipe (authenticated)
- `GET /recipes/:recipeId` – Get recipe by ID
- `PUT /recipes/:recipeId` – Edit a recipe (only author)
- `DELETE /recipes/:recipeId` – Delete a recipe (only author)
- `POST /recipes/:recipeId/like` – Like a recipe (authenticated)
- `DELETE /recipes/:recipeId/like` – Unlike a recipe (authenticated)
- `POST /recipes/:recipeId/favorite` – Add to favorites (authenticated)
- `DELETE /recipes/:recipeId/favorite` – Remove from favorites (authenticated)

### Comment

- `GET /recipes/:recipeId/comments` – Get comments for a recipe
- `POST /recipes/:recipeId/comments` – Add a comment (authenticated)
- `DELETE /recipes/:recipeId/comments/:commentId` – Delete a comment (only author, authenticated)

## License

MIT
```
