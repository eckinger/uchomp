import { RequestHandler } from "express";
import * as orderService from "../services/orderService";

export const listOrders: RequestHandler = async (_req, res) => {
  try {
    const result = await orderService.getOrders();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      error:
        "An unexpected server error occurred. Error: " + JSON.stringify(err),
    });
  }
};
