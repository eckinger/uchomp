import express from "express";
import {
  getActiveOrders,
  createOrder,
  deleteOrder,
  joinOrder,
  leaveOrder,
} from "../controllers/orderController";

const router = express.Router();

router.get("", getActiveOrders);
router.post("/create", createOrder);
router.post("/delete/:id", deleteOrder);
router.post("/join/:id", joinOrder);
router.post("/leave/:id", leaveOrder);

export default router;
