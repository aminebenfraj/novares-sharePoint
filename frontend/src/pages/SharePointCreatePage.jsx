"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  LinkIcon,
  MessageSquare,
  Shield,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { sharePointAPI } from "../apis/sharePointApi"
import { getAllUsers } from "../apis/admin"
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

export default function SharePointCreatePage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [searchUsers, setSearchUsers] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    link: "",
    comment: "",
    deadline: "",
    departmentApprover: false,
    usersToSign: [],
    fileMetadata: null,
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers(1, 100)
      setUsers(response.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users.",
      })
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = "Title is required"
      if (!formData.link.trim()) newErrors.link = "File path/link is required"
      if (!formData.deadline) newErrors.deadline = "Deadline is required"

      // Check if deadline is in the future
      const deadlineDate = new Date(formData.deadline)
      const today = new Date()
      if (deadlineDate <= today) {
        newErrors.deadline = "Deadline must be in the future"
      }
    }

    if (step === 2) {
      if (formData.usersToSign.length === 0) {
        newErrors.usersToSign = "At least one user must be selected for signing"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
    setErrors({})
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const toggleUserSelection = (userId) => {
    setFormData((prev) => ({
      ...prev,
      usersToSign: prev.usersToSign.includes(userId)
        ? prev.usersToSign.filter((id) => id !== userId)
        : [...prev.usersToSign, userId],
    }))

    // Clear error when user selects someone
    if (errors.usersToSign) {
      setErrors((prev) => ({ ...prev, usersToSign: null }))
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(2)) return

    setIsSubmitting(true)

    try {
      const response = await sharePointAPI.createDocument(formData)

      toast({
        title: "Success",
        description: "Document created successfully and sent for manager approval.",
      })

      // Navigate to the details page of the created document
      navigate(`/sharepoint/details/${response.data._id}`)
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

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUsers.toLowerCase()),
  )

  const selectedUsers = users.filter((user) => formData.usersToSign.includes(user._id))

  const getStepIcon = (step) => {
    if (step < currentStep) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (step === currentStep)
      return (
        <div className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
          {step}
        </div>
      )
    return (
      <div className="flex items-center justify-center w-5 h-5 text-xs font-bold text-gray-600 bg-gray-300 rounded-full">
        {step}
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl p-6 mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/sharepoint")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                Create New Document
              </h1>
              <p className="text-muted-foreground">Create a new document for signature workflow</p>
            </div>
          </div>

          {/* Progress Steps */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {getStepIcon(1)}
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      Document Details
                    </span>
                    <span className="text-xs text-muted-foreground">Basic information</span>
                  </div>
                </div>

                <div className="flex-1 mx-4">
                  <div className={`h-1 rounded-full ${currentStep > 1 ? "bg-green-600" : "bg-gray-300"}`} />
                </div>

                <div className="flex items-center gap-4">
                  {getStepIcon(2)}
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${currentStep >= 2 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      Select Signers
                    </span>
                    <span className="text-xs text-muted-foreground">Choose users to sign</span>
                  </div>
                </div>

                <div className="flex-1 mx-4">
                  <div className={`h-1 rounded-full ${currentStep > 2 ? "bg-green-600" : "bg-gray-300"}`} />
                </div>

                <div className="flex items-center gap-4">
                  {getStepIcon(3)}
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${currentStep >= 3 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      Review & Submit
                    </span>
                    <span className="text-xs text-muted-foreground">Final review</span>
                  </div>
                </div>
              </div>

              <Progress value={(currentStep / 3) * 100} className="h-2" />
            </CardContent>
          </Card>

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Document Details
                  </CardTitle>
                  <CardDescription>Provide the basic information about your document</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
                    <motion.div variants={slideUp} className="space-y-2">
                      <Label htmlFor="title" className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Document Title *
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Project Proposal Document"
                        className={errors.title ? "border-red-500" : ""}
                      />
                      {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </motion.div>

                    <motion.div variants={slideUp} className="space-y-2">
                      <Label htmlFor="link" className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                        File Path/Link *
                      </Label>
                      <Input
                        id="link"
                        name="link"
                        value={formData.link}
                        onChange={handleInputChange}
                        placeholder="C:/Documents/project-proposal.docx or https://..."
                        className={errors.link ? "border-red-500" : ""}
                      />
                      {errors.link && <p className="text-sm text-red-500">{errors.link}</p>}
                      <p className="text-xs text-muted-foreground">
                        Provide the file path on your computer or a shareable link
                      </p>
                    </motion.div>

                    <motion.div variants={slideUp} className="space-y-2">
                      <Label htmlFor="deadline" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Deadline *
                      </Label>
                      <Input
                        id="deadline"
                        name="deadline"
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        className={errors.deadline ? "border-red-500" : ""}
                      />
                      {errors.deadline && <p className="text-sm text-red-500">{errors.deadline}</p>}
                    </motion.div>

                    <motion.div variants={slideUp} className="space-y-2">
                      <Label htmlFor="comment" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        Comment/Instructions
                      </Label>
                      <Textarea
                        id="comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleInputChange}
                        placeholder="Please review and sign this document. Any specific instructions..."
                        rows={4}
                      />
                    </motion.div>

                    <motion.div variants={slideUp} className="flex items-center space-x-2">
                      <Checkbox
                        id="departmentApprover"
                        checked={formData.departmentApprover}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, departmentApprover: checked }))}
                      />
                      <Label htmlFor="departmentApprover" className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        Requires department approval
                      </Label>
                    </motion.div>

                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertTitle>Manager Approval Required</AlertTitle>
                      <AlertDescription>
                        This document will be sent to your manager for approval before users can access and sign it.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Select Signers
                  </CardTitle>
                  <CardDescription>Choose the users who need to sign this document</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Selected Users ({selectedUsers.length})</span>
                    </div>

                    <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Users
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Select Users to Sign</DialogTitle>
                          <DialogDescription>Choose the users who need to sign this document</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="relative">
                            <Input
                              placeholder="Search users..."
                              value={searchUsers}
                              onChange={(e) => setSearchUsers(e.target.value)}
                            />
                          </div>

                          <div className="max-h-[400px] overflow-y-auto space-y-2">
                            {filteredUsers.map((user) => (
                              <div
                                key={user._id}
                                className="flex items-center p-3 space-x-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                                onClick={() => toggleUserSelection(user._id)}
                              >
                                <Checkbox
                                  checked={formData.usersToSign.includes(user._id)}
                                  onChange={() => toggleUserSelection(user._id)}
                                />
                                <Avatar className="w-8 h-8">
                                  <AvatarImage
                                    src={user.image || "/placeholder.svg?height=32&width=32"}
                                    alt={user.username}
                                  />
                                  <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{user.username}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {user.roles.slice(0, 2).map((role, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {role}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
                            Done
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {errors.usersToSign && (
                    <Alert variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>{errors.usersToSign}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    {selectedUsers.length > 0 ? (
                      selectedUsers.map((user) => (
                        <motion.div
                          key={user._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={user.image || "/placeholder.svg?height=32&width=32"}
                                alt={user.username}
                              />
                              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleUserSelection(user._id)}
                            className="w-8 h-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No users selected</p>
                        <p className="text-sm text-muted-foreground">Click "Add Users" to select signers</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Review & Submit
                  </CardTitle>
                  <CardDescription>Review your document details before submitting for approval</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Document Title</Label>
                        <p className="text-sm font-medium">{formData.title}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">File Path/Link</Label>
                        <p className="text-sm font-medium break-all">{formData.link}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Deadline</Label>
                        <p className="text-sm font-medium">
                          {new Date(formData.deadline).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {formData.comment && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Comment</Label>
                          <p className="text-sm">{formData.comment}</p>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Department Approval</Label>
                        <p className="text-sm font-medium">
                          {formData.departmentApprover ? "Required" : "Not required"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Selected Signers ({selectedUsers.length})
                        </Label>
                        <div className="mt-2 space-y-2">
                          {selectedUsers.map((user) => (
                            <div key={user._id} className="flex items-center gap-2 p-2 border rounded">
                              <Avatar className="w-6 h-6">
                                <AvatarImage
                                  src={user.image || "/placeholder.svg?height=24&width=24"}
                                  alt={user.username}
                                />
                                <AvatarFallback className="text-xs">
                                  {user.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-medium">{user.username}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertTitle>What happens next?</AlertTitle>
                    <AlertDescription>
                      <ol className="mt-2 space-y-1 list-decimal list-inside">
                        <li>Your document will be sent to your manager for approval</li>
                        <li>Once approved, selected users will be notified to sign</li>
                        <li>You can track the progress in the document details page</li>
                        <li>You'll receive notifications when all signatures are collected</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? () => navigate("/sharepoint") : handlePrevious}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? "Cancel" : "Previous"}
            </Button>

            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Document
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
