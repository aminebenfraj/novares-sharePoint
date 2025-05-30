const express = require("express");
const { registerUser, loginUser, currentUser } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// 🔹 Register a new user
router.post("/register", registerUser);

// 🔹 Login user and return JWT token
router.post("/login", loginUser);

// 🔹 Get current user info (Protected route)
router.get("/current-user", protect, currentUser);

module.exports = router;
