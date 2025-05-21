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
    console.error("Error in /create:", err);
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
  const orderId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) {
    res.status(400).json({
      success: false,
      error: "User ID is required",
    });
    return;
  }

  try {
    const result = await orderService.joinOrder(user_id, orderId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /join-order:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const leaveOrder: RequestHandler = async (req, res) => {
  const orderId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) {
    res.status(400).json({
      success: false,
      error: "User ID is required",
    });
    return;
  }

  try {
    const result = await orderService.leaveOrder(user_id, orderId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /leave-order:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const updateOrderStatus: RequestHandler = async (req, res) => {
  const orderId = req.params.id;
  const { is_open } = req.body;

  if (typeof is_open !== 'boolean') {
    res.status(400).json({
      success: false,
      error: "is_open must be a boolean value",
    });
    return;
  }

  try {
    const result = await orderService.updateOrderStatus(orderId, is_open);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /update-status:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getOrderDetails: RequestHandler = async (req, res) => {
  const orderId = req.params.id;

  try {
    const result = await orderService.getOrderDetails(orderId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /order-details:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
