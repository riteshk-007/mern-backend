import { Router } from "express";
import { 
    GetWatchHistory,
    changeCurrentPassword, 
    currentUser,
    getUserChannelProfile,
    loginUser,
    logoutUser,
    refreshAccessToken, 
    registerUser, 
    updateAvatar,
    updateCoverImage,
    updateProfile 
        } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser)


router.route("/logout").post(verifyToken, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyToken, changeCurrentPassword)
router.route('/current-user').get(verifyToken, currentUser)
router.route("/update-account").patch(verifyToken, updateProfile)

router.route("/update-avatar").patch(verifyToken, upload.single("avatar"), updateAvatar)
router.route("/cover-image").patch(verifyToken, upload.single("coverImage"),updateCoverImage)

router.route("/c/:username").get(verifyToken, getUserChannelProfile)

router.route("/history").get(verifyToken, GetWatchHistory)

export default router;
