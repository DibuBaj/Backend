import { Router } from "express";
import { verifyJWT, verifyUser } from "../middlewares/auth.middleware.js";
import { createRecipe, updateRecipeDetail } from "../controllers/recipe.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-recipe").post(verifyJWT,verifyUser,upload.single("picture"),createRecipe);
router.route("/update-recipe/:recipeId").patch(verifyJWT,verifyUser,updateRecipeDetail);

export default router