import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedRecipe, toggleRecipeLike } from "../controllers/like.controller.js";

const router = Router();

router.route("/toggleLike/:recipeId").post(verifyJWT,toggleRecipeLike);
router.route("/liked-product").get(verifyJWT,getLikedRecipe);

export default router;