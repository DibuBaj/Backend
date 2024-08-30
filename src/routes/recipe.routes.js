import { Router } from "express";
import { verifyJWT, verifyUser } from "../middlewares/auth.middleware.js";
import { createRecipe, deleteRecipe, deleteRecipeIngredientAndInstruction, getAllRecipe, getRecipeById, updateRecipeDetail, updateRecipeImage, updateRecipeIngredientAndInstruction } from "../controllers/recipe.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-recipe").post(verifyJWT,verifyUser,upload.single("image"),createRecipe);
router.route("/update-recipe/:recipeId").patch(verifyJWT,verifyUser,updateRecipeDetail);
router.route("/update-image/:recipeId").patch(verifyJWT,verifyUser,upload.single("image"),updateRecipeImage);
router.route("/update-ins/:recipeId").patch(verifyJWT,verifyUser,updateRecipeIngredientAndInstruction)
router.route("/delete-ins/:recipeId").patch(verifyJWT,verifyUser,deleteRecipeIngredientAndInstruction)

router.route("/delete-recipe/:recipeId").get(verifyJWT,verifyUser,deleteRecipe);
router.route("/r/:recipeId").get(getRecipeById)

router.route("/").get(getAllRecipe)
export default router