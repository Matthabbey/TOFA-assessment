import express from "express";
import {
  Register,
  Login,
  CreateUser,
  CreateUserToken,
} from "../controller/userController";
import { auth } from "../middlewares/authentication";

const router = express.Router();

router.post("/signup", Register);
// router.post("/verify/:signature", verifyUser); //: means the query params, to get the id of the user saved in the local storage
router.post("/login", Login);
router.post("/create-user", auth, CreateUser);
router.post('/password-token', CreateUserToken)

export default router;
