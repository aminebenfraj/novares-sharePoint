const SharePoint = require("../models/SharePoint")
const User = require("../models/UserModel")
const {
  sendBulkSharePointAssignmentEmails,
  sendSharePointApprovalEmail,
  sendSharePointCompletionEmail,
} = require("../utils/emailService")

// Helper function to calculate completion percentage and status
const calculateCompletionData = (sharePoint) => {
  const totalSigners = sharePoint.usersToSign?.length || 0
  const signedCount = sharePoint.usersToSign?.filter((signer) => signer.hasSigned).length || 0

  const completionPercentage = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0
  const allUsersSigned = totalSigners > 0 && signedCount === totalSigners

  // Update status based on completion
  let status = sharePoint.status
  if (allUsersSigned && sharePoint.managerApproved) {
    status = "completed"
  } else if (signedCount > 0 && sharePoint.managerApproved) {
    status = "in_progress"
  } else if (sharePoint.managerApproved) {
    status = "pending"
  }

  return { completionPercentage, allUsersSigned, status }
}

// Create a new SharePoint - FIXED with proper email notifications
exports.createSharePoint = async (req, res) => {
  try {
    const { title, link, comment, deadline, usersToSign } = req.body

    // Validate required fields
    if (!title || !link || !deadline) {
      return res.status(400).json({ error: "Title, link, and deadline are required" })
    }

    // Validate deadline is in the future
    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({ error: "Deadline must be in the future" })
    }

    // Validate usersToSign array
    if (!Array.isArray(usersToSign) || usersToSign.length === 0) {
      return res.status(400).json({ error: "At least one signer must be selected" })
    }

    // Verify all selected users exist and get their full details
    const selectedUsers = await User.find({ _id: { $in: usersToSign } }).select("_id username email roles")
    if (selectedUsers.length !== usersToSign.length) {
      return res.status(400).json({ error: "One or more selected users do not exist" })
    }

    // Create SharePoint document
    const sharePoint = new SharePoint({
      title,
      link,
      comment,
      deadline: new Date(deadline),
      createdBy: req.user._id,
      usersToSign: usersToSign.map((userId) => ({ user: userId })),
      status: "pending_approval",
      updateHistory: [
        {
          action: "created",
          performedBy: req.user._id,
          details: `SharePoint created with title: ${title}. Waiting for manager approval.`,
        },
      ],
    })

    await sharePoint.save()
    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
    ])

    // ✅ FIXED: Send email notifications to assigned users
    try {
      console.log(`📧 Preparing to send emails to ${selectedUsers.length} users...`)

      // Prepare email data for each assigned user
      const emailList = selectedUsers.map((user) => ({
        to: user.email,
        username: user.username,
        documentTitle: title,
        documentLink: link,
        deadline: deadline,
        createdBy: req.user.username,
        comment: comment || "",
        documentId: sharePoint._id.toString(),
      }))

      // Send bulk emails
      const emailResults = await sendBulkSharePointAssignmentEmails(emailList)

      console.log(`📧 Email notification results:`, {
        total: emailResults.total,
        successful: emailResults.successful,
        failed: emailResults.failed,
      })

      // Log any failed emails
      if (emailResults.failed > 0) {
        console.warn(`⚠️ ${emailResults.failed} emails failed to send`)
      }
    } catch (emailError) {
      console.error("❌ Email notification failed:", emailError)
      // Continue with response even if email fails - don't break document creation
    }

    // Calculate completion data
    const completionData = calculateCompletionData(sharePoint)
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.status(201).json({
      message:
        "SharePoint created successfully. Email notifications sent to assigned users. Waiting for manager approval before users can sign.",
      sharePoint: responseData,
      emailNotificationsSent: true,
    })
  } catch (error) {
    console.error("Error creating SharePoint:", error)
    res.status(500).json({ error: "Error creating SharePoint" })
  }
}

// Get all SharePoints with enhanced pagination
exports.getAllSharePoints = async (req, res) => {
  try {
    const {
      status,
      createdBy,
      assignedTo,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
    } = req.query

    const filter = {}
    const sort = {}

    // Apply filters
    if (status && status !== "all") filter.status = status
    if (createdBy) filter.createdBy = createdBy
    if (assignedTo) filter["usersToSign.user"] = assignedTo

    // Add search functionality
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { comment: { $regex: search, $options: "i" } }]
    }

    // For non-admin users, only show SharePoints they created or are assigned to
    if (!req.user.roles.includes("Admin")) {
      const userFilter = { $or: [{ createdBy: req.user._id }, { "usersToSign.user": req.user._id }] }
      filter.$and = filter.$and ? [...filter.$and, userFilter] : [userFilter]
    }

    // Set up sorting
    sort[sortBy] = sortOrder === "desc" ? -1 : 1

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    const sharePoints = await SharePoint.find(filter)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")
      .populate("approvedBy", "username email")
      .sort(sort)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .lean()

    // Add completion data to each sharePoint
    const sharePointsWithCompletion = sharePoints.map((sharePoint) => {
      const completionData = calculateCompletionData(sharePoint)
      return { ...sharePoint, ...completionData }
    })

    const total = await SharePoint.countDocuments(filter)

    res.json({
      sharePoints: sharePointsWithCompletion,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
        totalItems: total,
        itemsPerPage: Number.parseInt(limit),
        hasNextPage: Number.parseInt(page) < Math.ceil(total / Number.parseInt(limit)),
        hasPrevPage: Number.parseInt(page) > 1,
      },
      filters: {
        status,
        createdBy,
        assignedTo,
        search,
        sortBy,
        sortOrder,
      },
    })
  } catch (error) {
    console.error("Error fetching SharePoints:", error)
    res.status(500).json({ error: "Error fetching SharePoints" })
  }
}

// Get SharePoint by ID
exports.getSharePointById = async (req, res) => {
  try {
    if (!req.user || !req.user.roles) {
      console.log("req.user or req.user.roles is undefined:", req.user)
      return res.status(401).json({ error: "Authentication required", details: "User or roles not found" })
    }

    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")
      .populate("approvedBy", "username email")
      .populate("updateHistory.performedBy", "username email")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    const canView =
      req.user.roles.includes("Admin") ||
      sharePoint.createdBy._id.toString() === req.user._id.toString() ||
      sharePoint.usersToSign.some((signer) => signer.user._id.toString() === req.user._id.toString())

    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to view this SharePoint" })
    }

    // Calculate completion data
    const completionData = calculateCompletionData(sharePoint)
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.json(responseData)
  } catch (error) {
    console.error("Error fetching SharePoint:", error)
    res.status(500).json({ error: "Error fetching SharePoint", details: error.message })
  }
}

// Sign SharePoint - UPDATED with completion email notifications
exports.signSharePoint = async (req, res) => {
  try {
    const { signatureNote } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    // Check if manager has approved the document first
    if (!sharePoint.managerApproved) {
      return res.status(403).json({
        error: "Document must be approved by a manager before users can sign it",
        code: "MANAGER_APPROVAL_REQUIRED",
      })
    }

    // Check if user is in the signers list
    const signerIndex = sharePoint.usersToSign.findIndex(
      (signer) => signer.user._id.toString() === req.user._id.toString(),
    )

    if (signerIndex === -1) {
      return res.status(403).json({ error: "You are not authorized to sign this SharePoint" })
    }

    // Check if already signed
    if (sharePoint.usersToSign[signerIndex].hasSigned) {
      return res.status(400).json({ error: "You have already signed this SharePoint" })
    }

    // Update signature
    sharePoint.usersToSign[signerIndex].hasSigned = true
    sharePoint.usersToSign[signerIndex].signedAt = new Date()
    if (signatureNote) {
      sharePoint.usersToSign[signerIndex].signatureNote = signatureNote
    }

    // Calculate completion and update status
    const completionData = calculateCompletionData(sharePoint)
    sharePoint.status = completionData.status

    // Add to history
    sharePoint.updateHistory.push({
      action: "signed",
      performedBy: req.user._id,
      details: signatureNote ? `Signed with note: ${signatureNote}` : "Signed",
    })

    await sharePoint.save()

    // ✅ Send completion email if document is now completed
    if (completionData.status === "completed") {
      try {
        // Send completion email to document creator
        await sendSharePointCompletionEmail({
          to: sharePoint.createdBy.email,
          username: sharePoint.createdBy.username,
          documentTitle: sharePoint.title,
          documentId: sharePoint._id.toString(),
        })

        console.log(`📧 Completion notification sent to document creator: ${sharePoint.createdBy.email}`)
      } catch (emailError) {
        console.error("❌ Failed to send completion email:", emailError)
      }
    }

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
    ])

    // Add completion data to response
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.json({
      message: "SharePoint signed successfully",
      sharePoint: responseData,
    })
  } catch (error) {
    console.error("Error signing SharePoint:", error)
    res.status(500).json({ error: "Error signing SharePoint" })
  }
}

// Get SharePoints assigned to current user with enhanced pagination
exports.getMyAssignedSharePoints = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search = "" } = req.query

    const filter = {
      "usersToSign.user": req.user._id,
    }

    if (status && status !== "all") filter.status = status

    // Add search functionality
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { comment: { $regex: search, $options: "i" } }]
    }

    const sort = {}
    sort[sortBy] = sortOrder === "desc" ? -1 : 1

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    const sharePoints = await SharePoint.find(filter)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")
      .sort(sort)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .lean()

    // Add completion data to each sharePoint
    const sharePointsWithCompletion = sharePoints.map((sharePoint) => {
      const completionData = calculateCompletionData(sharePoint)
      return { ...sharePoint, ...completionData }
    })

    const total = await SharePoint.countDocuments(filter)

    res.json({
      sharePoints: sharePointsWithCompletion,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
        totalItems: total,
        itemsPerPage: Number.parseInt(limit),
        hasNextPage: Number.parseInt(page) < Math.ceil(total / Number.parseInt(limit)),
        hasPrevPage: Number.parseInt(page) > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching assigned SharePoints:", error)
    res.status(500).json({ error: "Error fetching assigned SharePoints" })
  }
}

// Get SharePoints created by current user with enhanced pagination
exports.getMyCreatedSharePoints = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search = "" } = req.query

    const filter = {
      createdBy: req.user._id,
    }

    if (status && status !== "all") filter.status = status

    // Add search functionality
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { comment: { $regex: search, $options: "i" } }]
    }

    const sort = {}
    sort[sortBy] = sortOrder === "desc" ? -1 : 1

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    const sharePoints = await SharePoint.find(filter)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")
      .sort(sort)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .lean()

    // Add completion data to each sharePoint
    const sharePointsWithCompletion = sharePoints.map((sharePoint) => {
      const completionData = calculateCompletionData(sharePoint)
      return { ...sharePoint, ...completionData }
    })

    const total = await SharePoint.countDocuments(filter)

    res.json({
      sharePoints: sharePointsWithCompletion,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
        totalItems: total,
        itemsPerPage: Number.parseInt(limit),
        hasNextPage: Number.parseInt(page) < Math.ceil(total / Number.parseInt(limit)),
        hasPrevPage: Number.parseInt(page) > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching created SharePoints:", error)
    res.status(500).json({ error: "Error fetching created SharePoints" })
  }
}

// Update SharePoint
exports.updateSharePoint = async (req, res) => {
  try {
    const { title, link, comment, deadline, usersToSign } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    // Check permissions - only creator or admin can update
    if (!req.user.roles.includes("Admin") && sharePoint.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You don't have permission to update this SharePoint" })
    }

    // Store previous values for history
    const previousValues = {
      title: sharePoint.title,
      link: sharePoint.link,
      comment: sharePoint.comment,
      deadline: sharePoint.deadline,
      usersToSign: sharePoint.usersToSign,
    }

    // Update fields
    const updateData = {}
    if (title) updateData.title = title
    if (link) updateData.link = link
    if (comment !== undefined) updateData.comment = comment
    if (deadline) {
      if (new Date(deadline) <= new Date()) {
        return res.status(400).json({ error: "Deadline must be in the future" })
      }
      updateData.deadline = new Date(deadline)
    }
    if (usersToSign && Array.isArray(usersToSign)) {
      // Verify all selected users exist
      const selectedUsers = await User.find({ _id: { $in: usersToSign } })
      if (selectedUsers.length !== usersToSign.length) {
        return res.status(400).json({ error: "One or more selected users do not exist" })
      }
      updateData.usersToSign = usersToSign.map((userId) => ({ user: userId }))
    }

    // Add to update history
    updateData.$push = {
      updateHistory: {
        action: "updated",
        performedBy: req.user._id,
        details: `SharePoint updated`,
        previousValues,
      },
    }

    const updatedSharePoint = await SharePoint.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
      { path: "approvedBy", select: "username email" },
    ])

    // Calculate completion data
    const completionData = calculateCompletionData(updatedSharePoint)
    const responseData = {
      ...updatedSharePoint.toObject(),
      ...completionData,
    }

    res.json({
      message: "SharePoint updated successfully",
      sharePoint: responseData,
    })
  } catch (error) {
    console.error("Error updating SharePoint:", error)
    res.status(500).json({ error: "Error updating SharePoint" })
  }
}

// Delete SharePoint
exports.deleteSharePoint = async (req, res) => {
  try {
    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    // Check permissions - only creator or admin can delete
    if (!req.user.roles.includes("Admin") && sharePoint.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You don't have permission to delete this SharePoint" })
    }

    await SharePoint.findByIdAndDelete(req.params.id)

    res.json({ message: "SharePoint deleted successfully" })
  } catch (error) {
    console.error("Error deleting SharePoint:", error)
    res.status(500).json({ error: "Error deleting SharePoint" })
  }
}

// Approve SharePoint (Manager only) - ENHANCED with email notifications
exports.approveSharePoint = async (req, res) => {
  try {
    const { approved } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    // Check if user has manager role
    const hasManagerRole = req.user.roles.some((role) =>
      ["Admin", "Manager", "Project Manager", "Business Manager"].includes(role),
    )

    if (!hasManagerRole) {
      return res.status(403).json({ error: "You don't have permission to approve SharePoints" })
    }

    sharePoint.managerApproved = approved
    sharePoint.approvedBy = req.user._id
    sharePoint.approvedAt = new Date()

    // Update status based on approval
    if (approved) {
      sharePoint.status = "pending" // Ready for signing
    } else {
      sharePoint.status = "rejected"
    }

    // Add to history
    sharePoint.updateHistory.push({
      action: approved ? "approved" : "rejected",
      performedBy: req.user._id,
      details: approved
        ? "SharePoint approved by manager. Users can now sign the document."
        : "SharePoint rejected by manager",
    })

    await sharePoint.save()

    // ✅ Send approval notification emails if approved
    if (approved) {
      try {
        console.log(`📧 Sending approval notifications to ${sharePoint.usersToSign.length} users...`)

        // Send approval emails to all assigned users
        const approvalEmailPromises = sharePoint.usersToSign.map((signer) =>
          sendSharePointApprovalEmail({
            to: signer.user.email,
            username: signer.user.username,
            documentTitle: sharePoint.title,
            documentId: sharePoint._id.toString(),
            approvedBy: req.user.username,
          }),
        )

        await Promise.allSettled(approvalEmailPromises)
        console.log(`📧 Approval notifications sent successfully`)
      } catch (emailError) {
        console.error("❌ Failed to send approval notifications:", emailError)
      }
    }

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
      { path: "approvedBy", select: "username email" },
    ])

    // Calculate completion data
    const completionData = calculateCompletionData(sharePoint)
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.json({
      message: `SharePoint ${approved ? "approved" : "rejected"} successfully${approved ? ". Approval notifications sent to assigned users." : ""}`,
      sharePoint: responseData,
    })
  } catch (error) {
    console.error("Error approving SharePoint:", error)
    res.status(500).json({ error: "Error approving SharePoint" })
  }
}

// Check if user can sign (requires manager approval)
exports.canUserSign = async (req, res) => {
  try {
    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    const userId = req.params.userId || req.user._id
    const isAssignedSigner = sharePoint.usersToSign.some((signer) => signer.user.toString() === userId.toString())

    const canSign = sharePoint.managerApproved && isAssignedSigner

    res.json({
      canSign,
      managerApproved: sharePoint.managerApproved,
      isAssignedSigner,
      reason: !sharePoint.managerApproved
        ? "Manager approval required before signing"
        : !isAssignedSigner
          ? "User not assigned to sign this document"
          : "User can sign",
    })
  } catch (error) {
    console.error("Error checking sign permission:", error)
    res.status(500).json({ error: "Error checking sign permission" })
  }
}
