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

router.route("/p/:username").get(getUserProfile);
router.route("/d").get(verifyJWT,deleteUser)



export default router;
