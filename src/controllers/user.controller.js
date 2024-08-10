import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    
    // console.log("Avatar Local Path:", avatarLocalPath);
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

export { userRegister };
