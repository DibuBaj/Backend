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

  if (!["breakfast", "lunch", "snack", "dinner"].includes(category)) {
    throw new ApiError(400, "Invalid category");
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

  const imageLocalPath = req.file?.path;

  if (!imageLocalPath) {
    throw new ApiError(400, "Image is required.");
  }

  const image = await uploadOnCloudinary(imageLocalPath);

  if (!image) {
    throw new ApiError(400, "Failed to upload image.");
  }

  const recipe = await Recipe.create({
    name,
    description,
    category,
    ingredients,
    instructions,
    image: image.url,
    imageId: image.public_id,
    recipeOwner: _id,
  });

  const recipeCreate = await Recipe.findById(recipe._id);

  if (!recipeCreate) {
    throw new ApiError(500, "Something went wrong when creating recipe.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, recipeCreate, "Recipe Created Successfully."));
  
});

const updateRecipeDetail = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;

  const { recipeId } = req.params;

  if (!recipeId?.trim()) {
    throw new ApiError(400, "Recipe Id Missing");
  }
  
  const {_id} = req.user;

  if (!_id) {
    throw new ApiError(401, "Unauthorized request");
  }
  
  if (!recipeId) {
    throw new ApiError(400, "Recipe ID is required.");
  }

  if (!(name || description || category)) {
    throw new ApiError(400, "At least one field is required.");
  }

  if(category){
    if (!["breakfast", "lunch", "snack", "dinner"].includes(category)) {
      throw new ApiError(400, "Invalid category");
    }
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

const updateRecipeImage = asyncHandler(async (req, res) => {
  
  const { recipeId } = req.params;
  const {_id} = req.user;

  if (!recipeId?.trim()) {
    throw new ApiError(400, "Recipe Id Missing");
  }

  if (!_id) {
    throw new ApiError(401, "Unauthorized request");
  }

  const recipe = await Recipe.findOne(
    {_id:recipeId ,recipeOwner:_id}
  )

  if(!recipe){
    throw new ApiError(404, "Recipe not found or unauthorized request.");
  }

  const newRecipeImage = req.file?.path;
  
  if(!newRecipeImage){
    throw new ApiError(400,"Recipe Image Required.")
  }

  const oldRecipeImageId = recipe.imageId;

  const image = await uploadOnCloudinary(newRecipeImage,oldRecipeImageId);

  if(!image || !image.secure_url){
    throw new ApiError(500,"Failed to upload image.")
  }

  recipe.image = image.secure_url;
  recipe.imageId = image.public_id;

  await recipe.save();  

  return res.status(200)
  .json(new ApiResponse(200,recipe,"Image upload successfully."))
});

const updateRecipeIngredientAndInstruction = asyncHandler(async (req, res) => {
  const { ingredients, instructions, index } = req.body;
  const { recipeId } = req.params;

  if (!recipeId) {
    throw new ApiError(400, "Recipe ID is missing.");
  }

  const { _id } = req.user;

  if (!_id) {
    throw new ApiError(401, "Unauthorized request.");
  }

  if(!index){
    const recipe = await Recipe.findOne({_id:recipeId, recipeOwner:_id})

    if(!recipe){
      throw new ApiError(400,"Recipe not found or unauthorized request.")
    }
    if(ingredients){
      recipe.ingredients.push(ingredients)
    }
  
    if(instructions){
      recipe.instructions.push(instructions)
    }

    await recipe.save();
    return res
    .status(200)
    .json(new ApiResponse(200, recipe, "Recipe data added successfully."));
  }

  if (typeof index !== "number" || index < 0) {
    throw new ApiError(400, "Index should be a positive number.");
  }

  if(!(ingredients|| instructions)){
    throw new ApiError(400,"Any one field is required.")
  }

  const recipe = await Recipe.findOne({_id:recipeId, recipeOwner:_id})
  

  if (!recipe) {
    throw new ApiError(404, "Recipe not found or you are not authorized to update it.");
  }

  if(ingredients){
    recipe.ingredients[index] = ingredients
  }

  if(instructions){
    recipe.instructions[index] = instructions
  }

  await recipe.save();
  
  return res
    .status(200)
    .json(new ApiResponse(200, recipe, "Recipe updated successfully."));
});

const deleteRecipeIngredientAndInstruction = asyncHandler(async (req, res) => {
  const { ingredients, instructions, index } = req.body;
  const { recipeId } = req.params;

  if (!recipeId) {
    throw new ApiError(400, "Recipe ID is missing.");
  }

  const { _id } = req.user;

  if (!_id) {
    throw new ApiError(401, "Unauthorized request.");
  }


  if (typeof index !== "number" || index < 0) {
    throw new ApiError(400, "Index should be a positive number.");
  }

  if(!(ingredients|| instructions)){
    throw new ApiError(400,"Any one field is required.")
  }

  const recipe = await Recipe.findOne({_id:recipeId, recipeOwner:_id})
  

  if (!recipe) {
    throw new ApiError(404, "Recipe not found or you are not authorized to update it.");
  }

  if(ingredients){
    recipe.ingredients.splice(index,1) 
  }

  if(instructions){
    recipe.instructions.splice(index,1)
  }

  await recipe.save();
  
  return res
    .status(200)
    .json(new ApiResponse(200, recipe, "Recipe updated successfully."));
});

const getRecipeById = asyncHandler(async (req,res) =>{
  const { recipeId } = req.params;

  if (!recipeId?.trim()) {
    throw new ApiError(400, "Recipe Id Missing");
  }

  const recipe = await Recipe.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(recipeId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "recipe",
        as: "likesInfo",
      },
    },
    {
      $addFields: {
        totalLikes: { $size:
           { $ifNull: [
            {$arrayElemAt:
              [ "$likesInfo.likedBy",0] 
            },[]
          ] 
          } 
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        category: 1,
        image: 1,
        ingredients: 1,
        instructions: 1,
        totalLikes: 1,
      },
    },
  ]);

  if(!recipe || recipe.length == 0){
    throw new ApiError(404, "Recipe Not Found");
  }

  return res.status(200)
  .json(new ApiResponse(200,recipe[0],"Recipe detail fetched successfully."))
})

const getAllRecipe = asyncHandler(async (req, res) => {
   const query = req.query

   const recipe = await Recipe.find(query)

   if(!recipe){
    throw new ApiError(400,"No Recipe Found.")
   }

   return res.status(200)
   .json(new ApiResponse(200,recipe,"Data Fetched Successfully."))
});

const deleteRecipe = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const {_id} = req.user;

  if (!recipeId?.trim()) {
    throw new ApiError(400, "Recipe Id Missing");
  }

  if (!_id) {
    throw new ApiError(401, "Unauthorized request");
  }

  const recipe = await Recipe.findOneAndDelete(
    {_id:recipeId ,recipeOwner:_id}
  )

  if(!recipe){
    throw new ApiError(404, "Recipe not found or unauthorized request.");
  }

  const recipeImageId = recipe.imageId;

  await uploadOnCloudinary(null,recipeImageId)


  return res.status(200)
  .json(new ApiResponse(200,[],"Recipe deleted successfully."))
});

export { createRecipe ,updateRecipeDetail,updateRecipeImage,updateRecipeIngredientAndInstruction ,deleteRecipeIngredientAndInstruction ,getRecipeById ,getAllRecipe,deleteRecipe };
