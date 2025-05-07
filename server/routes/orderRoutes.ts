import express from "express";
import {
  getActiveOrders,
  createOrder,
  deleteOrder,
} from "../controllers/orderController";

const router = express.Router();

router.get("", getActiveOrders);
router.post("/create", createOrder);
router.post("/delete/:id", deleteOrder);

export default router;
