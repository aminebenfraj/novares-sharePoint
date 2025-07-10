const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
require("dotenv").config();

// Socket utility
const { initSocket } = require("./utils/socket");

// Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sharePointRoutes = require("./routes/sharePointRoutes");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: [
    'https://novares-sharepoint.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((error) => console.error("❌ MongoDB connection failed:", error));

mongoose.set("strictQuery", false);

// Serve static files from React (adjust 'dist' if using CRA)
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sharepoints", sharePointRoutes);

// Catch-all route to serve frontend for non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// Start server + initialize Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    const { io, emitNewCall } = initSocket(server);
    app.set("emitNewCall", emitNewCall);
    console.log("✅ Socket.IO initialized");
  } catch (error) {
    console.error("❌ Socket.IO initialization failed:", error.message);
  }
});
