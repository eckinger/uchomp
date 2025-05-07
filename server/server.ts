import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Pool } from "pg";
import userRoutes from "./routes/userRoutes";
import orderRoutes from "./routes/orderRoutes";

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

// Start server
const PORT = 5151;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
