const SharePoint = require("../models/SharePoint")
const User = require("../models/UserModel")
const mongoose = require("mongoose")

exports.createSharePoint = async (req, res) => {
  try {
    const { title, link, comment, deadline, departmentApprover, usersToSign, fileMetadata } = req.body

    // Validate required fields
    if (!title || !link || !deadline) {
      return res.status(400).json({ error: "Title, link, and deadline are required fields" })
    }

    // Validate users to sign if provided
    if (usersToSign && usersToSign.length > 0) {
      // Check if all users exist
      const userIds = usersToSign.map((userId) => userId)
      const existingUsers = await User.countDocuments({ _id: { $in: userIds } })

      if (existingUsers !== userIds.length) {
        return res.status(400).json({ error: "One or more users to sign do not exist" })
      }
    }

    // Create new SharePoint document
    const sharePoint = new SharePoint({
      title,
      link,
      comment,
      deadline: new Date(deadline),
      departmentApprover: departmentApprover || false,
      usersToSign:
        usersToSign?.map((userId) => ({
          user: userId,
          hasSigned: false,
        })) || [],
      fileMetadata,
      createdBy: req.user._id,
      managerApproved: false, // Always starts as not approved
      updateHistory: [
        {
          action: "created",
          performedBy: req.user._id,
          timestamp: Date.now(),
          details: "Document created and sent for manager approval",
        },
      ],
    })

    await sharePoint.save()

    // Populate the response
    await sharePoint.populate([
      { path: "createdBy", select: "username email" },
      { path: "usersToSign.user", select: "username email" },
    ])

    res.status(201).json({
      success: true,
      message: "SharePoint document created successfully and sent for manager approval",
      data: sharePoint,
    })
  } catch (error) {
    console.error("Error creating SharePoint document:", error)
    res.status(500).json({ error: "Error creating SharePoint document", details: error.message })
  }
}

exports.approveDocument = async (req, res) => {
  try {
    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint document not found" })
    }

    // Check if user is a manager or admin
    if (!req.user.roles.includes("Manager") && !req.user.roles.includes("Admin")) {
      return res.status(403).json({ error: "Only managers can approve documents" })
    }

    // Check if document is already approved
    if (sharePoint.managerApproved) {
      return res.status(400).json({ error: "Document is already approved" })
    }

    // Don't allow creator to approve their own document
    if (sharePoint.createdBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: "You cannot approve your own document" })
    }

    // Approve the document
    sharePoint.managerApproved = true
    sharePoint.approvedAt = new Date()
    sharePoint.approvedBy = req.user._id

    // Add to update history
    sharePoint.updateHistory.push({
      action: "approved",
      performedBy: req.user._id,
      timestamp: Date.now(),
      details: `Document approved by manager ${req.user.username}`,
    })

    await sharePoint.save()

    // Populate the response
    await sharePoint.populate([
      { path: "createdBy", select: "username email" },
      { path: "usersToSign.user", select: "username email" },
      { path: "approvedBy", select: "username email" },
    ])

    res.json({
      success: true,
      message: "Document approved successfully",
      data: sharePoint,
    })
  } catch (error) {
    console.error("Error approving SharePoint document:", error)

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: "Invalid SharePoint ID format" })
    }

    res.status(500).json({ error: "Error approving SharePoint document", details: error.message })
  }
}

exports.getAllSharePoints = async (req, res) => {
  try {
    // Pagination parameters
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Filtering parameters
    const filter = {}

    if (req.query.status) {
      filter.status = req.query.status
    }

    if (req.query.createdBy) {
      filter.createdBy = req.query.createdBy
    }

    // Date range filtering
    if (req.query.startDate && req.query.endDate) {
      filter.creationDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      }
    }

    // Search by title
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: "i" }
    }

    // Get documents assigned to the current user
    if (req.query.assignedToMe === "true") {
      filter["usersToSign.user"] = req.user._id
    }

    // Query with pagination
    const sharePoints = await SharePoint.find(filter)
      .populate("createdBy", "username email image")
      .populate("usersToSign.user", "username email image")
      .populate("approvedBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Get total count for pagination
    const total = await SharePoint.countDocuments(filter)

    res.json({
      success: true,
      count: sharePoints.length,
      total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        pageSize: limit,
      },
      data: sharePoints,
    })
  } catch (error) {
    console.error("Error fetching SharePoint documents:", error)
    res.status(500).json({ error: "Error fetching SharePoint documents", details: error.message })
  }
}


exports.getSharePointById = async (req, res) => {
  try {
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email image")
      .populate("usersToSign.user", "username email image")
      .populate("approvedBy", "username email")
      .populate("updateHistory.performedBy", "username email")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint document not found" })
    }

    res.json({
      success: true,
      data: sharePoint,
    })
  } catch (error) {
    console.error("Error fetching SharePoint document:", error)

    // Check if error is due to invalid ID format
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: "Invalid SharePoint ID format" })
    }

    res.status(500).json({ error: "Error fetching SharePoint document", details: error.message })
  }
}


exports.getDocumentStats = async (req, res) => {
  try {
    // Get total documents count
    const totalDocuments = await SharePoint.countDocuments()

    // Get pending approval count
    const pendingApproval = await SharePoint.countDocuments({ managerApproved: false })

    // Get pending signatures count (approved but not all signed)
    const pendingSignatures = await SharePoint.countDocuments({
      managerApproved: true,
      status: { $in: ["pending", "in_progress"] },
    })

    // Get completed documents count
    const completedDocuments = await SharePoint.countDocuments({ status: "completed" })

    // Get expired documents count
    const expiredDocuments = await SharePoint.countDocuments({
      deadline: { $lt: new Date() },
      status: { $ne: "completed" },
    })

    // Get counts by status for detailed breakdown
    const statusCounts = await SharePoint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])

    // Format status counts
    const statusStats = {}
    statusCounts.forEach((item) => {
      statusStats[item._id] = item.count
    })

    // Get counts by month (for the current year)
    const currentYear = new Date().getFullYear()
    const monthlyStats = await SharePoint.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Format monthly stats
    const monthlyData = Array(12).fill(0)
    monthlyStats.forEach((item) => {
      monthlyData[item._id - 1] = item.count
    })

    res.json({
      success: true,
      data: {
        totalDocuments,
        pendingApproval,
        pendingSignatures,
        completedDocuments,
        expiredDocuments,
        statusStats,
        monthlyData,
      },
    })
  } catch (error) {
    console.error("Error fetching document statistics:", error)
    res.status(500).json({ error: "Error fetching document statistics", details: error.message })
  }
}


exports.signDocument = async (req, res) => {
  try {
    const { signatureNote } = req.body

    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint document not found" })
    }

    // Check if document is approved by manager
    if (!sharePoint.managerApproved) {
      return res.status(403).json({ error: "Document must be approved by manager before signing" })
    }

    // Check if user is in the usersToSign array
    const userSignIndex = sharePoint.usersToSign.findIndex((user) => user.user.toString() === req.user._id.toString())

    if (userSignIndex === -1) {
      return res.status(403).json({ error: "You are not authorized to sign this document" })
    }

    // Check if user has already signed
    if (sharePoint.usersToSign[userSignIndex].hasSigned) {
      return res.status(400).json({ error: "You have already signed this document" })
    }

    // Update the user's signature status
    sharePoint.usersToSign[userSignIndex].hasSigned = true
    sharePoint.usersToSign[userSignIndex].signedAt = Date.now()
    sharePoint.usersToSign[userSignIndex].signatureNote = signatureNote || ""

    // Add to update history
    sharePoint.updateHistory.push({
      action: "signed",
      performedBy: req.user._id,
      timestamp: Date.now(),
      details: `Document signed by ${req.user.username}`,
    })

    await sharePoint.save()

    // Populate the response
    await sharePoint.populate([
      { path: "createdBy", select: "username email image" },
      { path: "usersToSign.user", select: "username email image" },
    ])

    res.json({
      success: true,
      message: "Document signed successfully",
      data: sharePoint,
    })
  } catch (error) {
    console.error("Error signing SharePoint document:", error)

    // Check if error is due to invalid ID format
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: "Invalid SharePoint ID format" })
    }

    res.status(500).json({ error: "Error signing SharePoint document", details: error.message })
  }
}


exports.updateSharePoint = async (req, res) => {
  try {
    const { title, link, comment, deadline, departmentApprover, fileMetadata } = req.body

    // Find the document first to get previous values for history
    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint document not found" })
    }

    // Check if user is authorized to update (creator or admin)
    if (sharePoint.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes("Admin")) {
      return res.status(403).json({ error: "Not authorized to update this document" })
    }

    // Store previous values for history
    const previousValues = {
      title: sharePoint.title,
      link: sharePoint.link,
      comment: sharePoint.comment,
      deadline: sharePoint.deadline,
      departmentApprover: sharePoint.departmentApprover,
    }

    // Update fields if provided
    if (title) sharePoint.title = title
    if (link) sharePoint.link = link
    if (comment !== undefined) sharePoint.comment = comment
    if (deadline) sharePoint.deadline = new Date(deadline)
    if (departmentApprover !== undefined) sharePoint.departmentApprover = departmentApprover
    if (fileMetadata) sharePoint.fileMetadata = fileMetadata

    // Add update to history
    sharePoint.updateHistory.push({
      action: "updated",
      performedBy: req.user._id,
      timestamp: Date.now(),
      details: "Document updated",
      previousValues,
    })

    await sharePoint.save()

    // Populate the response
    await sharePoint.populate([
      { path: "createdBy", select: "username email image" },
      { path: "usersToSign.user", select: "username email image" },
    ])

    res.json({
      success: true,
      message: "SharePoint document updated successfully",
      data: sharePoint,
    })
  } catch (error) {
    console.error("Error updating SharePoint document:", error)

    // Check if error is due to invalid ID format
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: "Invalid SharePoint ID format" })
    }

    res.status(500).json({ error: "Error updating SharePoint document", details: error.message })
  }
}

exports.deleteSharePoint = async (req, res) => {
  try {
    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint document not found" })
    }

    // Check if user is authorized to delete (creator or admin)
    if (sharePoint.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes("Admin")) {
      return res.status(403).json({ error: "Not authorized to delete this document" })
    }

    await SharePoint.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "SharePoint document deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting SharePoint document:", error)

    // Check if error is due to invalid ID format
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: "Invalid SharePoint ID format" })
    }

    res.status(500).json({ error: "Error deleting SharePoint document", details: error.message })
  }
}


exports.addUsersToSign = async (req, res) => {
  try {
    const { users } = req.body

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "Users array is required" })
    }

    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint document not found" })
    }

    // Check if user is authorized (creator or admin)
    if (sharePoint.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes("Admin")) {
      return res.status(403).json({ error: "Not authorized to modify this document" })
    }

    // Validate all user IDs
    const userIds = users.map((userId) => userId)
    const existingUsers = await User.find({ _id: { $in: userIds } })

    if (existingUsers.length !== userIds.length) {
      return res.status(400).json({ error: "One or more users do not exist" })
    }

    // Filter out users that are already in the usersToSign array
    const existingUserIds = sharePoint.usersToSign.map((user) => user.user.toString())
    const newUsers = userIds.filter((userId) => !existingUserIds.includes(userId))

    if (newUsers.length === 0) {
      return res.status(400).json({ error: "All users are already added to sign this document" })
    }

    // Add new users to sign
    newUsers.forEach((userId) => {
      sharePoint.usersToSign.push({
        user: userId,
        hasSigned: false,
      })
    })

    // Add to update history
    sharePoint.updateHistory.push({
      action: "updated",
      performedBy: req.user._id,
      timestamp: Date.now(),
      details: `Added ${newUsers.length} users to sign the document`,
    })

    await sharePoint.save()

    // Populate the response
    await sharePoint.populate([
      { path: "createdBy", select: "username email image" },
      { path: "usersToSign.user", select: "username email image" },
    ])

    res.json({
      success: true,
      message: `Added ${newUsers.length} users to sign the document`,
      data: sharePoint,
    })
  } catch (error) {
    console.error("Error adding users to sign:", error)

    // Check if error is due to invalid ID format
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: "Invalid SharePoint ID format" })
    }

    res.status(500).json({ error: "Error adding users to sign", details: error.message })
  }
}


exports.removeUserToSign = async (req, res) => {
  try {
    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint document not found" })
    }

    // Check if user is authorized (creator or admin)
    if (sharePoint.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes("Admin")) {
      return res.status(403).json({ error: "Not authorized to modify this document" })
    }

    // Find the user in the usersToSign array
    const userIndex = sharePoint.usersToSign.findIndex((user) => user.user.toString() === req.params.userId)

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found in the document's signing list" })
    }

    // Check if user has already signed
    if (sharePoint.usersToSign[userIndex].hasSigned) {
      return res.status(400).json({ error: "Cannot remove a user who has already signed" })
    }

    // Remove the user
    sharePoint.usersToSign.splice(userIndex, 1)

    // Add to update history
    sharePoint.updateHistory.push({
      action: "updated",
      performedBy: req.user._id,
      timestamp: Date.now(),
      details: `Removed a user from the signing list`,
    })

    await sharePoint.save()

    // Populate the response
    await sharePoint.populate([
      { path: "createdBy", select: "username email image" },
      { path: "usersToSign.user", select: "username email image" },
    ])

    res.json({
      success: true,
      message: "User removed from signing list successfully",
      data: sharePoint,
    })
  } catch (error) {
    console.error("Error removing user from signing list:", error)

    // Check if error is due to invalid ID format
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: "Invalid ID format" })
    }

    res.status(500).json({ error: "Error removing user from signing list", details: error.message })
  }
}


exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!status || !["pending", "in_progress", "completed", "expired", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Valid status is required" })
    }

    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint document not found" })
    }

    // Only admins can manually update status
    if (!req.user.roles.includes("Admin")) {
      return res.status(403).json({ error: "Only admins can manually update document status" })
    }

    const previousStatus = sharePoint.status
    sharePoint.status = status

    // Add to update history
    sharePoint.updateHistory.push({
      action: "updated",
      performedBy: req.user._id,
      timestamp: Date.now(),
      details: `Status changed from ${previousStatus} to ${status}`,
      previousValues: { status: previousStatus },
    })

    await sharePoint.save()

    // Populate the response
    await sharePoint.populate([
      { path: "createdBy", select: "username email image" },
      { path: "usersToSign.user", select: "username email image" },
    ])

    res.json({
      success: true,
      message: "Document status updated successfully",
      data: sharePoint,
    })
  } catch (error) {
    console.error("Error updating document status:", error)

    // Check if error is due to invalid ID format
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: "Invalid SharePoint ID format" })
    }

    res.status(500).json({ error: "Error updating document status", details: error.message })
  }
}

exports.getPendingSignatures = async (req, res) => {
  try {
    const pendingDocuments = await SharePoint.find({
      "usersToSign.user": req.user._id,
      "usersToSign.hasSigned": false,
      managerApproved: true,
      status: { $in: ["pending", "in_progress"] },
    })
      .populate("createdBy", "username email image")
      .populate("usersToSign.user", "username email image")
      .sort({ deadline: 1 })

    res.json({
      success: true,
      count: pendingDocuments.length,
      data: pendingDocuments,
    })
  } catch (error) {
    console.error("Error fetching pending signatures:", error)
    res.status(500).json({ error: "Error fetching pending signatures", details: error.message })
  }
}


exports.getMyDocuments = async (req, res) => {
  try {
    // Pagination parameters
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Filter by status if provided
    const filter = { createdBy: req.user._id }
    if (req.query.status) {
      filter.status = req.query.status
    }

    const documents = await SharePoint.find(filter)
      .populate("usersToSign.user", "username email image")
      .populate("approvedBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Get total count for pagination
    const total = await SharePoint.countDocuments(filter)

    res.json({
      success: true,
      count: documents.length,
      total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        pageSize: limit,
      },
      data: documents,
    })
  } catch (error) {
    console.error("Error fetching user's documents:", error)
    res.status(500).json({ error: "Error fetching user's documents", details: error.message })
  }
}
