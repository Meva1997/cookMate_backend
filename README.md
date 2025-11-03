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

- **URL:** [http://localhost:4000/docs](http://localhost:4000/docs)

You can explore all endpoints, view request/response schemas, and test API calls directly from the browser. For protected endpoints, use the "Authorize" button to enter your JWT token.

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
