import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


// generate access token and refresh token
const generateTokensAccessAndResfresh = async(userId)=>{
  try {
     const user =  await User.findById(userId)
    const accessToken =  user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()

     user.refreshToken = refreshToken;
     await await user.save(
        {
          validateBeforeSave: false,
        }
      );
      return {accessToken, refreshToken}
  } catch (error) {
      throw new ApiError(500, "Token generation failed");
  }
}

// create user (register)
export const registerUser = AsyncHandler(async (req, res) => {
  // get the user data from the request body
  // validate the user data not empty
  // check if the user already exists in the database : email and username
  // check for image, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in the database
  // remove password and refresh token field  from response
  // check for user creation
  // return user data and token

  const { username, fullName, email, password } = req.body;

  if (
    [username, email, password, fullName].some((filed) => filed?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existsUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existsUser) {
    throw new ApiError(409, "User already exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage?.[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Avatar file is required");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    email,
    password,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user created successfully"));
});


// login user with password and username or email

export const loginUser = AsyncHandler(async (req, res) =>{
    // get the user data from the request body
    // username Or email and password
    // find the user in the database
    // check user password
    // generate access token and refresh token
    // send refresh token as a cookie

    const { username, email, password } = req.body;
   if(!(username || email)) {
       throw new ApiError(400, "username or email is required");
   }
 const user = await  User.findOne({
    $or: [{username}, {email}]
  })
  if(!user) {
    throw new ApiError(404, "User not found");
  }

 const isPasswordValid =  await user.isPasswordCorrect(password);
  if(!isPasswordValid) {
      throw new ApiError(401, "password is incorrect");
  }

 const {accessToken, refreshToken} =  await generateTokensAccessAndResfresh(user._id);
  const logedinUser = await User.findById(user._id).select("-password -refreshToken");

  const options ={
    httpOnly: true,
    secure: true,
  }
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(new ApiResponse(200,
    {
      user : logedinUser,
      accessToken,
      refreshToken,
    }
    , "user logedin successfully"
    ));

})

// logout user
export const  logoutUser = AsyncHandler(async(req, res)=>{
  await User.findByIdAndUpdate(req.user._id ,{
      $unset:{
        refreshToken: 1,
      },
    
  } , {
    new: true,
  }
  )
  const options ={
    httpOnly: true,
    secure: true,
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "user logedout successfully"));
})

// refresh access token
export const refreshAccessToken = AsyncHandler(async(req, res)=>{
  // get the refresh token from the request cookie
  // check if the refresh token is valid
  // generate new access token
  // send the new access token
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if(!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
 try {
   const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
   const user = await User.findById(decoded?._id);
 
   if(!user) {
     throw new ApiError(401, "invalid refresh token");
   }
   if(user?.refreshToken !== incomingRefreshToken) {
     throw new ApiError(401, "refresh token is invalid");
   }
   const options ={
     httpOnly: true,
     secure: true,
   }
 
   const {accessToken, newrefreshToken} =  await generateTokensAccessAndResfresh(user._id);
 
   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", newrefreshToken, options)
   .json(new ApiResponse(200,
     {
       accessToken,
       refreshToken: newrefreshToken,
     }
     , "access token refreshed successfully"
     ));
 } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
 }

})

// chnage password
export const changeCurrentPassword = AsyncHandler(async(req, res)=>{
try {
    const {oldPassword, newPassword} = req.body;
    if(!oldPassword || !newPassword) {
      throw new ApiError(400, "old password and new password are required");
    }
    const user = await User.findById(req.user?._id);

   const isPasswordValid =  await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid) {
      throw new ApiError(401, "password is incorrect");
    }
    user.password = newPassword;
    await user.save({
        validateBeforeSave: false,
      } );

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));

} catch (error) {
  throw new ApiError(400, error?.message || "old password and new password are required");
}
})


// update user profile
export const currentUser = AsyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
  })

 // update user profile 
 export const updateProfile = AsyncHandler(async(req, res)=>{
    const {username, fullName} = req.body;
    if(!(username || fullName)) {
      throw new ApiError(400, "username or fullName  is required");
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
       
        $set: {
          username,
          fullName,
        }
    
    }, {
      new: true,
    }).select("-password");
    return res
    .status(200)
    .json(new ApiResponse(200, user, "user profile updated successfully"));
 })

 // update user avatar
 export const updateAvatar = AsyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
      throw new ApiError(500, "Error while uploading on avatar");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
       
        $set: {
          avatar: avatar.url,
        }
    
    }, {
      new: true,
    }).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "user avatar updated successfully"));
 })


  // update user cover image
  export const updateCoverImage = AsyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
      throw new ApiError(400, "cover Image file is missing");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
      throw new ApiError(500, "Error while uploading on avatar");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
       
        $set: {
          coverImage: coverImage.url,
        }
    
    }, {
      new: true,
    }).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "user cover image updated successfully"));
 })

// Create a new subscription for the specified channel
 export const getUserChannelProfile = AsyncHandler(async (req, res)=>{
  const {username} = req.params;
  if(!username?.trim()) {
    throw new ApiError(400, "username is required");
  }
  const channel =  await User.aggregate([
    {
      $match:{
        username: username?.toLowerCase(),
      }
    },{
      $lookup:{
        from: "Subscription",
        localField: "_id",
        foreignField:"channel",
        as: "subscribers"
      }
    },{
      $lookup:{
        from: "Subscription",
        localField: "_id",
        foreignField:"subscriber",
        as: "subscribedTo"
      }
    },{
      $addFields:{
        subscriberCount: {
          $size: "$subscribers"
        },
        ChannelssubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed :{
          $cont : {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },{
      $project: {
          fullName: 1,
          username: 1,
          isSubscribed: 1,
          subscriberCount: 1,
          ChannelssubscribedToCount: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
      }
    }
  ])
  if(!channel?.length) {
    throw new ApiError(404, "channel dose not exist");
  }
  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "channel fetched successfully"));
 })

 // get user watch history
 export const GetWatchHistory = AsyncHandler(async (req, res)=>{
    const user  = await User.aggregate([
      {
        $match:{
          _id: new mongoose.Types.ObjectId(req.user?._id),
        }
      },{
        $lookup:{ 
          from : "Video",
          localField:"watchHistory",
          foreignField:"_id",
          as: "watchHistory",
          pipeline:[
            {
              $lookup:{
                from: "User",
                localField: "owner",
                foreignField:"_id",
                as: "owner",
                pipeline:[
                  {
                    $project:{
                      username: 1,
                      fullName: 1,
                      avatar: 1,
                    }
                  }
                ]
              }
            },{
              $addFields:{
                owner : {
                  $first : "$owner",
                }
              }
            }
          ]
        }
      }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "user watch history fetched successfully"));
 })