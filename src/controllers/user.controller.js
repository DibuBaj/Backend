import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken , refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token.")
    }
}

const options = {
    httpOnly : true,
    secure : true
}

const userRegister = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;

    if (
        [username, email, fullName, password].some((field) =>
            field?.trim() === ""
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

    const avatarLocalPath = await req.files?.avatar?.[0]?.path;
    
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
        password,
        username: username.toLowerCase(),
    });

    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createUser) {
        throw new ApiError(500, "Something went wrong while creating user.");
    }

    return res.status(201).json(
        new ApiResponse(201, createUser, "User Registered Successfully.")
    );
});

const userLogin  = asyncHandler(async (req,res) =>{
    
    const {username , email , password} = req.body;

    if(!(username || email)) {
        throw new ApiError(400, "Username or Email is required.");
    }

    if(!password){
        throw new ApiError(400, "Password is required.");
    }

    const user = await User.findOne({
         $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError (404, "User does not exist.")
    }

    const isPasswordValid = await user.isCorrectPassword(password);

    if (!isPasswordValid) {
        throw new ApiError(401 ,"Invalid Password.")
    }

    const {accessToken,refreshToken} =  await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser, accessToken , refreshToken
            },
            "User logged in successfully.")
    )
});

const userLogout = asyncHandler(async (req,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            } 
        },
        {
            new: true
        }
    )

    

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,
        {},
        "User logged out successfully."))
});

const refreshAccessToken = asyncHandler(async (req, res) =>{
    const incomingRefreshToken = req.cookies.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used.")
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id);
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken",newRefreshToken, options)
        .json(new ApiResponse(200,
             {accessToken ,refreshToken:newRefreshToken},
             "Token Refreshed successfully."))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
});



export { userRegister, 
         userLogin , 
         userLogout,
         refreshAccessToken
         };
