const express = require("express")
const router = express.Router()
const { protect, verifyAdmin } = require("../middlewares/authMiddleware")
const sharePointController = require("../controllers/sharePointController")

// Base route: /api/sharepoint

// Protected routes - require authentication
router.use(protect)

// Statistics route - accessible to all authenticated users
router.get("/stats", sharePointController.getDocumentStats)

// User-specific document routes
router.get("/pending-signature", sharePointController.getPendingSignatures)
router.get("/my-documents", sharePointController.getMyDocuments)

// CRUD operations
router.post("/", sharePointController.createSharePoint)
router.get("/", sharePointController.getAllSharePoints)
router.get("/:id", sharePointController.getSharePointById)
router.put("/:id", sharePointController.updateSharePoint)
router.delete("/:id", sharePointController.deleteSharePoint)

// Document actions
router.post("/:id/approve", sharePointController.approveDocument)
router.post("/:id/sign", sharePointController.signDocument)
router.post("/:id/users", sharePointController.addUsersToSign)
router.delete("/:id/users/:userId", sharePointController.removeUserToSign)
router.patch("/:id/status", verifyAdmin, sharePointController.updateStatus)

module.exports = router
