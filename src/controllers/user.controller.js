import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token."
    );
  }
};

const options = {
  httpOnly: true,
  secure: true,
};

const userRegister = asyncHandler(async (req, res) => {
  const { username, email, fullName, password, userType } = req.body;

  if (
    [username, email, fullName, password, userType].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All the fields are required.");
  }

  const existingUsername = await User.findOne({ username });
  const existingEmail = await User.findOne({ email });

  if (existingUsername) {
    throw new ApiError(409, "Username already exists.");
  }

  if (existingEmail) {
    throw new ApiError(409, "Email already exists.");
  }

  const avatarLocalPath = await req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed.");
  }

  const user = await User.create({
    fullName,
    email,
    avatar: avatar.url,  
    avatarPublicId: avatar.public_id,
    password,
    username: username.toLowerCase(),
    userType,
  });

  const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createUser) {
    throw new ApiError(500, "Something went wrong while creating user.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createUser, "User Registered Successfully."));
});

const userLogin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required.");
  }

  if (!password) {
    throw new ApiError(400, "Password is required.");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist.");
  }

  const isPasswordValid = await user.isCorrectPassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully."
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used.");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    console.log(incomingRefreshToken);
    console.log(newRefreshToken);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Token Refreshed successfully."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully."));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, conformPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isCorrectPassword = await user.isCorrectPassword(oldPassword);

  if (!isCorrectPassword) {
    throw new ApiError(400, "Invalid old password");
  }

  if (!(newPassword === conformPassword)) {
    throw new ApiError(400, "Password does not match");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { username, fullName, userType } = req.body;

  if (!(username || fullName || userType)) {
    throw new ApiError(400, "Please fill at least one field.");
  }

  const updateFields = {};

  username && (updateFields.username =username);
  fullName && (updateFields.fullName =fullName);
  userType && (updateFields.userType =userType);


  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true }
  ).select("-password");


  if(!user){
    throw new ApiError(500,"Updating detail failed")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully."));
});

const updateAvatarImage = asyncHandler(async (req, res) => {
  const avatarImageLocalPath = req.file?.path;

  if (!avatarImageLocalPath) {
    throw new ApiError(400, "Please upload an image");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const oldAvatarPublicId = user.avatarPublicId;

   const avatar = await uploadOnCloudinary(avatarImageLocalPath, oldAvatarPublicId);

  if (!avatar || !avatar.secure_url) {
    throw new ApiError(500, "Failed to upload image");
  }

  user.avatar = avatar.secure_url;
  user.avatarPublicId = avatar.public_id;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});


const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username Missing");
  }

  const profile = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "followings",
        localField: "_id",
        foreignField: "profile",
        as: "followers",
      },
    },
    {
      $lookup: {
        from: "followings",
        localField: "_id",
        foreignField: "follower",
        as: "followedTo",
      },
    },
    {
      $addFields: {
        followersCount: {
          $size: "$followers",
        },
        followedToCount: {
          $size: "$followedTo",
        },
        isFollowing: {
          $cond: {
            if: {
              $in: [req.user?._id, "$followers.follower"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        userType:1,
        email: 1,
        followersCount: 1,
        followedToCount: 1,
        isFollowing: 1,
      },
    },
  ]);

  // console.log(profile);
  
  if (!profile?.length) {
    throw new ApiError(404, "Profile does not exist.");
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, profile[0], "User profile fetched successfully.")
  );
});

const deleteUser = asyncHandler(async(req,res) =>{
  const { username } =  req.params 
  

  if(username !== req.user?.username){
    throw new ApiError(403, "Unauthorized Request");
  }


  const user =await User.findOneAndDelete({username : username})


  if(!user){
    throw new ApiError(400,"User does not exist")
  }
  
  const avatarPublicId = user.avatarPublicId;

  const avatar = uploadOnCloudinary(null,avatarPublicId);

  if(!avatar){
    throw new ApiError(500,"Fail to delete avatar")
  }
  
  return res.status(200)
  .json(new ApiResponse(200,[],'User Deleted Successfully.'))
})

const getLikedRecipe = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "recipes",
              localField: "likedRecipe",
              foreignField: "_id",
              as: "likedRecipe",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "recipeOwner",
                          foreignField: "_id",
                          as: "recipeOwner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          recipeOwner:{
                              $first: "$recipeOwner"
                          }
                      }
                  }
              ]
          }
      }
  ])

  return res
  .status(200)
  .json(
      new ApiResponse(200, user[0].likedRecipe ,"Liked Recipe fetched successfully")
  )
})



export {
  userRegister,
  userLogin,
  userLogout,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateUserDetails,
  updateAvatarImage,
  getUserProfile,
  deleteUser,
  getLikedRecipe
};
