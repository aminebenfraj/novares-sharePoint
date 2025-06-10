const express = require("express")
const router = express.Router()
const sharePointController = require("../controllers/sharePointController")
const { protect } = require("../middlewares/authMiddleware")

// Create SharePoint document
router.post("/", protect, sharePointController.createSharePoint)

// Get all SharePoints (with filtering and pagination)
router.get("/", protect, sharePointController.getAllSharePoints)

// Get SharePoints assigned to current user
router.get("/my-assigned", protect, sharePointController.getMyAssignedSharePoints)

// Get SharePoints created by current user
router.get("/my-created", protect, sharePointController.getMyCreatedSharePoints)

// Check if user can sign a specific SharePoint (must be before /:id route)
router.get("/:id/can-sign/:userId?", protect, sharePointController.canUserSign)

// Approve SharePoint (manager action)
router.post("/:id/approve", protect, sharePointController.approveSharePoint)

// Sign SharePoint (user action)
router.post("/:id/sign", protect, sharePointController.signSharePoint)

// Get specific SharePoint by ID
router.get("/:id", protect, sharePointController.getSharePointById)

// Update SharePoint
router.put("/:id", protect, sharePointController.updateSharePoint)

// Delete SharePoint
router.delete("/:id", protect, sharePointController.deleteSharePoint)

module.exports = router
