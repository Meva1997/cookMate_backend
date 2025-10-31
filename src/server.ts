import express from "express";
import "dotenv/config";
import authRouter from "./routes/authRouter";
import userRouter from "./routes/userRouter";
import recipieRouter from "./routes/recipieRouter";
import commentRouter from "./routes/commentRouter";
import { connectDB } from "./config/db";

const app = express();

//Read JSON bodies
app.use(express.json());

connectDB();

//routing
app.use("/api", authRouter);
app.use("/api", userRouter);
app.use("/api", recipieRouter);
app.use("/api", commentRouter);

export default app;
