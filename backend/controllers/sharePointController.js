const SharePoint = require("../models/SharePoint")
const User = require("../models/UserModel")
const {
  sendManagerApprovalEmail,
  sendUserSigningEmail,
  sendRelaunchNotificationEmail,
  sendCompletionNotificationEmail,
  sendBulkEmails,
  sendExpirationNotificationEmail,
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
    status = "completed"
  } else if (signedCount > 0 && sharePoint.managerApproved) {
    status = isExpired ? "expired" : "in_progress"
  } else if (sharePoint.managerApproved) {
    status = isExpired ? "expired" : "pending"
  } else {
    status = isExpired ? "expired" : "pending_approval"
  }

  return {
    completionPercentage,
    allUsersSigned,
    status,
    hasDisapprovals,
    signedCount,
    totalSigners,
    managerApproved: sharePoint.managerApproved,
    isExpired,
  }
}

// 🔧 ENHANCED: Function to check and notify about expired documents with better error handling
const checkAndNotifyExpiredDocuments = async () => {
  try {
    console.log("🔍 Starting expiration check at:", new Date().toISOString())

    const now = new Date()

    // 🔧 FIX: More comprehensive query to find expired documents
    const query = {
      deadline: { $lt: now },
      status: { $nin: ["completed", "expired", "rejected", "disapproved", "cancelled"] },
      $or: [
        { expiredNotificationSent: { $exists: false } },
        { expiredNotificationSent: false },
        { expiredNotificationSent: null },
      ],
    }

    console.log("📋 Expiration query:", JSON.stringify(query, null, 2))

    const expiredDocuments = await SharePoint.find(query).populate("createdBy", "username email").lean()

    console.log(`📊 Found ${expiredDocuments.length} expired documents to process`)

    if (expiredDocuments.length === 0) {
      console.log("✅ No expired documents found")
      return { processed: 0, successful: 0, failed: 0 }
    }

    let successful = 0
    let failed = 0

    for (const doc of expiredDocuments) {
      try {
        console.log(`📧 Processing expiration for document: ${doc.title} (${doc._id})`)
        console.log(`📅 Document deadline: ${doc.deadline}, Current time: ${now}`)
        console.log(`👤 Creator: ${doc.createdBy?.username} (${doc.createdBy?.email})`)

        // Validate creator email
        if (!doc.createdBy?.email) {
          console.error(`❌ No email found for creator of document ${doc._id}`)
          failed++
          continue
        }

        // Send expiration notification to creator
        await sendExpirationNotificationEmail({
          to: doc.createdBy.email,
          username: doc.createdBy.username || "User",
          documentTitle: doc.title,
          documentId: doc._id.toString(),
          deadline: doc.deadline,
        })

        // 🔧 FIX: Update document status and notification flag using findByIdAndUpdate
        await SharePoint.findByIdAndUpdate(doc._id, {
          $set: {
            status: "expired",
            expiredNotificationSent: true,
            expiredNotificationSentAt: new Date(), // 🔧 NEW: Track when notification was sent
          },
          $push: {
            updateHistory: {
              action: "expired",
              performedBy: null,
              details: `Document automatically marked as expired. Creator notified to relaunch with new deadline.`,
              comment: null,
              userAction: {
                type: "system_expiration",
                timestamp: new Date(),
                note: "Document expired - creator notification sent",
              },
            },
          },
        })

        console.log(`✅ Expiration notification sent successfully for document: ${doc.title} (${doc._id})`)
        successful++
      } catch (emailError) {
        console.error(`❌ Failed to process expiration for document ${doc._id}:`, emailError)

        // 🔧 NEW: Mark as failed attempt but don't prevent future attempts
        try {
          await SharePoint.findByIdAndUpdate(doc._id, {
            $push: {
              updateHistory: {
                action: "expiration_failed",
                performedBy: null,
                details: `Failed to send expiration notification: ${emailError.message}`,
                comment: null,
                userAction: {
                  type: "system_expiration_failed",
                  timestamp: new Date(),
                  note: `Email failed: ${emailError.message}`,
                },
              },
            },
          })
        } catch (updateError) {
          console.error(`❌ Failed to update document history for ${doc._id}:`, updateError)
        }

        failed++
      }
    }

    const result = {
      processed: expiredDocuments.length,
      successful,
      failed,
      timestamp: new Date().toISOString(),
    }

    console.log(`✅ Expiration check completed:`, result)
    return result
  } catch (error) {
    console.error("❌ Error in expiration check process:", error)
    return { processed: 0, successful: 0, failed: 0, error: error.message }
  }
}

// 🔧 ENHANCED: Store interval reference and add startup delay
let expirationCheckInterval = null

// 🔧 NEW: Start expiration checking with initial delay
const startExpirationChecking = () => {
  // Clear any existing interval
  if (expirationCheckInterval) {
    clearInterval(expirationCheckInterval)
  }

  console.log("🚀 Starting expiration checking system...")

  // Run initial check after 30 seconds (to allow server to fully start)
  setTimeout(() => {
    console.log("🔍 Running initial expiration check...")
    checkAndNotifyExpiredDocuments()
  }, 30000)

  // Then run every hour
  expirationCheckInterval = setInterval(
    () => {
      console.log("⏰ Running scheduled expiration check...")
      checkAndNotifyExpiredDocuments()
    },
    60 * 60 * 1000,
  ) // 1 hour

  console.log("✅ Expiration checking system started (checks every hour)")
}

// 🔧 NEW: Stop expiration checking (useful for testing or shutdown)
const stopExpirationChecking = () => {
  if (expirationCheckInterval) {
    clearInterval(expirationCheckInterval)
    expirationCheckInterval = null
    console.log("🛑 Expiration checking system stopped")
  }
}

// Start the expiration checking system
startExpirationChecking()

// 🔧 NEW: Manual expiration check endpoint for testing
exports.manualExpirationCheck = async (req, res) => {
  try {
    console.log("🔧 Manual expiration check triggered by:", req.user?.username || "Unknown user")
    const result = await checkAndNotifyExpiredDocuments()

    res.json({
      message: "Manual expiration check completed",
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Manual expiration check failed:", error)
    res.status(500).json({
      error: "Manual expiration check failed",
      details: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}

// 🔧 NEW: Get expiration check status
exports.getExpirationCheckStatus = async (req, res) => {
  try {
    const now = new Date()

    // Get count of documents that should be expired
    const expiredCount = await SharePoint.countDocuments({
      deadline: { $lt: now },
      status: { $nin: ["completed", "expired", "rejected", "disapproved", "cancelled"] },
    })

    // Get count of documents with pending notifications
    const pendingNotifications = await SharePoint.countDocuments({
      deadline: { $lt: now },
      status: { $nin: ["completed", "expired", "rejected", "disapproved", "cancelled"] },
      $or: [
        { expiredNotificationSent: { $exists: false } },
        { expiredNotificationSent: false },
        { expiredNotificationSent: null },
      ],
    })

    // Get recently processed documents
    const recentlyProcessed = await SharePoint.find({
      expiredNotificationSentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    })
      .select("title expiredNotificationSentAt createdBy")
      .populate("createdBy", "username email")
      .limit(10)

    res.json({
      status: "active",
      intervalActive: !!expirationCheckInterval,
      expiredDocumentsCount: expiredCount,
      pendingNotificationsCount: pendingNotifications,
      recentlyProcessed: recentlyProcessed.length,
      recentlyProcessedDocuments: recentlyProcessed,
      lastCheckTime: new Date().toISOString(),
      nextCheckIn: "1 hour (automatic)",
    })
  } catch (error) {
    console.error("❌ Error getting expiration check status:", error)
    res.status(500).json({
      error: "Failed to get expiration check status",
      details: error.message,
    })
  }
}

// Create a new SharePoint - Email to assigned managers
exports.createSharePoint = async (req, res) => {
  try {
    console.log("Received request body:", req.body)

    const { title, link, comment, deadline, usersToSign, managersToApprove, requesterDepartment } = req.body

    console.log("Extracted requesterDepartment:", requesterDepartment)

    if (!title || !link || !deadline) {
      return res.status(400).json({ error: "Title, link, and deadline are required" })
    }

    if (!requesterDepartment || requesterDepartment.trim() === "") {
      console.log("RequesterDepartment validation failed:", requesterDepartment)
      return res.status(400).json({ error: "Requester department is required" })
    }

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
      console.log("Invalid department:", requesterDepartment)
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

    console.log("Creating SharePoint with department:", requesterDepartment)

    const sharePoint = new SharePoint({
      title,
      link,
      comment,
      deadline: new Date(deadline),
      requesterDepartment: requesterDepartment.trim(),
      createdBy: req.user._id,
      usersToSign: selectedUsers.map((user) => ({ user: user._id })),
      managersToApprove: managersToApprove,
      status: "pending_approval",
      expiredNotificationSent: false,
      expiredNotificationSentAt: null, // 🔧 NEW: Track when notification was sent
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
    console.log("SharePoint saved successfully with department:", sharePoint.requesterDepartment)

    await sharePoint.populate([
      { path: "createdBy", select: "username email roles" },
      { path: "usersToSign.user", select: "username email roles" },
      { path: "managersToApprove", select: "username email roles" },
    ])

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
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ error: `Validation failed: ${validationErrors.join(", ")}` })
    }
    res.status(500).json({ error: "Error creating SharePoint" })
  }
}

// Keep all other existing functions unchanged...
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

    const isExpired = sharePoint.deadline && new Date(sharePoint.deadline) < new Date()
    if (isExpired && sharePoint.status !== "completed") {
      return res.status(400).json({
        error: "Cannot approve expired document. Creator must relaunch with new deadline.",
        code: "DOCUMENT_EXPIRED",
      })
    }

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
            documentId: documentId,
          }),
        )

        const emailResults = await Promise.allSettled(userEmailPromises)

        const successful = emailResults.filter((result) => result.status === "fulfilled").length
        const failed = emailResults.filter((result) => result.status === "rejected").length

        console.log(
          `📧 User signing notifications sent with document ID ${documentId}: ${successful} successful, ${failed} failed`,
        )

        emailResults.forEach((result, index) => {
          if (result.status === "rejected") {
            console.error(`❌ Failed to send email to ${usersToNotify[index].user.email}:`, result.reason)
          }
        })
      } catch (emailError) {
        console.error("❌ Failed to send user signing notifications:", emailError)
      }
    } else {
      try {
        await sendRelaunchNotificationEmail({
          to: sharePoint.createdBy.email,
          username: sharePoint.createdBy.username,
          documentTitle: sharePoint.title,
          documentId: documentId,
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

// Keep all other existing functions...
exports.signSharePoint = async (req, res) => {
  try {
    const { signatureNote } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    const isExpired = sharePoint.deadline && new Date(sharePoint.deadline) < new Date()
    if (isExpired && sharePoint.status !== "completed") {
      return res.status(400).json({
        error: "Cannot sign expired document. Please wait for creator to relaunch with new deadline.",
        code: "DOCUMENT_EXPIRED",
      })
    }

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

    if (completionData.status === "completed") {
      try {
        await sendCompletionNotificationEmail({
          to: sharePoint.createdBy.email,
          username: sharePoint.createdBy.username,
          documentTitle: sharePoint.title,
          documentId: documentId,
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

exports.disapproveSharePoint = async (req, res) => {
  try {
    const { disapprovalNote } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    const isExpired = sharePoint.deadline && new Date(sharePoint.deadline) < new Date()
    if (isExpired && sharePoint.status !== "completed") {
      return res.status(400).json({
        error: "Cannot disapprove expired document. Please wait for creator to relaunch with new deadline.",
        code: "DOCUMENT_EXPIRED",
      })
    }

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

    try {
      await sendRelaunchNotificationEmail({
        to: sharePoint.createdBy.email,
        username: sharePoint.createdBy.username,
        documentTitle: sharePoint.title,
        documentId: documentId,
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

exports.relaunchSharePoint = async (req, res) => {
  try {
    const { relaunchComment, newDeadline } = req.body
    const sharePoint = await SharePoint.findById(req.params.id)
      .populate("createdBy", "username email roles")
      .populate("managersToApprove", "username email roles")
      .populate("usersToSign.user", "username email roles")

    if (!sharePoint) {
      return res.status(404).json({ error: "SharePoint not found" })
    }

    const documentId = sharePoint._id.toString()
    console.log(`📋 Processing relaunch for SharePoint ID: ${documentId}`)

    if (sharePoint.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the document creator can relaunch the document" })
    }

    if (sharePoint.status !== "disapproved" && sharePoint.status !== "rejected" && sharePoint.status !== "expired") {
      return res.status(400).json({
        error: "Only disapproved, rejected, or expired documents can be relaunched",
        currentStatus: sharePoint.status,
      })
    }

    if (newDeadline) {
      const newDeadlineDate = new Date(newDeadline)
      if (newDeadlineDate <= new Date()) {
        return res.status(400).json({ error: "New deadline must be in the future" })
      }
      sharePoint.deadline = newDeadlineDate
    } else if (sharePoint.status === "expired") {
      return res.status(400).json({ error: "New deadline is required when relaunching expired documents" })
    }

    sharePoint.status = "pending_approval"
    sharePoint.managerApproved = false
    sharePoint.approvedBy = null
    sharePoint.approvedAt = null
    sharePoint.disapprovalNote = null
    sharePoint.expiredNotificationSent = false
    sharePoint.expiredNotificationSentAt = null // 🔧 NEW: Reset notification timestamp

    const resetSigners = sharePoint.usersToSign.map((signer) => ({
      ...signer.toObject(),
      hasSigned: signer.hasSigned,
      signedAt: signer.signedAt,
      signatureNote: signer.signatureNote,
      hasDisapproved: false,
      disapprovedAt: null,
      disapprovalNote: null,
    }))
    sharePoint.usersToSign = resetSigners

    const relaunchCommentText =
      relaunchComment && relaunchComment.trim()
        ? relaunchComment.trim()
        : "Document relaunched to address previous concerns"

    const deadlineChangeInfo = newDeadline ? ` New deadline set to: ${new Date(newDeadline).toLocaleDateString()}.` : ""

    sharePoint.updateHistory.push({
      action: "relaunched",
      performedBy: req.user._id,
      details: `Document relaunched by ${req.user.username}. Existing user approvals preserved.${deadlineChangeInfo}`,
      comment: relaunchCommentText,
      userAction: {
        type: "relaunch",
        userId: req.user._id,
        username: req.user.username,
        timestamp: new Date(),
        note: relaunchCommentText,
        newDeadline: newDeadline || null,
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
        documentId: documentId,
        isRelaunch: true,
        relaunchReason: relaunchCommentText,
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

    const alreadyApprovedCount = sharePoint.usersToSign.filter((signer) => signer.hasSigned).length
    const totalUsers = sharePoint.usersToSign.length

    res.json({
      message: `SharePoint relaunched successfully${newDeadline ? " with new deadline" : ""}. Managers have been notified for re-approval. ${alreadyApprovedCount}/${totalUsers} user approvals preserved.`,
      sharePoint: responseData,
      preservedApprovals: alreadyApprovedCount,
      totalUsers: totalUsers,
      newDeadline: newDeadline || null,
    })
  } catch (error) {
    console.error("Error relaunching SharePoint:", error)
    res.status(500).json({ error: "Error relaunching SharePoint" })
  }
}

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
      approxiDate,
      requesterDepartment,
    } = req.query

    const filter = {}
    const sort = {}

    if (status && status !== "all") filter.status = status
    if (createdBy) filter.createdBy = createdBy
    if (assignedTo) filter["usersToSign.user"] = assignedTo
    if (approxiDate && approxiDate !== "all") filter.approxiDate = approxiDate
    if (requesterDepartment && requesterDepartment !== "all") filter.requesterDepartment = requesterDepartment

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { comment: { $regex: search, $options: "i" } },
        { "createdBy.username": { $regex: search, $options: "i" } },
      ]
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
      updateData.expiredNotificationSent = false
      updateData.expiredNotificationSentAt = null // 🔧 NEW: Reset notification timestamp
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

    const isExpired = sharePoint.deadline && new Date(sharePoint.deadline) < new Date()

    const canSign = sharePoint.managerApproved && isAssignedSigner && !isExpired

    res.json({
      canSign,
      managerApproved: sharePoint.managerApproved,
      isAssignedSigner,
      isExpired,
      reason: !sharePoint.managerApproved
        ? "Manager approval required before signing"
        : !isAssignedSigner
          ? "User not assigned to sign this document"
          : isExpired
            ? "Document has expired - creator must relaunch with new deadline"
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

// Export the expiration check function and control functions
exports.checkExpiredDocuments = checkAndNotifyExpiredDocuments
exports.startExpirationChecking = startExpirationChecking
exports.stopExpirationChecking = stopExpirationChecking
