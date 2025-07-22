"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileText,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Edit,
  Trash2,
  ArrowLeft,
  MessageSquare,
  History,
  CheckCircle,
  User,
  Shield,
  Database,
  Info,
  UserCheck,
  CalendarDays,
  Download,
  Settings,
  RotateCcw,
  AlertTriangle,
  Copy,
  MessageCircle,
  Quote,
  Building2,
} from "lucide-react"
import {
  getSharePointById,
  signSharePoint,
  approveSharePoint,
  disapproveSharePoint,
  relaunchSharePoint,
  deleteSharePoint,
} from "../apis/sharePointApi"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "../context/AuthContext"
import MainLayout from "../components/MainLayout"
import WorkflowStatusIndicator from "../components/workflow-status-indicator"
import { getCurrentUser } from "../apis/auth"
import html2pdf from "html2pdf.js"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
}

export default function SharePointDetailEnhanced({
  id: propId,
  currentUser: propCurrentUser,
  onBack: propOnBack,
  onEdit: propOnEdit,
}) {
  const navigate = useNavigate()
  const params = useParams()
  const { user } = useAuth()

  const documentId = propId || params.id || window.location.pathname.split("/").pop()
  const activeUser = propCurrentUser || user

  const [sharePoint, setSharePoint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [approvalNote, setApprovalNote] = useState("")
  const [disapprovalNote, setDisapprovalNote] = useState("")
  const [managerApprovalNote, setManagerApprovalNote] = useState("")
  const [relaunchComment, setRelaunchComment] = useState("")
  const [newDeadline, setNewDeadline] = useState("") // 🔧 NEW: State for new deadline
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showManagerApproveDialog, setShowManagerApproveDialog] = useState(false)
  const [showDisapproveDialog, setShowDisapproveDialog] = useState(false)
  const [showManagerRejectDialog, setShowManagerRejectDialog] = useState(false)
  const [showRelaunchDialog, setShowRelaunchDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentUserInfo, setCurrentUserInfo] = useState(null)

  const handleBack = () => {
    if (propOnBack) {
      propOnBack()
    } else if (navigate) {
      navigate("/sharepoint")
    } else {
      window.history.back()
    }
  }

  const handleEdit = () => {
    if (propOnEdit) {
      propOnEdit(documentId)
    } else if (navigate) {
      navigate(`/sharepoint/${documentId}/edit`)
    } else {
      window.location.href = `/sharepoint/${documentId}/edit`
    }
  }

  useEffect(() => {
    if (documentId && documentId !== "undefined" && documentId !== "null") {
      loadSharePointDetails()
    } else {
      setError("No document ID provided")
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await getCurrentUser()
        setCurrentUserInfo(userData)
        console.log("Current user info loaded:", userData)
      } catch (error) {
        console.error("Error fetching current user:", error)
      }
    }
    fetchCurrentUser()
  }, [])

  const loadSharePointDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSharePointById(documentId)
      setSharePoint(data)
    } catch (err) {
      console.error("Error loading SharePoint details:", err)
      setError("Failed to load document details. Please try again.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load document details.",
      })
    } finally {
      setLoading(false)
    }
  }

  // After sharePoint data is loaded, calculate all derived values in proper order
  const isExpired =
    sharePoint && sharePoint.deadline && new Date(sharePoint.deadline) < new Date() && sharePoint.status !== "completed"
  const completionPercentage = sharePoint?.completionPercentage || 0
  // Enhanced logic to check if current user can edit the document
  const canEdit = (() => {
    // Admin users can always edit
    if (activeUser?.roles?.includes("Admin")) {
      return true
    }

    // Check if current user is the creator of the document
    const currentUserId = currentUserInfo?._id || activeUser?._id
    const currentUserUsername = currentUserInfo?.username || activeUser?.username
    const currentUserLicense = currentUserInfo?.license || activeUser?.license

    const creatorId = sharePoint?.createdBy?._id
    const creatorUsername = sharePoint?.createdBy?.username
    const creatorLicense = sharePoint?.createdBy?.license

    // Check multiple identifiers to ensure proper matching
    return (
      (currentUserId && creatorId && String(currentUserId) === String(creatorId)) ||
      (currentUserUsername && creatorUsername && String(currentUserUsername) === String(creatorUsername)) ||
      (currentUserLicense && creatorLicense && String(currentUserLicense) === String(creatorLicense))
    )
  })()
  const hasManagerApproved = sharePoint?.managerApproved
  const allApproved = sharePoint?.allUsersSigned
  const isDisapproved = sharePoint?.status === "disapproved" || sharePoint?.status === "cancelled"
  const isRejected = sharePoint?.status === "rejected"
  const canRelaunch =
    sharePoint?.createdBy?.license === activeUser?.license &&
    (isDisapproved || isRejected || sharePoint?.status === "expired")

  // Calculate user permissions
  const currentUserLicense = currentUserInfo?.license || activeUser?.license
  const currentUserUsername = currentUserInfo?.username || activeUser?.username
  const currentUserId = currentUserInfo?._id || activeUser?._id

  // Check if current user is a selected manager
  const isSelectedManager = sharePoint?.managersToApprove?.some((managerId) => {
    const managerIdStr = String(managerId)
    const userIdStr = currentUserInfo ? String(currentUserInfo._id) : String(activeUser?._id)
    const userLicenseStr = currentUserInfo ? String(currentUserInfo.license) : String(activeUser?.license)
    return managerIdStr === userIdStr || managerIdStr === userLicenseStr
  })

  // 🔧 ENHANCED: Manager can only approve if document is not expired
  const canManagerApprove =
    isSelectedManager && sharePoint?.status === "pending_approval" && !hasManagerApproved && !isExpired

  // Find current user as signer
  const userSigner = sharePoint?.usersToSign?.find((signer) => {
    if (!signer?.user) return false
    const signerId = String(signer.user._id)
    const signerUsername = String(signer.user.username)
    const signerLicense = String(signer.user.license)
    const userId = String(currentUserId)
    const userUsername = String(currentUserUsername)
    const userLicense = String(currentUserLicense)

    return (
      (userId && signerId === userId) ||
      (userUsername && signerUsername === userUsername) ||
      (userLicense && signerLicense === userLicense)
    )
  })

  // 🔧 ENHANCED: Users can only approve/disapprove if document is not expired
  const canUserApprove =
    hasManagerApproved &&
    userSigner &&
    !userSigner.hasSigned &&
    !userSigner.hasDisapproved &&
    !isDisapproved &&
    !isRejected &&
    !isExpired

  const canUserDisapprove =
    hasManagerApproved &&
    userSigner &&
    !userSigner.hasSigned &&
    !userSigner.hasDisapproved &&
    !isDisapproved &&
    !isRejected &&
    !isExpired

  // User approval (after manager approval) - Enhanced with comment
  const handleUserApprove = async () => {
    try {
      setIsSubmitting(true)
      await signSharePoint(documentId, approvalNote.trim())
      toast({
        title: "Document Approved",
        description: "You have successfully approved this document.",
      })
      loadSharePointDetails()
      setShowApproveDialog(false)
      setApprovalNote("")
    } catch (err) {
      console.error("Error approving document:", err)

      // 🔧 ENHANCED: Handle expiration error specifically
      if (err.response?.data?.code === "DOCUMENT_EXPIRED") {
        toast({
          variant: "destructive",
          title: "Document Expired",
          description: "This document has expired. Please wait for the creator to relaunch it with a new deadline.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to approve the document. Please try again.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manager approval with comment - Enhanced
  const handleManagerApprove = async () => {
    try {
      setIsSubmitting(true)
      await approveSharePoint(documentId, true, managerApprovalNote.trim())
      toast({
        title: "Document Approved by Manager",
        description: "You have approved this document. Users can now provide their approvals.",
      })
      loadSharePointDetails()
      setShowManagerApproveDialog(false)
      setManagerApprovalNote("")
    } catch (err) {
      console.error("Error approving document:", err)

      // 🔧 ENHANCED: Handle expiration error specifically
      if (err.response?.data?.code === "DOCUMENT_EXPIRED") {
        toast({
          variant: "destructive",
          title: "Document Expired",
          description: "This document has expired. The creator must relaunch it with a new deadline.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to approve the document. Please try again.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // User disapproval - Enhanced with required comment
  const handleUserDisapprove = async () => {
    try {
      setIsSubmitting(true)
      await disapproveSharePoint(documentId, disapprovalNote.trim())
      toast({
        title: "Document Disapproved",
        description: "You have disapproved this document. The document has been cancelled.",
      })
      loadSharePointDetails()
      setShowDisapproveDialog(false)
      setDisapprovalNote("")
    } catch (err) {
      console.error("Error disapproving document:", err)

      // 🔧 ENHANCED: Handle expiration error specifically
      if (err.response?.data?.code === "DOCUMENT_EXPIRED") {
        toast({
          variant: "destructive",
          title: "Document Expired",
          description: "This document has expired. Please wait for the creator to relaunch it with a new deadline.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to disapprove the document. Please try again.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manager rejection with required comment - Enhanced
  const handleManagerReject = async () => {
    try {
      setIsSubmitting(true)
      await approveSharePoint(documentId, false, disapprovalNote.trim())
      toast({
        title: "Document Rejected",
        description: "You have rejected this document.",
      })
      loadSharePointDetails()
      setShowManagerRejectDialog(false)
      setDisapprovalNote("")
    } catch (err) {
      console.error("Error rejecting document:", err)

      // 🔧 ENHANCED: Handle expiration error specifically
      if (err.response?.data?.code === "DOCUMENT_EXPIRED") {
        toast({
          variant: "destructive",
          title: "Document Expired",
          description: "This document has expired. The creator must relaunch it with a new deadline.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reject the document. Please try again.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 🔧 ENHANCED: Relaunch with new deadline support
  const handleRelaunch = async () => {
    try {
      setIsSubmitting(true)

      // Prepare relaunch data
      const relaunchData = {
        relaunchComment: relaunchComment.trim(),
      }

      // Add new deadline if provided (required for expired documents)
      if (newDeadline) {
        relaunchData.newDeadline = newDeadline
      }

      await relaunchSharePoint(documentId, relaunchData)
      toast({
        title: "Document Relaunched",
        description: newDeadline
          ? "The document has been relaunched with a new deadline and sent back to managers for re-approval."
          : "The document has been sent back to managers for re-approval.",
      })
      loadSharePointDetails()
      setShowRelaunchDialog(false)
      setRelaunchComment("")
      setNewDeadline("")
    } catch (err) {
      console.error("Error relaunching document:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to relaunch the document. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsSubmitting(true)
      await deleteSharePoint(documentId)
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      })
      handleBack()
    } catch (err) {
      console.error("Error deleting document:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the document. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
      setShowDeleteDialog(false)
    }
  }

  // Enhanced function to handle PDF generation of the complete document history
  const handlePrintHistoryAsPDF = () => {
    const opt = {
      margin: [15, 15, 15, 15],
      filename: `SharePoint_Complete_Report_${sharePoint.title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },
    }

    // Create comprehensive PDF content
    const createPDFContent = () => {
      const container = document.createElement("div")
      container.style.cssText = `
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      padding: 20px;
      background: white;
    `

      // Header Section
      const header = document.createElement("div")
      header.style.cssText = `
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    `
      header.innerHTML = `
      <h1 style="color: #1e40af; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">
        SharePoint Document Report
      </h1>
      <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">
        ${sharePoint.title}
      </h2>
      <div style="background: #f3f4f6; padding: 10px; border-radius: 8px; display: inline-block;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          <strong>Document ID:</strong> ${sharePoint._id}<br>
          <strong>Internal ID:</strong> ${sharePoint.approxiDate || "N/A"}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
          <strong>Status:</strong> <span style="color: ${sharePoint.status === "completed" ? "#059669" : sharePoint.status === "rejected" || sharePoint.status === "disapproved" ? "#dc2626" : sharePoint.status === "expired" ? "#dc2626" : "#d97706"}; font-weight: bold; text-transform: uppercase;">${sharePoint.status.replace("_", " ")}</span>
        </p>
      </div>
    `

      // Document Overview Section
      const overview = document.createElement("div")
      overview.style.cssText = `
      margin-bottom: 25px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    `
      overview.innerHTML = `
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
        📋 Document Overview
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 8px 0;"><strong>Created By:</strong> ${sharePoint.createdBy?.username || "Unknown"}</p>
          <p style="margin: 8px 0;"><strong>Creation Date:</strong> ${formatDate(sharePoint.creationDate)}</p>
          <p style="margin: 8px 0;"><strong>Deadline:</strong> ${formatDate(sharePoint.deadline)}</p>
          <p style="margin: 8px 0;"><strong>Department:</strong> ${sharePoint.requesterDepartment || "N/A"}</p>
          <p style="margin: 8px 0;"><strong>SharePoint Link:</strong> <span style="font-size: 12px; word-break: break-all;">${sharePoint.link}</span></p>
        </div>
        <div>
          <p style="margin: 8px 0;"><strong>Internal ID:</strong> ${sharePoint.approxiDate || "N/A"}</p>
          <p style="margin: 8px 0;"><strong>Total Signers:</strong> ${sharePoint.usersToSign?.length || 0}</p>
          <p style="margin: 8px 0;"><strong>Completed Signatures:</strong> ${sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}</p>
          <p style="margin: 8px 0;"><strong>Completion:</strong> ${completionPercentage}%</p>
          <p style="margin: 8px 0;"><strong>Manager Approved:</strong> ${hasManagerApproved ? "✅ Yes" : "❌ No"}</p>
          <p style="margin: 8px 0;"><strong>Is Expired:</strong> ${isExpired ? "⚠️ Yes" : "✅ No"}</p>
        </div>
      </div>
      ${
        sharePoint.comment
          ? `
        <div style="margin-top: 15px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
          <strong>Creation Comment:</strong><br>
          <span style="font-style: italic;">"${sharePoint.comment}"</span>
        </div>
      `
          : ""
      }
    `

      // Manager Approval Section
      const managerSection = document.createElement("div")
      managerSection.style.cssText = `
      margin-bottom: 25px;
      padding: 20px;
      background: ${hasManagerApproved ? "#ecfdf5" : "#fef3c7"};
      border-radius: 8px;
      border-left: 4px solid ${hasManagerApproved ? "#10b981" : "#f59e0b"};
    `
      managerSection.innerHTML = `
      <h3 style="color: ${hasManagerApproved ? "#065f46" : "#92400e"}; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
        ${hasManagerApproved ? "✅" : "⏳"} Manager Approval Status
      </h3>
      ${
        hasManagerApproved
          ? `
        <p style="margin: 8px 0;"><strong>Approved By:</strong> ${sharePoint.approvedBy?.username || "Unknown Manager"}</p>
        <p style="margin: 8px 0;"><strong>Approval Date:</strong> ${formatDate(sharePoint.approvedAt)}</p>
        ${
          sharePoint.updateHistory?.find((entry) => entry.action === "approved" && entry.comment)?.comment
            ? `
          <div style="margin-top: 12px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #d1fae5;">
            <strong>Manager's Approval Comment:</strong><br>
            <span style="font-style: italic;">"${sharePoint.updateHistory.find((entry) => entry.action === "approved" && entry.comment)?.comment}"</span>
          </div>
        `
            : ""
        }
      `
          : `
        <p style="margin: 8px 0; color: #92400e;"><strong>Status:</strong> Pending manager approval</p>
        <p style="margin: 8px 0;"><strong>Assigned Managers:</strong> ${sharePoint.managersToApprove?.length || 0}</p>
      `
      }
    `

      // User Signatures Section
      const signaturesSection = document.createElement("div")
      signaturesSection.style.cssText = `
      margin-bottom: 25px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #8b5cf6;
    `
      let signaturesHTML = `
      <h3 style="color: #5b21b6; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
        👥 User Signatures (${sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/${sharePoint.usersToSign?.length || 0})
      </h3>
    `

      sharePoint.usersToSign?.forEach((signer, index) => {
        const status = signer.hasSigned ? "✅ Approved" : signer.hasDisapproved ? "❌ Disapproved" : "⏳ Pending"
        const statusColor = signer.hasSigned ? "#059669" : signer.hasDisapproved ? "#dc2626" : "#d97706"

        signaturesHTML += `
        <div style="margin: 12px 0; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong>${signer.user?.username || "Unknown User"}</strong>
            <span style="color: ${statusColor}; font-weight: bold;">${status}</span>
          </div>
          <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">${signer.user?.email || "No email"}</p>
          ${
            signer.hasSigned
              ? `
            <p style="margin: 4px 0; font-size: 14px;"><strong>Signed:</strong> ${formatDate(signer.signedAt)}</p>
            ${
              signer.signatureNote
                ? `
              <div style="margin-top: 8px; padding: 8px; background: #ecfdf5; border-radius: 4px; border-left: 3px solid #10b981;">
                <strong>Approval Comment:</strong><br>
                <span style="font-style: italic;">"${signer.signatureNote}"</span>
              </div>
            `
                : ""
            }
          `
              : signer.hasDisapproved
                ? `
            <p style="margin: 4px 0; font-size: 14px;"><strong>Disapproved:</strong> ${formatDate(signer.disapprovedAt)}</p>
            ${
              signer.disapprovalNote
                ? `
              <div style="margin-top: 8px; padding: 8px; background: #fef2f2; border-radius: 4px; border-left: 3px solid #ef4444;">
                <strong>Disapproval Reason:</strong><br>
                <span style="font-style: italic;">"${signer.disapprovalNote}"</span>
              </div>
            `
                : ""
            }
          `
                : ""
          }
        </div>
      `
      })
      signaturesSection.innerHTML = signaturesHTML

      // Comments Timeline Section
      const commentsSection = document.createElement("div")
      commentsSection.style.cssText = `
      margin-bottom: 25px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #ec4899;
    `

      const allComments = getAllComments()
      let commentsHTML = `
      <h3 style="color: #be185d; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
        💬 Comments Timeline (${allComments.length})
      </h3>
    `

      if (allComments.length === 0) {
        commentsHTML += `<p style="color: #6b7280; font-style: italic;">No comments available.</p>`
      } else {
        allComments.forEach((comment, index) => {
          const bgColor =
            comment.type === "creation"
              ? "#dbeafe"
              : comment.type === "manager_approval"
                ? "#d1fae5"
                : comment.type === "approval_note"
                  ? "#ecfdf5"
                  : comment.type === "disapproval_note" || comment.type === "manager_rejection"
                    ? "#fef2f2"
                    : comment.type === "relaunch"
                      ? "#dbeafe"
                      : "#f3f4f6"

          commentsHTML += `
          <div style="margin: 12px 0; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <strong>${comment.author?.username || "Unknown User"}</strong>
                <span style="background: ${bgColor}; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; font-weight: 500;">
                  ${comment.type.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <span style="font-size: 12px; color: #6b7280;">${formatDate(comment.timestamp)}</span>
            </div>
            <div style="padding: 8px; background: ${bgColor}; border-radius: 4px; border-left: 3px solid #6b7280;">
              <span style="font-style: italic;">"${comment.comment}"</span>
            </div>
          </div>
        `
        })
      }
      commentsSection.innerHTML = commentsHTML

      // Complete History Section
      const historySection = document.createElement("div")
      historySection.style.cssText = `
      margin-bottom: 25px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #059669;
    `

      let historyHTML = `
      <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
        📜 Complete Action History (${sharePoint.updateHistory?.length || 0} events)
      </h3>
    `

      sharePoint.updateHistory?.forEach((event, index) => {
        const actionColor =
          event.action === "created" || event.action === "signed" || event.action === "approved"
            ? "#059669"
            : event.action === "rejected" || event.action === "disapproved"
              ? "#dc2626"
              : event.action === "relaunched"
                ? "#2563eb"
                : event.action === "expired"
                  ? "#dc2626"
                  : "#6b7280"

        historyHTML += `
        <div style="margin: 12px 0; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; position: relative;">
          ${
            index !== sharePoint.updateHistory.length - 1
              ? `
            <div style="position: absolute; left: 8px; top: 45px; bottom: -12px; width: 2px; background: #e5e7eb;"></div>
          `
              : ""
          }
          <div style="position: absolute; left: 2px; top: 20px; width: 14px; height: 14px; background: ${actionColor}; border-radius: 50%; border: 3px solid white;"></div>
          <div style="margin-left: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: ${actionColor}; text-transform: capitalize;">${event.action.replace("_", " ")}</strong>
              <span style="font-size: 12px; color: #6b7280;">${formatDate(event.timestamp)}</span>
            </div>
            <p style="margin: 4px 0; color: #374151;">${event.details}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">
              <strong>Performed by:</strong> ${event.performedBy?.username || "System"}
            </p>
            ${
              event.comment
                ? `
              <div style="margin-top: 8px; padding: 8px; background: #f9fafb; border-radius: 4px; border-left: 3px solid ${actionColor};">
                <strong>Comment:</strong><br>
                <span style="font-style: italic;">"${event.comment}"</span>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `
      })
      historySection.innerHTML = historyHTML

      // Footer Section
      const footer = document.createElement("div")
      footer.style.cssText = `
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    `
      footer.innerHTML = `
      <p style="margin: 0;">
        This report was generated automatically from the SharePoint Document Management System<br>
        Generated on: ${new Date().toLocaleString()} | Document ID: ${sharePoint._id} | Approxi Date: ${sharePoint.approxiDate || "N/A"}<br>
        Status: ${sharePoint.status.toUpperCase()} | Expired: ${isExpired ? "YES" : "NO"}
      </p>
    `

      // Assemble all sections
      container.appendChild(header)
      container.appendChild(overview)
      container.appendChild(managerSection)
      container.appendChild(signaturesSection)
      container.appendChild(commentsSection)
      container.appendChild(historySection)
      container.appendChild(footer)

      return container
    }

    try {
      const pdfContent = createPDFContent()

      html2pdf()
        .set(opt)
        .from(pdfContent)
        .save()
        .then(() => {
          toast({
            title: "PDF Generated Successfully",
            description: "Complete SharePoint document report has been downloaded.",
          })
        })
        .catch((err) => {
          console.error("Error generating PDF:", err)
          toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "Failed to generate the document report. Please try again.",
          })
        })
    } catch (error) {
      console.error("Error creating PDF content:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to prepare document content for PDF generation.",
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "pending_approval":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "expired":
        return "bg-red-50 text-red-700 border-red-200"
      case "cancelled":
        return "bg-gray-50 text-gray-700 border-gray-200"
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200"
      case "disapproved":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />
      case "in_progress":
        return <Clock className="w-4 h-4" />
      case "pending":
        return <AlertCircle className="w-4 h-4" />
      case "pending_approval":
        return <Shield className="w-4 h-4" />
      case "expired":
        return <Timer className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      case "disapproved":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Enhanced function to get all comments from the document
  const getAllComments = () => {
    if (!sharePoint) return []

    const comments = []

    // Add creation comment if exists
    if (sharePoint.comment) {
      comments.push({
        id: "creation",
        type: "creation",
        comment: sharePoint.comment,
        author: sharePoint.createdBy,
        timestamp: sharePoint.creationDate,
        icon: <FileText className="w-4 h-4" />,
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-700",
      })
    }

    // Add manager approval note if exists
    if (sharePoint.managerApproved && sharePoint.approvedBy) {
      const managerApprovalEntry = sharePoint.updateHistory?.find(
        (entry) => entry.action === "approved" && entry.performedBy?._id === sharePoint.approvedBy._id,
      )
      if (managerApprovalEntry && managerApprovalEntry.comment) {
        comments.push({
          id: "manager-approval",
          type: "manager_approval",
          comment: managerApprovalEntry.comment,
          author: sharePoint.approvedBy,
          timestamp: sharePoint.approvedAt,
          icon: <Shield className="w-4 h-4" />,
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          textColor: "text-emerald-700",
        })
      }
    }

    // Add all history comments (including manager rejections and relaunch comments)
    sharePoint.updateHistory?.forEach((entry, index) => {
      if (entry.comment) {
        let icon, bgColor, borderColor, textColor

        switch (entry.action) {
          case "approved":
            icon = <Shield className="w-4 h-4" />
            bgColor = "bg-emerald-50"
            borderColor = "border-emerald-200"
            textColor = "text-emerald-700"
            break
          case "rejected":
            icon = <XCircle className="w-4 h-4" />
            bgColor = "bg-red-50"
            borderColor = "border-red-200"
            textColor = "text-red-700"
            break
          case "signed":
            icon = <CheckCircle className="w-4 h-4" />
            bgColor = "bg-green-50"
            borderColor = "border-green-200"
            textColor = "text-green-700"
            break
          case "disapproved":
            icon = <XCircle className="w-4 h-4" />
            bgColor = "bg-red-50"
            borderColor = "border-red-200"
            textColor = "text-red-700"
            break
          case "relaunched":
            icon = <RotateCcw className="w-4 h-4" />
            bgColor = "bg-blue-50"
            borderColor = "border-blue-200"
            textColor = "text-blue-700"
            break
          case "expired":
            icon = <Timer className="w-4 h-4" />
            bgColor = "bg-red-50"
            borderColor = "border-red-200"
            textColor = "text-red-700"
            break
          default:
            icon = <MessageCircle className="w-4 h-4" />
            bgColor = "bg-gray-50"
            borderColor = "border-gray-200"
            textColor = "text-gray-700"
        }

        comments.push({
          id: `history-${index}`,
          type: entry.action,
          comment: entry.comment,
          author: entry.performedBy,
          timestamp: entry.timestamp,
          userAction: entry.userAction,
          icon,
          bgColor,
          borderColor,
          textColor,
        })
      }
    })

    // Add user signature notes (both approval and disapproval)
    sharePoint.usersToSign?.forEach((signer, index) => {
      if (signer.signatureNote) {
        comments.push({
          id: `approval-${index}`,
          type: "approval_note",
          comment: signer.signatureNote,
          author: signer.user,
          timestamp: signer.signedAt,
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-700",
        })
      }
      if (signer.disapprovalNote) {
        comments.push({
          id: `disapproval-${index}`,
          type: "disapproval_note",
          comment: signer.disapprovalNote,
          author: signer.user,
          timestamp: signer.disapprovedAt,
          icon: <XCircle className="w-4 h-4" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-700",
        })
      }
    })

    return comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="space-y-4 text-center">
            <div className="inline-block w-12 h-12 border-4 rounded-full border-muted border-t-primary animate-spin"></div>
            <h3 className="text-xl font-medium text-foreground">Loading document details...</h3>
            <p className="text-sm text-muted-foreground">Document ID: {documentId}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !sharePoint) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl text-destructive">Error Loading Document</CardTitle>
              <CardDescription>We couldn't load the document details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error || "Document not found or access denied."}
                  <br />
                  <span className="text-xs">Document ID: {documentId}</span>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={handleBack} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={loadSharePointDetails} variant="outline" className="w-full bg-transparent">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="container p-6 mx-auto max-w-7xl">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header with Back Button */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Documents
              </Button>
              <div className="flex gap-2">
                {canEdit && (
                  <>
                    <Button variant="outline" onClick={handleEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Document</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this document? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSubmitting}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? "Deleting..." : "Delete Document"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </motion.div>

            {/* Document Title and Status */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{sharePoint.title}</h1>
                  <p className="text-muted-foreground">
                    Created by {sharePoint.createdBy?.username} on {formatDate(sharePoint.creationDate)}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <p className="font-mono text-muted-foreground">ID: {sharePoint._id}</p>
                    {sharePoint.approxiDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-muted-foreground">Approxi: {sharePoint.approxiDate}</span>
                      </div>
                    )}
                    {sharePoint.requesterDepartment && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{sharePoint.requesterDepartment}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(sharePoint.status)} variant="outline">
                    {getStatusIcon(sharePoint.status)}
                    <span className="ml-1">{sharePoint.status.replace("_", " ").toUpperCase()}</span>
                  </Badge>
                  {/* 🔧 ENHANCED: Show expired badge prominently */}
                  {isExpired && (
                    <Badge variant="destructive" className="animate-pulse">
                      <Timer className="w-3 h-3 mr-1" />
                      EXPIRED
                    </Badge>
                  )}
                  {hasManagerApproved && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                      <Shield className="w-3 h-3 mr-1" />
                      Manager Approved
                    </Badge>
                  )}
                  {allApproved && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                      <UserCheck className="w-3 h-3 mr-1" />
                      All Approved
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approval Progress</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0} of{" "}
                    {sharePoint.usersToSign?.length || 0} approved
                  </span>
                  <span>
                    {sharePoint.usersToSign?.length - (sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0)}{" "}
                    remaining
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 🔧 ENHANCED: Expiration Alert */}
            {isExpired && (
              <motion.div variants={itemVariants}>
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <Timer className="w-4 h-4" />
                  <AlertTitle className="text-red-800">Document Expired</AlertTitle>
                  <AlertDescription className="text-red-700">
                    This document expired on {formatDate(sharePoint.deadline)}.
                    {canRelaunch ? (
                      <>
                        <br />
                        <strong>
                          As the creator, you can relaunch this document with a new deadline to restart the approval
                          process.
                        </strong>
                      </>
                    ) : (
                      <>
                        <br />
                        <strong>
                          Users cannot approve or disapprove expired documents. The creator must relaunch it with a new
                          deadline.
                        </strong>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Status Alerts */}
            {(isDisapproved || isRejected) && (
              <motion.div variants={itemVariants}>
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Document {isRejected ? "Rejected" : "Cancelled"}</AlertTitle>
                  <AlertDescription>
                    This document has been{" "}
                    {isRejected ? "rejected by the manager" : "cancelled due to user disapproval"}.
                    {sharePoint.disapprovalNote && (
                      <>
                        <br />
                        <strong>Reason:</strong> {sharePoint.disapprovalNote}
                      </>
                    )}
                    {canRelaunch && (
                      <>
                        <br />
                        <span className="text-sm">You can relaunch this document to restart the approval process.</span>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Action Buttons */}
            {(canManagerApprove || canUserApprove || canUserDisapprove || canRelaunch) && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      {/* Manager Approval/Rejection Buttons - Only show if not expired */}
                      {canManagerApprove && (
                        <div className="flex flex-1 gap-2">
                          <Dialog open={showManagerApproveDialog} onOpenChange={setShowManagerApproveDialog}>
                            <DialogTrigger asChild>
                              <Button className="flex-1">
                                <Shield className="w-4 h-4 mr-2" />
                                Approve Document
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Document</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to approve "{sharePoint.title}"? This will allow assigned users
                                  to provide their approvals.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="manager-approval-note">Manager Approval Comment</Label>
                                  <Textarea
                                    id="manager-approval-note"
                                    placeholder="Add any comments about your approval (optional)..."
                                    value={managerApprovalNote}
                                    onChange={(e) => setManagerApprovalNote(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Your comment will be visible to all users and saved in the document history.
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowManagerApproveDialog(false)}
                                  disabled={isSubmitting}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleManagerApprove} disabled={isSubmitting}>
                                  {isSubmitting ? "Approving..." : "Approve"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={showManagerRejectDialog} onOpenChange={setShowManagerRejectDialog}>
                            <DialogTrigger asChild>
                              <Button variant="destructive" className="flex-1">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Document</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to reject "{sharePoint.title}"? The creator will be able to
                                  relaunch it.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="rejection-note">Reason for Rejection *</Label>
                                  <Textarea
                                    id="rejection-note"
                                    placeholder="Explain why you are rejecting this document..."
                                    value={disapprovalNote}
                                    onChange={(e) => setDisapprovalNote(e.target.value)}
                                    className="min-h-[100px]"
                                    required
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Your comment will be visible to the creator and saved in the document history.
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowManagerRejectDialog(false)}
                                  disabled={isSubmitting}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleManagerReject}
                                  disabled={isSubmitting || !disapprovalNote.trim()}
                                >
                                  {isSubmitting ? "Rejecting..." : "Reject Document"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {/* User Approval/Disapproval Buttons - Only show if not expired */}
                      {(canUserApprove || canUserDisapprove) && (
                        <div className="flex flex-1 gap-2">
                          {canUserApprove && (
                            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                              <DialogTrigger asChild>
                                <Button className="flex-1">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve Document
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Document</DialogTitle>
                                  <DialogDescription>
                                    You are about to approve "{sharePoint.title}". This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4 space-y-4">
                                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Shield className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-700">Manager Approved</span>
                                    </div>
                                    <p className="text-xs text-blue-600">
                                      This document has been approved by the manager and is ready for your approval.
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="approval-note">Add a comment</Label>
                                    <Textarea
                                      id="approval-note"
                                      placeholder="Add any comments about your approval (optional)..."
                                      value={approvalNote}
                                      onChange={(e) => setApprovalNote(e.target.value)}
                                      className="min-h-[100px]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Your comment will be visible to managers and saved in the document history.
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowApproveDialog(false)}
                                    disabled={isSubmitting}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUserApprove} disabled={isSubmitting}>
                                    {isSubmitting ? "Approving..." : "Confirm Approval"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {canUserDisapprove && (
                            <Dialog open={showDisapproveDialog} onOpenChange={setShowDisapproveDialog}>
                              <DialogTrigger asChild>
                                <Button variant="destructive" className="flex-1">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Disapprove
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Disapprove Document</DialogTitle>
                                  <DialogDescription>
                                    You are about to disapprove "{sharePoint.title}". This will cancel the document and
                                    notify the creator.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4 space-y-4">
                                  <div className="p-4 border rounded-lg border-amber-200 bg-amber-50">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                                      <span className="text-sm font-medium text-amber-700">Important</span>
                                    </div>
                                    <p className="text-xs text-amber-600">
                                      Disapproving will cancel the document for all users. The creator can then make
                                      changes and relaunch it.
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="disapproval-note">Reason for Disapproval *</Label>
                                    <Textarea
                                      id="disapproval-note"
                                      placeholder="Please explain why you are disapproving this document. Be specific about what needs to be changed..."
                                      value={disapprovalNote}
                                      onChange={(e) => setDisapprovalNote(e.target.value)}
                                      className="min-h-[120px]"
                                      required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Your feedback will help the creator understand what needs to be improved and will
                                      be saved in the document history.
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowDisapproveDialog(false)}
                                    disabled={isSubmitting}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={handleUserDisapprove}
                                    disabled={isSubmitting || !disapprovalNote.trim()}
                                  >
                                    {isSubmitting ? "Disapproving..." : "Disapprove Document"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      )}

                      {/* 🔧 ENHANCED: Relaunch Button with New Deadline Support */}
                      {canRelaunch && (
                        <div className="flex-1">
                          <Dialog open={showRelaunchDialog} onOpenChange={setShowRelaunchDialog}>
                            <DialogTrigger asChild>
                              <Button className="w-full bg-transparent" variant="outline">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Relaunch Document
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Relaunch Document</DialogTitle>
                                <DialogDescription>
                                  This will send the document back to managers for re-approval. All previous approvals
                                  will be reset, but the history will be preserved.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 space-y-4">
                                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">What happens next?</span>
                                  </div>
                                  <ul className="space-y-1 text-xs text-blue-600">
                                    <li>• All approvals will be cleared</li>
                                    <li>• All disapprovals will be cleared</li>
                                    <li>• Managers will receive new approval notifications</li>
                                    <li>• Users can approve again once re-approved by manager</li>
                                    <li>• History will be preserved</li>
                                    {sharePoint?.status === "expired" && (
                                      <li className="font-medium">• New deadline is required for expired documents</li>
                                    )}
                                  </ul>
                                </div>

                                {/* 🔧 NEW: New Deadline Input */}
                                {(sharePoint?.status === "expired" || isExpired) && (
                                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Timer className="w-4 h-4 text-red-600" />
                                      <span className="text-sm font-medium text-red-700">
                                        Document Expired - New Deadline Required
                                      </span>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="new-deadline" className="text-red-700">
                                        New Deadline *
                                      </Label>
                                      <Input
                                        id="new-deadline"
                                        type="datetime-local"
                                        value={newDeadline}
                                        onChange={(e) => setNewDeadline(e.target.value)}
                                        min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)} // Minimum 24 hours from now
                                        className="border-red-200 focus:border-red-400"
                                        required
                                      />
                                      <p className="text-xs text-red-600">
                                        Current deadline: {formatDate(sharePoint.deadline)} (expired)
                                        <br />
                                        New deadline must be at least 24 hours in the future.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Optional new deadline for non-expired documents */}
                                {sharePoint?.status !== "expired" && !isExpired && (
                                  <div className="space-y-2">
                                    <Label htmlFor="optional-new-deadline">Update Deadline (Optional)</Label>
                                    <Input
                                      id="optional-new-deadline"
                                      type="datetime-local"
                                      value={newDeadline}
                                      onChange={(e) => setNewDeadline(e.target.value)}
                                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Current deadline: {formatDate(sharePoint.deadline)}
                                      <br />
                                      Leave empty to keep the current deadline.
                                    </p>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <Label htmlFor="relaunch-comment">Relaunch Comment</Label>
                                  <Textarea
                                    id="relaunch-comment"
                                    placeholder="Explain what changes you've made or why you're relaunching this document (optional)..."
                                    value={relaunchComment}
                                    onChange={(e) => setRelaunchComment(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Your comment will be visible to managers and saved in the document history.
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowRelaunchDialog(false)
                                    setNewDeadline("")
                                    setRelaunchComment("")
                                  }}
                                  disabled={isSubmitting}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleRelaunch}
                                  disabled={
                                    isSubmitting || ((sharePoint?.status === "expired" || isExpired) && !newDeadline)
                                  }
                                >
                                  {isSubmitting ? "Relaunching..." : "Relaunch Document"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>

                    {/* 🔧 ENHANCED: Status Information with Expiration Details */}
                    <div className="p-3 mt-4 rounded-lg bg-muted">
                      <div className="flex items-center justify-between text-sm">
                        <span>Document Status:</span>
                        <div className="flex items-center gap-2">
                          {isExpired ? (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                              <Timer className="w-3 h-3 mr-1" />
                              Expired - Relaunch Required
                            </Badge>
                          ) : sharePoint.managerApproved ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                              <Shield className="w-3 h-3 mr-1" />
                              Manager Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                              <Clock className="w-3 h-3 mr-1" />
                              Awaiting Manager Approval
                            </Badge>
                          )}
                          {sharePoint.allUsersSigned ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                              <UserCheck className="w-3 h-3 mr-1" />
                              All Approved
                            </Badge>
                          ) : isDisapproved ? (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Cancelled
                            </Badge>
                          ) : isRejected ? (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              <Users className="w-3 h-3 mr-1" />
                              Awaiting Approvals
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 🔧 ENHANCED: Show expiration message when no actions available */}
            {isExpired && !canRelaunch && !canManagerApprove && !canUserApprove && !canUserDisapprove && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center gap-3 p-6 text-center">
                      <Timer className="w-8 h-8 text-red-500" />
                      <div>
                        <h3 className="text-lg font-medium text-red-700">Document Expired</h3>
                        <p className="text-sm text-red-600">
                          This document expired on {formatDate(sharePoint.deadline)}. The creator must relaunch it with
                          a new deadline before any actions can be taken.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Document Details */}
              <motion.div variants={cardVariants} className="space-y-6 lg:col-span-2">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview" className="flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="approvers" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Approvers
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Comments
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-1">
                      <History className="w-3 h-3" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="metadata" className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      Metadata
                    </TabsTrigger>
                    <TabsTrigger value="managers" className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Managers
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          Document Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-4">
                            <div>
                              <h3 className="mb-2 text-sm font-medium text-muted-foreground">SharePoint Link</h3>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(sharePoint.link)
                                  toast({
                                    title: "Link Copied",
                                    description: "SharePoint link has been copied to clipboard.",
                                  })
                                }}
                                className="w-full"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                              </Button>
                            </div>

                            <div>
                              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Deadline</h3>
                              <div
                                className={`flex items-center gap-2 p-3 rounded-lg border ${isExpired ? "bg-red-50 border-red-200" : "bg-muted border-border"}`}
                              >
                                <Calendar className="w-4 h-4" />
                                <div>
                                  <p className={`font-medium ${isExpired ? "text-red-600" : "text-foreground"}`}>
                                    {formatDate(sharePoint.deadline)}
                                  </p>
                                  {isExpired && <p className="text-xs text-red-500">This deadline has passed</p>}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Creation Date</h3>
                              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                                <CalendarDays className="w-4 h-4" />
                                <p className="font-medium">{formatDate(sharePoint.creationDate)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* Display Approxi Date */}
                            {sharePoint.approxiDate && (
                              <div>
                                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Internal ID</h3>
                                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                                  <Calendar className="w-4 h-4" />
                                  <p className="font-mono font-medium">{sharePoint.approxiDate}</p>
                                </div>
                              </div>
                            )}

                            {/* Display Requester Department */}
                            {sharePoint.requesterDepartment && (
                              <div>
                                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Requester Department</h3>
                                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                                  <Building2 className="w-4 h-4" />
                                  <p className="font-medium">{sharePoint.requesterDepartment}</p>
                                </div>
                              </div>
                            )}

                            <div>
                              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Status Information</h3>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                                  <span className="text-sm">Current Status</span>
                                  <Badge className={getStatusColor(sharePoint.status)} variant="outline">
                                    {getStatusIcon(sharePoint.status)}
                                    <span className="ml-1">{sharePoint.status.replace("_", " ").toUpperCase()}</span>
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                                  <span className="text-sm">All Users Approved</span>
                                  <Badge variant={allApproved ? "default" : "secondary"}>
                                    {allApproved ? (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                      <Clock className="w-3 h-3 mr-1" />
                                    )}
                                    {allApproved ? "Yes" : "No"}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                                  <span className="text-sm">Manager Approved</span>
                                  <Badge variant={hasManagerApproved ? "default" : "secondary"}>
                                    {hasManagerApproved ? (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                      <Clock className="w-3 h-3 mr-1" />
                                    )}
                                    {hasManagerApproved ? "Yes" : "Pending"}
                                  </Badge>
                                </div>
                                {/* 🔧 NEW: Expiration Status */}
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                                  <span className="text-sm">Document Expired</span>
                                  <Badge variant={isExpired ? "destructive" : "default"}>
                                    {isExpired ? (
                                      <Timer className="w-3 h-3 mr-1" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {isExpired ? "Yes" : "No"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {sharePoint.comment && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Creation Comments</h3>
                            <div className="p-4 border rounded-lg bg-muted">
                              <p className="text-sm whitespace-pre-wrap">{sharePoint.comment}</p>
                            </div>
                          </div>
                        )}

                        {sharePoint.disapprovalNote && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              {isRejected ? "Rejection" : "Disapproval"} Reason
                            </h3>
                            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                              <p className="text-sm text-red-700 whitespace-pre-wrap">{sharePoint.disapprovalNote}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Approvers Tab */}
                  <TabsContent value="approvers" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          Approval Details ({sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/
                          {sharePoint.usersToSign?.length || 0})
                        </CardTitle>
                        {/* 🔧 NEW: Show expiration warning in approvers tab */}
                        {isExpired && (
                          <CardDescription className="text-red-600">
                            ⚠️ Document expired - users cannot approve or disapprove until relaunched with new deadline
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sharePoint.usersToSign?.map((signer, index) => {
                            if (!signer?.user) return null

                            return (
                              <Card key={signer.user._id} className="overflow-hidden">
                                <div
                                  className={`flex items-center justify-between p-4 ${
                                    signer.hasSigned
                                      ? "bg-emerald-50"
                                      : signer.hasDisapproved
                                        ? "bg-red-50"
                                        : isExpired
                                          ? "bg-gray-50"
                                          : "bg-muted"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback>
                                        {signer.user.username?.charAt(0).toUpperCase() || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{signer.user.username || "Unknown User"}</p>
                                      <p className="text-sm text-muted-foreground">{signer.user.email}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {signer.user.roles?.map((role) => (
                                          <Badge key={role} variant="secondary" className="text-xs">
                                            {role}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      {signer.hasSigned ? (
                                        <Badge
                                          className="text-emerald-700 bg-emerald-100 border-emerald-200"
                                          variant="outline"
                                        >
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Approved
                                        </Badge>
                                      ) : signer.hasDisapproved ? (
                                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Disapproved
                                        </Badge>
                                      ) : isExpired ? (
                                        <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">
                                          <Timer className="w-3 h-3 mr-1" />
                                          Expired
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-amber-600 bg-amber-50 border-amber-200"
                                        >
                                          <Clock className="w-3 h-3 mr-1" />
                                          Pending
                                        </Badge>
                                      )}
                                      {signer.hasSigned && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {formatDate(signer.signedAt)}
                                        </p>
                                      )}
                                      {signer.hasDisapproved && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {formatDate(signer.disapprovedAt)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {((signer.hasSigned && signer.signatureNote) ||
                                  (signer.hasDisapproved && signer.disapprovalNote)) && (
                                  <CardContent className="p-4 pt-4 border-t">
                                    <div className="flex items-start gap-2">
                                      <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="mb-1 text-sm font-medium">
                                          {signer.hasSigned ? "Approval Comment:" : "Disapproval Reason:"}
                                        </p>
                                        <p className="text-sm">{signer.signatureNote || signer.disapprovalNote}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Enhanced Comments Tab */}
                  <TabsContent value="comments" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" />
                          All Comments & Notes ({getAllComments().length})
                          {(isSelectedManager || activeUser?.roles?.includes("Admin")) && (
                            <Badge variant="outline" className="text-xs">
                              Manager View - All Comments Visible
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Complete timeline of all comments, notes, and feedback from all participants including manager
                          approvals/rejections, user approvals/disapprovals, and relaunch comments
                          {(isSelectedManager || activeUser?.roles?.includes("Admin")) &&
                            " (Manager/Admin view shows all comments including approvals and disapprovals)"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {getAllComments().length === 0 ? (
                            <div className="py-8 text-center">
                              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                              <h3 className="mb-2 text-lg font-medium">No Comments Yet</h3>
                              <p className="text-muted-foreground">
                                Comments and notes from approvals, disapprovals, rejections, and relaunches will appear
                                here.
                              </p>
                            </div>
                          ) : (
                            getAllComments().map((comment, index) => (
                              <Card key={comment.id} className={`border ${comment.borderColor} ${comment.bgColor}`}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${comment.bgColor}`}>{comment.icon}</div>
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs">
                                              {comment.author?.username?.charAt(0).toUpperCase() || "?"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium">
                                            {comment.author?.username || "Unknown User"}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${comment.textColor} ${comment.borderColor} ${comment.bgColor}`}
                                          >
                                            {comment.type.replace("_", " ").toUpperCase()}
                                          </Badge>
                                          {(isSelectedManager || activeUser?.roles?.includes("Admin")) && (
                                            <Badge variant="secondary" className="text-xs">
                                              Visible to Managers
                                            </Badge>
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(comment.timestamp)}
                                        </span>
                                      </div>
                                      <div className="pl-8">
                                        <div className="flex items-start gap-2">
                                          <Quote className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                          <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                                        </div>
                                        {comment.userAction && (
                                          <div className="p-2 mt-2 border rounded bg-muted/50">
                                            <p className="text-xs text-muted-foreground">
                                              <strong>Action:</strong> {comment.userAction.type?.replace("_", " ")}
                                              {comment.userAction.note && (
                                                <>
                                                  <br />
                                                  <strong>Note:</strong> {comment.userAction.note}
                                                </>
                                              )}
                                              {comment.userAction.reason && (
                                                <>
                                                  <br />
                                                  <strong>Reason:</strong> {comment.userAction.reason}
                                                </>
                                              )}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* History Tab */}
                  <TabsContent value="history" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" />
                            Update History ({sharePoint.updateHistory?.length || 0} events)
                          </div>
                          <Button variant="outline" size="sm" onClick={handlePrintHistoryAsPDF}>
                            <Download className="w-4 h-4 mr-2" />
                            Print History as PDF
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent id="history-content">
                        <div className="space-y-4">
                          {sharePoint.updateHistory?.map((event, index) => (
                            <div key={index} className="relative pb-6 pl-6">
                              {index !== sharePoint.updateHistory.length - 1 && (
                                <div className="absolute top-6 bottom-0 left-[11px] w-0.5 bg-border"></div>
                              )}
                              <div className="flex items-start gap-4">
                                <div
                                  className={`absolute left-0 p-1.5 rounded-full ${
                                    event.action === "created" ||
                                    event.action === "signed" ||
                                    event.action === "approved"
                                      ? "bg-emerald-100"
                                      : event.action === "rejected" ||
                                          event.action === "disapproved" ||
                                          event.action === "expired"
                                        ? "bg-red-100"
                                        : "bg-blue-100"
                                  }`}
                                >
                                  {event.action === "created" && <FileText className="w-3 h-3 text-emerald-600" />}
                                  {event.action === "updated" && <Edit className="w-3 h-3 text-blue-600" />}
                                  {event.action === "signed" && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                                  {event.action === "approved" && <Shield className="w-3 h-3 text-emerald-600" />}
                                  {event.action === "rejected" && <XCircle className="w-3 h-3 text-red-600" />}
                                  {event.action === "disapproved" && <AlertTriangle className="w-3 h-3 text-red-600" />}
                                  {event.action === "relaunched" && <RotateCcw className="w-3 h-3 text-blue-600" />}
                                  {event.action === "expired" && <Timer className="w-3 h-3 text-red-600" />}
                                  {event.action === "deadline_extended" && (
                                    <Calendar className="w-3 h-3 text-blue-600" />
                                  )}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium capitalize">{event.action.replace("_", " ")}</p>
                                    <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {event.performedBy?.username || "System"} - {event.details}
                                  </p>
                                  {event.comment && (
                                    <div className="p-3 mt-2 border rounded-lg bg-muted/50">
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                        <div>
                                          <p className="mb-1 text-xs font-medium text-muted-foreground">Comment:</p>
                                          <p className="text-sm">{event.comment}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {event.userAction && (
                                    <div className="p-2 mt-2 border rounded bg-muted/30">
                                      <p className="text-xs text-muted-foreground">
                                        <strong>Action Type:</strong> {event.userAction.type?.replace("_", " ")}
                                        {event.userAction.newDeadline && (
                                          <>
                                            <br />
                                            <strong>New Deadline:</strong> {formatDate(event.userAction.newDeadline)}
                                          </>
                                        )}
                                        {event.userAction.previousDisapprovals &&
                                          event.userAction.previousDisapprovals.length > 0 && (
                                            <>
                                              <br />
                                              <strong>Previous Issues:</strong>{" "}
                                              {event.userAction.previousDisapprovals
                                                .map((d) => `${d.username}: ${d.reason}`)
                                                .join("; ")}
                                            </>
                                          )}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Metadata Tab */}
                  <TabsContent value="metadata" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="w-5 h-5 text-primary" />
                          Technical Metadata
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Database Information</h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Field</TableHead>
                                  <TableHead>Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">Document ID</TableCell>
                                  <TableCell className="font-mono text-sm">{sharePoint._id}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Internal ID</TableCell>
                                  <TableCell className="font-mono text-sm">{sharePoint.approxiDate || "N/A"}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Requester Department</TableCell>
                                  <TableCell>{sharePoint.requesterDepartment || "N/A"}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Created At</TableCell>
                                  <TableCell>{formatDate(sharePoint.createdAt)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Updated At</TableCell>
                                  <TableCell>{formatDate(sharePoint.updatedAt)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Deadline</TableCell>
                                  <TableCell className={isExpired ? "text-red-600 font-medium" : ""}>
                                    {formatDate(sharePoint.deadline)}
                                    {isExpired && " (EXPIRED)"}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Is Expired</TableCell>
                                  <TableCell>
                                    <Badge variant={isExpired ? "destructive" : "default"}>
                                      {isExpired ? "Yes" : "No"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Version</TableCell>
                                  <TableCell>{sharePoint.__v || 0}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Total Comments</TableCell>
                                  <TableCell>{getAllComments().length}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Managers Tab */}
                  <TabsContent value="managers" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          Manager Approval Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card
                            className={`p-4 ${hasManagerApproved ? "bg-emerald-50 border-emerald-200" : isExpired ? "bg-red-50 border-red-200" : "bg-muted border-border"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-full ${hasManagerApproved ? "bg-emerald-100" : isExpired ? "bg-red-100" : "bg-muted"}`}
                              >
                                <Shield
                                  className={`w-5 h-5 ${hasManagerApproved ? "text-emerald-600" : isExpired ? "text-red-600" : "text-muted-foreground"}`}
                                />
                              </div>
                              <div>
                                <h3 className="font-medium">Manager Approval</h3>
                                <p className="text-sm text-muted-foreground">
                                  {hasManagerApproved
                                    ? "Approved"
                                    : isExpired
                                      ? "Expired - Cannot approve"
                                      : "Pending approval"}
                                </p>
                              </div>
                            </div>
                            {hasManagerApproved && sharePoint.approvedBy && (
                              <div className="pt-4 mt-4 border-t">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback>
                                      {sharePoint.approvedBy.username?.charAt(0).toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{sharePoint.approvedBy.username}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(sharePoint.approvedAt)}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {isExpired && !hasManagerApproved && (
                              <div className="pt-4 mt-4 border-t border-red-200">
                                <div className="flex items-center gap-2 text-red-600">
                                  <Timer className="w-4 h-4" />
                                  <p className="text-sm">Document expired before manager approval</p>
                                </div>
                              </div>
                            )}
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>

              {/* Sidebar */}
              <motion.div variants={cardVariants} className="space-y-6">
                {/* Creator Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Created By
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>
                          {sharePoint.createdBy?.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{sharePoint.createdBy?.username}</p>
                        <p className="text-sm text-muted-foreground">{sharePoint.createdBy?.email}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sharePoint.createdBy?.roles?.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Workflow Status Indicator */}
                <WorkflowStatusIndicator sharePoint={sharePoint} onRelaunch={handleRelaunch} />

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">{formatDate(sharePoint.creationDate)}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className={`font-medium ${isExpired ? "text-red-600" : "text-foreground"}`}>
                          {formatDate(sharePoint.deadline)}
                          {isExpired && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              EXPIRED
                            </Badge>
                          )}
                        </span>
                      </div>
                      {hasManagerApproved && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Manager Approved</span>
                            <span className="font-medium">{formatDate(sharePoint.approvedAt)}</span>
                          </div>
                        </>
                      )}
                      {allApproved && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Completed</span>
                            <span className="font-medium text-emerald-600">
                              {formatDate(
                                sharePoint.usersToSign
                                  ?.filter((u) => u.hasSigned)
                                  .sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt))[0]?.signedAt,
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => {
                        navigator.clipboard.writeText(sharePoint.link)
                        toast({
                          title: "Link Copied",
                          description: "SharePoint link has been copied to clipboard.",
                        })
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy SharePoint Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => {
                        navigator.clipboard.writeText(sharePoint._id)
                        toast({
                          title: "ID Copied",
                          description: "Document ID has been copied to clipboard.",
                        })
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Document ID
                    </Button>
                    {sharePoint.approxiDate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => {
                          navigator.clipboard.writeText(sharePoint.approxiDate)
                          toast({
                            title: "Internal ID Copied",
                            description: "Internal ID has been copied to clipboard.",
                          })
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Internal ID
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={handlePrintHistoryAsPDF}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export History
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
