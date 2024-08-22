import { Router } from "express";
import {
  userLogin,
  userLogout,
  userRegister,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserDetails,
  getCurrentUser,
  updateAvatarImage,
  getUserProfile,
  deleteUser,
  getLikedRecipe,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(upload.single("avatar"), userRegister);

router.route("/login").post(userLogin);

//secure routes
router.route("/logout").post(verifyJWT, userLogout);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-details").patch(verifyJWT, updateUserDetails);
router.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatarImage);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/p/:username").get(verifyJWT, getUserProfile);
router.route("/d/:username").get(verifyJWT,deleteUser)

router.route("/liked-product").get(verifyJWT, getLikedRecipe);

export default router;
