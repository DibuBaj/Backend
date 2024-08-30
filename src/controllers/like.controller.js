import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Recipe } from "../models/recipe.model.js";

const toggleRecipeLike = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const userId = req.user?._id;

  if (!recipeId) {
    throw new ApiError(400, "Recipe ID Missing");
  }

  const recipe = await Recipe.findById(recipeId);

  if (!recipe) {
    throw new ApiError(404, "Recipe Not Found");
  }

  let like = await Like.findOne({ recipe: recipeId });

  if (!like) {
    like = new Like({
      recipe: recipeId,
      likedBy: [userId],
    });
    await like.save();
    return res
      .status(200)
      .json(new ApiResponse(200, like, "Recipe liked Successfully."));
  }

  const userIndex = like.likedBy.indexOf(userId);

  if (userIndex === -1) {
    like.likedBy.push(userId);
    await like.save();
    return res
      .status(200)
      .json(new ApiResponse(200, like, "Recipe liked successfully."));
  } else {
    like.likedBy.splice(userIndex, 1);

    if (like.likedBy.length === 0) {
      await like.remove();
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Recipe disliked successfully."));
    } else {
      await like.save();
      return res
        .status(200)
        .json(new ApiResponse(200, like, "Recipe disliked successfully."));
    }
  }
});

const getLikedRecipe = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  
  
  const likedRecipe = await Like.aggregate([
    {
        $match: {
          likedBy: userId,
        },
      },
      {
        $lookup: {
          from: "recipes",
          localField: "recipe",
          foreignField: "_id",
          as: "recipeDetails",
        },
      },
      {
        $unwind: "$recipeDetails",
      },
      {
        $lookup: {
          from: "users",
          localField: "recipeDetails.recipeOwner",
          foreignField: "_id",
          as: "recipeOwnerDetails",
        },
      },
      {
        $unwind: "$recipeOwnerDetails",
      },
      {
        $project: {
          _id: 0,
          recipeName: "$recipeDetails.name",
          recipeOwner: "$recipeOwnerDetails.fullName",
        },
      }     
  ])

  
  
  if (!likedRecipe) {
    throw new ApiError(400, "No Liked Recipe Found");
  }

  return res.status(200)
  .json(new ApiResponse(200,likedRecipe,"Liked Recipe Fetched Successfully."))
});

export { toggleRecipeLike ,getLikedRecipe };
