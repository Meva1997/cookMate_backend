import express from "express";
import swaggerUI from "swagger-ui-express";
import swaggerSpec, { swaggerUiOptions } from "./config/swagger";
import authRouter from "./routes/authRouter";
import userRouter from "./routes/userRouter";
import recipieRouter from "./routes/recipieRouter";
import commentRouter from "./routes/commentRouter";
import { connectDB } from "./config/db";
import "dotenv/config";

const app = express();

//Read JSON bodies
app.use(express.json());

connectDB();

//routing
app.use("/api", authRouter);
app.use("/api", userRouter);
app.use("/api", recipieRouter);
app.use("/api", commentRouter);

//swagger docs
app.use(
  "/docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpec, swaggerUiOptions)
);

app.get("/", (req, res) => {
  res.send("Welcome to CookMate API");
});

export default app;
