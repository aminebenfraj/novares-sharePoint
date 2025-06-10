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
  Pencil,
  Building,
  FileIcon,
  Database,
  Activity,
  Info,
  UserCheck,
  CalendarDays,
  AlertTriangle,
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
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
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

  // Get ID from props first, then from URL params, then from current location
  const documentId = propId || params.id || window.location.pathname.split("/").pop()

  // Use currentUser prop if provided, otherwise fall back to useAuth
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
      console.error("SharePoint Detail: No valid document ID found", {
        propId,
        paramsId: params?.id,
        pathname: window.location.pathname,
      })
    }
  }, [documentId])

  const loadSharePointDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Loading SharePoint details for ID:", documentId)
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
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending_approval":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="space-y-4 text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
            <h3 className="text-xl font-medium text-gray-700">Loading document details...</h3>
            <p className="text-sm text-gray-500">Document ID: {documentId}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !sharePoint) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <Card className="w-full max-w-md border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-red-600">Error Loading Document</CardTitle>
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
  const canEdit = sharePoint?.createdBy?._id === activeUser?._id || activeUser?.roles?.includes("Admin")

  // Make approval buttons visible for everyone
  const canApprove = sharePoint?.status === "pending_approval" && !sharePoint?.managerApproved

  // Make sign buttons visible for assigned users when manager approved
  const canSign =
    sharePoint?.managerApproved &&
    sharePoint?.usersToSign?.some((signer) => signer.user._id === activeUser?._id && !signer.hasSigned)

  const hasManagerApproved = sharePoint?.managerApproved
  const allSigned = sharePoint?.allUsersSigned
  const hasDepartmentApprover = sharePoint?.departmentApprover

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container p-6 mx-auto max-w-7xl">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
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
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text md:text-4xl">
                    {sharePoint.title}
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Created by {sharePoint.createdBy?.username} on {formatDate(sharePoint.creationDate)}
                  </p>
                  <p className="text-sm text-muted-foreground">Document ID: {sharePoint._id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={getStatusColor(sharePoint.status)}>
                    {getStatusIcon(sharePoint.status)}
                    <span className="ml-1">{sharePoint.status.replace("_", " ").toUpperCase()}</span>
                  </Badge>
                  {isExpired && !allSigned && (
                    <Badge variant="destructive" className="text-xs">
                      <Timer className="w-3 h-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                  {hasManagerApproved && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
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
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
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

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Document Details */}
              <motion.div variants={cardVariants} className="space-y-6 lg:col-span-2">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
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
                    <TabsTrigger value="actions" className="flex items-center gap-1">
                      <Pencil className="w-3 h-3" />
                      Actions
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-6">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
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
                                className={`flex items-center gap-2 p-3 rounded-lg border ${isExpired ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}
                              >
                                <Calendar className="w-4 h-4" />
                                <div>
                                  <p className={`font-medium ${isExpired ? "text-red-600" : ""}`}>
                                    {formatDate(sharePoint.deadline)}
                                  </p>
                                  {isExpired && <p className="text-xs text-red-500">This deadline has passed</p>}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Creation Date</h3>
                              <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <CalendarDays className="w-4 h-4" />
                                <p className="font-medium">{formatDate(sharePoint.creationDate)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Status Information</h3>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                                  <span className="text-sm">Current Status</span>
                                  <Badge className={getStatusColor(sharePoint.status)}>
                                    {getStatusIcon(sharePoint.status)}
                                    <span className="ml-1">{sharePoint.status.replace("_", " ").toUpperCase()}</span>
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
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
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
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
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                                  <span className="text-sm">Department Approved</span>
                                  <Badge variant={hasDepartmentApprover ? "default" : "secondary"}>
                                    {hasDepartmentApprover ? (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                      <Clock className="w-3 h-3 mr-1" />
                                    )}
                                    {hasDepartmentApprover ? "Yes" : "Pending"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {sharePoint.comment && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Comments</h3>
                            <div className="p-4 border rounded-lg bg-slate-50">
                              <p className="text-sm whitespace-pre-wrap">{sharePoint.comment}</p>
                            </div>
                          </div>
                        )}

                        {/* File Metadata */}
                        {sharePoint.fileMetadata && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">File Information</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="p-4 border rounded-lg bg-slate-50">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileIcon className="w-4 h-4" />
                                  <span className="font-medium">File Details</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-muted-foreground">Name:</span>{" "}
                                    {sharePoint.fileMetadata.fileName || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">Size:</span>{" "}
                                    {formatFileSize(sharePoint.fileMetadata.fileSize)}
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">Type:</span>{" "}
                                    {sharePoint.fileMetadata.fileType || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">Last Modified:</span>{" "}
                                    {formatDate(sharePoint.fileMetadata.lastModified)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Signers Tab */}
                  <TabsContent value="signers" className="mt-6">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          Signature Details ({sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/
                          {sharePoint.usersToSign?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sharePoint.usersToSign?.map((signer, index) => (
                            <Card key={signer.user._id} className="overflow-hidden border">
                              <div
                                className={`flex items-center justify-between p-4 ${
                                  signer.hasSigned ? "bg-green-50" : "bg-gray-50"
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
                                      <Badge className="text-green-800 bg-green-100 border-green-200">
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
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <History className="w-5 h-5 text-blue-600" />
                          Update History ({sharePoint.updateHistory?.length || 0} events)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sharePoint.updateHistory?.map((event, index) => (
                            <div key={index} className="relative pb-6 pl-6">
                              {index !== sharePoint.updateHistory.length - 1 && (
                                <div className="absolute top-6 bottom-0 left-[11px] w-0.5 bg-gray-200"></div>
                              )}
                              <div className="flex items-start gap-4">
                                <div
                                  className={`absolute left-0 p-1.5 rounded-full ${
                                    event.action === "created" ||
                                    event.action === "signed" ||
                                    event.action === "approved"
                                      ? "bg-green-100"
                                      : event.action === "rejected"
                                        ? "bg-red-100"
                                        : "bg-blue-100"
                                  }`}
                                >
                                  {event.action === "created" && <FileText className="w-3 h-3 text-green-600" />}
                                  {event.action === "updated" && <Edit className="w-3 h-3 text-blue-600" />}
                                  {event.action === "signed" && <CheckCircle className="w-3 h-3 text-green-600" />}
                                  {event.action === "approved" && <Shield className="w-3 h-3 text-green-600" />}
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
                                  {event.previousValues && (
                                    <details className="mt-2">
                                      <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                                        View previous values
                                      </summary>
                                      <div className="p-2 mt-2 text-xs rounded bg-gray-50">
                                        <pre className="whitespace-pre-wrap">
                                          {JSON.stringify(event.previousValues, null, 2)}
                                        </pre>
                                      </div>
                                    </details>
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
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-600" />
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

                          <div>
                            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Computed Properties</h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Property</TableHead>
                                  <TableHead>Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">All Users Signed</TableCell>
                                  <TableCell>
                                    <Badge variant={allSigned ? "default" : "secondary"}>
                                      {allSigned ? "True" : "False"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Completion Percentage</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Progress value={completionPercentage} className="w-20 h-2" />
                                      <span className="text-sm font-medium">{completionPercentage}%</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Is Expired</TableCell>
                                  <TableCell>
                                    <Badge variant={isExpired ? "destructive" : "secondary"}>
                                      {isExpired ? "True" : "False"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>

                          <div>
                            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Raw Document Data</h3>
                            <details className="border rounded-lg">
                              <summary className="p-3 cursor-pointer hover:bg-gray-50">
                                View complete document JSON
                              </summary>
                              <div className="p-3 border-t bg-gray-50">
                                <pre className="overflow-auto text-xs max-h-96">
                                  {JSON.stringify(sharePoint, null, 2)}
                                </pre>
                              </div>
                            </details>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Approvals Tab */}
                  <TabsContent value="approvals" className="mt-6">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          Approval Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card
                            className={`p-4 ${hasManagerApproved ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-full ${hasManagerApproved ? "bg-green-100" : "bg-gray-100"}`}
                              >
                                <Shield
                                  className={`w-5 h-5 ${hasManagerApproved ? "text-green-600" : "text-gray-400"}`}
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

                          <Card
                            className={`p-4 ${hasDepartmentApprover ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-full ${hasDepartmentApprover ? "bg-blue-100" : "bg-gray-100"}`}
                              >
                                <Building
                                  className={`w-5 h-5 ${hasDepartmentApprover ? "text-blue-600" : "text-gray-400"}`}
                                />
                              </div>
                              <div>
                                <h3 className="font-medium">Department Approval</h3>
                                <p className="text-sm text-muted-foreground">
                                  {hasDepartmentApprover ? "Approved" : "Pending approval"}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>

                        <div>
                          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Approval Requirements</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                              <span className="text-sm">All signatures collected</span>
                              <Badge variant={allSigned ? "default" : "secondary"}>
                                {allSigned ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <Clock className="w-3 h-3 mr-1" />
                                )}
                                {allSigned ? "Complete" : "Pending"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                              <span className="text-sm">Manager approval</span>
                              <Badge variant={hasManagerApproved ? "default" : "secondary"}>
                                {hasManagerApproved ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <Clock className="w-3 h-3 mr-1" />
                                )}
                                {hasManagerApproved ? "Approved" : "Pending"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                              <span className="text-sm">Department approval</span>
                              <Badge variant={hasDepartmentApprover ? "default" : "secondary"}>
                                {hasDepartmentApprover ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <Clock className="w-3 h-3 mr-1" />
                                )}
                                {hasDepartmentApprover ? "Approved" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Actions Tab */}
                  <TabsContent value="actions" className="mt-6">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          Available Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {canSign && (
                            <div className="space-y-2">
                              <h3 className="font-medium">Sign Document</h3>
                              <p className="text-sm text-muted-foreground">
                                You are required to sign this document. Click the button below to proceed.
                              </p>
                              <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
                                <DialogTrigger asChild>
                                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
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

                          {/* Show message when manager approval is required */}
                          {sharePoint?.usersToSign?.some((signer) => signer.user._id === activeUser?._id) &&
                            !sharePoint?.managerApproved && (
                              <div className="space-y-2">
                                <h3 className="font-medium">Signature Required</h3>
                                <Alert className="border-orange-200 bg-orange-50">
                                  <Shield className="w-4 h-4 text-orange-600" />
                                  <AlertTitle>Manager Approval Required</AlertTitle>
                                  <AlertDescription>
                                    This document must be approved by a manager before you can sign it. You will be
                                    notified once approval is granted.
                                  </AlertDescription>
                                </Alert>
                              </div>
                            )}

                          {canApprove && (
                            <div className="space-y-2">
                              <h3 className="font-medium">Manager Approval Required</h3>
                              <p className="text-sm text-muted-foreground">
                                This document is waiting for manager approval. Once approved, assigned users can sign
                                it.
                              </p>
                              <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                                <DialogTrigger asChild>
                                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Review & Approve
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Manager Approval</DialogTitle>
                                    <DialogDescription>
                                      You are about to review "{sharePoint.title}". Please approve or reject this
                                      document.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => setShowApproveDialog(false)}
                                      disabled={isSubmitting}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleApprove(false)}
                                      disabled={isSubmitting}
                                    >
                                      {isSubmitting ? "Processing..." : "Reject"}
                                    </Button>
                                    <Button
                                      variant="default"
                                      onClick={() => handleApprove(true)}
                                      disabled={isSubmitting}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {isSubmitting ? "Processing..." : "Approve"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}

                          {/* Sign buttons for assigned users after manager approval */}
                          {hasManagerApproved && (
                            <div className="space-y-4">
                              <h3 className="font-medium">Document Approved by Manager</h3>
                              <Alert className="border-green-200 bg-green-50">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <AlertTitle>Document Approved</AlertTitle>
                                <AlertDescription>
                                  This document has been approved by {sharePoint.approvedBy?.username || "a manager"} on{" "}
                                  {formatDate(sharePoint.approvedAt)}.
                                </AlertDescription>
                              </Alert>

                              {/* Show sign button for current user if they're assigned and haven't signed yet */}
                              {sharePoint?.usersToSign?.some(
                                (signer) => signer.user._id === activeUser?._id && !signer.hasSigned,
                              ) ? (
                                <div className="mt-4 space-y-2">
                                  <h3 className="font-medium">Your Signature Required</h3>
                                  <p className="text-sm text-muted-foreground">
                                    You are assigned to sign this document. Please review and sign it.
                                  </p>
                                  <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
                                    <DialogTrigger asChild>
                                      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Sign Document Now
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
                                        <div className="p-4 border rounded-lg bg-blue-50">
                                          <h4 className="mb-2 font-medium">Document Information</h4>
                                          <div className="space-y-1 text-sm">
                                            <p>
                                              <span className="font-medium">Title:</span> {sharePoint.title}
                                            </p>
                                            <p>
                                              <span className="font-medium">Created by:</span>{" "}
                                              {sharePoint.createdBy?.username}
                                            </p>
                                            <p>
                                              <span className="font-medium">Deadline:</span>{" "}
                                              {formatDate(sharePoint.deadline)}
                                            </p>
                                            <p>
                                              <span className="font-medium">Approved by:</span>{" "}
                                              {sharePoint.approvedBy?.username}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <h4 className="text-sm font-medium">Add a signature note (optional)</h4>
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
                              ) : sharePoint?.usersToSign?.some(
                                  (signer) => signer.user._id === activeUser?._id && signer.hasSigned,
                                ) ? (
                                <div className="mt-4">
                                  <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <AlertTitle>Document Signed</AlertTitle>
                                    <AlertDescription>You have already signed this document.</AlertDescription>
                                  </Alert>
                                </div>
                              ) : (
                                <div className="mt-4">
                                  <Alert className="border-blue-200 bg-blue-50">
                                    <Info className="w-4 h-4 text-blue-600" />
                                    <AlertTitle>Signatures in Progress</AlertTitle>
                                    <AlertDescription>
                                      This document is approved and waiting for signatures from assigned users.
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              )}

                              {/* List of assigned users and their signature status */}
                              <div className="mt-6">
                                <h3 className="mb-3 font-medium">Assigned Signers</h3>
                                <div className="space-y-2">
                                  {sharePoint.usersToSign?.map((signer) => (
                                    <div
                                      key={signer.user._id}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${
                                        signer.hasSigned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                          <AvatarImage src={signer.user.image || "/placeholder.svg"} />
                                          <AvatarFallback>
                                            {signer.user.username?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">{signer.user.username}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {signer.user._id === activeUser?._id ? "(You)" : ""}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge
                                        className={
                                          signer.hasSigned
                                            ? "bg-green-100 text-green-800 border-green-200"
                                            : "bg-amber-100 text-amber-800 border-amber-200"
                                        }
                                      >
                                        {signer.hasSigned ? (
                                          <>
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Signed
                                          </>
                                        ) : (
                                          <>
                                            <Clock className="w-3 h-3 mr-1" />
                                            Pending
                                          </>
                                        )}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Show approval buttons for managers when document is pending approval */}
                          {canApprove && (
                            <div className="space-y-2">
                              <h3 className="font-medium">Manager Approval Required</h3>
                              <p className="text-sm text-muted-foreground">
                                This document is waiting for manager approval. Once approved, assigned users can sign
                                it.
                              </p>
                              <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                                <DialogTrigger asChild>
                                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Review & Approve
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Manager Approval</DialogTitle>
                                    <DialogDescription>
                                      You are about to review "{sharePoint.title}". Please approve or reject this
                                      document.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => setShowApproveDialog(false)}
                                      disabled={isSubmitting}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleApprove(false)}
                                      disabled={isSubmitting}
                                    >
                                      {isSubmitting ? "Processing..." : "Reject"}
                                    </Button>
                                    <Button
                                      variant="default"
                                      onClick={() => handleApprove(true)}
                                      disabled={isSubmitting}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {isSubmitting ? "Processing..." : "Approve"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}

                          {/* Show message when no actions are available */}
                          {!hasManagerApproved &&
                            !canApprove &&
                            !sharePoint?.usersToSign?.some((signer) => signer.user._id === activeUser?._id) && (
                              <div className="p-4 text-center border rounded-lg bg-slate-50">
                                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-muted-foreground">No actions available for you at this time.</p>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>

              {/* Sidebar */}
              <motion.div variants={cardVariants} className="space-y-6">
                {/* Creator Information */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
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
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
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
                          <p className="font-medium text-green-600">{formatDate(sharePoint.approvedAt)}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(sharePoint.status)}>
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
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600" />
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
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        Approval
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
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
