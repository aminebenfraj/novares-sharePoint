"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  FileText,
  Plus,
  Search,
  Grid3X3,
  List,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  Loader2,
  Calendar,
  Users,
  TrendingUp,
  FileCheck,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  PenTool,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { sharePointAPI } from "../apis/sharePointApi"
import { useUser } from "../context/UserContext"
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: { duration: 0.2 },
  },
}

export default function SharePointListPage() {
  const navigate = useNavigate()
  const { user, canSignDocument, canEditDocument } = useUser()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [activeTab, setActiveTab] = useState("all")
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingApproval: 0,
    pendingSignatures: 0,
    completedDocuments: 0,
    expiredDocuments: 0,
  })

  useEffect(() => {
    if (user) {
      fetchDocuments()
      fetchStats()
    }
  }, [user])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await sharePointAPI.getAllDocuments()
      setDocuments(response.data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load documents.",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await sharePointAPI.getStats()
      setStats(response.data || stats)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchDocuments(), fetchStats()])
      toast({
        title: "Success",
        description: "Data refreshed successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh data.",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteDocument = async (documentId) => {
    try {
      await sharePointAPI.deleteDocument(documentId)
      await fetchDocuments()
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document.",
      })
    }
  }

  const getStatusBadge = (status, managerApproved) => {
    if (!managerApproved) {
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>
      )
    }

    const statusConfig = {
      pending: { variant: "secondary", icon: Clock, color: "text-yellow-600" },
      in_progress: { variant: "default", icon: TrendingUp, color: "text-blue-600" },
      completed: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      expired: { variant: "destructive", icon: AlertTriangle, color: "text-red-600" },
      cancelled: { variant: "outline", icon: AlertCircle, color: "text-gray-600" },
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
      month: "short",
      day: "numeric",
    })
  }

  const isDeadlineNear = (deadline) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchTerm === "" ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.comment?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || doc.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getTabDocuments = (tab) => {
    switch (tab) {
      case "pending-approval":
        return filteredDocuments.filter((doc) => !doc.managerApproved)
      case "pending-signature":
        return filteredDocuments.filter(
          (doc) =>
            doc.managerApproved &&
            doc.usersToSign?.some((userSign) => userSign.user._id === user._id && !userSign.hasSigned),
        )
      case "my-documents":
        return filteredDocuments.filter((doc) => doc.createdBy._id === user._id)
      case "completed":
        return filteredDocuments.filter((doc) => doc.status === "completed")
      default:
        return filteredDocuments
    }
  }

  const DocumentCard = ({ document }) => (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
      <Card className="h-full transition-all duration-200 cursor-pointer hover:shadow-lg group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-tight">{document.title}</h3>
                <p className="text-sm text-muted-foreground">Created {formatDate(document.creationDate)}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/sharepoint/details/${document._id}`)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {canSignDocument(document) && (
                  <DropdownMenuItem>
                    <PenTool className="w-4 h-4 mr-2" />
                    Sign Document
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                {canEditDocument(document) && (
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {canEditDocument(document) && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
                        handleDeleteDocument(document._id)
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4" onClick={() => navigate(`/sharepoint/details/${document._id}`)}>
          <div className="flex items-center justify-between">
            {getStatusBadge(document.status, document.managerApproved)}
            {isDeadlineNear(document.deadline) && document.status !== "completed" && (
              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                <Clock className="w-3 h-3 mr-1" />
                Due Soon
              </Badge>
            )}
          </div>

          {document.comment && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{document.comment}</p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Signature Progress</span>
              <span className="font-medium">{document.completionPercentage || 0}%</span>
            </div>
            <Progress value={document.completionPercentage || 0} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span
                className={`${
                  isDeadlineNear(document.deadline) && document.status !== "completed"
                    ? "text-orange-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {formatDate(document.deadline)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{document.usersToSign?.length || 0} signers</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="w-6 h-6">
              <AvatarImage
                src={document.createdBy?.image || "/placeholder.svg?height=24&width=24"}
                alt={document.createdBy?.username}
              />
              <AvatarFallback className="text-xs">
                {document.createdBy?.username?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">by {document.createdBy?.username || "Unknown"}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  if (loading && documents.length === 0) {
    return (
      <MainLayout>
        <div className="container p-6 mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[300px]" />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container p-6 mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                SharePoint Documents
              </h1>
              <p className="text-muted-foreground">Manage and track document signatures with approval workflow</p>
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

              <Button
                size="sm"
                onClick={() => navigate("/sharepoint/create")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <motion.div variants={slideUp}>
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Total Documents</CardTitle>
                  <FileText className="w-4 h-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalDocuments}</div>
                  <p className="text-xs text-blue-600">{documents.length} active documents</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-amber-700">Pending Approval</CardTitle>
                  <Clock className="w-4 h-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">{stats.pendingApproval}</div>
                  <p className="text-xs text-amber-600">Awaiting manager approval</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Pending Signatures</CardTitle>
                  <PenTool className="w-4 h-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{stats.pendingSignatures}</div>
                  <p className="text-xs text-purple-600">Awaiting signatures</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Completed</CardTitle>
                  <FileCheck className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{stats.completedDocuments}</div>
                  <p className="text-xs text-green-600">Fully signed documents</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">Expired</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900">{stats.expiredDocuments}</div>
                  <p className="text-xs text-red-600">Past deadline</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Tabs and Filters */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-auto">
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="pending-approval">Pending Approval</TabsTrigger>
                <TabsTrigger value="pending-signature">Pending Signature</TabsTrigger>
                <TabsTrigger value="my-documents">My Documents</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search documents..."
                    className="w-full pl-9 sm:w-[200px] md:w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <ToggleGroup type="single" value={viewMode} onValueChange={setViewMode}>
                  <ToggleGroupItem value="grid" aria-label="Grid view">
                    <Grid3X3 className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="w-4 h-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              {viewMode === "grid" ? (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {getTabDocuments(activeTab).length > 0 ? (
                    getTabDocuments(activeTab).map((document) => (
                      <DocumentCard key={document._id} document={document} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 col-span-full">
                      <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-medium text-muted-foreground">No documents found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or create a new document.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getTabDocuments(activeTab).length > 0 ? (
                          getTabDocuments(activeTab).map((document, index) => (
                            <TableRow
                              key={document._id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/sharepoint/details/${document._id}`)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600">
                                    <FileText className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{document.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {document.comment?.substring(0, 50)}
                                      {document.comment?.length > 50 ? "..." : ""}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(document.status, document.managerApproved)}
                                {isDeadlineNear(document.deadline) && document.status !== "completed" && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-orange-600 border-orange-200 bg-orange-50"
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    Due Soon
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={document.completionPercentage || 0} className="w-16 h-2" />
                                  <span className="text-xs text-muted-foreground">
                                    {document.completionPercentage || 0}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`text-sm ${
                                    isDeadlineNear(document.deadline) && document.status !== "completed"
                                      ? "text-orange-600 font-medium"
                                      : ""
                                  }`}
                                >
                                  {formatDate(document.deadline)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage
                                      src={document.createdBy?.image || "/placeholder.svg?height=24&width=24"}
                                      alt={document.createdBy?.username}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {document.createdBy?.username?.substring(0, 2).toUpperCase() || "??"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{document.createdBy?.username || "Unknown"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-8 h-8">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate(`/sharepoint/details/${document._id}`)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    {canSignDocument(document) && (
                                      <DropdownMenuItem>
                                        <PenTool className="w-4 h-4 mr-2" />
                                        Sign Document
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    {canEditDocument(document) && (
                                      <DropdownMenuItem>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {canEditDocument(document) && (
                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
                                            handleDeleteDocument(document._id)
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                                <p className="text-muted-foreground">No documents found.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  )
}
