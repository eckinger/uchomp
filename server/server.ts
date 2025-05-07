import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";
import * as userService from "./services/userService";
import * as orderService from "./services/orderService";
import userRoutes from "./routes/userRoutes";
import orderRoutes from "./routes/orderRoutes";

dotenv.config({ path: ".env.local" });

const app = express();

// CORS Setup
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Database Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
});

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// API: Send Code
app.post("/send-code", async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const result = await userService.sendCode(email);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /send-code:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// API: Verify Code
app.post("/verify", async (req, res) => {
  const { email, key } = req.body;
  try {
    const result = await userService.verify(email, key);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /verify:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// API: Update Profile (name + cell)
app.post("/update-profile", async (req: Request, res: Response) => {
  const { email, name, cell } = req.body;
  try {
    const result = await userService.updateNameAndCell(email, name, cell);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /update-profile:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// API: Create Order
app.post("/create-order", async (req: Request, res: Response) => {
  const { owner_id, restaurant, expiration, loc } = req.body;

  try {
    const result = await orderService.createOrder(
      owner_id,
      restaurant,
      expiration,
      loc
    );
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /create-order:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// API: Delete Order
app.delete("/delete-order/:id", async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);

  try {
    const result = await orderService.deleteOrder(orderId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Error in /delete-order:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// API: List Users
app.get("/api/users", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM "user"');
    res.json(result.rows);
  } catch (err) {
    console.error("Error querying DB:", err);
    res.status(500).send("DB error");
  }
});

// Start server
const PORT = 5151;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
