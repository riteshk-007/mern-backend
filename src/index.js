import dotenv from "dotenv";
import connectDB from "./Db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    console.log("DB Connected");
    app.on("error", (err) => {
      console.log("Server Error", err);
    });

    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("DB Connection Failed", err);
  });
