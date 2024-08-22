import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Recipe } from "../models/recipe.model.js"
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createRecipe = asyncHandler(async(req,res) =>{
    let { name , description , ingredients ,instructions}  =  req.body;
    console.log(req.body)
    if(
        [name , description  ].some(
            (field) =>field?.trim() === "" 
        )
    ){
        throw new ApiError(400,"All the fields are required.")
    }

    try {
        if (typeof ingredients === "string") {
          ingredients = JSON.parse(ingredients);
        }
        if (typeof instructions === "string") {
          instructions = JSON.parse(instructions);
        }
      } catch (error) {
        throw new ApiError(400, "Invalid JSON format for ingredients or instructions.");
      }

    if(
        !Array.isArray(ingredients) || ingredients.length === 0 || 
        !ingredients.every(item => typeof item === "string")
    ){
        throw new ApiError(400,"Ingredients should be array of string.")
    }

    if(
    !Array.isArray(instructions) || instructions.length === 0 ||
    !instructions.every(item => typeof item === "string")
    ){
        throw new ApiError(400,"Instructions should be array of string.")
    }

    const picLocalPath = req.file?.path

    if(!picLocalPath){
        throw new ApiError(400,"Picture is required.")
    }

    const picture = await uploadOnCloudinary(picLocalPath)

    if(!picture){
        throw new ApiError(400,"Failed to upload picture.")
    }

    const recipe = await Recipe.create({
        name,
        description,
        ingredients ,
        instructions,
        picture: picture.url,
        pictureId: picture.public_id
    });

    const recipeCreate = await Recipe.findById(recipe._id)
    
    if(!recipeCreate){
        throw new ApiError(500,"Something went wrong when creating recipe.")
    }

    return res.status(201)
    .json(new ApiResponse(201,recipeCreate,"Recipe Created Successfully."))
    return
})

export{
    createRecipe
}