import { RequestHandler } from "express";
import * as orderService from "../services/orderService";

export const getActiveOrders: RequestHandler = async (_req, res) => {
  try {
    const result = await orderService.getOrders();
    res.status(result.success ? 200 : 400).json(result.orders || []);
  } catch (err) {
    console.error("Error in /orders:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const createOrder: RequestHandler = async (req, res) => {
  const { owner_id, restaurant, expiration, loc } = req.body;

  try {
    const result = await orderService.createOrder(
      owner_id,
      restaurant,
      expiration,
      loc,
    );
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /create-order:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const deleteOrder: RequestHandler = async (req, res) => {
  const orderId = req.params.id;

  try {
    const result = await orderService.deleteOrder(orderId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /delete-order:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const joinOrder: RequestHandler = async (req, res) => {
  const { userId, orderId } = req.body;

  try {
    const result = await orderService.joinOrder(userId, orderId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (e) {
    console.error("Error in /join-order:", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
