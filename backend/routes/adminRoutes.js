const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserByLicense,
  createUser,
  adminUpdateUser,
  updateUserRoles,
  adminDeleteUser
} = require("../controllers/adminController");

const { protect, verifyAdmin } = require("../middlewares/authMiddleware");

// 🔹 Admin Only Routes
router.get("/all", protect, verifyAdmin, getAllUsers);
router.get("/:license", protect, verifyAdmin, getUserByLicense);
router.post("/create", protect, verifyAdmin, createUser);
router.put("/update/:license", protect, verifyAdmin, adminUpdateUser);
router.put("/role/:license", protect, verifyAdmin, updateUserRoles);
router.delete("/delete/:license", protect, verifyAdmin, adminDeleteUser);

module.exports = router;
