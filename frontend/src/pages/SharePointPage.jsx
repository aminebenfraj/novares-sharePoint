"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Loader2,
  PenTool,
  TrendingUp,
  FileCheck,
  AlertCircle,
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

// Import API functions (you'll need to create these based on your backend)
import { sharePointAPI } from "../apis/sharePointApi"
import { getAllUsers } from "../apis/admin"

// Import MainLayout
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

const tableRowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export default function SharePointPage() {
  const [documents, setDocuments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all-documents")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSignModalOpen, setIsSignModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingSignatures: 0,
    completedDocuments: 0,
    expiredDocuments: 0,
  })

  const [newDocument, setNewDocument] = useState({
    title: "",
    link: "",
    comment: "",
    deadline: "",
    departmentApprover: false,
    usersToSign: [],
    fileMetadata: null,
  })

  const [signatureData, setSignatureData] = useState({
    signatureNote: "",
  })

  // Fetch data on component mount
  useEffect(() => {
    fetchDocuments()
    fetchUsers()
    fetchStats()
  }, [])

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

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers(1, 100) // Get all users for selection
      setUsers(response.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
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
      await Promise.all([fetchDocuments(), fetchUsers(), fetchStats()])
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

  const handleCreateDocument = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await sharePointAPI.createDocument(newDocument)
      await fetchDocuments()
      setIsCreateModalOpen(false)
      setNewDocument({
        title: "",
        link: "",
        comment: "",
        deadline: "",
        departmentApprover: false,
        usersToSign: [],
        fileMetadata: null,
      })

      toast({
        title: "Success",
        description: "Document created successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to create document.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignDocument = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await sharePointAPI.signDocument(selectedDocument._id, signatureData)
      await fetchDocuments()
      setIsSignModalOpen(false)
      setSignatureData({ signatureNote: "" })
      setSelectedDocument(null)

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

  const toggleUserSelection = (userId) => {
    setNewDocument((prev) => ({
      ...prev,
      usersToSign: prev.usersToSign.includes(userId)
        ? prev.usersToSign.filter((id) => id !== userId)
        : [...prev.usersToSign, userId],
    }))
  }

  const getStatusBadge = (status) => {
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
      case "pending-signature":
        return filteredDocuments.filter((doc) => doc.usersToSign?.some((user) => !user.hasSigned))
      case "my-documents":
        return filteredDocuments.filter((doc) => doc.createdBy === "current-user-id") // Replace with actual user ID
      case "completed":
        return filteredDocuments.filter((doc) => doc.status === "completed")
      default:
        return filteredDocuments
    }
  }

  if (loading && documents.length === 0) {
    return (
      <MainLayout>
        <div className="container p-6 mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>

          <Skeleton className="w-full h-10 mb-6" />

          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-16" />
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
              <h1 className="text-3xl font-bold tracking-tight">SharePoint Documents</h1>
              <p className="text-muted-foreground">Manage and track document signatures</p>
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

              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Document</DialogTitle>
                    <DialogDescription>Add a new document for signature workflow</DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleCreateDocument} className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Document Title</Label>
                        <Input
                          id="title"
                          value={newDocument.title}
                          onChange={(e) => setNewDocument((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Project Proposal"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={newDocument.deadline}
                          onChange={(e) => setNewDocument((prev) => ({ ...prev, deadline: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link">File Path/Link</Label>
                      <Input
                        id="link"
                        value={newDocument.link}
                        onChange={(e) => setNewDocument((prev) => ({ ...prev, link: e.target.value }))}
                        placeholder="C:/Documents/project-proposal.docx"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comment">Comment</Label>
                      <Textarea
                        id="comment"
                        value={newDocument.comment}
                        onChange={(e) => setNewDocument((prev) => ({ ...prev, comment: e.target.value }))}
                        placeholder="Please review and sign this document..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="departmentApprover"
                        checked={newDocument.departmentApprover}
                        onCheckedChange={(checked) =>
                          setNewDocument((prev) => ({ ...prev, departmentApprover: checked }))
                        }
                      />
                      <Label htmlFor="departmentApprover">Requires department approval</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Select Users to Sign</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                        {users.map((user) => (
                          <div key={user._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-${user._id}`}
                              checked={newDocument.usersToSign.includes(user._id)}
                              onCheckedChange={() => toggleUserSelection(user._id)}
                            />
                            <Label htmlFor={`user-${user._id}`} className="text-sm cursor-pointer">
                              {user.username} ({user.email})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Document"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={slideUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">{documents.length} active documents</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
                  <PenTool className="w-4 h-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingSignatures}</div>
                  <p className="text-xs text-muted-foreground">Awaiting signatures</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <FileCheck className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedDocuments}</div>
                  <p className="text-xs text-muted-foreground">Fully signed documents</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Expired</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.expiredDocuments}</div>
                  <p className="text-xs text-muted-foreground">Past deadline</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Tabs and Filters */}
          <Tabs defaultValue="all-documents" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <TabsList>
                <TabsTrigger value="all-documents">All Documents</TabsTrigger>
                <TabsTrigger value="pending-signature">Pending Signature</TabsTrigger>
                <TabsTrigger value="my-documents">My Documents</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <div className="flex flex-col gap-2 sm:flex-row">
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
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-6">
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
                      {loading ? (
                        [...Array(5)].map((_, index) => (
                          <TableRow key={`skeleton-${index}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded" />
                                <div className="flex flex-col gap-1">
                                  <Skeleton className="w-32 h-4" />
                                  <Skeleton className="w-24 h-3" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Skeleton className="w-20 h-6" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="w-24 h-4" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="w-20 h-4" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="w-24 h-4" />
                            </TableCell>
                            <TableCell className="text-right">
                              <Skeleton className="w-8 h-8 ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : getTabDocuments(activeTab).length > 0 ? (
                        <AnimatePresence>
                          {getTabDocuments(activeTab).map((document, index) => (
                            <motion.tr
                              key={document._id}
                              custom={index}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              variants={tableRowVariants}
                              className="group"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10">
                                    <FileText className="w-4 h-4 text-primary" />
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
                                {getStatusBadge(document.status)}
                                {isDeadlineNear(document.deadline) && document.status !== "completed" && (
                                  <Badge variant="outline" className="ml-2 text-orange-600">
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
                              <TableCell className="text-right">
                                <div className="flex justify-end">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="w-8 h-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                        <span className="sr-only">Open menu</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      {document.usersToSign?.some((user) => !user.hasSigned) && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedDocument(document)
                                            setIsSignModalOpen(true)
                                          }}
                                        >
                                          <PenTool className="w-4 h-4 mr-2" />
                                          Sign Document
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem>
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
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
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
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
            </TabsContent>
          </Tabs>

          {/* Sign Document Modal */}
          <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Sign Document</DialogTitle>
                <DialogDescription>{selectedDocument && `Sign "${selectedDocument.title}"`}</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSignDocument} className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signatureNote">Signature Note (Optional)</Label>
                  <Textarea
                    id="signatureNote"
                    value={signatureData.signatureNote}
                    onChange={(e) => setSignatureData((prev) => ({ ...prev, signatureNote: e.target.value }))}
                    placeholder="Add any comments about your signature..."
                    rows={3}
                  />
                </div>

                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    By signing this document, you confirm that you have reviewed and approve its contents.
                  </AlertDescription>
                </Alert>

                <DialogFooter className="pt-4">
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
        </motion.div>
      </div>
    </MainLayout>
  )
}
