const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const app = express();

// ✅ Correct CORS setup (server-side only)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "user"');
    res.json(result.rows);
  } catch (err) {
    console.error("Error querying DB:", err);
    res.status(500).send("DB error");
  }
});

const PORT = 5151;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
