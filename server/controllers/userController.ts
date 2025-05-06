import { RequestHandler } from "express";
import * as userService from "../services/userService";

export const loginUser: RequestHandler = async (req, res) => {
  const { email } = req.body;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

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
