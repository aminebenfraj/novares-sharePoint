const SharePoint = require("../models/SharePoint")
const User = require("../models/UserModel")
const {
  sendManagerApprovalEmail,
  sendUserSigningEmail,
  sendRelaunchNotificationEmail,
  sendCompletionNotificationEmail,
  sendBulkEmails,
} = require("../utils/emailService")

// Helper function to calculate completion percentage and status
const calculateCompletionData = (sharePoint) => {
  const totalSigners = sharePoint.usersToSign?.length || 0
  const signedCount = sharePoint.usersToSign?.filter((signer) => signer.hasSigned).length || 0
  const disapprovedCount = sharePoint.usersToSign?.filter((signer) => signer.hasDisapproved).length || 0

  let completionPercentage = 0

  if (totalSigners > 0) {
    const managerApprovalWeight = 0.5
    const userSignatureWeight = 0.5

    const managerApprovalProgress = sharePoint.managerApproved ? 1 : 0
    const userSignatureProgress = signedCount / totalSigners

    completionPercentage = Math.round(
      (managerApprovalProgress * managerApprovalWeight + userSignatureProgress * userSignatureWeight) * 100,
    )
  } else if (sharePoint.managerApproved) {
    completionPercentage = 100
  }

  const allUsersSigned = totalSigners > 0 && signedCount === totalSigners
  const hasDisapprovals = disapprovedCount > 0
  const isExpired = sharePoint.deadline && new Date(sharePoint.deadline) < new Date()

  let status = sharePoint.status

  if (hasDisapprovals) {
    status = "disapproved"
  } else if (sharePoint.status === "rejected") {
    status = "rejected"
  } else if (!sharePoint.managerApproved && sharePoint.status === "pending_approval") {
    status = "pending_approval"
  } else if (allUsersSigned && sharePoint.managerApproved) {
    // 🔧 FIX: When document is fully completed, it stays "completed" regardless of deadline
    status = "completed"
  } else if (signedCount > 0 && sharePoint.managerApproved) {
    // Check if expired only for in-progress documents
    status = isExpired ? "expired" : "in_progress"
  } else if (sharePoint.managerApproved) {
    // Check if expired only for pending documents
    status = isExpired ? "expired" : "pending"
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

// Create a new SharePoint - Email to assigned managers
exports.createSharePoint = async (req, res) => {
  try {
    console.log("Received request body:", req.body) // Debug log

    const { title, link, comment, deadline, usersToSign, managersToApprove, requesterDepartment } = req.body

    console.log("Extracted requesterDepartment:", requesterDepartment) // Debug log

    if (!title || !link || !deadline) {
      return res.status(400).json({ error: "Title, link, and deadline are required" })
    }

    if (!requesterDepartment || requesterDepartment.trim() === "") {
      console.log("RequesterDepartment validation failed:", requesterDepartment) // Debug log
      return res.status(400).json({ error: "Requester department is required" })
    }

    // Validate that the department is one of the allowed values
    const allowedDepartments = [
      "Direction",
      "Engineering",
      "Business",
      "Production",
      "Controlling",
      "Financial",
      "Purchasing",
      "Logistics",
      "Quality",
      "Human Resources",
      "Maintenance",
      "Health & Safety",
      "Informatic Systems",
    ]

    if (!allowedDepartments.includes(requesterDepartment)) {
      console.log("Invalid department:", requesterDepartment) // Debug log
      return res.status(400).json({ error: "Invalid requester department selected" })
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

    console.log("Creating SharePoint with department:", requesterDepartment) // Debug log

    const sharePoint = new SharePoint({
      title,
      link,
      comment,
      deadline: new Date(deadline),
      requesterDepartment: requesterDepartment.trim(), // Ensure no extra whitespace
      createdBy: req.user._id,
      usersToSign: selectedUsers.map((user) => ({ user: user._id })),
      managersToApprove: managersToApprove,
      status: "pending_approval",
      updateHistory: [
        {
          action: "created",
          performedBy: req.user._id,
          details: `SharePoint created with title: ${title}. Department: ${requesterDepartment}. Waiting for manager approval.`,
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
    console.log("SharePoint saved successfully with department:", sharePoint.requesterDepartment) // Debug log

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
      { path: "managersToApprove", select: "username email roles" },
    ])

    // 🔧 FIX: Ensure we use the correct MongoDB _id as string
    const documentId = sharePoint._id.toString()
    console.log(`📋 Created SharePoint with ID: ${documentId}`)

    // Send email to assigned managers for approval
    try {
      const managerEmailList = selectedManagers.map((manager) => ({
        to: manager.email,
        username: manager.username,
        documentTitle: title,
        documentLink: link,
        deadline: deadline,
        createdBy: req.user.username,
        comment: comment || "",
        documentId: documentId,
        requesterDepartment: requesterDepartment,
      }))

      await sendBulkEmails(managerEmailList, "managerApproval")
      console.log(`📧 Manager approval emails sent successfully with document ID: ${documentId}`)
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
    if (error.name === "ValidationError") {
      // Handle Mongoose validation errors
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ error: `Validation failed: ${validationErrors.join(", ")}` })
    }
    res.status(500).json({ error: "Error creating SharePoint" })
  }
}

// Manager approves document - Email to assigned users
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

    // 🔧 FIX: Ensure we use the correct MongoDB _id as string
    const documentId = sharePoint._id.toString()
    console.log(`📋 Processing approval for SharePoint ID: ${documentId}`)

    const isSelectedManager = sharePoint.managersToApprove.some((managerId) =>
      [String(managerId), String(req.user._id), String(req.user.license)].includes(String(managerId)),
    )

    if (!isSelectedManager) {
      return res.status(403).json({ error: "You don't have permission to approve this document." })
    }

    if (!approved && (!approvalNote || !approvalNote.trim())) {
      return res.status(400).json({ error: "A comment is required when rejecting a document" })
    }

    sharePoint.managerApproved = approved
    sharePoint.approvedBy = req.user._id
    sharePoint.approvedAt = new Date()
    sharePoint.status = approved ? "pending" : "rejected"

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
      // Send email to assigned users for signing (only to users who haven't signed yet)
      try {
        const usersToNotify = sharePoint.usersToSign.filter((signer) => !signer.hasSigned)

        const userEmailPromises = usersToNotify.map((signer) =>
          sendUserSigningEmail({
            to: signer.user.email,
            username: signer.user.username,
            documentTitle: sharePoint.title,
            documentLink: sharePoint.link,
            deadline: sharePoint.deadline,
            createdBy: sharePoint.createdBy.username,
            approvedBy: req.user.username,
            comment: sharePoint.comment || "",
            documentId: documentId, // 🔧 FIX: Use the correct document ID
          }),
        )

        const emailResults = await Promise.allSettled(userEmailPromises)

        const successful = emailResults.filter((result) => result.status === "fulfilled").length
        const failed = emailResults.filter((result) => result.status === "rejected").length

        console.log(
          `📧 User signing notifications sent with document ID ${documentId}: ${successful} successful, ${failed} failed`,
        )

        // Log any failures
        emailResults.forEach((result, index) => {
          if (result.status === "rejected") {
            console.error(`❌ Failed to send email to ${usersToNotify[index].user.email}:`, result.reason)
          }
        })
      } catch (emailError) {
        console.error("❌ Failed to send user signing notifications:", emailError)
      }
    } else {
      // Send relaunch notification to creator
      try {
        await sendRelaunchNotificationEmail({
          to: sharePoint.createdBy.email,
          username: sharePoint.createdBy.username,
          documentTitle: sharePoint.title,
          documentId: documentId, // 🔧 FIX: Use the correct document ID
          disapprovedBy: req.user.username,
          disapprovalNote: approvalNote.trim(),
          isManagerDisapproval: true,
        })
        console.log(`📧 Relaunch notification sent to creator with document ID: ${documentId}`)
      } catch (emailError) {
        console.error("❌ Failed to send relaunch notification:", emailError)
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

// User signs document - Check if all signed, then email creator completion
exports.signSharePoint = async (req, res) => {
  try {
    const { signatureNote } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    // 🔧 FIX: Ensure we use the correct MongoDB _id as string
    const documentId = sharePoint._id.toString()
    console.log(`📋 Processing signature for SharePoint ID: ${documentId}`)

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

    // If all users have signed, send completion notification to creator
    if (completionData.status === "completed") {
      try {
        await sendCompletionNotificationEmail({
          to: sharePoint.createdBy.email,
          username: sharePoint.createdBy.username,
          documentTitle: sharePoint.title,
          documentId: documentId, // 🔧 FIX: Use the correct document ID
        })
        console.log(`📧 Completion notification sent to creator with document ID: ${documentId}`)
      } catch (emailError) {
        console.error("❌ Failed to send completion notification:", emailError)
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

// User disapproves document - Email creator for relaunch
exports.disapproveSharePoint = async (req, res) => {
  try {
    const { disapprovalNote } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    // 🔧 FIX: Ensure we use the correct MongoDB _id as string
    const documentId = sharePoint._id.toString()
    console.log(`📋 Processing disapproval for SharePoint ID: ${documentId}`)

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

    // Send relaunch notification to creator
    try {
      await sendRelaunchNotificationEmail({
        to: sharePoint.createdBy.email,
        username: sharePoint.createdBy.username,
        documentTitle: sharePoint.title,
        documentId: documentId, // 🔧 FIX: Use the correct document ID
        disapprovedBy: req.user.username,
        disapprovalNote: disapprovalNote.trim(),
        isManagerDisapproval: false,
      })
      console.log(`📧 Relaunch notification sent to creator with document ID: ${documentId}`)
    } catch (emailError) {
      console.error("❌ Failed to send relaunch notification:", emailError)
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

// Creator relaunches document - Email to assigned managers again (PRESERVE USER APPROVALS)
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

    // 🔧 FIX: Ensure we use the correct MongoDB _id as string
    const documentId = sharePoint._id.toString()
    console.log(`📋 Processing relaunch for SharePoint ID: ${documentId}`)

    if (sharePoint.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the document creator can relaunch the document" })
    }

    if (sharePoint.status !== "disapproved" && sharePoint.status !== "rejected") {
      return res.status(400).json({
        error: "Only disapproved or rejected documents can be relaunched",
        currentStatus: sharePoint.status,
      })
    }

    // Reset document state but PRESERVE existing user approvals
    sharePoint.status = "pending_approval"
    sharePoint.managerApproved = false
    sharePoint.approvedBy = null
    sharePoint.approvedAt = null
    sharePoint.disapprovalNote = null

    // PRESERVE user signatures but ONLY reset disapprovals
    const resetSigners = sharePoint.usersToSign.map((signer) => ({
      ...signer.toObject(),
      // Keep existing approvals (hasSigned, signedAt, signatureNote)
      hasSigned: signer.hasSigned, // PRESERVE
      signedAt: signer.signedAt, // PRESERVE
      signatureNote: signer.signatureNote, // PRESERVE
      // Only reset disapprovals
      hasDisapproved: false, // RESET
      disapprovedAt: null, // RESET
      disapprovalNote: null, // RESET
    }))
    sharePoint.usersToSign = resetSigners

    const relaunchCommentText =
      relaunchComment && relaunchComment.trim()
        ? relaunchComment.trim()
        : "Document relaunched to address previous concerns"

    sharePoint.updateHistory.push({
      action: "relaunched",
      performedBy: req.user._id,
      details: `Document relaunched by ${req.user.username}. Existing user approvals preserved.`,
      comment: relaunchCommentText,
      userAction: {
        type: "relaunch",
        userId: req.user._id,
        username: req.user.username,
        timestamp: new Date(),
        note: relaunchCommentText,
      },
    })

    await sharePoint.save()

    // Send email to assigned managers for re-approval
    try {
      const managerEmailList = sharePoint.managersToApprove.map((manager) => ({
        to: manager.email,
        username: manager.username,
        documentTitle: sharePoint.title,
        documentLink: sharePoint.link,
        deadline: sharePoint.deadline,
        createdBy: req.user.username,
        comment: sharePoint.comment || "",
        documentId: documentId, // 🔧 FIX: Use the correct document ID
      }))

      await sendBulkEmails(managerEmailList, "managerApproval")
      console.log(`📧 Manager re-approval notifications sent successfully with document ID: ${documentId}`)
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

    // Count how many users already approved
    const alreadyApprovedCount = sharePoint.usersToSign.filter((signer) => signer.hasSigned).length
    const totalUsers = sharePoint.usersToSign.length

    res.json({
      message: `SharePoint relaunched successfully. Managers have been notified for re-approval. ${alreadyApprovedCount}/${totalUsers} user approvals preserved.`,
      sharePoint: responseData,
      preservedApprovals: alreadyApprovedCount,
      totalUsers: totalUsers,
    })
  } catch (error) {
    console.error("Error relaunching SharePoint:", error)
    res.status(500).json({ error: "Error relaunching SharePoint" })
  }
}

// Keep all other existing functions unchanged...
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

exports.deleteSharePoint = async (req, res) => {
  try {
    const sharePoint = await SharePoint.findById(req.params.id)

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

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
