"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Calendar,
  Clock,
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  ExternalLink,
  RefreshCw,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Shield,
  CheckCircle,
  Activity,
} from "lucide-react"
import {
  getAllSharePoints,
  getMyAssignedSharePoints,
  getMyCreatedSharePoints,
  deleteSharePoint,
  approveSharePoint,
  signSharePoint,
} from "../apis/sharePointApi"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "../context/AuthContext"
import MainLayout from "../components/MainLayout"
import { getCurrentUser } from "../apis/auth"

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
  hover: {
    y: -2,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
}

export default function SharePointShow() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [sharePoints, setSharePoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  // Add a new function to get documents assigned to the current user for approval
  const [viewFilter, setViewFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [viewMode, setViewMode] = useState("grid")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  const [currentUserInfo, setCurrentUserInfo] = useState(null)

  // Navigation handlers
  const handleViewDetail = (id) => {
    navigate(`/sharepoint/${id}`)
  }

  const handleCreateNew = () => {
    navigate("/sharepoint/create")
  }

  const handleEdit = (id) => {
    navigate(`/sharepoint/${id}/edit`)
  }

  useEffect(() => {
    loadSharePoints()
  }, [viewFilter, statusFilter, sortBy, sortOrder, pagination.currentPage])

  // Add this useEffect after the existing useEffect for loadSharePoints
  useEffect(() => {
    // Fetch current user information
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

  // Update the loadSharePoints function to handle the new filter
  const loadSharePoints = async () => {
    try {
      setLoading(true)
      let response

      const filters = {
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: pagination.currentPage,
        limit: 12,
      }

      switch (viewFilter) {
        case "assigned":
          response = await getMyAssignedSharePoints(filters)
          break
        case "created":
          response = await getMyCreatedSharePoints(filters)
          break
        case "to_approve":
          // This will use the updated backend filter that includes managersToApprove
          response = await getAllSharePoints({ ...filters, needsManagerApproval: true })
          break
        default:
          response = await getAllSharePoints(filters)
      }

      setSharePoints(response.sharePoints || [])
      setPagination(response.pagination || pagination)
    } catch (error) {
      console.error("Error loading SharePoints:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load SharePoint documents.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this SharePoint document?")) {
      return
    }

    try {
      await deleteSharePoint(id)
      toast({
        title: "Document Deleted",
        description: "SharePoint document has been deleted successfully.",
      })
      loadSharePoints()
    } catch (error) {
      console.error("Error deleting SharePoint:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the document.",
      })
    }
  }

  const handleApprove = async (id, approved) => {
    try {
      setIsSubmitting(true)
      await approveSharePoint(id, approved)
      toast({
        title: approved ? "Document Approved" : "Document Rejected",
        description: approved ? "Document has been approved successfully." : "Document has been rejected.",
      })
      loadSharePoints()
    } catch (error) {
      console.error("Error approving document:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process approval.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickSign = async (id) => {
    try {
      setIsSubmitting(true)
      await signSharePoint(id, "")
      toast({
        title: "Document Signed",
        description: "You have successfully signed this document.",
      })
      loadSharePoints()
    } catch (error) {
      console.error("Error signing document:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign the document.",
      })
    } finally {
      setIsSubmitting(false)
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
        return <CheckCircle2 className="w-3 h-3" />
      case "in_progress":
        return <Clock className="w-3 h-3" />
      case "pending":
        return <AlertCircle className="w-3 h-3" />
      case "pending_approval":
        return <Shield className="w-3 h-3" />
      case "expired":
        return <Timer className="w-3 h-3" />
      case "cancelled":
        return <XCircle className="w-3 h-3" />
      case "rejected":
        return <XCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const filteredSharePoints = sharePoints.filter(
    (sp) =>
      sp?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp?.createdBy?.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const SharePointCard = ({ sharePoint }) => {
    if (!sharePoint) return null

    const isExpired = sharePoint.deadline && new Date(sharePoint.deadline) < new Date()
    const completionPercentage = sharePoint.completionPercentage || 0
    const canEdit = sharePoint.createdBy?._id === currentUser?._id || currentUser?.roles?.includes("Admin")

    // Check if current user is in the managersToApprove array and document needs approval
    const canApprove =
      sharePoint?.managersToApprove?.some((managerId) => {
        // Convert both to strings for comparison
        const managerIdStr = String(managerId)

        // Use currentUserInfo if available, otherwise fall back to currentUser
        const userIdStr = currentUserInfo ? String(currentUserInfo._id) : String(currentUser?._id)
        const userLicenseStr = currentUserInfo ? String(currentUserInfo.license) : String(currentUser?.license)

        // Check if manager ID matches either user ID or license
        return managerIdStr === userIdStr || managerIdStr === userLicenseStr
      }) &&
      sharePoint?.status === "pending_approval" &&
      !sharePoint?.managerApproved

    // Log for debugging
    if (sharePoint?.status === "pending_approval" && !sharePoint?.managerApproved) {
      console.log("Document needs approval:", sharePoint.title)
      console.log("Current user ID:", currentUser?._id)
      console.log("Current user license:", currentUser?.license)
      console.log("Managers to approve:", sharePoint?.managersToApprove)
      console.log("Can approve:", canApprove)
    }

    const canSign =
      sharePoint?.managerApproved &&
      sharePoint?.usersToSign?.some((signer) => signer.user?._id === currentUser?._id && !signer.hasSigned)

    return (
      <motion.div variants={cardVariants} whileHover="hover" layout>
        <Card className="h-full transition-all duration-200 hover:shadow-md border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold truncate text-foreground">{sharePoint.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  by {sharePoint.createdBy?.username}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleViewDetail(sharePoint._id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={sharePoint.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Document
                    </a>
                  </DropdownMenuItem>
                  {canEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(sharePoint._id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(sharePoint._id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(sharePoint.status)} variant="outline">
                {getStatusIcon(sharePoint.status)}
                <span className="ml-1">{sharePoint.status?.replace("_", " ").toUpperCase()}</span>
              </Badge>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  <Timer className="w-3 h-3 mr-1" />
                  Expired
                </Badge>
              )}
              {sharePoint.managerApproved && (
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                  <Shield className="w-3 h-3 mr-1" />
                  Approved
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Deadline</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className={isExpired ? "text-red-600 font-medium" : "text-foreground"}>
                    {sharePoint.deadline ? new Date(sharePoint.deadline).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Signers</p>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">
                    {sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/
                    {sharePoint.usersToSign?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {sharePoint.usersToSign?.slice(0, 3).map((signer, index) => {
                  if (!signer?.user) return null

                  return (
                    <TooltipProvider key={signer.user._id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="w-6 h-6 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {signer.user.username?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{signer.user.username || "Unknown User"}</p>
                          <p className="text-xs">{signer.hasSigned ? "Signed" : "Pending"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
                {sharePoint.usersToSign?.length > 3 && (
                  <div className="flex items-center justify-center w-6 h-6 border-2 rounded-full bg-muted border-background">
                    <span className="text-xs text-muted-foreground">+{sharePoint.usersToSign.length - 3}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              {canApprove && (
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex-1">
                        <Shield className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approve Document</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to approve "{sharePoint.title}"? This will allow assigned users to sign
                          the document.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" disabled={isSubmitting}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleApprove(sharePoint._id, true)} disabled={isSubmitting}>
                          {isSubmitting ? "Approving..." : "Approve"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="flex-1">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
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
                          onClick={() => handleApprove(sharePoint._id, false)}
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

              {canSign && (
                <Button
                  size="sm"
                  onClick={() => handleQuickSign(sharePoint._id)}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Signing..." : "Quick Sign"}
                </Button>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewDetail(sharePoint._id)} className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={sharePoint.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const SharePointListItem = ({ sharePoint }) => {
    if (!sharePoint) return null

    const isExpired = sharePoint.deadline && new Date(sharePoint.deadline) < new Date()
    const completionPercentage = sharePoint.completionPercentage || 0
    const canEdit = sharePoint.createdBy?._id === currentUser?._id || currentUser?.roles?.includes("Admin")
    const canApprove =
      sharePoint?.managersToApprove?.some((managerId) => {
        // Convert both to strings for comparison
        const managerIdStr = String(managerId)

        // Use currentUserInfo if available, otherwise fall back to currentUser
        const userIdStr = currentUserInfo ? String(currentUserInfo._id) : String(currentUser?._id)
        const userLicenseStr = currentUserInfo ? String(currentUserInfo.license) : String(currentUser?.license)

        // Check if manager ID matches either user ID or license
        return managerIdStr === userIdStr || managerIdStr === userLicenseStr
      }) &&
      sharePoint?.status === "pending_approval" &&
      !sharePoint?.managerApproved
    const canSign =
      sharePoint?.managerApproved &&
      sharePoint?.usersToSign?.some((signer) => signer.user?._id === currentUser?._id && !signer.hasSigned)

    return (
      <motion.div variants={itemVariants}>
        <Card className="transition-all duration-200 hover:shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0 gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-foreground">{sharePoint.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {sharePoint.createdBy?.username} •{" "}
                    {sharePoint.creationDate ? new Date(sharePoint.creationDate).toLocaleDateString() : "N/A"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(sharePoint.status)} variant="outline">
                      {getStatusIcon(sharePoint.status)}
                      <span className="ml-1">{sharePoint.status?.replace("_", " ").toUpperCase()}</span>
                    </Badge>
                    {sharePoint.managerApproved && (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                        <Shield className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">{completionPercentage}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>

                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">
                    {sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/
                    {sharePoint.usersToSign?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Signed</div>
                </div>

                <div className="text-center min-w-[80px]">
                  <div className={`text-sm font-medium ${isExpired ? "text-red-600" : "text-foreground"}`}>
                    {sharePoint.deadline ? new Date(sharePoint.deadline).toLocaleDateString() : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">Deadline</div>
                </div>

                <div className="flex items-center gap-2">
                  {canApprove && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Shield className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Document</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to approve "{sharePoint.title}"?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" disabled={isSubmitting}>
                              Cancel
                            </Button>
                            <Button onClick={() => handleApprove(sharePoint._id, true)} disabled={isSubmitting}>
                              {isSubmitting ? "Approving..." : "Approve"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Document</DialogTitle>
                            <DialogDescription>Are you sure you want to reject "{sharePoint.title}"?</DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" disabled={isSubmitting}>
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleApprove(sharePoint._id, false)}
                              disabled={isSubmitting}
                              variant="destructive"
                            >
                              {isSubmitting ? "Rejecting..." : "Reject"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {canSign && (
                    <Button size="sm" onClick={() => handleQuickSign(sharePoint._id)} disabled={isSubmitting}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Signing..." : "Sign"}
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={() => handleViewDetail(sharePoint._id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={sharePoint.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Document
                        </a>
                      </DropdownMenuItem>
                      {canEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(sharePoint._id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(sharePoint._id)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="container p-6 mx-auto max-w-7xl">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">SharePoint Documents</h1>
                <p className="text-muted-foreground">Manage and track your document signatures</p>
              </div>
              <Button onClick={handleCreateNew} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Document
              </Button>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Documents</p>
                      <p className="text-2xl font-bold">{pagination.totalItems || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Approval</p>
                      <p className="text-2xl font-bold">
                        {sharePoints.filter((sp) => sp.status === "pending_approval").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold">
                        {sharePoints.filter((sp) => sp.status === "in_progress").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">
                        {sharePoints.filter((sp) => sp.status === "completed").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Filters and Search */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                        <Input
                          placeholder="Search documents by title or creator..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Update the Select component for viewFilter to include the new option */}
                      <Select value={viewFilter} onValueChange={setViewFilter}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="View" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Documents</SelectItem>
                          <SelectItem value="assigned">Assigned to Me</SelectItem>
                          <SelectItem value="created">Created by Me</SelectItem>
                          <SelectItem value="to_approve">To Approve</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending_approval">Pending Approval</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt">Created Date</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      >
                        {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                      </Button>

                      <Separator orientation="vertical" className="h-8" />

                      <div className="flex border rounded-lg">
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className="rounded-r-none"
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                          className="rounded-l-none"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>

                      <Button variant="outline" size="sm" onClick={loadSharePoints}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Documents Grid/List */}
            <motion.div variants={itemVariants}>
              {loading ? (
                <div
                  className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}
                >
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="w-3/4 h-6 rounded bg-muted"></div>
                        <div className="w-1/2 h-4 rounded bg-muted"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="h-4 rounded bg-muted"></div>
                          <div className="w-2/3 h-4 rounded bg-muted"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredSharePoints.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="mb-2 text-xl font-semibold">No documents found</h3>
                    <p className="mb-6 text-muted-foreground">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Create your first SharePoint document to get started"}
                    </p>
                    <Button onClick={handleCreateNew}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Document
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence mode="wait">
                  {viewMode === "grid" ? (
                    <motion.div
                      key="grid"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                      {filteredSharePoints.map((sharePoint) => (
                        <SharePointCard key={sharePoint._id} sharePoint={sharePoint} />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-3"
                    >
                      {filteredSharePoints.map((sharePoint) => (
                        <SharePointListItem key={sharePoint._id} sharePoint={sharePoint} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div variants={itemVariants} className="flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.currentPage === 1}
                    onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
