import { asyncHandler } from "../utils/asyncHandler.js";

const userRegister = asyncHandler( async (req,res) =>{
    res.status(200).json({
        success: true,
        message: "Ok"
    })
});

export {userRegister}