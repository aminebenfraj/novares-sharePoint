"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileText,
  Clock,
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
  SortAsc,
  SortDesc,
  Shield,
  CheckCircle,
  Activity,
  AlertTriangle,
} from "lucide-react"
import {
  getAllSharePoints,
  getMyAssignedSharePoints,
  getMyCreatedSharePoints,
  deleteSharePoint,
  approveSharePoint,
  signSharePoint,
  disapproveSharePoint,
} from "../apis/sharePointApi"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "../context/AuthContext"
import MainLayout from "../components/MainLayout"
import { getCurrentUser } from "../apis/auth"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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

export default function SharePointShow() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [sharePoints, setSharePoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewFilter, setViewFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [approxiDateFilter, setApproxiDateFilter] = useState("all")
  const [requesterDepartmentFilter, setRequesterDepartmentFilter] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  const [currentUserInfo, setCurrentUserInfo] = useState(null)

  // New states for disapproval dialog
  const [showDisapproveDialog, setShowDisapproveDialog] = useState(false)
  const [disapprovalNote, setDisapprovalNote] = useState("")
  const [currentDisapproveSharePointId, setCurrentDisapproveSharePointId] = useState(null)

  // New states for manager rejection dialog
  const [showManagerRejectDialog, setShowManagerRejectDialog] = useState(false)
  const [managerRejectionNote, setManagerRejectionNote] = useState("")
  const [currentManagerRejectSharePointId, setCurrentManagerRejectSharePointId] = useState(null)

  // 🔧 FIX: Get unique values from all sharePoints, not just filtered ones
  const uniqueApproxiDates = useMemo(() => {
    const dates = new Set(sharePoints.map((sp) => sp.approxiDate).filter(Boolean))
    return ["all", ...Array.from(dates).sort()]
  }, [sharePoints])

  const uniqueRequesterDepartments = useMemo(() => {
    const departments = new Set(sharePoints.map((sp) => sp.requesterDepartment).filter(Boolean))
    return ["all", ...Array.from(departments).sort()]
  }, [sharePoints])

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

  // 🔧 FIX: Updated loadSharePoints function with proper filter handling
  const loadSharePoints = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true)
        let response

        // 🔧 FIX: Send ALL filters to backend, including search and custom filters
        const filters = {
          status: statusFilter !== "all" ? statusFilter : undefined,
          page: pagination.currentPage,
          limit: 12,
          sortBy,
          sortOrder,
          search: searchTerm.trim() || undefined,
          // 🔧 NEW: Add custom filters to backend request
          approxiDate: approxiDateFilter !== "all" ? approxiDateFilter : undefined,
          requesterDepartment: requesterDepartmentFilter !== "all" ? requesterDepartmentFilter : undefined,
        }

        // Remove undefined values to clean up the request
        Object.keys(filters).forEach((key) => {
          if (filters[key] === undefined) {
            delete filters[key]
          }
        })

        switch (viewFilter) {
          case "assigned":
            response = await getMyAssignedSharePoints(filters)
            break
          case "created":
            response = await getMyCreatedSharePoints(filters)
            break
          case "to_approve":
            response = await getAllSharePoints({ ...filters, needsManagerApproval: true })
            break
          default:
            response = await getAllSharePoints(filters)
        }

        setSharePoints(response.sharePoints || [])
        setPagination(response.pagination || pagination)
        setLastRefresh(new Date())
      } catch (error) {
        console.error("Error loading SharePoints:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load SharePoint documents.",
        })
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [
      viewFilter,
      statusFilter,
      sortBy,
      sortOrder,
      searchTerm,
      approxiDateFilter,
      requesterDepartmentFilter,
      pagination.currentPage,
    ], // 🔧 FIX: Include all filter dependencies
  )

  // 🔧 FIX: Reset pagination when filters change
  const resetPaginationAndLoad = useCallback(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }, [])

  // 🔧 FIX: Separate effect for filter changes that should reset pagination
  useEffect(() => {
    resetPaginationAndLoad()
  }, [viewFilter, statusFilter, sortBy, sortOrder, searchTerm, approxiDateFilter, requesterDepartmentFilter])

  // 🔧 FIX: Effect for loading data when pagination or filters change
  useEffect(() => {
    loadSharePoints()
  }, [loadSharePoints])

  // Auto-refresh functionality - always on
  useEffect(() => {
    const interval = setInterval(() => {
      loadSharePoints(false) // Don't show loading spinner for auto-refresh
    }, 10000) // 10 seconds

    setRefreshInterval(interval)
    return () => clearInterval(interval)
  }, [loadSharePoints])

  // Fetch current user information
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

  // 🔧 FIX: Pagination handlers
  const handlePreviousPage = () => {
    if (pagination.currentPage > 1) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
    }
  }

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
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

  // Modified handleApprove to include manager rejection comment
  const handleApprove = async (id, approved) => {
    try {
      setIsSubmitting(true)
      const comment = approved ? "" : managerRejectionNote.trim()
      await approveSharePoint(id, approved, comment)
      toast({
        title: approved ? "Document Approved" : "Document Rejected",
        description: approved ? "Document has been approved successfully." : "Document has been rejected.",
      })
      loadSharePoints()
      setShowManagerRejectDialog(false)
      setManagerRejectionNote("")
      setCurrentManagerRejectSharePointId(null)
    } catch (error) {
      console.error("Error approving document:", error)

      if (error.response?.data?.code === "DOCUMENT_EXPIRED") {
        toast({
          variant: "destructive",
          title: "Document Expired",
          description: "This document has expired. The creator must relaunch it with a new deadline.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process approval.",
        })
      }
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

      if (error.response?.data?.code === "DOCUMENT_EXPIRED") {
        toast({
          variant: "destructive",
          title: "Document Expired",
          description: "This document has expired. Please wait for the creator to relaunch it with a new deadline.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to sign the document.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUserDisapproveFromShow = async () => {
    try {
      setIsSubmitting(true)
      await disapproveSharePoint(currentDisapproveSharePointId, disapprovalNote.trim())
      toast({
        title: "Document Disapproved",
        description: "You have disapproved this document. The document has been cancelled.",
      })
      loadSharePoints()
      setShowDisapproveDialog(false)
      setDisapprovalNote("")
      setCurrentDisapproveSharePointId(null)
    } catch (err) {
      console.error("Error disapproving document:", err)

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
      case "disapproved":
        return <AlertTriangle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  // 🔧 FIX: Remove client-side filtering since we're now filtering on the backend
  const displayedSharePoints = sharePoints // No more client-side filtering

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
              <div className="flex items-center gap-4">
                <div className="text-xs text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()}</div>
                <Button onClick={handleCreateNew} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Document
                </Button>
              </div>
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
                          <SelectItem value="disapproved">Disapproved</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={approxiDateFilter} onValueChange={setApproxiDateFilter}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Internal ID" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueApproxiDates.map((date) => (
                            <SelectItem key={date} value={date}>
                              {date === "all" ? "Internal ID" : date}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={requesterDepartmentFilter} onValueChange={setRequesterDepartmentFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Requester Dept." />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueRequesterDepartments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept === "all" ? "All Departments" : dept}
                            </SelectItem>
                          ))}
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

                      <Button variant="outline" size="sm" onClick={() => loadSharePoints()}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Documents Table */}
            <motion.div variants={itemVariants}>
              {loading ? (
                <Card className="animate-pulse">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="h-8 rounded bg-muted"></div>
                      <div className="h-6 rounded bg-muted"></div>
                      <div className="h-6 rounded bg-muted"></div>
                      <div className="h-6 rounded bg-muted"></div>
                      <div className="h-6 rounded bg-muted"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : displayedSharePoints.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="mb-2 text-xl font-semibold">No documents found</h3>
                    <p className="mb-6 text-muted-foreground">
                      {searchTerm ||
                      statusFilter !== "all" ||
                      approxiDateFilter !== "all" ||
                      requesterDepartmentFilter !== "all"
                        ? "Try adjusting your search terms or filters"
                        : "Create your first SharePoint document to get started"}
                    </p>
                    <Button onClick={handleCreateNew}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Document
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Document</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Signers</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Internal ID</TableHead>
                          <TableHead>Requester Dept.</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedSharePoints.map((sharePoint) => {
                          if (!sharePoint) return null

                          const isExpired =
                            sharePoint.deadline &&
                            new Date(sharePoint.deadline) < new Date() &&
                            sharePoint.status !== "completed"

                          const completionPercentage = sharePoint.completionPercentage || 0
                          const canEdit =
                            sharePoint.createdBy?._id === currentUser?._id || currentUser?.roles?.includes("Admin")

                          const canApprove =
                            sharePoint?.managersToApprove?.some((managerId) => {
                              const managerIdStr = String(managerId)
                              const userIdStr = currentUserInfo ? String(currentUserInfo._id) : String(currentUser?._id)
                              const userLicenseStr = currentUserInfo
                                ? String(currentUserInfo.license)
                                : String(currentUser?.license)
                              return managerIdStr === userIdStr || managerIdStr === userLicenseStr
                            }) &&
                            sharePoint?.status === "pending_approval" &&
                            !sharePoint?.managerApproved

                          const userSigner = sharePoint?.usersToSign?.find(
                            (signer) => signer.user?._id === currentUser?._id,
                          )
                          const hasUserSigned = userSigner?.hasSigned || false
                          const hasUserDisapproved = userSigner?.hasDisapproved || false

                          const canUserAct =
                            sharePoint?.managerApproved &&
                            userSigner &&
                            !hasUserSigned &&
                            !hasUserDisapproved &&
                            sharePoint.status !== "disapproved" &&
                            sharePoint.status !== "rejected" &&
                            sharePoint.status !== "cancelled" &&
                            sharePoint.status !== "expired"

                          return (
                            <TableRow key={sharePoint._id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-muted">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{sharePoint.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {sharePoint.creationDate
                                        ? new Date(sharePoint.creationDate).toLocaleDateString()
                                        : "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(sharePoint.status)} variant="outline">
                                    {getStatusIcon(sharePoint.status)}
                                    <span className="ml-1">{sharePoint.status?.replace("_", " ").toUpperCase()}</span>
                                  </Badge>
                                  {sharePoint.managerApproved && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50"
                                    >
                                      <Shield className="w-3 h-3 mr-1" />
                                      Approved
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={completionPercentage} className="w-16 h-2" />
                                  <span className="text-sm font-medium">{completionPercentage}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1">
                                    {sharePoint.usersToSign?.slice(0, 3).map((signer) => {
                                      if (!signer?.user) return null
                                      return (
                                        <Avatar key={signer.user._id} className="w-6 h-6 border-2 border-background">
                                          <AvatarFallback className="text-xs">
                                            {signer.user.username?.charAt(0).toUpperCase() || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                      )
                                    })}
                                    {sharePoint.usersToSign?.length > 3 && (
                                      <div className="flex items-center justify-center w-6 h-6 border-2 rounded-full bg-muted border-background">
                                        <span className="text-xs">+{sharePoint.usersToSign.length - 3}</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/
                                    {sharePoint.usersToSign?.length || 0}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={isExpired ? "text-red-600 font-medium" : "text-foreground"}>
                                  {sharePoint.deadline ? new Date(sharePoint.deadline).toLocaleDateString() : "N/A"}
                                </span>
                                {isExpired && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    Expired
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{sharePoint.approxiDate || "N/A"}</TableCell>
                              <TableCell>{sharePoint.requesterDepartment || "N/A"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">
                                      {sharePoint.createdBy?.username?.charAt(0).toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{sharePoint.createdBy?.username}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {canApprove && !isExpired && (
                                    <div className="flex gap-1">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button size="sm" variant="outline">
                                            <Shield className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Approve Document</DialogTitle>
                                            <DialogDescription>
                                              Are you sure you want to approve "{sharePoint.title}"?
                                            </DialogDescription>
                                          </DialogHeader>
                                          <DialogFooter>
                                            <Button variant="outline" disabled={isSubmitting}>
                                              Cancel
                                            </Button>
                                            <Button
                                              onClick={() => handleApprove(sharePoint._id, true)}
                                              disabled={isSubmitting}
                                            >
                                              {isSubmitting ? "Approving..." : "Approve"}
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                      <Dialog
                                        open={
                                          showManagerRejectDialog && currentManagerRejectSharePointId === sharePoint._id
                                        }
                                        onOpenChange={(open) => {
                                          setShowManagerRejectDialog(open)
                                          if (!open) {
                                            setManagerRejectionNote("")
                                            setCurrentManagerRejectSharePointId(null)
                                          }
                                        }}
                                      >
                                        <DialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                              setCurrentManagerRejectSharePointId(sharePoint._id)
                                              setShowManagerRejectDialog(true)
                                            }}
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Reject Document</DialogTitle>
                                            <DialogDescription>
                                              Are you sure you want to reject "{sharePoint.title}"? The creator will be
                                              able to relaunch it.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="mt-4 space-y-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="manager-rejection-note">Reason for Rejection *</Label>
                                              <Textarea
                                                id="manager-rejection-note"
                                                placeholder="Explain why you are rejecting this document..."
                                                value={managerRejectionNote}
                                                onChange={(e) => setManagerRejectionNote(e.target.value)}
                                                className="min-h-[100px]"
                                                required
                                              />
                                              <p className="text-xs text-muted-foreground">
                                                Your comment will be visible to the creator and saved in the document
                                                history.
                                              </p>
                                            </div>
                                          </div>
                                          <DialogFooter>
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setShowManagerRejectDialog(false)
                                                setManagerRejectionNote("")
                                                setCurrentManagerRejectSharePointId(null)
                                              }}
                                              disabled={isSubmitting}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              onClick={() => handleApprove(sharePoint._id, false)}
                                              disabled={isSubmitting || !managerRejectionNote.trim()}
                                              variant="destructive"
                                            >
                                              {isSubmitting ? "Rejecting..." : "Reject"}
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  )}

                                  {canApprove && isExpired && (
                                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-red-600 border border-red-200 rounded bg-red-50">
                                      <Timer className="w-3 h-3" />
                                      <span>Expired - Creator must relaunch</span>
                                    </div>
                                  )}

                                  {canUserAct && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleQuickSign(sharePoint._id)}
                                        disabled={isSubmitting}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                      <Dialog
                                        open={showDisapproveDialog && currentDisapproveSharePointId === sharePoint._id}
                                        onOpenChange={(open) => {
                                          setShowDisapproveDialog(open)
                                          if (!open) {
                                            setDisapprovalNote("")
                                            setCurrentDisapproveSharePointId(null)
                                          }
                                        }}
                                      >
                                        <DialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                              setCurrentDisapproveSharePointId(sharePoint._id)
                                              setShowDisapproveDialog(true)
                                            }}
                                            disabled={isSubmitting}
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Disapprove Document</DialogTitle>
                                            <DialogDescription>
                                              You are about to disapprove "{sharePoint.title}". This will cancel the
                                              document and notify the creator.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="mt-4 space-y-4">
                                            <div className="p-4 border rounded-lg border-amber-200 bg-amber-50">
                                              <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                <span className="text-sm font-medium text-amber-700">Important</span>
                                              </div>
                                              <p className="text-xs text-amber-600">
                                                Disapproving will cancel the document for all users. The creator can
                                                then make changes and relaunch it.
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
                                                Your feedback will help the creator understand what needs to be improved
                                                and will be saved in the document history.
                                              </p>
                                            </div>
                                          </div>
                                          <DialogFooter>
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setShowDisapproveDialog(false)
                                                setDisapprovalNote("")
                                                setCurrentDisapproveSharePointId(null)
                                              }}
                                              disabled={isSubmitting}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              onClick={handleUserDisapproveFromShow}
                                              disabled={isSubmitting || !disapprovalNote.trim()}
                                            >
                                              {isSubmitting ? "Disapproving..." : "Disapprove Document"}
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </>
                                  )}

                                  {sharePoint?.managerApproved &&
                                    userSigner &&
                                    !hasUserSigned &&
                                    !hasUserDisapproved &&
                                    sharePoint.status === "expired" && (
                                      <div className="flex items-center gap-2 px-2 py-1 text-xs text-red-600 border border-red-200 rounded bg-red-50">
                                        <Timer className="w-3 h-3" />
                                        <span>Expired - Wait for relaunch</span>
                                      </div>
                                    )}

                                  <Button variant="outline" size="sm" onClick={() => handleViewDetail(sharePoint._id)}>
                                    <Eye className="w-4 h-4" />
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
                                          <DropdownMenuItem
                                            onClick={() => handleDelete(sharePoint._id)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* 🔧 FIX: Updated Pagination with proper handlers */}
            {pagination.totalPages > 1 && (
              <motion.div variants={itemVariants} className="flex justify-center">
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled={pagination.currentPage === 1} onClick={handlePreviousPage}>
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={handleNextPage}
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
