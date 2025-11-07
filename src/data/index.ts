// import { exit } from "node:process";
// import { connectDB } from "./../config/db";

// export const clearData = async () => {
//   try {
//     if (!process.env.MONGO_URI) {
//       console.warn("Skipping clearData: MONGO_URI not set");
//       return exit(0);
//     }

//     await connectDB();
//     // Add your actual collection clearing logic here if needed
//     console.log("Database cleared");
//     exit(0);
//   } catch (error) {
//     console.log(error);
//     exit(1);
//   }
// };

// // Only run when the script is invoked with --clear
// if (process.argv.includes("--clear")) {
//   void clearData();
// }
