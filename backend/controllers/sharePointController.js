const SharePoint = require("../models/SharePoint")
const User = require("../models/UserModel")
const {
  sendManagerCreationEmail,
  sendUserAssignmentEmail,
  sendDisapprovalEmail,
  sendCompletionEmail,
  sendBulkEmails,
} = require("../utils/emailService")

// Helper function to calculate completion percentage and status
const calculateCompletionData = (sharePoint) => {
  const totalSigners = sharePoint.usersToSign?.length || 0
  const signedCount = sharePoint.usersToSign?.filter((signer) => signer.hasSigned).length || 0
  const disapprovedCount = sharePoint.usersToSign?.filter((signer) => signer.hasDisapproved).length || 0

  // Calculate completion percentage considering both manager approval and user signatures
  let completionPercentage = 0

  if (totalSigners > 0) {
    // Manager approval counts as 50% of completion, user signatures as the other 50%
    const managerApprovalWeight = 0.5
    const userSignatureWeight = 0.5

    const managerApprovalProgress = sharePoint.managerApproved ? 1 : 0
    const userSignatureProgress = signedCount / totalSigners

    completionPercentage = Math.round(
      (managerApprovalProgress * managerApprovalWeight + userSignatureProgress * userSignatureWeight) * 100,
    )
  } else if (sharePoint.managerApproved) {
    // If no users to sign but manager approved, it's 100% complete
    completionPercentage = 100
  }

  const allUsersSigned = totalSigners > 0 && signedCount === totalSigners
  const hasDisapprovals = disapprovedCount > 0

  // Determine status based on workflow state
  let status = sharePoint.status

  if (hasDisapprovals) {
    status = "disapproved"
  } else if (sharePoint.status === "rejected") {
    status = "rejected"
  } else if (!sharePoint.managerApproved && sharePoint.status === "pending_approval") {
    status = "pending_approval"
  } else if (allUsersSigned && sharePoint.managerApproved) {
    status = "completed"
  } else if (signedCount > 0 && sharePoint.managerApproved) {
    status = "in_progress"
  } else if (sharePoint.managerApproved) {
    status = "pending"
  } else {
    status = "pending_approval"
  }

  return {
    completionPercentage,
    allUsersSigned,
    status,
    hasDisapprovals,
    signedCount,
    totalSigners,
    managerApproved: sharePoint.managerApproved,
  }
}

// Create a new SharePoint
exports.createSharePoint = async (req, res) => {
  try {
    const { title, link, comment, deadline, usersToSign, managersToApprove } = req.body

    if (!title || !link || !deadline) {
      return res.status(400).json({ error: "Title, link, and deadline are required" })
    }

    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({ error: "Deadline must be in the future" })
    }

    if (!Array.isArray(managersToApprove) || managersToApprove.length === 0) {
      return res.status(400).json({ error: "At least one manager must be selected for approval" })
    }

    if (!Array.isArray(usersToSign) || usersToSign.length === 0) {
      return res.status(400).json({ error: "At least one signer must be selected" })
    }

    const selectedUsers = await User.find({ _id: { $in: usersToSign } }).select("_id username email roles")
    if (selectedUsers.length !== usersToSign.length) {
      return res.status(400).json({ error: "One or more selected users do not exist" })
    }

    const selectedManagers = await User.find({ _id: { $in: managersToApprove } }).select("_id username email roles")
    if (selectedManagers.length !== managersToApprove.length) {
      return res.status(400).json({ error: "One or more selected managers do not exist" })
    }

    const managerRoles = ["Admin", "Manager", "Project Manager", "Business Manager", "Department Manager"]
    const invalidManagers = selectedManagers.filter(
      (manager) => !manager.roles || !manager.roles.some((role) => managerRoles.includes(role)),
    )

    if (invalidManagers.length > 0) {
      return res.status(400).json({
        error: `Selected users do not have manager roles: ${invalidManagers.map((m) => m.username).join(", ")}`,
      })
    }

    const sharePoint = new SharePoint({
      title,
      link,
      comment,
      deadline: new Date(deadline),
      createdBy: req.user._id,
      usersToSign: selectedUsers.map((user) => ({ user: user._id })),
      managersToApprove: managersToApprove,
      status: "pending_approval",
      updateHistory: [
        {
          action: "created",
          performedBy: req.user._id,
          details: `SharePoint created with title: ${title}. Waiting for manager approval.`,
          comment: comment || null,
          userAction: {
            type: "creation",
            userId: req.user._id,
            username: req.user.username,
            timestamp: new Date(),
            note: comment || null,
          },
        },
      ],
    })

    await sharePoint.save()
    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
      { path: "managersToApprove", select: "username email roles" },
    ])

    try {
      const managerEmailList = selectedManagers.map((manager) => ({
        to: manager.email,
        username: manager.username,
        documentTitle: title,
        documentLink: link,
        deadline: deadline,
        createdBy: req.user.username,
        comment: comment || "",
        documentId: sharePoint._id.toString(),
      }))

      await Promise.allSettled(managerEmailList.map((emailOptions) => sendManagerCreationEmail(emailOptions)))
      console.log(`📧 Manager creation emails sent successfully`)
    } catch (emailError) {
      console.error("❌ Email notification failed:", emailError)
    }

    const completionData = calculateCompletionData(sharePoint)
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.status(201).json({
      message: "SharePoint created successfully. Email notifications sent to managers.",
      sharePoint: responseData,
      emailNotificationsSent: true,
    })
  } catch (error) {
    console.error("Error creating SharePoint:", error)
    res.status(500).json({ error: "Error creating SharePoint" })
  }
}

// Get all SharePoints
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

    if (status && status !== "all") filter.status = status
    if (createdBy) filter.createdBy = createdBy
    if (assignedTo) filter["usersToSign.user"] = assignedTo

    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { comment: { $regex: search, $options: "i" } }]
    }

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

// Sign SharePoint - Enhanced with comment support
exports.signSharePoint = async (req, res) => {
  try {
    const { signatureNote } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    if (!sharePoint.managerApproved) {
      return res.status(403).json({
        error: "Document must be approved by a manager before users can sign it",
        code: "MANAGER_APPROVAL_REQUIRED",
      })
    }

    const signerIndex = sharePoint.usersToSign.findIndex(
      (signer) => signer.user._id.toString() === req.user._id.toString(),
    )

    if (signerIndex === -1) {
      return res.status(403).json({ error: "You are not authorized to sign this SharePoint" })
    }

    if (sharePoint.usersToSign[signerIndex].hasSigned) {
      return res.status(400).json({ error: "You have already signed this SharePoint" })
    }

    sharePoint.usersToSign[signerIndex].hasSigned = true
    sharePoint.usersToSign[signerIndex].signedAt = new Date()
    if (signatureNote && signatureNote.trim()) {
      sharePoint.usersToSign[signerIndex].signatureNote = signatureNote.trim()
    }

    const completionData = calculateCompletionData(sharePoint)
    sharePoint.status = completionData.status

    sharePoint.updateHistory.push({
      action: "signed",
      performedBy: req.user._id,
      details: `Document signed by ${req.user.username}${signatureNote && signatureNote.trim() ? ` with comment: ${signatureNote.trim()}` : ""}`,
      comment: signatureNote && signatureNote.trim() ? signatureNote.trim() : null,
      userAction: {
        type: "approval",
        userId: req.user._id,
        username: req.user.username,
        timestamp: new Date(),
        note: signatureNote && signatureNote.trim() ? signatureNote.trim() : null,
      },
    })

    await sharePoint.save()

    if (completionData.status === "completed") {
      try {
        const completionEmailList = [
          {
            to: sharePoint.createdBy.email,
            username: sharePoint.createdBy.username,
            documentTitle: sharePoint.title,
            documentId: sharePoint._id.toString(),
          },
          ...sharePoint.managersToApprove.map((manager) => ({
            to: manager.email,
            username: manager.username,
            documentTitle: sharePoint.title,
            documentId: sharePoint._id.toString(),
          })),
        ]

        await sendBulkEmails(completionEmailList, "completion")
        console.log(`📧 Completion notifications sent to creator and managers`)
      } catch (emailError) {
        console.error("❌ Failed to send completion emails:", emailError)
      }
    }

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
    ])

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

// Get SharePoints assigned to current user
exports.getMyAssignedSharePoints = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search = "" } = req.query

    const filter = {
      "usersToSign.user": req.user._id,
    }

    if (status && status !== "all") filter.status = status

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

// Get SharePoints created by current user
exports.getMyCreatedSharePoints = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search = "" } = req.query

    const filter = {
      createdBy: req.user._id,
    }

    if (status && status !== "all") filter.status = status

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

    if (!req.user.roles.includes("Admin") && sharePoint.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You don't have permission to update this SharePoint" })
    }

    const previousValues = {
      title: sharePoint.title,
      link: sharePoint.link,
      comment: sharePoint.comment,
      deadline: sharePoint.deadline,
      usersToSign: sharePoint.usersToSign,
    }

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
      const selectedUsers = await User.find({ _id: { $in: usersToSign } })
      if (selectedUsers.length !== usersToSign.length) {
        return res.status(400).json({ error: "One or more selected users do not exist" })
      }
      updateData.usersToSign = usersToSign.map((userId) => ({ user: userId }))
    }

    updateData.$push = {
      updateHistory: {
        action: "updated",
        performedBy: req.user._id,
        details: `SharePoint updated by ${req.user.username}`,
        comment: comment || null,
        previousValues,
        userAction: {
          type: "update",
          userId: req.user._id,
          username: req.user.username,
          timestamp: new Date(),
          note: comment || null,
        },
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

// Disapprove SharePoint - Enhanced with required comment
exports.disapproveSharePoint = async (req, res) => {
  try {
    const { disapprovalNote } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    if (!sharePoint.managerApproved) {
      return res.status(403).json({
        error: "Document must be approved by a manager before users can disapprove it",
        code: "MANAGER_APPROVAL_REQUIRED",
      })
    }

    const signerIndex = sharePoint.usersToSign.findIndex(
      (signer) => signer.user && signer.user._id.toString() === req.user._id.toString(),
    )

    if (signerIndex === -1) {
      return res.status(403).json({ error: "You are not authorized to disapprove this SharePoint" })
    }

    if (sharePoint.usersToSign[signerIndex].hasSigned) {
      return res.status(400).json({ error: "You have already signed this SharePoint" })
    }

    if (sharePoint.usersToSign[signerIndex].hasDisapproved) {
      return res.status(400).json({ error: "You have already disapproved this SharePoint" })
    }

    if (!disapprovalNote || !disapprovalNote.trim()) {
      return res.status(400).json({ error: "Disapproval comment is required" })
    }

    sharePoint.usersToSign[signerIndex].hasDisapproved = true
    sharePoint.usersToSign[signerIndex].disapprovedAt = new Date()
    sharePoint.usersToSign[signerIndex].disapprovalNote = disapprovalNote.trim()

    sharePoint.status = "disapproved"
    sharePoint.disapprovalNote = disapprovalNote.trim()

    sharePoint.updateHistory.push({
      action: "disapproved",
      performedBy: req.user._id,
      details: `Document disapproved by ${req.user.username}: ${disapprovalNote.trim()}`,
      comment: disapprovalNote.trim(),
      userAction: {
        type: "disapproval",
        userId: req.user._id,
        username: req.user.username,
        timestamp: new Date(),
        reason: disapprovalNote.trim(),
      },
    })

    await sharePoint.save()

    try {
      await sendDisapprovalEmail({
        to: sharePoint.createdBy.email,
        username: sharePoint.createdBy.username,
        documentTitle: sharePoint.title,
        documentId: sharePoint._id.toString(),
        disapprovedBy: req.user.username,
        disapprovalNote: disapprovalNote.trim(),
        isManagerDisapproval: false,
      })
      console.log(`📧 Disapproval notification sent to creator: ${sharePoint.createdBy.email}`)
    } catch (emailError) {
      console.error("❌ Failed to send disapproval notification:", emailError)
    }

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
    ])

    const completionData = calculateCompletionData(sharePoint)
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.json({
      message: "SharePoint disapproved successfully. Creator has been notified.",
      sharePoint: responseData,
    })
  } catch (error) {
    console.error("Error disapproving SharePoint:", error)
    res.status(500).json({ error: "Error disapproving SharePoint" })
  }
}

// Relaunch SharePoint - Enhanced with comment support
exports.relaunchSharePoint = async (req, res) => {
  try {
    const { relaunchComment } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("managersToApprove", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    if (sharePoint.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the document creator can relaunch the document" })
    }

    if (sharePoint.status !== "disapproved" && sharePoint.status !== "rejected") {
      return res.status(400).json({
        error: "Only disapproved or rejected documents can be relaunched",
        currentStatus: sharePoint.status,
      })
    }

    const previousIssues = [
      ...sharePoint.usersToSign
        .filter((signer) => signer.hasDisapproved)
        .map((signer) => ({
          type: "user_disapproval",
          username: signer.user?.username,
          reason: signer.disapprovalNote,
          timestamp: signer.disapprovedAt,
        })),
      ...sharePoint.updateHistory
        .filter((entry) => entry.action === "rejected")
        .map((entry) => ({
          type: "manager_rejection",
          username: entry.userAction?.username || "Manager",
          reason: entry.comment || "No reason provided",
          timestamp: entry.timestamp || entry.createdAt,
        })),
    ]

    sharePoint.status = "pending_approval"
    sharePoint.managerApproved = false
    sharePoint.approvedBy = null
    sharePoint.approvedAt = null
    sharePoint.disapprovalNote = null

    const resetSigners = sharePoint.usersToSign.map((signer) => ({
      ...signer.toObject(),
      hasDisapproved: false,
      disapprovedAt: null,
      disapprovalNote: null,
    }))
    sharePoint.usersToSign = resetSigners

    const issuesSummary = previousIssues.map((issue) => `${issue.username} (${issue.type}): ${issue.reason}`).join("; ")

    const relaunchDetails = `Document relaunched by ${req.user.username} after ${sharePoint.status === "rejected" ? "manager rejection" : "user disapproval"}. Previous issues: ${issuesSummary}`
    const relaunchCommentText =
      relaunchComment && relaunchComment.trim()
        ? relaunchComment.trim()
        : `Relaunched to address previous concerns: ${previousIssues.map((issue) => issue.reason).join("; ")}`

    sharePoint.updateHistory.push({
      action: "relaunched",
      performedBy: req.user._id,
      details: relaunchDetails,
      comment: relaunchCommentText,
      userAction: {
        type: "relaunch",
        userId: req.user._id,
        username: req.user.username,
        timestamp: new Date(),
        note: relaunchCommentText,
        previousIssues: previousIssues,
        relaunchReason: sharePoint.status === "rejected" ? "manager_rejection" : "user_disapproval",
      },
    })

    await sharePoint.save()

    try {
      const managerEmailList = sharePoint.managersToApprove.map((manager) => ({
        to: manager.email,
        username: manager.username,
        documentTitle: sharePoint.title,
        documentLink: sharePoint.link,
        deadline: sharePoint.deadline,
        createdBy: req.user.username,
        comment: sharePoint.comment || "",
        documentId: sharePoint._id.toString(),
      }))

      await Promise.allSettled(managerEmailList.map((emailOptions) => sendManagerCreationEmail(emailOptions)))
      console.log("📧 Manager re-approval notifications sent successfully")
    } catch (emailError) {
      console.error("❌ Failed to send re-approval notifications:", emailError)
    }

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
    ])

    const completionData = calculateCompletionData(sharePoint)
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.json({
      message: `SharePoint relaunched successfully. Managers have been notified for re-approval.`,
      sharePoint: responseData,
      relaunchReason: sharePoint.status === "rejected" ? "manager_rejection" : "user_disapproval",
      previousIssuesCount: previousIssues.length,
    })
  } catch (error) {
    console.error("Error relaunching SharePoint:", error)
    res.status(500).json({ error: "Error relaunching SharePoint" })
  }
}

// Approve SharePoint (Manager only) - Enhanced with comment support
exports.approveSharePoint = async (req, res) => {
  try {
    const { approved, approvalNote } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")
      .populate("managersToApprove", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    const isSelectedManager = sharePoint.managersToApprove.some((managerId) =>
      [String(managerId), String(req.user._id), String(req.user.license)].includes(String(managerId)),
    )

    if (!isSelectedManager) {
      return res.status(403).json({ error: "You don't have permission to approve this document." })
    }

    // For rejections, require a comment
    if (!approved && (!approvalNote || !approvalNote.trim())) {
      return res.status(400).json({ error: "A comment is required when rejecting a document" })
    }

    sharePoint.managerApproved = approved
    sharePoint.approvedBy = req.user._id
    sharePoint.approvedAt = new Date()

    sharePoint.status = approved ? "pending" : "rejected"

    // If rejecting, set the disapproval note at document level
    if (!approved) {
      sharePoint.disapprovalNote = approvalNote.trim()
    }

    sharePoint.updateHistory.push({
      action: approved ? "approved" : "rejected",
      performedBy: req.user._id,
      details: approved
        ? `Document approved by manager ${req.user.username}${approvalNote && approvalNote.trim() ? ` with comment: ${approvalNote.trim()}` : ""}`
        : `Document rejected by manager ${req.user.username} with reason: ${approvalNote.trim()}`,
      comment: approvalNote && approvalNote.trim() ? approvalNote.trim() : null,
      userAction: {
        type: approved ? "manager_approval" : "manager_rejection",
        userId: req.user._id,
        username: req.user.username,
        timestamp: new Date(),
        note: approvalNote && approvalNote.trim() ? approvalNote.trim() : null,
        reason: !approved ? approvalNote.trim() : null,
      },
    })

    await sharePoint.save()

    if (approved) {
      try {
        const userEmailList = sharePoint.usersToSign.map((signer) => ({
          to: signer.user.email,
          username: signer.user.username,
          documentTitle: sharePoint.title,
          documentLink: sharePoint.link,
          deadline: sharePoint.deadline,
          createdBy: sharePoint.createdBy.username,
          approvedBy: req.user.username,
          comment: sharePoint.comment || "",
          documentId: sharePoint._id.toString(),
        }))

        await sendBulkEmails(userEmailList, "userAssignment")
        console.log(`📧 User assignment notifications sent successfully`)
      } catch (emailError) {
        console.error("❌ Failed to send user assignment notifications:", emailError)
      }
    } else {
      try {
        await sendDisapprovalEmail({
          to: sharePoint.createdBy.email,
          username: sharePoint.createdBy.username,
          documentTitle: sharePoint.title,
          documentId: sharePoint._id.toString(),
          disapprovedBy: req.user.username,
          disapprovalNote: approvalNote.trim(),
          isManagerDisapproval: true,
        })
        console.log(`📧 Rejection notification sent to creator`)
      } catch (emailError) {
        console.error("❌ Failed to send rejection notification:", emailError)
      }
    }

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
      { path: "approvedBy", select: "username email" },
    ])

    const completionData = calculateCompletionData(sharePoint)
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.json({
      message: `SharePoint ${approved ? "approved" : "rejected"} successfully${approved ? ". Users have been notified." : ". Creator has been notified."}`,
      sharePoint: responseData,
    })
  } catch (error) {
    console.error("Error approving SharePoint:", error)
    res.status(500).json({ error: "Error approving SharePoint" })
  }
}

// Check if user can sign
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

// Get documents needing approval from current user
exports.getMyApprovalSharePoints = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search = "" } = req.query

    const filter = {
      managersToApprove: req.user._id,
      status: "pending_approval",
      managerApproved: { $ne: true },
    }

    if (status && status !== "all") filter.status = status

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
    console.error("Error fetching approval SharePoints:", error)
    res.status(500).json({ error: "Error fetching approval SharePoints" })
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
