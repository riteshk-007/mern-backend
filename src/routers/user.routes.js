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

router.route("/register").post( //   /register
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

router.route("/login").post(loginUser) //    /login


router.route("/logout").post(verifyToken, logoutUser) //    /logout
router.route("/refresh-token").post(refreshAccessToken) //   /refresh-token
router.route("/change-password").post(verifyToken, changeCurrentPassword) //     /change-password
router.route('/current-user').get(verifyToken, currentUser) //    /current-user
router.route("/update-account").patch(verifyToken, updateProfile) //    /update-account

router.route("/update-avatar").patch(verifyToken, upload.single("avatar"), updateAvatar) //    /update-avatar
router.route("/cover-image").patch(verifyToken, upload.single("coverImage"),updateCoverImage) //    /cover-image

router.route("/c/:username").get(verifyToken, getUserChannelProfile)

router.route("/history").get(verifyToken, GetWatchHistory) //     /history

export default router;
