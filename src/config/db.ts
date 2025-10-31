import colors from "colors";
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI);
    const url = `${connection.host}:${connection.port}`;
    console.log(colors.cyan(`MongoDB connected: ${url}`));
  } catch (error) {
    console.log(colors.red(error.message));
    process.exit(1);
  }
};
