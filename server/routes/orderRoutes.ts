import express from "express";
import { listOrders } from "../controllers/orderController";

const router = express.Router();

router.get("", listOrders);

export default router;
