import dotenv from "dotenv";

import express from "express";
import cors from "cors";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "API is running" });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () =>
      console.log(`🚀 Server is running on http://localhost:${PORT}`),
    );
  } catch (err) {
    console.error("Mongo error:", err);
    process.exit(1);
  }
}
startServer();
