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
  const disapprovedCount = sharePoint.usersToSign?.filter((signer) => signer.hasDisapproved).length || 0

  const completionPercentage = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0
  const allUsersSigned = totalSigners > 0 && signedCount === totalSigners
  const hasDisapprovals = disapprovedCount > 0

  // Update status based on completion
  let status = sharePoint.status
  if (hasDisapprovals) {
    status = "disapproved"
  } else if (allUsersSigned && sharePoint.managerApproved) {
    status = "completed"
  } else if (signedCount > 0 && sharePoint.managerApproved) {
    status = "in_progress"
  } else if (sharePoint.managerApproved) {
    status = "pending"
  }

  return { completionPercentage, allUsersSigned, status, hasDisapprovals }
}

// Helper function to send invitation emails to external users
const sendExternalUserInvitationEmail = async ({
  to,
  documentTitle,
  documentLink,
  deadline,
  createdBy,
  comment,
  documentId,
}) => {
  try {
    // Import the email service function if not already imported
    const { sendEmail } = require("../utils/emailService")

    const subject = `You've been invited to sign a document: ${documentTitle}`
    const html = `
      <h2>Document Signing Invitation</h2>
      <p>Hello,</p>
      <p>You have been invited by <strong>${createdBy}</strong> to sign the following document:</p>
      <p><strong>Document:</strong> ${documentTitle}</p>
      <p><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString()}</p>
      ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ""}
      <p>Please click the link below to view and sign the document:</p>
      <p><a href="${documentLink}" target="_blank">View Document</a></p>
      <p>Document ID: ${documentId}</p>
      <p>Thank you,<br>Document Management System</p>
    `

    return await sendEmail({
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error(`Failed to send invitation email to ${to}:`, error)
    throw error
  }
}

// Create a new SharePoint - FIXED with proper email notifications
exports.createSharePoint = async (req, res) => {
  try {
    const { title, link, comment, deadline, usersToSign, managersToApprove, externalEmails } = req.body

    // Validate required fields
    if (!title || !link || !deadline) {
      return res.status(400).json({ error: "Title, link, and deadline are required" })
    }

    // Validate deadline is in the future
    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({ error: "Deadline must be in the future" })
    }

    // Validate managers array
    if (!Array.isArray(managersToApprove) || managersToApprove.length === 0) {
      return res.status(400).json({ error: "At least one manager must be selected for approval" })
    }

    // Validate that at least one signer is provided (either registered user or external email)
    const hasRegisteredSigners = Array.isArray(usersToSign) && usersToSign.length > 0
    const hasExternalSigners = Array.isArray(externalEmails) && externalEmails.length > 0

    if (!hasRegisteredSigners && !hasExternalSigners) {
      return res.status(400).json({ error: "At least one signer must be selected or external email added" })
    }

    // Verify all selected users exist
    let selectedUsers = []
    if (hasRegisteredSigners) {
      selectedUsers = await User.find({ _id: { $in: usersToSign } }).select("_id username email roles")
      if (selectedUsers.length !== usersToSign.length) {
        return res.status(400).json({ error: "One or more selected users do not exist" })
      }
    }

    // Verify all selected managers exist and have manager roles
    const selectedManagers = await User.find({ _id: { $in: managersToApprove } }).select("_id username email roles")
    if (selectedManagers.length !== managersToApprove.length) {
      return res.status(400).json({ error: "One or more selected managers do not exist" })
    }

    // Validate that selected managers have appropriate roles - Fixed logic
    const managerRoles = ["Admin", "Manager", "Project Manager", "Business Manager", "Department Manager"]
    const invalidManagers = selectedManagers.filter(
      (manager) => !manager.roles || !manager.roles.some((role) => managerRoles.includes(role)),
    )

    if (invalidManagers.length > 0) {
      console.log(
        "Invalid managers found:",
        invalidManagers.map((m) => ({ username: m.username, roles: m.roles })),
      )
      return res.status(400).json({
        error: `Selected users do not have manager roles: ${invalidManagers.map((m) => m.username).join(", ")}`,
      })
    }

    console.log(
      "Valid managers:",
      selectedManagers.map((m) => ({ username: m.username, roles: m.roles })),
    )

    // Validate external emails
    let validatedExternalEmails = []
    if (hasExternalSigners) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      validatedExternalEmails = externalEmails.filter((email) => {
        if (!emailRegex.test(email)) return false
        // Check if email belongs to existing user
        const existingUser = selectedUsers.find((user) => user.email.toLowerCase() === email.toLowerCase())
        return !existingUser
      })
    }

    // Create SharePoint document
    const sharePoint = new SharePoint({
      title,
      link,
      comment,
      deadline: new Date(deadline),
      createdBy: req.user._id,
      usersToSign: [
        ...selectedUsers.map((userId) => ({ user: userId._id })),
        ...validatedExternalEmails.map((email) => ({ externalEmail: email, isExternal: true })),
      ],
      managersToApprove: managersToApprove,
      status: "pending_approval",
      updateHistory: [
        {
          action: "created",
          performedBy: req.user._id,
          details: `SharePoint created with title: ${title}. Waiting for manager approval.`,
          // Enhanced: Add creation comment to history
          comment: comment || null,
        },
      ],
    })

    await sharePoint.save()
    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
      { path: "managersToApprove", select: "username email roles" },
    ])

    // Send email notifications
    try {
      console.log(`📧 Preparing to send emails...`)

      // Send emails to registered users
      if (selectedUsers.length > 0) {
        const userEmailList = selectedUsers.map((user) => ({
          to: user.email,
          username: user.username,
          documentTitle: title,
          documentLink: link,
          deadline: deadline,
          createdBy: req.user.username,
          comment: comment || "",
          documentId: sharePoint._id.toString(),
        }))

        await sendBulkSharePointAssignmentEmails(userEmailList)
      }

      // Send invitation emails to external users
      if (validatedExternalEmails.length > 0) {
        const externalEmailPromises = validatedExternalEmails.map((email) =>
          sendExternalUserInvitationEmail({
            to: email,
            documentTitle: title,
            documentLink: link,
            deadline: deadline,
            createdBy: req.user.username,
            comment: comment || "",
            documentId: sharePoint._id.toString(),
          }),
        )

        await Promise.allSettled(externalEmailPromises)
      }

      // Send notification to managers
      const managerEmailPromises = selectedManagers.map((manager) =>
        sendSharePointApprovalEmail({
          to: manager.email,
          username: manager.username,
          documentTitle: title,
          documentId: sharePoint._id.toString(),
          createdBy: req.user.username,
          requiresApproval: true,
        }),
      )

      await Promise.allSettled(managerEmailPromises)

      console.log(`📧 All email notifications sent successfully`)
    } catch (emailError) {
      console.error("❌ Email notification failed:", emailError)
      // Continue with response even if email fails
    }

    // Calculate completion data
    const completionData = calculateCompletionData(sharePoint)
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.status(201).json({
      message: "SharePoint created successfully. Email notifications sent to all assigned users and managers.",
      sharePoint: responseData,
      emailNotificationsSent: true,
      externalUsersInvited: validatedExternalEmails.length,
    })
  } catch (error) {
    console.error("Error creating SharePoint:", error)
    res.status(500).json({ error: "Error creating SharePoint" })
  }
}

// Get all SharePoints with enhanced pagination - MODIFIED to show all documents to everyone
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

    // REMOVED: Permission filtering - now everyone can see all documents
    // The original code had this filter that restricted visibility:
    // if (!req.user.roles.includes("Admin")) {
    //   const userFilter = {
    //     $or: [
    //       { createdBy: req.user._id },
    //       { "usersToSign.user": req.user._id },
    //       { managersToApprove: req.user._id },
    //     ],
    //   }
    //   filter.$and = filter.$and ? [...filter.$and, userFilter] : [userFilter]
    // }

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

// Get SharePoint by ID - MODIFIED to allow everyone to view any document
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

    // REMOVED: Permission check - now everyone can view any document
    // The original code had this check that restricted access:
    // const canView =
    //   req.user.roles.includes("Admin") ||
    //   sharePoint.createdBy._id.toString() === req.user._id.toString() ||
    //   sharePoint.usersToSign.some((signer) => signer.user && signer.user._id.toString() === req.user._id.toString()) ||
    //   sharePoint.managersToApprove.some((managerId) => managerId.toString() === req.user._id.toString())
    //
    // if (!canView) {
    //   return res.status(403).json({ error: "You don't have permission to view this SharePoint" })
    // }

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

// Sign SharePoint - UPDATED with completion email notifications and enhanced comment tracking
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

    // Enhanced: Add detailed approval to history with comment
    sharePoint.updateHistory.push({
      action: "signed",
      performedBy: req.user._id,
      details: `Document approved by ${req.user.username}${signatureNote ? ` with note: ${signatureNote}` : ""}`,
      comment: signatureNote || null,
      userAction: {
        type: "approval",
        userId: req.user._id,
        username: req.user.username,
        timestamp: new Date(),
      },
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

    // Enhanced: Add update to history with comment tracking
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

// Enhanced disapprove function with better comment tracking
exports.disapproveSharePoint = async (req, res) => {
  try {
    const { disapprovalNote } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    // Check if manager has approved the document first
    if (!sharePoint.managerApproved) {
      return res.status(403).json({
        error: "Document must be approved by a manager before users can disapprove it",
        code: "MANAGER_APPROVAL_REQUIRED",
      })
    }

    // Check if user is in the signers list
    const signerIndex = sharePoint.usersToSign.findIndex(
      (signer) => signer.user && signer.user._id.toString() === req.user._id.toString(),
    )

    if (signerIndex === -1) {
      return res.status(403).json({ error: "You are not authorized to disapprove this SharePoint" })
    }

    // Check if already signed or disapproved
    if (sharePoint.usersToSign[signerIndex].hasSigned) {
      return res.status(400).json({ error: "You have already signed this SharePoint" })
    }

    if (sharePoint.usersToSign[signerIndex].hasDisapproved) {
      return res.status(400).json({ error: "You have already disapproved this SharePoint" })
    }

    // Validate disapproval note
    if (!disapprovalNote || !disapprovalNote.trim()) {
      return res.status(400).json({ error: "Disapproval note is required" })
    }

    // Update disapproval
    sharePoint.usersToSign[signerIndex].hasDisapproved = true
    sharePoint.usersToSign[signerIndex].disapprovedAt = new Date()
    sharePoint.usersToSign[signerIndex].disapprovalNote = disapprovalNote.trim()

    // Update document status
    sharePoint.status = "disapproved"
    sharePoint.disapprovalNote = disapprovalNote.trim()

    // Enhanced: Add detailed disapproval to history with full comment tracking
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

    // Send notification to document creator
    try {
      await sendSharePointRelaunchEmail({
        to: sharePoint.createdBy.email,
        username: sharePoint.createdBy.username,
        documentTitle: sharePoint.title,
        documentId: sharePoint._id.toString(),
        disapprovedBy: req.user.username,
        disapprovalNote: disapprovalNote.trim(),
      })
    } catch (emailError) {
      console.error("❌ Failed to send disapproval notification:", emailError)
    }

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
    ])

    // Calculate completion data
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

// ENHANCED: Relaunch function now supports both user disapprovals AND manager rejections
exports.relaunchSharePoint = async (req, res) => {
  try {
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("managersToApprove", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    // Check if user is the creator
    if (sharePoint.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the document creator can relaunch the document" })
    }

    // UPDATED: Check if document is disapproved OR rejected (manager rejection)
    if (sharePoint.status !== "disapproved" && sharePoint.status !== "rejected") {
      return res.status(400).json({ 
        error: "Only disapproved or rejected documents can be relaunched",
        currentStatus: sharePoint.status 
      })
    }

    // Store previous rejection/disapproval information for history
    let previousIssues = []
    
    // Handle user disapprovals
    const previousDisapprovals = sharePoint.usersToSign
      .filter((signer) => signer.hasDisapproved)
      .map((signer) => ({
        type: "user_disapproval",
        username: signer.user?.username,
        reason: signer.disapprovalNote,
        timestamp: signer.disapprovedAt,
      }))
    
    // Handle manager rejection
    if (sharePoint.status === "rejected") {
      // Find the rejection details from update history
      const rejectionHistory = sharePoint.updateHistory
        .filter(entry => entry.action === "rejected")
        .pop() // Get the most recent rejection
      
      if (rejectionHistory) {
        previousIssues.push({
          type: "manager_rejection",
          username: rejectionHistory.userAction?.username || "Manager",
          reason: rejectionHistory.comment || "No reason provided",
          timestamp: rejectionHistory.timestamp || rejectionHistory.createdAt,
        })
      }
    }
    
    previousIssues = [...previousIssues, ...previousDisapprovals]

    // Reset document status and approvals
    sharePoint.status = "pending_approval"
    sharePoint.managerApproved = false
    sharePoint.approvedBy = null
    sharePoint.approvedAt = null
    sharePoint.disapprovalNote = null

    // Reset user disapprovals (preserve approvals as per current logic)
    const resetSigners = sharePoint.usersToSign.map((signer) => ({
      ...signer.toObject(),
      hasDisapproved: false,
      disapprovedAt: null,
      disapprovalNote: null,
      // Do NOT reset: hasSigned, signedAt, signatureNote
    }))
    sharePoint.usersToSign = resetSigners

    // Log the reset state for debugging
    console.log(
      "Relaunched SharePoint signers:",
      sharePoint.usersToSign.map((s) => ({
        user: s.user?.username || s.externalEmail,
        hasSigned: s.hasSigned,
        hasDisapproved: s.hasDisapproved,
      })),
    )

    // ENHANCED: Add detailed relaunch to history with both rejection types
    const issuesSummary = previousIssues.map((issue) => 
      `${issue.username} (${issue.type}): ${issue.reason}`
    ).join("; ")

    sharePoint.updateHistory.push({
      action: "relaunched",
      performedBy: req.user._id,
      details: `Document relaunched by ${req.user.username} after ${sharePoint.status === "rejected" ? "manager rejection" : "user disapproval"}. Previous issues: ${issuesSummary}`,
      comment: `Relaunched to address previous concerns: ${previousIssues.map((issue) => issue.reason).join("; ")}`,
      userAction: {
        type: "relaunch",
        userId: req.user._id,
        username: req.user.username,
        timestamp: new Date(),
        previousIssues: previousIssues,
        relaunchReason: sharePoint.status === "rejected" ? "manager_rejection" : "user_disapproval",
      },
    })

    await sharePoint.save()

    // Send notification to managers for re-approval
    try {
      const managerEmailPromises = sharePoint.managersToApprove.map((manager) =>
        sendSharePointApprovalEmail({
          to: manager.email,
          username: manager.username,
          documentTitle: sharePoint.title,
          documentId: sharePoint._id.toString(),
          createdBy: req.user.username,
          requiresApproval: true,
          isRelaunch: true,
          relaunchReason: sharePoint.status === "rejected" ? "manager rejection" : "user disapproval",
        }),
      )
      await Promise.allSettled(managerEmailPromises)
      console.log("Manager re-approval notifications sent successfully")
    } catch (emailError) {
      console.error("Failed to send relaunch notifications:", emailError)
    }

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
    ])

    // Calculate completion data
    const completionData = calculateCompletionData(sharePoint)
    const responseData = {
      ...sharePoint.toObject(),
      ...completionData,
    }

    res.json({
      message: `SharePoint relaunched successfully after ${sharePoint.status === "rejected" ? "manager rejection" : "user disapproval"}. Managers have been notified for re-approval. User disapprovals have been reset, and existing approvals preserved.`,
      sharePoint: responseData,
      relaunchReason: sharePoint.status === "rejected" ? "manager_rejection" : "user_disapproval",
      previousIssuesCount: previousIssues.length,
    })
  } catch (error) {
    console.error("Error relaunching SharePoint:", error)
    res.status(500).json({ error: "Error relaunching SharePoint" })
  }
}

// Send notification to document creator when document is disapproved
const sendSharePointRelaunchEmail = async ({
  to,
  username,
  documentTitle,
  documentId,
  disapprovedBy,
  disapprovalNote,
}) => {
  try {
    // Import the email service function if not already imported
    const { sendEmail } = require("../utils/emailService")

    const subject = `Document Disapproved: ${documentTitle}`
    const html = `
      <h2>Document Disapproval Notification</h2>
      <p>Hello ${username},</p>
      <p>Your document <strong>${documentTitle}</strong> has been disapproved by <strong>${disapprovedBy}</strong>.</p>
      <p><strong>Reason for disapproval:</strong> ${disapprovalNote}</p>
      <p>You can relaunch this document after making necessary changes.</p>
      <p>Document ID: ${documentId}</p>
      <p>Thank you,<br>Document Management System</p>
    `

    return await sendEmail({
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error(`Failed to send disapproval notification email to ${to}:`, error)
    throw error
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

// Enhanced approve SharePoint (Manager only) with better comment tracking
exports.approveSharePoint = async (req, res) => {
  try {
    const { approved, approvalNote } = req.body // Added approvalNote parameter
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    // Check if user is in the managersToApprove array
    const isSelectedManager = sharePoint.managersToApprove.some((managerId) => {
      const managerIdStr = String(managerId)
      const userIdStr = String(req.user._id)
      const userLicenseStr = String(req.user.license)

      // Log for debugging
      console.log("Approval check - Manager ID:", managerIdStr)
      console.log("Approval check - User ID:", userIdStr)
      console.log("Approval check - User license:", userLicenseStr)

      return managerIdStr === userIdStr || managerIdStr === userLicenseStr
    })

    if (!isSelectedManager) {
      console.log("User is not in the managersToApprove list for this document")
      console.log("User ID:", req.user._id)
      console.log("User license:", req.user.license)
      console.log("Managers to approve:", sharePoint.managersToApprove)
      return res
        .status(403)
        .json({ error: "You don't have permission to approve this document. Only selected managers can approve." })
    }

    sharePoint.managerApproved = approved
    sharePoint.approvedBy = req.user._id
    sharePoint.approvedAt = new Date()

    // Update status based on approval
    if (approved) {
      sharePoint.status = "pending" // Ready for signing
    } else {
      sharePoint.status = "rejected" // UPDATED: Use "rejected" for manager rejections
    }

    // Enhanced: Add detailed manager action to history with comment
    sharePoint.updateHistory.push({
      action: approved ? "approved" : "rejected",
      performedBy: req.user._id,
      details: approved
        ? `Document approved by manager ${req.user.username}. Users can now sign the document.${approvalNote ? ` Manager note: ${approvalNote}` : ""}`
        : `Document rejected by manager ${req.user.username}${approvalNote ? ` with reason: ${approvalNote}` : ""}`,
      comment: approvalNote || null,
      userAction: {
        type: approved ? "manager_approval" : "manager_rejection",
        userId: req.user._id,
        username: req.user.username,
        timestamp: new Date(),
        note: approvalNote || null,
      },
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
    } else {
      // ENHANCED: Send rejection notification to document creator
      try {
        await sendManagerRejectionEmail({
          to: sharePoint.createdBy.email,
          username: sharePoint.createdBy.username,
          documentTitle: sharePoint.title,
          documentId: sharePoint._id.toString(),
          rejectedBy: req.user.username,
          rejectionNote: approvalNote || "No reason provided",
        })
        console.log(`📧 Rejection notification sent to document creator`)
      } catch (emailError) {
        console.error("❌ Failed to send rejection notification:", emailError)
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
      message: `SharePoint ${approved ? "approved" : "rejected"} successfully${approved ? ". Approval notifications sent to assigned users." : ". Creator has been notified and can relaunch the document."}`,
      sharePoint: responseData,
    })
  } catch (error) {
    console.error("Error approving SharePoint:", error)
    res.status(500).json({ error: "Error approving SharePoint" })
  }
}

// NEW: Send notification to document creator when document is rejected by manager
const sendManagerRejectionEmail = async ({
  to,
  username,
  documentTitle,
  documentId,
  rejectedBy,
  rejectionNote,
}) => {
  try {
    const { sendEmail } = require("../utils/emailService")

    const subject = `Document Rejected by Manager: ${documentTitle}`
    const html = `
      <h2>Document Rejection Notification</h2>
      <p>Hello ${username},</p>
      <p>Your document <strong>${documentTitle}</strong> has been rejected by manager <strong>${rejectedBy}</strong>.</p>
      <p><strong>Reason for rejection:</strong> ${rejectionNote}</p>
      <p>You can relaunch this document after making necessary changes to address the manager's concerns.</p>
      <p>Document ID: ${documentId}</p>
      <p>Thank you,<br>Document Management System</p>
    `

    return await sendEmail({
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error(`Failed to send manager rejection notification email to ${to}:`, error)
    throw error
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

// Add a new function to get documents that need approval from the current user
exports.getMyApprovalSharePoints = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search = "" } = req.query

    const filter = {
      managersToApprove: req.user._id,
      status: "pending_approval",
      managerApproved: { $ne: true },
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
    console.error("Error fetching approval SharePoints:", error)
    res.status(500).json({ error: "Error fetching approval SharePoints" })
  }
}