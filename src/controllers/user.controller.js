import { AsyncHandler } from "../utils/AsyncHandler.js";

export const registerUser = AsyncHandler(async (req, res) => {
  res.status(200).json({ message: "user " });
});
