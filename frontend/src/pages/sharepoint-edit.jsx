"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Calendar,
  LinkIcon,
  AlertCircle,
  Save,
  X,
  ArrowLeft,
  Loader2,
  Check,
  ChevronsUpDown,
  MessageSquare,
} from "lucide-react"
import { getSharePointById, updateSharePoint } from "../apis/sharePointApi"
import { getAllUsers } from "../apis/admin"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "../context/AuthContext"
import MainLayout from "../components/MainLayout"
import { cn } from "@/lib/utils"

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
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

export default function SharePointEditModern() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [sharePoint, setSharePoint] = useState(null)
  const [loading, setLoading] = useState(true)
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
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState("")
  const [showUserSelector, setShowUserSelector] = useState(false)
  const [formProgress, setFormProgress] = useState(0)

  // Calculate form completion progress
  useEffect(() => {
    const totalFields = 4 // title, link, deadline, usersToSign
    let completedFields = 0

    if (formData.title.trim()) completedFields++
    if (formData.link.trim()) completedFields++
    if (formData.deadline) completedFields++
    if (selectedUsers.length > 0) completedFields++

    const progress = (completedFields / totalFields) * 100
    setFormProgress(progress)
  }, [formData, selectedUsers])

  useEffect(() => {
    if (id) {
      loadSharePointDetails()
      loadAllUsers()
    }
  }, [id])

  const loadSharePointDetails = async () => {
    try {
      setLoading(true)
      const data = await getSharePointById(id)
      setSharePoint(data)

      // Populate form with existing data
      setFormData({
        title: data.title || "",
        link: data.link || "",
        comment: data.comment || "",
        deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : "",
      })

      // Set selected users
      setSelectedUsers(data.usersToSign?.map((signer) => signer.user) || [])
    } catch (error) {
      console.error("Error loading SharePoint details:", error)
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

  const loadAllUsers = async () => {
    try {
      setIsLoadingUsers(true)
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

      await updateSharePoint(id, submitData)

      toast({
        title: "🎉 Success!",
        description: "SharePoint document updated successfully!",
      })

      navigate(`/sharepoint/${id}`)
    } catch (error) {
      console.error("Error updating SharePoint:", error)
      setApiError(
        error.response?.data?.error || error.message || "Failed to update SharePoint document. Please try again.",
      )
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update SharePoint document.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate(`/sharepoint/${id}`)
  }

  const UserSelector = () => (
    <Popover open={showUserSelector} onOpenChange={setShowUserSelector}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={showUserSelector} className="justify-between w-full">
          {selectedUsers.length > 0
            ? `${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""} selected`
            : "Select users to sign..."}
          <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandEmpty>No users found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <ScrollArea className="h-64">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.find((u) => u._id === user._id)
                  return (
                    <CommandItem
                      key={user._id}
                      onSelect={() => handleUserToggle(user)}
                      className="flex items-center gap-2 p-2"
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.roles && user.roles.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {user.roles.slice(0, 2).map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="space-y-4 text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <h3 className="text-xl font-medium">Loading document details...</h3>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Check permissions
  const canEdit = sharePoint?.createdBy?._id === user?._id || user?.roles?.includes("Admin")

  if (!canEdit) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl text-destructive">Access Denied</CardTitle>
              <CardDescription>You don't have permission to edit this document</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl p-6 mx-auto">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <div className="space-y-1">
                <Button variant="ghost" onClick={handleBack} className="gap-2 mb-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Document
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Edit SharePoint Document</h1>
                <p className="text-muted-foreground">Update document details and manage signers</p>
              </div>
            </motion.div>

            {/* Progress Bar */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Form Completion</span>
                      <span className="font-medium">{Math.round(formProgress)}%</span>
                    </div>
                    <Progress value={formProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Error Alert */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Form */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Document Details Section */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Document Details</h2>
                        <p className="text-muted-foreground">
                          Update the essential information about your SharePoint document
                        </p>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-sm font-medium">
                            Document Title *
                          </Label>
                          <Input
                            id="title"
                            placeholder="Enter a descriptive title for your document"
                            value={formData.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                            className={cn(
                              "transition-all duration-200",
                              errors.title && "border-destructive focus:border-destructive",
                            )}
                            maxLength={200}
                          />
                          <div className="flex items-center justify-between">
                            {errors.title && (
                              <p className="flex items-center gap-1 text-sm text-destructive">
                                <AlertCircle className="w-3 h-3" />
                                {errors.title}
                              </p>
                            )}
                            <span className="ml-auto text-xs text-muted-foreground">{formData.title.length}/200</span>
                          </div>
                        </div>

                        <div className="space-y-2">
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
                              className={cn(
                                "pl-10 transition-all duration-200",
                                errors.deadline && "border-destructive focus:border-destructive",
                              )}
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </div>
                          {errors.deadline && (
                            <p className="flex items-center gap-1 text-sm text-destructive">
                              <AlertCircle className="w-3 h-3" />
                              {errors.deadline}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="link" className="text-sm font-medium">
                          SharePoint Link or File Path *
                        </Label>
                        <div className="relative">
                          <LinkIcon className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                          <Input
                            id="link"
                            placeholder="https://company.sharepoint.com/... or C:\Program Files\..."
                            value={formData.link}
                            onChange={(e) => handleInputChange("link", e.target.value)}
                            className={cn(
                              "pl-10 transition-all duration-200",
                              errors.link && "border-destructive focus:border-destructive",
                            )}
                          />
                        </div>
                        {errors.link && (
                          <p className="flex items-center gap-1 text-sm text-destructive">
                            <AlertCircle className="w-3 h-3" />
                            {errors.link}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comment" className="text-sm font-medium">
                          Additional Comments
                        </Label>
                        <div className="relative">
                          <MessageSquare className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                          <Textarea
                            id="comment"
                            placeholder="Add any additional context, instructions, or notes..."
                            value={formData.comment}
                            onChange={(e) => handleInputChange("comment", e.target.value)}
                            className={cn(
                              "min-h-[120px] pl-10 pt-10 transition-all duration-200",
                              errors.comment && "border-destructive focus:border-destructive",
                            )}
                            maxLength={1000}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          {errors.comment && (
                            <p className="flex items-center gap-1 text-sm text-destructive">
                              <AlertCircle className="w-3 h-3" />
                              {errors.comment}
                            </p>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground">{formData.comment.length}/1000</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h2 className="text-xl font-semibold">Signers Management</h2>
                          <p className="text-muted-foreground">
                            Update team members who need to review and sign this document
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Users to Sign *</Label>
                            <UserSelector />
                            {errors.usersToSign && (
                              <p className="flex items-center gap-1 text-sm text-destructive">
                                <AlertCircle className="w-3 h-3" />
                                {errors.usersToSign}
                              </p>
                            )}
                          </div>

                          {/* Selected Users */}
                          {selectedUsers.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Selected Signers ({selectedUsers.length})</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedUsers([])}
                                  type="button"
                                  className="h-auto p-1 text-xs"
                                >
                                  Clear All
                                </Button>
                              </div>
                              <div className="grid gap-2">
                                <AnimatePresence>
                                  {selectedUsers.map((user) => (
                                    <motion.div
                                      key={user._id}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                          <span className="text-sm font-medium text-primary">
                                            {user.username.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">{user.username}</p>
                                          <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUserToggle(user)}
                                        type="button"
                                        className="h-auto p-1"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-between pt-8 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || isLoadingUsers}
                        className="flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Update Document
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
