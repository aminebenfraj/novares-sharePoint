
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  Clock,
  Search,
  Eye,
  ExternalLink,
  RefreshCw,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  CheckCircle,
  Inbox,
  ClipboardSignature,
  CalendarClock,
  CheckSquare,
  HourglassIcon,
} from "lucide-react"
import { getMyAssignedSharePoints, signSharePoint } from "../apis/sharePointApi"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "../context/AuthContext"
import MainLayout from "../components/MainLayout"
import ExternalLinkHandler from "../components/external-link-handler"

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

export default function SharePointAssigned() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("deadline")
  const [sortOrder, setSortOrder] = useState("asc")
  const [viewMode, setViewMode] = useState("grid")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signatureNote, setSignatureNote] = useState("")
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  // Navigation handlers
  const handleViewDetail = (id) => {
    navigate(`/sharepoint/${id}`)
  }

  useEffect(() => {
    loadAssignedDocuments()
  }, [statusFilter, sortBy, sortOrder, pagination.currentPage])

  const loadAssignedDocuments = async () => {
    try {
      setLoading(true)

      const filters = {
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: pagination.currentPage,
        limit: 12,
      }

      const response = await getMyAssignedSharePoints(filters)
      setDocuments(response.sharePoints || [])
      setPagination(response.pagination || pagination)
    } catch (error) {
      console.error("Error loading assigned documents:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your assigned documents.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignDocument = async (id, note = "") => {
    try {
      setIsSubmitting(true)
      await signSharePoint(id, note)
      toast({
        title: "Document Signed",
        description: "You have successfully signed this document.",
      })
      loadAssignedDocuments()
      setSignatureNote("")
      setSelectedDocument(null)
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
        return <HourglassIcon className="w-3 h-3" />
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

  const filteredDocuments = documents.filter(
    (doc) =>
      doc?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc?.createdBy?.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get counts for the tabs
  const pendingCount = documents.filter((doc) => {
    const userSignStatus = doc.usersToSign?.find((signer) => signer.user._id === currentUser?._id && !signer.hasSigned)
    return userSignStatus && doc.managerApproved
  }).length

  const signedCount = documents.filter((doc) => {
    const userSignStatus = doc.usersToSign?.find((signer) => signer.user._id === currentUser?._id && signer.hasSigned)
    return userSignStatus
  }).length

  const expiredCount = documents.filter((doc) => new Date(doc.deadline) < new Date()).length

  // Check if the current user has already signed a document
  const hasUserSigned = (document) => {
    return document.usersToSign?.some((signer) => signer.user._id === currentUser?._id && signer.hasSigned)
  }

  // Check if the current user can sign a document
  const canUserSign = (document) => {
    return (
      document.managerApproved &&
      document.usersToSign?.some((signer) => signer.user._id === currentUser?._id && !signer.hasSigned)
    )
  }

  const DocumentCard = ({ document }) => {
    if (!document) return null

    const isExpired = document.deadline && new Date(document.deadline) < new Date()
    const completionPercentage = document.completionPercentage || 0
    const userHasSigned = hasUserSigned(document)
    const userCanSign = canUserSign(document)
    const daysUntilDeadline = document.deadline
      ? Math.ceil((new Date(document.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      : null

    return (
      <motion.div variants={cardVariants} whileHover="hover" layout>
        <Card className="h-full transition-all duration-200 hover:shadow-md border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold truncate text-foreground">{document.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  by {document.createdBy?.username}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleViewDetail(document._id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <ExternalLinkHandler link={document.link}>
                      <div className="flex items-center w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Document
                      </div>
                    </ExternalLinkHandler>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(document.status)} variant="outline">
                {getStatusIcon(document.status)}
                <span className="ml-1">{document.status?.replace("_", " ").toUpperCase()}</span>
              </Badge>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  <Timer className="w-3 h-3 mr-1" />
                  Expired
                </Badge>
              )}
              {userHasSigned && (
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Signed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
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
                    {document.deadline ? new Date(document.deadline).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Time Left</p>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span
                    className={
                      isExpired
                        ? "text-red-600 font-medium"
                        : daysUntilDeadline <= 3
                          ? "text-amber-600 font-medium"
                          : "text-foreground"
                    }
                  >
                    {isExpired
                      ? "Expired"
                      : daysUntilDeadline === 0
                        ? "Today"
                        : daysUntilDeadline === 1
                          ? "Tomorrow"
                          : `${daysUntilDeadline} days`}
                  </span>
                </div>
              </div>
            </div>

            {document.comment && (
              <div className="text-sm">
                <p className="mb-1 text-muted-foreground">Comment</p>
                <p className="text-sm text-foreground line-clamp-2">{document.comment}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <div className="w-full space-y-2">
              {userCanSign && (
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedDocument(document)
                  }}
                >
                  <ClipboardSignature className="w-4 h-4 mr-2" />
                  Sign Document
                </Button>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewDetail(document._id)} className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <ExternalLinkHandler link={document.link}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </ExternalLinkHandler>
              </div>
            </div>
          </CardFooter>
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Documents Assigned to Me</h1>
                <p className="text-muted-foreground">View and sign documents that require your attention</p>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <ClipboardSignature className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Signature</p>
                      <p className="text-2xl font-bold">{pendingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Signed</p>
                      <p className="text-2xl font-bold">{signedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <CalendarClock className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expired</p>
                      <p className="text-2xl font-bold">{expiredCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs and Filters */}
            <motion.div variants={itemVariants}>
              <Tabs defaultValue="all" className="w-full">
                <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList>
                    <TabsTrigger value="all">All Documents</TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending Signature
                      {pendingCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {pendingCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="signed">Signed</TabsTrigger>
                  </TabsList>

                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-[200px]"
                      />
                    </div>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </Button>

                    <Separator orientation="vertical" className="h-10" />

                    <div className="flex border rounded-lg">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className="rounded-r-none"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                        className="rounded-l-none"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button variant="outline" size="icon" onClick={loadAssignedDocuments}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <TabsContent value="all" className="mt-0">
                  {renderDocumentGrid(filteredDocuments)}
                </TabsContent>

                <TabsContent value="pending" className="mt-0">
                  {renderDocumentGrid(
                    filteredDocuments.filter(
                      (doc) =>
                        doc.usersToSign?.some((signer) => signer.user._id === currentUser?._id && !signer.hasSigned) &&
                        doc.managerApproved,
                    ),
                  )}
                </TabsContent>

                <TabsContent value="signed" className="mt-0">
                  {renderDocumentGrid(
                    filteredDocuments.filter((doc) =>
                      doc.usersToSign?.some((signer) => signer.user._id === currentUser?._id && signer.hasSigned),
                    ),
                  )}
                </TabsContent>
              </Tabs>
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

      {/* Sign Document Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
            <DialogDescription>
              You are about to sign "{selectedDocument?.title}". This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signature-note">Signature Note (Optional)</Label>
              <Textarea
                id="signature-note"
                placeholder="Add an optional note with your signature"
                value={signatureNote}
                onChange={(e) => setSignatureNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedDocument(null)
                setSignatureNote("")
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleSignDocument(selectedDocument?._id, signatureNote)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing..." : "Sign Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )

  function renderDocumentGrid(documents) {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      )
    }

    if (documents.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="mb-2 text-xl font-semibold">No documents found</h3>
            <p className="mb-6 text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms"
                : "You don't have any documents assigned to you at the moment"}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {documents.map((document) => (
          <DocumentCard key={document._id} document={document} />
        ))}
      </motion.div>
    )
  }
}
