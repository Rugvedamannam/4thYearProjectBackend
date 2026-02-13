const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // OK for auth & normal APIs

// DB
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const hackathonRoutes = require("./routes/HackathonRoutes");

app.use("/", authRoutes);
app.use("/api/hackathons", hackathonRoutes);

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
