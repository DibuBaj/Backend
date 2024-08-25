import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Recipe } from "../models/recipe.model.js";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createRecipe = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  let { name, description, category, ingredients, instructions } = req.body;

  if ([name, description, category].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All the fields are required.");
  }

  try {
    if (typeof ingredients === "string") {
      ingredients = JSON.parse(ingredients);
    }
    if (typeof instructions === "string") {
      instructions = JSON.parse(instructions);
    }
  } catch (error) {
    throw new ApiError(
      400,
      "Invalid JSON format for ingredients or instructions."
    );
  }

  if (
    !Array.isArray(ingredients) ||
    ingredients.length === 0 ||
    !ingredients.every((item) => typeof item === "string")
  ) {
    throw new ApiError(400, "Ingredients should be array of string.");
  }

  if (
    !Array.isArray(instructions) ||
    instructions.length === 0 ||
    !instructions.every((item) => typeof item === "string")
  ) {
    throw new ApiError(400, "Instructions should be array of string.");
  }

  const picLocalPath = req.file?.path;

  if (!picLocalPath) {
    throw new ApiError(400, "Picture is required.");
  }

  const picture = await uploadOnCloudinary(picLocalPath);

  if (!picture) {
    throw new ApiError(400, "Failed to upload picture.");
  }

  const recipe = await Recipe.create({
    name,
    description,
    category,
    ingredients,
    instructions,
    picture: picture.url,
    pictureId: picture.public_id,
    recipeOwner: _id,
  });

  const recipeCreate = await Recipe.findById(recipe._id);

  if (!recipeCreate) {
    throw new ApiError(500, "Something went wrong when creating recipe.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, recipeCreate, "Recipe Created Successfully."));
  return;
});

const updateRecipeDetail = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;

  const { recipeId } = req.params;
  const {_id} = req.user;

  
  if (!recipeId) {
    throw new ApiError(400, "Recipe ID is required.");
  }

  
  if (!_id) {
    throw new ApiError(401, "Unauthorized request");
  }


  if (!(name || description || category)) {
    throw new ApiError(400, "At least one field is required.");
  }

  const updateFields = {};

  if(name)  (updateFields.name = name);
  if(description)  (updateFields.description = description);
  if(category)  (updateFields.category = category);

  
  const recipe = await Recipe.findOneAndUpdate(
    { _id:recipeId,recipeOwner:_id },
    { $set: updateFields },
    { new: true }
  );

  
  if(!recipe){
    throw new ApiError(404, "Recipe not found or you are not authorized to update it.");
  }

  return res.status(200)
  .json(new ApiResponse(200,recipe,"Recipe detail updated successfully."))

});

const updateRecipeImage = asyncHandler(async (req, res) => {});

const deleteRecipe = asyncHandler(async (req, res) => {});

const getAllRecipe = asyncHandler(async (req, res) => {});

const getLikedBy = asyncHandler(async (req, res) => {});

export { createRecipe ,updateRecipeDetail };
