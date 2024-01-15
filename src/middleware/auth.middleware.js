import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";


export const verifyToken = AsyncHandler(async (req, _, next) => {
  try {
    const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if(!token){
      throw new ApiError(401, "Unauthorized token")
    }
        const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
         const user = await User.findById(decoded?._id).select("-password -refreshToken")
            if(!user){
            throw new ApiError(404, "invalid token")
            }
            req.user = user;
            next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token")
  }
})