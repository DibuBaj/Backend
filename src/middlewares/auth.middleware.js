import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async(req,_,next) =>{
    try {
        const token = await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request.")
        }
    
        const decodedToken =  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid Access Token.")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
}) 

const verifyUser  = asyncHandler(async(req,_,next) =>{
    
    if(req.user?.userType !== "chef" && req.user?.userType !== "admin"){
        throw new ApiError(403, "You are not authorized to access this route.")
    }
    next();
})

export {verifyJWT ,verifyUser}