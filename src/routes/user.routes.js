//all the routes related to the user will be used here 
import { Router } from "express";
import { loggedOutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        //accepting two files 
        //images and avatars so 2 objects
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);
// router.route("/login").post(login);

router.route("/login").post(loginUser);

//Secured routes
router.route("/logout").post(verifyJWT,loggedOutUser);
//working: verifyJWT -> (MIDDLEWARE) -> loggedOutUser

export default router;