// Updated adminRoutes.js - Add admin users endpoint

const express = require("express")
const router = express.Router()
const {
  getAllUsers,
  getAdminUsers, // Add the new function
  getUserByLicense,
  createUser,
  adminUpdateUser,
  updateUserRoles,
  adminDeleteUser,
  getUserStats,
} = require("../controllers/adminController")

const { protect, verifyAdmin } = require("../middlewares/authMiddleware")

// 🔹 Admin Only Routes
router.get("/stats", protect, verifyAdmin, getUserStats)
router.get("/all", protect, verifyAdmin, getAllUsers)
router.get("/admins", protect, verifyAdmin, getAdminUsers) // New endpoint for admin users only
router.get("/:license", protect, verifyAdmin, getUserByLicense)
router.post("/create", protect, verifyAdmin, createUser)
router.put("/update/:license", protect, verifyAdmin, adminUpdateUser)
router.put("/role/:license", protect, verifyAdmin, updateUserRoles)
router.delete("/delete/:license", protect, verifyAdmin, adminDeleteUser)

module.exports = router
