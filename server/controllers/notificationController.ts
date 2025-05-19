import { RequestHandler } from "express";
import * as notificationService from "../services/notificationService";

export const sendExpirationAlert: RequestHandler = async (req, res) => {
  const { email, groupName, expirationTime } = req.body;
  
  try {
    const result = await notificationService.sendExpirationNotification(
      email,
      groupName,
      new Date(expirationTime)
    );
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error sending expiration notification:", err);
    res.status(500).json({ success: false, error: "Failed to send notification" });
  }
};

export const sendJoinAlert: RequestHandler = async (req, res) => {
  const { email, groupName } = req.body;
  
  try {
    const result = await notificationService.sendJoinNotification(email, groupName);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error sending join notification:", err);
    res.status(500).json({ success: false, error: "Failed to send notification" });
  }
};

export const sendLeaveAlert: RequestHandler = async (req, res) => {
  const { email, groupName } = req.body;
  
  try {
    const result = await notificationService.sendLeaveNotification(email, groupName);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error sending leave notification:", err);
    res.status(500).json({ success: false, error: "Failed to send notification" });
  }
};