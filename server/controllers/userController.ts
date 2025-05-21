import { RequestHandler } from "express";
import * as userService from "../services/userService";

export const loginUser: RequestHandler = async (req, res) => {
  const { email } = req.body;

  try {
    const code = await userService.sendCode(email);
    res.status(200).json({ code: code });
  } catch (err) {
    console.error("Error inserting code:", err);
    res.status(400).json({
      error: "Unable to process your request. Error: " + JSON.stringify(err),
    });
  }
};

export const emailCodeToUser: RequestHandler = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await userService.sendCode(email);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /send-code:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const verifyEmail: RequestHandler = async (req, res) => {
  const { email, key } = req.body;
  try {
    const result = await userService.verify(email, key);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /verify:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const updateAccountInformation: RequestHandler = async (req, res) => {
  const { email, name, cell } = req.body;
  try {
    const result = await userService.updateNameAndCell(email, name, cell);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /update:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
