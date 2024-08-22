import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createRecipe } from "../controllers/recipe.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-recipe").post(upload.single("picture"),verifyJWT,createRecipe);

export default router