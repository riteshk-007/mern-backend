import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Initialize express app
const app = express();

// Setup CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Setup body parsers
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Setup static files serving
app.use(express.static("public"));

// Setup cookie parser
app.use(cookieParser());

// routes imports
import userRouter from "./routers/user.routes.js";

// route declarations

app.use("/api/v1/users", userRouter);
//http://localhost:8000/api/v1/users/register

export { app };
