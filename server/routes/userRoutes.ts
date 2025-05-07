import express from "express";
import {
  emailCodeToUser,
  loginUser,
  updateAccountInformation,
  verifyEmail,
} from "../controllers/userController";

const router = express.Router();

router.post("/login", loginUser);
router.post("/send-code", emailCodeToUser);
router.post("/verify", verifyEmail);
router.post("/update", updateAccountInformation);

export default router;
