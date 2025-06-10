"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileText,
  Calendar,
  Clock,
  Users,
  ExternalLink,
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
  Building,
  Database,
  Info,
  UserCheck,
  CalendarDays,
  Download,
  Settings,
} from "lucide-react"
import { getSharePointById, signSharePoint, approveSharePoint, deleteSharePoint } from "../apis/sharePointApi"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "../context/AuthContext"
import MainLayout from "../components/MainLayout"
import WorkflowStatusIndicator from "../components/workflow-status-indicator"

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

export default function SharePointDetail({
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
  const [signatureNote, setSignatureNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSignDialog, setShowSignDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  const handleSign = async () => {
    try {
      setIsSubmitting(true)
      await signSharePoint(documentId, signatureNote)
      toast({
        title: "Document Signed",
        description: "You have successfully signed this document.",
      })
      loadSharePointDetails()
      setShowSignDialog(false)
      setSignatureNote("")
    } catch (err) {
      console.error("Error signing document:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign the document. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async (approved) => {
    try {
      setIsSubmitting(true)
      await approveSharePoint(documentId, approved)
      toast({
        title: approved ? "Document Approved" : "Document Rejected",
        description: approved ? "You have successfully approved this document." : "You have rejected this document.",
      })
      loadSharePointDetails()
      setShowApproveDialog(false)
    } catch (err) {
      console.error("Error approving/rejecting document:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process approval. Please try again.",
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

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
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
                <Button onClick={loadSharePointDetails} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const isExpired = sharePoint && new Date(sharePoint.deadline) < new Date()
  const completionPercentage = sharePoint?.completionPercentage || 0
  const canEdit = sharePoint?.createdBy?.license === activeUser?.license || activeUser?.roles?.includes("Admin")
  const canApprove =
    user?.roles?.includes("Admin") && sharePoint?.status === "pending_approval" && !sharePoint?.managerApproved
  const hasManagerApproved = sharePoint?.managerApproved
  const allSigned = sharePoint?.allUsersSigned

  const hasDepartmentApprover = sharePoint?.departmentApprover

  // More robust user matching using license instead of _id
  const currentUserLicense = activeUser?.license || user?.license
  const currentUserUsername = activeUser?.username || user?.username
  const currentUserId = activeUser?._id || user?._id

  console.log("Current user info:", { currentUserLicense, currentUserUsername, currentUserId })
  console.log(
    "Users to sign:",
    sharePoint?.usersToSign?.map((s) => ({
      userId: s.user._id,
      username: s.user.username,
      email: s.user.email,
      hasSigned: s.hasSigned,
    })),
  )

  // Find the current user in the signers list using multiple criteria
  const userSigner = sharePoint?.usersToSign?.find((signer) => {
    // Try matching by username first (most reliable)
    if (currentUserUsername && signer.user.username === currentUserUsername) {
      console.log(`✅ Found user by username: ${currentUserUsername}`)
      return true
    }

    // Try matching by user ID
    if (currentUserId && signer.user._id === currentUserId) {
      console.log(`✅ Found user by ID: ${currentUserId}`)
      return true
    }

    // Try matching by license if available
    if (currentUserLicense && signer.user.license === currentUserLicense) {
      console.log(`✅ Found user by license: ${currentUserLicense}`)
      return true
    }

    return false
  })

  const canSign = sharePoint?.managerApproved && userSigner && !userSigner.hasSigned

  console.log("User signer found:", userSigner)
  console.log("Manager approved:", sharePoint?.managerApproved)
  console.log("Can sign:", canSign)

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
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSubmitting}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? "Deleting..." : "Delete Document"}
                          </Button>
                        </div>
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
                  <p className="font-mono text-sm text-muted-foreground">ID: {sharePoint._id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(sharePoint.status)} variant="outline">
                    {getStatusIcon(sharePoint.status)}
                    <span className="ml-1">{sharePoint.status.replace("_", " ").toUpperCase()}</span>
                  </Badge>
                  {isExpired && !allSigned && (
                    <Badge variant="destructive">
                      <Timer className="w-3 h-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                  {hasManagerApproved && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                      <Shield className="w-3 h-3 mr-1" />
                      Manager Approved
                    </Badge>
                  )}
                  {hasDepartmentApprover && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      <Building className="w-3 h-3 mr-1" />
                      Department Approved
                    </Badge>
                  )}
                  {allSigned && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                      <UserCheck className="w-3 h-3 mr-1" />
                      All Signed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Signature Progress</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0} of{" "}
                    {sharePoint.usersToSign?.length || 0} signed
                  </span>
                  <span>
                    {sharePoint.usersToSign?.length - (sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0)}{" "}
                    remaining
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            {(canApprove ||
              canSign ||
              (sharePoint?.managerApproved &&
                sharePoint?.usersToSign?.some(
                  (signer) => signer.user.license === activeUser?.license && !signer.hasSigned,
                ))) && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      {/* Manager Approval Buttons - Only show if document needs manager approval */}
                      {canApprove && (
                        <div className="flex flex-1 gap-2">
                          <Dialog>
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
                                  to sign the document.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" disabled={isSubmitting}>
                                  Cancel
                                </Button>
                                <Button onClick={() => handleApprove(true)} disabled={isSubmitting}>
                                  {isSubmitting ? "Approving..." : "Approve"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" className="flex-1">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Document
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Document</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to reject "{sharePoint.title}"? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" disabled={isSubmitting}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleApprove(false)}
                                  disabled={isSubmitting}
                                  variant="destructive"
                                >
                                  {isSubmitting ? "Rejecting..." : "Reject"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {/* User Signature Button - Show if user is assigned and manager has approved */}
                      {(canSign ||
                        (sharePoint?.managerApproved &&
                          sharePoint?.usersToSign?.some(
                            (signer) => signer.user.license === activeUser?.license && !signer.hasSigned,
                          ))) && (
                        <div className="flex-1">
                          <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
                            <DialogTrigger asChild>
                              <Button className="w-full" size="lg">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Sign Document
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Sign Document</DialogTitle>
                                <DialogDescription>
                                  You are about to sign "{sharePoint.title}". This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 space-y-4">
                                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">Manager Approved</span>
                                  </div>
                                  <p className="text-xs text-blue-600">
                                    This document has been approved by the manager and is ready for your signature.
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Add a note (optional)</h4>
                                  <Textarea
                                    placeholder="Add any comments or notes about your signature..."
                                    value={signatureNote}
                                    onChange={(e) => setSignatureNote(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowSignDialog(false)}
                                    disabled={isSubmitting}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleSign} disabled={isSubmitting}>
                                    {isSubmitting ? "Signing..." : "Confirm Signature"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>

                    {/* Status Information */}
                    <div className="p-3 mt-4 rounded-lg bg-muted">
                      <div className="flex items-center justify-between text-sm">
                        <span>Document Status:</span>
                        <div className="flex items-center gap-2">
                          {sharePoint.managerApproved ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                              <Shield className="w-3 h-3 mr-1" />
                              Manager Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                              <Clock className="w-3 h-3 mr-1" />
                              Awaiting Approval
                            </Badge>
                          )}
                          {sharePoint.allUsersSigned ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                              <UserCheck className="w-3 h-3 mr-1" />
                              All Signed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              <Users className="w-3 h-3 mr-1" />
                              Awaiting Signatures
                            </Badge>
                          )}
                        </div>
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
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview" className="flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="signers" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Signers
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-1">
                      <History className="w-3 h-3" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="metadata" className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      Metadata
                    </TabsTrigger>
                    <TabsTrigger value="approvals" className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Approvals
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
                              <Button variant="outline" size="sm" asChild className="w-full">
                                <a
                                  href={sharePoint.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Open Document
                                </a>
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
                                  <span className="text-sm">All Users Signed</span>
                                  <Badge variant={allSigned ? "default" : "secondary"}>
                                    {allSigned ? (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                      <Clock className="w-3 h-3 mr-1" />
                                    )}
                                    {allSigned ? "Yes" : "No"}
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
                              </div>
                            </div>
                          </div>
                        </div>

                        {sharePoint.comment && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Comments</h3>
                            <div className="p-4 border rounded-lg bg-muted">
                              <p className="text-sm whitespace-pre-wrap">{sharePoint.comment}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Signers Tab */}
                  <TabsContent value="signers" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          Signature Details ({sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/
                          {sharePoint.usersToSign?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sharePoint.usersToSign?.map((signer, index) => (
                            <Card key={signer.user._id} className="overflow-hidden">
                              <div
                                className={`flex items-center justify-between p-4 ${
                                  signer.hasSigned ? "bg-emerald-50" : "bg-muted"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={signer.user.image || "/placeholder.svg"} />
                                    <AvatarFallback>{signer.user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{signer.user.username}</p>
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
                                        Signed
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Pending
                                      </Badge>
                                    )}
                                    {signer.hasSigned && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {formatDate(signer.signedAt)}
                                      </p>
                                    )}
                                    {signer.hasSigned && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {formatDate(signer.signedAt)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {signer.hasSigned && signer.signatureNote && (
                                <CardContent className="p-4 pt-4 border-t">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                      <p className="mb-1 text-sm font-medium">Signature Note:</p>
                                      <p className="text-sm">{signer.signatureNote}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* History Tab */}
                  <TabsContent value="history" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <History className="w-5 h-5 text-primary" />
                          Update History ({sharePoint.updateHistory?.length || 0} events)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
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
                                      : event.action === "rejected"
                                        ? "bg-red-100"
                                        : "bg-blue-100"
                                  }`}
                                >
                                  {event.action === "created" && <FileText className="w-3 h-3 text-emerald-600" />}
                                  {event.action === "updated" && <Edit className="w-3 h-3 text-blue-600" />}
                                  {event.action === "signed" && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                                  {event.action === "approved" && <Shield className="w-3 h-3 text-emerald-600" />}
                                  {event.action === "rejected" && <XCircle className="w-3 h-3 text-red-600" />}
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
                                    {event.performedBy?.username || "Unknown user"} - {event.details}
                                  </p>
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
                                  <TableCell className="font-medium">Created At</TableCell>
                                  <TableCell>{formatDate(sharePoint.createdAt)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Updated At</TableCell>
                                  <TableCell>{formatDate(sharePoint.updatedAt)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Version</TableCell>
                                  <TableCell>{sharePoint.__v || 0}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Approvals Tab */}
                  <TabsContent value="approvals" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          Approval Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card
                            className={`p-4 ${hasManagerApproved ? "bg-emerald-50 border-emerald-200" : "bg-muted border-border"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${hasManagerApproved ? "bg-emerald-100" : "bg-muted"}`}>
                                <Shield
                                  className={`w-5 h-5 ${hasManagerApproved ? "text-emerald-600" : "text-muted-foreground"}`}
                                />
                              </div>
                              <div>
                                <h3 className="font-medium">Manager Approval</h3>
                                <p className="text-sm text-muted-foreground">
                                  {hasManagerApproved ? "Approved" : "Pending approval"}
                                </p>
                              </div>
                            </div>
                            {hasManagerApproved && sharePoint.approvedBy && (
                              <div className="pt-4 mt-4 border-t">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={sharePoint.approvedBy.image || "/placeholder.svg"} />
                                    <AvatarFallback>
                                      {sharePoint.approvedBy.username?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{sharePoint.approvedBy.username}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(sharePoint.approvedAt)}</p>
                                  </div>
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
                        <AvatarImage src={sharePoint.createdBy?.image || "/placeholder.svg"} />
                        <AvatarFallback>{sharePoint.createdBy?.username?.charAt(0).toUpperCase()}</AvatarFallback>
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
                <WorkflowStatusIndicator sharePoint={sharePoint} />

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDate(sharePoint.creationDate)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">{formatDate(sharePoint.updatedAt)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Deadline</p>
                        <p className={`font-medium ${isExpired ? "text-red-600" : ""}`}>
                          {formatDate(sharePoint.deadline)}
                        </p>
                      </div>
                      {sharePoint.approvedAt && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Approved</p>
                          <p className="font-medium text-emerald-600">{formatDate(sharePoint.approvedAt)}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(sharePoint.status)} variant="outline">
                          {getStatusIcon(sharePoint.status)}
                          <span className="ml-1">{sharePoint.status.replace("_", " ").toUpperCase()}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Completion</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                      </div>
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
                  <CardContent className="space-y-3">
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <a
                        href={sharePoint.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Document
                      </a>
                    </Button>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={handleEdit} className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Document
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Print Details
                    </Button>
                  </CardContent>
                </Card>

                {/* Approval Status */}
                {sharePoint.approvedBy && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        Approval
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg border-emerald-200 bg-emerald-50">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <p className="font-medium">Approved</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={sharePoint.approvedBy.image || "/placeholder.svg"} />
                              <AvatarFallback>{sharePoint.approvedBy.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{sharePoint.approvedBy.username}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(sharePoint.approvedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
