"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Plus, RefreshCw, Grid3X3, List, SortAsc, SortDesc } from "lucide-react"
import {
  getAllSharePoints,
  getMyAssignedSharePoints,
  getMyCreatedSharePoints,
  deleteSharePoint,
} from "../apis/sharePointApi"
import { toast } from "@/hooks/use-toast"
import SharePointCard from "../components/sharepoint-card"
import SharePointListItem from "../components/sharepoint-list-item"

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

export default function SharePointShowEnhanced({ currentUser, onCreateNew, onViewDetail }) {
  const [sharePoints, setSharePoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewFilter, setViewFilter] = useState("all") // all, assigned, created
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [viewMode, setViewMode] = useState("grid") // grid, list
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  useEffect(() => {
    loadSharePoints()
  }, [viewFilter, statusFilter, sortBy, sortOrder, pagination.currentPage])

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

  const filteredSharePoints = sharePoints.filter(
    (sp) =>
      sp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.createdBy?.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container p-6 mx-auto max-w-7xl">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
                SharePoint Documents
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">Manage and track your document signatures</p>
            </div>
            <Button onClick={onCreateNew} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="w-5 h-5 mr-2" />
              Create New Document
            </Button>
          </motion.div>

          {/* Filters and Search */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row">
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
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
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
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
              >
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
                        <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredSharePoints.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-semibold">No documents found</h3>
                  <p className="mb-6 text-muted-foreground">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "Create your first SharePoint document to get started"}
                  </p>
                  <Button onClick={onCreateNew}>
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
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {filteredSharePoints.map((sharePoint) => (
                      <SharePointCard
                        key={sharePoint._id}
                        sharePoint={sharePoint}
                        currentUser={currentUser}
                        onViewDetail={onViewDetail}
                        onDelete={handleDelete}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-4"
                  >
                    {filteredSharePoints.map((sharePoint) => (
                      <SharePointListItem
                        key={sharePoint._id}
                        sharePoint={sharePoint}
                        currentUser={currentUser}
                        onViewDetail={onViewDetail}
                        onDelete={handleDelete}
                      />
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
                <span className="px-4 py-2 text-sm">
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
  )
}
