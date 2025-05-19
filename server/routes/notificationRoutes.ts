import express from "express";
import {
  sendExpirationAlert,
  sendJoinAlert,
  sendLeaveAlert
} from "../controllers/notificationController";

const router = express.Router();

router.post("/expiration", sendExpirationAlert);
router.post("/join", sendJoinAlert);
router.post("/leave", sendLeaveAlert);

export default router;