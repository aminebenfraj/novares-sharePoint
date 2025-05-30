"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Edit,
  Trash2,
  PenTool,
  Shield,
  MessageSquare,
  History,
  RefreshCw,
  Loader2,
  ExternalLink,
  Copy,
  Share2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { sharePointAPI } from "../apis/sharePointApi"
import { useUser } from "../context/UserContext"
import ProgressTracker from "../components/ProgressTracker"
import MainLayout from "../components/MainLayout"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function SharePointDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, canApproveDocument, canSignDocument, canEditDocument } = useUser()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isSignModalOpen, setIsSignModalOpen] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signatureData, setSignatureData] = useState({
    signatureNote: "",
  })

  useEffect(() => {
    if (user) {
      fetchDocument()
    }
  }, [id, user])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const response = await sharePointAPI.getDocumentById(id)
      setDocument(response.data)
    } catch (error) {
      console.error("Error fetching document:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load document details.",
      })
      navigate("/sharepoint")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchDocument()
      toast({
        title: "Success",
        description: "Document refreshed successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh document.",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleSignDocument = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await sharePointAPI.signDocument(id, signatureData)
      await fetchDocument()
      setIsSignModalOpen(false)
      setSignatureData({ signatureNote: "" })

      toast({
        title: "Success",
        description: "Document signed successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to sign document.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveDocument = async () => {
    setIsSubmitting(true)

    try {
      await sharePointAPI.approveDocument(id)
      await fetchDocument()
      setIsApproveModalOpen(false)

      toast({
        title: "Success",
        description: "Document approved successfully. Users can now access and sign it.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to approve document.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDocument = async () => {
    if (!window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      return
    }

    try {
      await sharePointAPI.deleteDocument(id)
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      })
      navigate("/sharepoint")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document.",
      })
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Link copied to clipboard.",
    })
  }

  const getStatusBadge = (status, managerApproved) => {
    if (!managerApproved) {
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
          <Clock className="w-3 h-3 mr-1" />
          Pending Manager Approval
        </Badge>
      )
    }

    const statusConfig = {
      pending: { variant: "secondary", icon: Clock, color: "text-yellow-600" },
      in_progress: { variant: "default", icon: Users, color: "text-blue-600" },
      completed: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      expired: { variant: "destructive", icon: AlertTriangle, color: "text-red-600" },
      cancelled: { variant: "outline", icon: AlertTriangle, color: "text-gray-600" },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isDeadlineNear = (deadline) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }

  const getSignatureStatus = (userSignature) => {
    if (userSignature.hasSigned) {
      return (
        <Badge variant="default" className="text-green-600 border-green-200 bg-green-50">
          <CheckCircle className="w-3 h-3 mr-1" />
          Signed
        </Badge>
      )
    }

    if (userSignature.user._id === user._id) {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
          <PenTool className="w-3 h-3 mr-1" />
          Your Turn
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="text-gray-600">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-6xl p-6 mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-10 h-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-[300px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[300px]" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[200px]" />
              <Skeleton className="h-[300px]" />
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!document) {
    return (
      <MainLayout>
        <div className="container max-w-6xl p-6 mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Document Not Found</AlertTitle>
            <AlertDescription>The requested document could not be found.</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl p-6 mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/sharepoint")} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
                <p className="text-muted-foreground">
                  Created {formatDate(document.creationDate)} by {document.createdBy?.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Document Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => copyToClipboard(document.link)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  {canEditDocument(document) && (
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Document
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {canEditDocument(document) && (
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDeleteDocument}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Document
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Status Alert */}
          {!document.managerApproved && (
            <Alert className="border-amber-200 bg-amber-50">
              <Clock className="w-4 h-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Pending Manager Approval</AlertTitle>
              <AlertDescription className="text-amber-700">
                This document is waiting for manager approval before users can access and sign it.
                {canApproveDocument(document) && (
                  <div className="mt-3">
                    <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                          <Shield className="w-4 h-4 mr-2" />
                          Approve Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Approve Document</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to approve this document? Once approved, selected users will be able
                            to access and sign it.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleApproveDocument} disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Deadline Warning */}
          {isDeadlineNear(document.deadline) && document.status !== "completed" && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Deadline Approaching</AlertTitle>
              <AlertDescription>
                This document is due on {formatDate(document.deadline)}. Please ensure all signatures are collected
                before the deadline.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Document Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Document Overview
                    </CardTitle>
                    {getStatusBadge(document.status, document.managerApproved)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">File Location</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm font-medium break-all">{document.link}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => copyToClipboard(document.link)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => window.open(document.link, "_blank")}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Deadline</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p
                            className={`text-sm font-medium ${
                              isDeadlineNear(document.deadline) && document.status !== "completed"
                                ? "text-orange-600"
                                : ""
                            }`}
                          >
                            {formatDate(document.deadline)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Department Approval</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {document.departmentApprover ? "Required" : "Not Required"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="w-6 h-6">
                            <AvatarImage
                              src={document.createdBy?.image || "/placeholder.svg?height=24&width=24"}
                              alt={document.createdBy?.username}
                            />
                            <AvatarFallback className="text-xs">
                              {document.createdBy?.username?.substring(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{document.createdBy?.username}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Signers</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{document.usersToSign?.length || 0} users</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Completion</Label>
                        <div className="mt-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{document.completionPercentage || 0}%</span>
                            <span className="text-xs text-muted-foreground">
                              {document.usersToSign?.filter((user) => user.hasSigned).length || 0} of{" "}
                              {document.usersToSign?.length || 0} signed
                            </span>
                          </div>
                          <Progress value={document.completionPercentage || 0} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {document.comment && (
                    <>
                      <Separator />
                      <div>
                        <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MessageSquare className="w-4 h-4" />
                          Instructions/Comments
                        </Label>
                        <p className="p-3 mt-2 text-sm rounded-lg bg-muted/50">{document.comment}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Signature Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="w-5 h-5" />
                    Signature Progress
                  </CardTitle>
                  <CardDescription>Track the signing progress of all assigned users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {document.usersToSign?.map((userSignature, index) => (
                      <motion.div
                        key={userSignature.user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={userSignature.user.image || "/placeholder.svg?height=40&width=40"}
                              alt={userSignature.user.username}
                            />
                            <AvatarFallback>
                              {userSignature.user.username?.substring(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{userSignature.user.username}</p>
                            <p className="text-sm text-muted-foreground">{userSignature.user.email}</p>
                            {userSignature.hasSigned && userSignature.signedAt && (
                              <p className="text-xs text-green-600">Signed on {formatDate(userSignature.signedAt)}</p>
                            )}
                            {userSignature.signatureNote && (
                              <p className="mt-1 text-xs italic text-muted-foreground">
                                "{userSignature.signatureNote}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSignatureStatus(userSignature)}
                          {!userSignature.hasSigned &&
                            userSignature.user._id === user._id &&
                            document.managerApproved && (
                              <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
                                <DialogTrigger asChild>
                                  <Button size="sm">
                                    <PenTool className="w-4 h-4 mr-2" />
                                    Sign Now
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Sign Document</DialogTitle>
                                    <DialogDescription>
                                      You are about to sign "{document.title}". Please add any comments if needed.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <form onSubmit={handleSignDocument} className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="signatureNote">Signature Note (Optional)</Label>
                                      <Textarea
                                        id="signatureNote"
                                        value={signatureData.signatureNote}
                                        onChange={(e) =>
                                          setSignatureData((prev) => ({ ...prev, signatureNote: e.target.value }))
                                        }
                                        placeholder="Add any comments about your signature..."
                                        rows={3}
                                      />
                                    </div>

                                    <Alert>
                                      <AlertTriangle className="w-4 h-4" />
                                      <AlertDescription>
                                        By signing this document, you confirm that you have reviewed and approve its
                                        contents.
                                      </AlertDescription>
                                    </Alert>

                                    <DialogFooter>
                                      <Button type="button" variant="outline" onClick={() => setIsSignModalOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Signing...
                                          </>
                                        ) : (
                                          <>
                                            <PenTool className="w-4 h-4 mr-2" />
                                            Sign Document
                                          </>
                                        )}
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Tracker */}
              <ProgressTracker document={document} />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="justify-start w-full"
                    onClick={() => window.open(document.link, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open File
                  </Button>
                  <Button variant="outline" className="justify-start w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start w-full"
                    onClick={() => copyToClipboard(document.link)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Separator />
                  {canEditDocument(document) && (
                    <>
                      <Button variant="outline" className="justify-start w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Document
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start w-full text-red-600 hover:text-red-700"
                        onClick={handleDeleteDocument}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Document
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Document Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="w-5 h-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {document.updateHistory?.map((update, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          {index < document.updateHistory.length - 1 && <div className="w-px h-8 mt-2 bg-border" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{update.action.replace("_", " ").toUpperCase()}</p>
                            <Badge variant="outline" className="text-xs">
                              {formatDate(update.timestamp)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{update.details}</p>
                          <p className="text-xs text-muted-foreground">by {update.performedBy?.username || "System"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
