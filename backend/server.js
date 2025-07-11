const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { initSocket } = require("./utils/socket");
const path = require("path");
require("dotenv").config();

// Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sharePointRoutes = require("./routes/sharePointRoutes");

const app = express();
const server = http.createServer(app);

// Middleware - CORS Setup
app.use(cors({
  origin: [
    'https://novares-share-point.vercel.app', // ✅ Vercel frontend
    'http://localhost:3000',                  // ✅ Local React dev
    'http://localhost:5173'                   // ✅ Vite dev
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests for all routes
app.options('*', cors());

app.use(express.json());

// Serve static frontend (optional, if deploying frontend separately, you can remove this)
app.use(express.static(path.join(__dirname, 'build'))); // Adjust if needed

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

mongoose.set("strictQuery", false);

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sharepoints", sharePointRoutes);

// Catch-all route for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html')); // Adjust if needed
});

// Start server and initialize socket
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
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
