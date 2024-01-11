import dotenv from "dotenv";
import connectDB from "./Db/index.js";

dotenv.config({
  path: "./env",
});

connectDB();
