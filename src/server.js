const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const { initializeSocketHandlers } = require("./socket/socketHandlers");

dotenv.config();
const app = express();

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize socket handlers
initializeSocketHandlers(io);

// Make io accessible to routes/controllers if needed
app.set("io", io);

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
const chatRoutes = require("./routes/chatRoutes");
const teamRoutes = require("./routes/teamRoutes");
const inviteRoutes = require("./routes/inviteRoutes");

app.use("/api", authRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/invites", inviteRoutes);

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Backend is running with WebSocket support...");
});

const PORT = process.env.PORT || 8003;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} with WebSocket support`)
);