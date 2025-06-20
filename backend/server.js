const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { initSocket } = require("./utils/socket"); // Corrected path
require("dotenv").config();

// Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sharePointRoutes = require("./routes/sharePointRoutes")


const app = express();

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: [
    'https://novares-sharepoint.onrender.com',
    'http://localhost:3000', // For local development
    'http://localhost:5173'  // For Vite default port if you're using it
  ],
  credentials: true, // This is crucial for allowing cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
// Removed duplicate app.use(express.json())

// MongoDB Connection

app.use(express.json())

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected")
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error)
  })
// Handle Mongoose Deprecation Warning
mongoose.set("strictQuery", false);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sharepoints", sharePointRoutes)


// Start Server and Initialize Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);

  // Initialize Socket.IO after server starts
  try {
    const { io, emitNewCall } = initSocket(server);
    app.set("emitNewCall", emitNewCall);
    console.log(`Socket.IO initialized on port ${PORT}`);
  } catch (error) {
    console.error("Failed to initialize Socket.IO:", {
      message: error.message,
      stack: error.stack,
    });
  }

  
});