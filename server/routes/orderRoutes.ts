import express from "express";
import {
  getActiveOrders,
  createOrder,
  deleteOrder,
  joinOrder,
  leaveOrder,
  updateOrderStatus,
  getOrderDetails,
} from "../controllers/orderController";

const router = express.Router();

router.get("", getActiveOrders);
router.get("/details/:id", getOrderDetails);
router.post("/create", createOrder);
router.post("/delete/:id", deleteOrder);
router.post("/join/:id", joinOrder);
router.post("/leave/:id", leaveOrder);
router.post("/update-status/:id", updateOrderStatus);

export default router;
