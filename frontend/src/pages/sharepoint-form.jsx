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
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Calendar,
  Users,
  FileText,
  LinkIcon,
  AlertCircle,
  CheckCircle2,
  Search,
  UserPlus,
  Send,
  X,
  Sparkles,
} from "lucide-react"
import { createSharePoint } from "../apis/sharePointApi"
import { getAllUsers } from "../apis/admin"
import { toast } from "@/hooks/use-toast"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
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
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

const userCardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

export default function SharePointFormEnhanced() {
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [apiError, setApiError] = useState("")
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [formProgress, setFormProgress] = useState(0)

  // Calculate form completion progress
  useEffect(() => {
    const fields = [formData.title, formData.link, formData.deadline]
    const completedFields = fields.filter((field) => field.trim() !== "").length
    const userSelection = selectedUsers.length > 0 ? 1 : 0
    const progress = ((completedFields + userSelection) / 4) * 100
    setFormProgress(progress)
  }, [formData, selectedUsers])

  useEffect(() => {
    loadAllUsers()
  }, [])

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

  const loadAllUsers = async () => {
    try {
      setIsLoadingUsers(true)
      setApiError("")

      const response = await getAllUsers(1, 1000)
      const users = response.users || []

      setAllUsers(users)
      setFilteredUsers(users)
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
        title: "🎉 Success!",
        description: "SharePoint document created successfully!",
      })

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container max-w-6xl p-6 mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
              <Sparkles className="w-4 h-4" />
              Create New Document
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
              SharePoint Document
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Share documents with your team for review and approval. Track progress and manage signatures seamlessly.
            </p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Form Progress</span>
                    <span className="font-medium">{Math.round(formProgress)}%</span>
                  </div>
                  <Progress value={formProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Success/Error Alerts */}
          <AnimatePresence>
            {submitSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="text-green-800 border-green-200 bg-green-50">
                  <CheckCircle2 className="w-4 h-4" />
                  <AlertTitle>Document Created Successfully!</AlertTitle>
                  <AlertDescription>Users will be notified to review and sign the document.</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {apiError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main Form */}
              <motion.div variants={cardVariants} className="space-y-6 lg:col-span-2">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      Document Information
                    </CardTitle>
                    <CardDescription>Provide the essential details for your SharePoint document</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Document Title *
                      </Label>
                      <Input
                        id="title"
                        placeholder="Enter a descriptive title for your document"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        className={`transition-all duration-200 ${
                          errors.title ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"
                        }`}
                        maxLength={200}
                      />
                      <div className="flex items-center justify-between">
                        {errors.title && (
                          <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1 text-sm text-red-500"
                          >
                            <AlertCircle className="w-3 h-3" />
                            {errors.title}
                          </motion.p>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">{formData.title.length}/200</span>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="link" className="text-sm font-medium">
                        SharePoint Link *
                      </Label>
                      <div className="relative">
                        <LinkIcon className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                        <Input
                          id="link"
                          placeholder="https://company.sharepoint.com/..."
                          value={formData.link}
                          onChange={(e) => handleInputChange("link", e.target.value)}
                          className={`pl-10 transition-all duration-200 ${
                            errors.link ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"
                          }`}
                        />
                      </div>
                      {errors.link && (
                        <motion.p
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-1 text-sm text-red-500"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {errors.link}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="deadline" className="text-sm font-medium">
                        Deadline *
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                        <Input
                          id="deadline"
                          type="datetime-local"
                          value={formData.deadline}
                          onChange={(e) => handleInputChange("deadline", e.target.value)}
                          className={`pl-10 transition-all duration-200 ${
                            errors.deadline ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"
                          }`}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                      {errors.deadline && (
                        <motion.p
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-1 text-sm text-red-500"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {errors.deadline}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="comment" className="text-sm font-medium">
                        Additional Comments
                      </Label>
                      <Textarea
                        id="comment"
                        placeholder="Add any additional context, instructions, or notes..."
                        value={formData.comment}
                        onChange={(e) => handleInputChange("comment", e.target.value)}
                        className={`min-h-[120px] transition-all duration-200 ${
                          errors.comment ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"
                        }`}
                        maxLength={1000}
                      />
                      <div className="flex items-center justify-between">
                        {errors.comment && (
                          <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1 text-sm text-red-500"
                          >
                            <AlertCircle className="w-3 h-3" />
                            {errors.comment}
                          </motion.p>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">{formData.comment.length}/1000</span>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* User Selection */}
              <motion.div variants={cardVariants} className="space-y-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      Select Signers
                    </CardTitle>
                    <CardDescription>Choose team members who need to review and sign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" type="button">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Signers
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Select Users to Sign</DialogTitle>
                          <DialogDescription>Choose users who need to review and sign this document</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                            <Input
                              placeholder="Search users by name, email, or role..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                              disabled={isLoadingUsers}
                            />
                          </div>

                          <ScrollArea className="h-[400px] border rounded-lg">
                            {isLoadingUsers ? (
                              <div className="p-4 space-y-3">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center p-3 space-x-3 border rounded-lg animate-pulse"
                                  >
                                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                    <div className="flex-1 space-y-2">
                                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                                      <div className="w-48 h-3 bg-gray-200 rounded"></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : filteredUsers.length === 0 ? (
                              <div className="p-8 text-center text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No users found</p>
                                <Button variant="ghost" size="sm" onClick={loadAllUsers} className="mt-2" type="button">
                                  Refresh Users
                                </Button>
                              </div>
                            ) : (
                              <div className="p-4 space-y-2">
                                {filteredUsers.map((user) => {
                                  const isSelected = selectedUsers.find((u) => u._id === user._id)
                                  return (
                                    <motion.div
                                      key={user._id}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                        isSelected
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
                                          <p className="text-xs truncate text-muted-foreground">{user.email}</p>
                                          {user.roles && user.roles.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
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
                      </DialogContent>
                    </Dialog>

                    {errors.usersToSign && (
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1 text-sm text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.usersToSign}
                      </motion.p>
                    )}

                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3"
                      >
                        <Separator />
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Selected Signers ({selectedUsers.length})</Label>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])} type="button">
                            Clear All
                          </Button>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-48">
                          <AnimatePresence>
                            {selectedUsers.map((user) => (
                              <motion.div
                                key={user._id}
                                variants={userCardVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                    <span className="text-xs font-medium text-blue-600">
                                      {user.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{user.username}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleUserToggle(user)} type="button">
                                  <X className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="flex justify-center pt-8">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || isLoadingUsers}
                className="px-12 py-6 text-lg font-medium transition-all duration-200 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 mr-3 border-2 border-white rounded-full border-t-transparent"
                    />
                    Creating Document...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-3" />
                    Create SharePoint Document
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
