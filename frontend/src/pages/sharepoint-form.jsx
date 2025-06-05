"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, FileText, LinkIcon, Clock, AlertCircle, CheckCircle2, RefreshCw, Search } from "lucide-react"
import { createSharePoint } from "../apis/sharePointApi"
import { getAllUsers } from "../apis/admin"
import { toast } from "@/hooks/use-toast"
import MainLayout from "@/components/MainLayout"

// Default role categories for fallback
const defaultRoleCategories = {
  Management: ["Admin", "Manager", "Project Manager", "Business Manager", "Financial Leader"],
  Engineering: [
    "Manufacturing Eng. Manager",
    "Manufacturing Eng. Leader",
    "Tooling Manager",
    "Automation Leader",
    "SAP Leader",
    "Methodes UAP1&3",
    "Methodes UAP2",
  ],
  Logistics: [
    "Logistic Manager",
    "Logistic Leader UAP1",
    "Logistic Leader UAP2",
    "Logistic Leader",
    "POE Administrator",
    "Material Administrator",
    "Warehouse Leader UAP1",
    "Warehouse Leader UAP2",
    "LOGISTICA",
  ],
  Production: ["Prod. Plant Manager UAP1", "Prod. Plant Manager UAP2", "PRODUCCION"],
  Quality: [
    "Quality Manager",
    "Quality Leader UAP1",
    "Quality Leader UAP2",
    "Quality Leader UAP3",
    "Laboratory Leader",
  ],
  Other: ["Customer", "User", "Maintenance Manager", "Maintenance Leader UAP2", "Purchasing Manager"],
}

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

export default function SharePointForm() {
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    comment: "",
    deadline: "",
  })

  const [errors, setErrors] = useState({})
  const [selectedUsers, setSelectedUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [apiError, setApiError] = useState("")
  const [activeTab, setActiveTab] = useState("roles")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load available roles on component mount
  useEffect(() => {
    loadAllUsers()
  }, [])

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(allUsers)
      return
    }

    const searchTermLower = searchTerm.toLowerCase()
    const filtered = allUsers.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTermLower) ||
        user.email?.toLowerCase().includes(searchTermLower) ||
        user.license?.toLowerCase().includes(searchTermLower) ||
        user.roles?.some((role) => role.toLowerCase().includes(searchTermLower)),
    )
    setFilteredUsers(filtered)
  }, [searchTerm, allUsers])

  // Load all users as fallback
  const loadAllUsers = async () => {
    try {
      setIsLoadingUsers(true)
      setApiError("")

      try {
        const response = await getAllUsers(1, 1000) // Get all users with high page size
        const users = response.users || []

        setAllUsers(users)
        setFilteredUsers(users)
      } catch (error) {
        console.error("Failed to get users:", error)
        setApiError("Failed to load users. Please check your connection.")
      }
    } catch (error) {
      console.error("Error loading users:", error)
      setApiError("Failed to load users. Please try again.")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters"
    }

    if (!formData.link.trim()) {
      newErrors.link = "Link is required"
    } else if (!isValidUrl(formData.link)) {
      newErrors.link = "Please enter a valid URL"
    }

    if (formData.comment && formData.comment.length > 1000) {
      newErrors.comment = "Comment must be less than 1000 characters"
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required"
    } else if (new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = "Deadline must be in the future"
    }

    if (selectedUsers.length === 0) {
      newErrors.usersToSign = "At least one signer must be selected"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleUserToggle = (user) => {
    const isSelected = selectedUsers.find((u) => u._id === user._id)
    if (isSelected) {
      setSelectedUsers((prev) => prev.filter((u) => u._id !== user._id))
    } else {
      setSelectedUsers((prev) => [...prev, user])
    }
    if (errors.usersToSign) {
      setErrors((prev) => ({ ...prev, usersToSign: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setApiError("")

    try {
      const submitData = {
        title: formData.title.trim(),
        link: formData.link.trim(),
        comment: formData.comment.trim(),
        deadline: formData.deadline,
        usersToSign: selectedUsers.map((user) => user._id),
      }

      await createSharePoint(submitData)

      setSubmitSuccess(true)
      toast({
        title: "Success",
        description: "SharePoint document created successfully!",
      })

      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: "",
          link: "",
          comment: "",
          deadline: "",
        })
        setSelectedUsers([])
        setSubmitSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error creating SharePoint:", error)
      setApiError(
        error.response?.data?.error || error.message || "Failed to create SharePoint document. Please try again.",
      )
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create SharePoint document.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div className="max-w-4xl mx-auto" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={fadeIn} className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Create SharePoint Document</h1>
          <p className="text-gray-600">Share documents with your team for review and approval</p>
        </motion.div>

        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-6"
            >
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  SharePoint document created successfully! Users will be notified to review and sign.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {apiError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-6"
            >
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <motion.div variants={slideUp} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Document Details
                  </CardTitle>
                  <CardDescription>Enter the basic information for your SharePoint document</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <motion.div variants={slideUp} className="space-y-2">
                    <Label htmlFor="title">Document Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter document title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className={errors.title ? "border-red-500" : ""}
                      maxLength={200}
                    />
                    {errors.title && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 text-sm text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.title}
                      </motion.p>
                    )}
                    <p className="text-xs text-gray-500">{formData.title.length}/200 characters</p>
                  </motion.div>

                  <motion.div variants={slideUp} className="space-y-2">
                    <Label htmlFor="link">SharePoint Link *</Label>
                    <div className="relative">
                      <LinkIcon className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                      <Input
                        id="link"
                        placeholder="https://company.sharepoint.com/..."
                        value={formData.link}
                        onChange={(e) => handleInputChange("link", e.target.value)}
                        className={`pl-10 ${errors.link ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.link && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 text-sm text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.link}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div variants={slideUp} className="space-y-2">
                    <Label htmlFor="deadline">Deadline *</Label>
                    <div className="relative">
                      <Calendar className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                      <Input
                        id="deadline"
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange("deadline", e.target.value)}
                        className={`pl-10 ${errors.deadline ? "border-red-500" : ""}`}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    {errors.deadline && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 text-sm text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.deadline}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div variants={slideUp} className="space-y-2">
                    <Label htmlFor="comment">Additional Comments</Label>
                    <Textarea
                      id="comment"
                      placeholder="Add any additional context or instructions..."
                      value={formData.comment}
                      onChange={(e) => handleInputChange("comment", e.target.value)}
                      className={`min-h-[100px] ${errors.comment ? "border-red-500" : ""}`}
                      maxLength={1000}
                    />
                    {errors.comment && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 text-sm text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.comment}
                      </motion.p>
                    )}
                    <p className="text-xs text-gray-500">{formData.comment.length}/1000 characters</p>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* User Selection */}
            <motion.div variants={slideUp}>
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Select Signers
                  </CardTitle>
                  <CardDescription>Choose users who need to review and sign this document</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="search" value="search">
                    <TabsList className="w-full">
                      <TabsTrigger value="search" className="w-full">
                        Search Users
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="mt-4">
                      <div className="relative">
                        <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                        <Input
                          placeholder="Search users by name, email, or license..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          disabled={isLoadingUsers}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  {errors.usersToSign && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1 text-sm text-red-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.usersToSign}
                    </motion.p>
                  )}

                  {/* User List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Available Users ({filteredUsers.length})</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={loadAllUsers}
                        disabled={isLoadingUsers}
                        className="h-6 px-2 text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingUsers ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>

                    <ScrollArea className="h-[200px] border rounded-md">
                      {isLoadingUsers ? (
                        <div className="p-3 space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-2 border rounded-lg">
                              <div className="flex items-start gap-3">
                                <Skeleton className="w-4 h-4 mt-1" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="w-24 h-4" />
                                  <Skeleton className="w-32 h-3" />
                                  <div className="flex gap-1">
                                    <Skeleton className="w-16 h-5" />
                                    <Skeleton className="w-20 h-5" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No users found</p>
                          <Button type="button" variant="ghost" size="sm" onClick={loadAllUsers} className="mt-2">
                            Load all users
                          </Button>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {filteredUsers.map((user) => {
                            const isSelected = selectedUsers.find((u) => u._id === user._id)
                            return (
                              <motion.div
                                key={user._id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                                  isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={() => handleUserToggle(user)}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={!!isSelected}
                                    onChange={() => handleUserToggle(user)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{user.username}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    {user.roles && user.roles.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {user.roles.slice(0, 2).map((role) => (
                                          <Badge key={role} variant="secondary" className="text-xs">
                                            {role}
                                          </Badge>
                                        ))}
                                        {user.roles.length > 2 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{user.roles.length - 2}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Selected Users Summary */}
                  {selectedUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pt-4 border-t"
                    >
                      <p className="mb-2 text-sm font-medium">Selected Signers ({selectedUsers.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((user) => (
                          <motion.div
                            key={user._id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge
                              variant="default"
                              className="cursor-pointer hover:bg-red-500"
                              onClick={() => handleUserToggle(user)}
                            >
                              {user.username} ×
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.div variants={slideUp} className="flex justify-center mt-8">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoadingUsers}
              className="px-8 py-3 text-lg"
              size="lg"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 mr-2 border-2 border-white rounded-full border-t-transparent"
                />
              ) : (
                <Clock className="w-5 h-5 mr-2" />
              )}
              {isSubmitting ? "Creating SharePoint..." : "Create SharePoint Document"}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
    </MainLayout>
  )
}
