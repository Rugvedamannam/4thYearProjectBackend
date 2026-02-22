const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const hackathonRoutes = require("./routes/HackathonRoutes");
const projectRoutes = require("./routes/ProjectRoutes");
const timelineRoutes = require("./routes/TimeLineRoutes");

app.use("/", authRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/timeline", timelineRoutes);

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);