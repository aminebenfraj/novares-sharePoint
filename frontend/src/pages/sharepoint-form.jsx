"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Users,
  FileText,
  LinkIcon,
  AlertCircle,
  CheckCircle2,
  Send,
  X,
  ArrowLeft,
  Clock,
  Target,
  MessageSquare,
  Check,
  ChevronsUpDown,
  Loader2,
  Shield,
} from "lucide-react"
import { createSharePoint } from "../apis/sharePointApi"
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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
}

export default function SharePointCreateEnhanced() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    comment: "",
    deadline: "",
  })

  const [errors, setErrors] = useState({})
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedManager, setSelectedManager] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [managers, setManagers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [filteredManagers, setFilteredManagers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [managerSearchTerm, setManagerSearchTerm] = useState("")
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [apiError, setApiError] = useState("")
  const [showUserSelector, setShowUserSelector] = useState(false)
  const [showManagerSelector, setShowManagerSelector] = useState(false)
  const [formProgress, setFormProgress] = useState(0)

  const steps = [
    {
      id: 0,
      title: "Document Details",
      description: "Basic information about your document",
      icon: FileText,
      fields: ["title", "link"],
    },
    {
      id: 1,
      title: "Timeline & Notes",
      description: "Set deadline and add comments",
      icon: Clock,
      fields: ["deadline", "comment"],
    },
    {
      id: 2,
      title: "Select Approver",
      description: "Choose a manager who must approve",
      icon: Shield,
      fields: ["managers"],
    },
    {
      id: 3,
      title: "Select Signers",
      description: "Choose who needs to sign",
      icon: Users,
      fields: ["usersToSign"],
    },
    {
      id: 4,
      title: "Review & Submit",
      description: "Confirm all details",
      icon: Target,
      fields: [],
    },
  ]

  // Calculate form completion progress
  useEffect(() => {
    const totalFields = 5 // title, link, deadline, managers, usersToSign
    let completedFields = 0

    if (formData.title.trim()) completedFields++
    if (formData.link.trim()) completedFields++
    if (formData.deadline) completedFields++
    if (selectedManager) completedFields++
    if (selectedUsers.length > 0) completedFields++

    const progress = (completedFields / totalFields) * 100
    setFormProgress(progress)
  }, [formData, selectedUsers, selectedManager])

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
        user.roles?.some((role) => role.toLowerCase().includes(searchTermLower)),
    )
    setFilteredUsers(filtered)
  }, [searchTerm, allUsers])

  useEffect(() => {
    if (!managerSearchTerm.trim()) {
      setFilteredManagers(managers)
      return
    }

    const searchTermLower = managerSearchTerm.toLowerCase()
    const filtered = managers.filter(
      (manager) =>
        manager.username?.toLowerCase().includes(managerSearchTerm) ||
        manager.email?.toLowerCase().includes(managerSearchTerm) ||
        manager.roles?.some((role) => role.toLowerCase().includes(managerSearchTerm)),
    )
    setFilteredManagers(filtered)
  }, [managerSearchTerm, managers])

  const loadAllUsers = async () => {
    try {
      setIsLoadingUsers(true)
      setApiError("")

      const response = await getAllUsers(1, 1000)
      const users = response.users || []

      // Filter managers (users with manager roles) - Fixed logic
      const managerRoles = ["Admin", "Manager", "Project Manager", "Business Manager", "Department Manager"]
      const managerUsers = users.filter((user) => {
        // Check if user has ANY manager role
        return user.roles && user.roles.some((role) => managerRoles.includes(role))
      })

      console.log("All users:", users.length)
      console.log("Manager users found:", managerUsers.length)
      console.log(
        "Manager users:",
        managerUsers.map((u) => ({ username: u.username, roles: u.roles })),
      )

      setAllUsers(users)
      setManagers(managerUsers)
      setFilteredUsers(users)
      setFilteredManagers(managerUsers)
    } catch (error) {
      console.error("Error loading users:", error)
      setApiError("Failed to load users. Please try again.")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const validateStep = (stepIndex) => {
    const newErrors = {}
    const step = steps[stepIndex]

    if (step.fields.includes("title")) {
      if (!formData.title.trim()) {
        newErrors.title = "Title is required"
      } else if (formData.title.length > 200) {
        newErrors.title = "Title must be less than 200 characters"
      }
    }

    if (step.fields.includes("link")) {
      if (!formData.link.trim()) {
        newErrors.link = "Link is required"
      }
    }

    if (step.fields.includes("deadline")) {
      if (!formData.deadline) {
        newErrors.deadline = "Deadline is required"
      } else if (new Date(formData.deadline) <= new Date()) {
        newErrors.deadline = "Deadline must be in the future"
      }
    }

    if (step.fields.includes("comment")) {
      if (formData.comment && formData.comment.length > 1000) {
        newErrors.comment = "Comment must be less than 1000 characters"
      }
    }

    if (step.fields.includes("managers")) {
      if (!selectedManager) {
        newErrors.managers = "A manager must be selected for approval"
      }
    }

    if (step.fields.includes("usersToSign")) {
      if (selectedUsers.length === 0) {
        newErrors.usersToSign = "At least one signer must be selected"
      }
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

  const handleManagerSelect = (manager) => {
    setSelectedManager(manager)
    if (errors.managers) {
      setErrors((prev) => ({ ...prev, managers: "" }))
    }
    setShowManagerSelector(false) // Close selector after selection
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    // Validate all steps first
    for (let i = 0; i <= 3; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i)
        return
      }
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
        managersToApprove: [selectedManager._id],
      }

      console.log("Submitting data:", submitData)
      console.log("Selected managers:", selectedManager)

      await createSharePoint(submitData)

      setSubmitSuccess(true)
      toast({
        title: "🎉 Success!",
        description: "SharePoint document created successfully! Notifications sent to all assigned users.",
      })

      setTimeout(() => {
        navigate("/sharepoint")
      }, 2000)
    } catch (error) {
      console.error("Error creating SharePoint:", error)
      setApiError(
        error.response?.data?.error || error.message || "Failed to create SharePoint document. Please try again.",
      )
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to create SharePoint document.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate("/sharepoint")
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8 overflow-x-auto">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = index === currentStep
        const isCompleted = index < currentStep
        const isAccessible = index <= currentStep

        return (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <button
                onClick={() => isAccessible && setCurrentStep(index)}
                disabled={!isAccessible}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                      ? "border-primary text-primary bg-primary/10"
                      : "border-muted-foreground/30 text-muted-foreground",
                  isAccessible && "hover:border-primary/50 cursor-pointer",
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </button>
              <div className="mt-2 text-center">
                <p className={cn("text-sm font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground max-w-24">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-16 h-0.5 mx-4 transition-colors duration-200",
                  index < currentStep ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )

  const UserSelector = () => (
    <Popover open={showUserSelector} onOpenChange={setShowUserSelector}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={showUserSelector}
          className="justify-between w-full bg-transparent"
        >
          {selectedUsers.length > 0
            ? `${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""} selected`
            : "Select users to sign..."}
          <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." value={searchTerm} onValueChange={setSearchTerm} />
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

  const ManagerSelector = () => (
    <Popover open={showManagerSelector} onOpenChange={setShowManagerSelector}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={showManagerSelector}
          className="justify-between w-full bg-transparent"
        >
          {selectedManager ? selectedManager.username : "Select a manager to approve..."}
          <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search managers..."
            value={managerSearchTerm}
            onValueChange={setManagerSearchTerm}
          />
          <CommandEmpty>No managers found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <ScrollArea className="h-64">
                {filteredManagers.map((manager) => {
                  const isSelected = selectedManager?._id === manager._id
                  return (
                    <CommandItem
                      key={manager._id}
                      onSelect={() => handleManagerSelect(manager)}
                      className="flex items-center gap-2 p-2"
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border border-primary",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50",
                        )}
                      >
                        {isSelected && <div className="w-2 h-2 bg-current rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3 text-blue-600" />
                          <p className="text-sm font-medium">{manager.username}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{manager.email}</p>
                        {manager.roles && manager.roles.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {manager.roles.slice(0, 2).map((role) => (
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
                  Back to Documents
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Create SharePoint Document</h1>
                <p className="text-muted-foreground">Share documents with your team for review and approval</p>
              </div>
            </motion.div>

            {/* Progress Bar */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
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
                    <AlertDescription>Document created successfully! Redirecting to documents list...</AlertDescription>
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
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step Indicator */}
            <motion.div variants={itemVariants}>
              <StepIndicator />
            </motion.div>

            {/* Form Content */}
            <motion.div variants={cardVariants}>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <AnimatePresence mode="wait">
                    {/* Step 0: Document Details */}
                    {currentStep === 0 && (
                      <motion.div
                        key="step-0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold">Document Details</h2>
                          <p className="text-muted-foreground">
                            Provide the essential information about your SharePoint document
                          </p>
                        </div>

                        <div className="space-y-6">
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
                            <p className="text-xs text-muted-foreground">
                              You can enter a web URL or a local file path (e.g., C:\Documents\file.pdf)
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 1: Timeline & Notes */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold">Timeline & Notes</h2>
                          <p className="text-muted-foreground">Set the deadline and add any additional context</p>
                        </div>

                        <div className="space-y-6">
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
                              <span className="ml-auto text-xs text-muted-foreground">
                                {formData.comment.length}/1000
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Select Approvers */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold">Select Approvers</h2>
                          <p className="text-muted-foreground">
                            Choose a manager who must approve this document before users can sign it. Only approved
                            documents can be signed by assigned users.
                          </p>
                          {/* Debug info */}
                          <div className="p-2 text-xs bg-gray-100 rounded">
                            <p>Debug: {managers.length} managers available</p>
                            <p>Debug: {selectedManager ? "1" : "0"} manager selected</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Managers to Approve *</Label>
                            <ManagerSelector />
                            {errors.managers && (
                              <p className="flex items-center gap-1 text-sm text-destructive">
                                <AlertCircle className="w-3 h-3" />
                                {errors.managers}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Only users with manager roles (Admin, Manager, Project Manager, Business Manager,
                              Department Manager) are shown here
                            </p>
                          </div>

                          {/* Selected Managers */}
                          {selectedManager && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Selected Approver</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedManager(null)}
                                  className="h-auto p-1 text-xs"
                                >
                                  Clear
                                </Button>
                              </div>
                              <div className="grid gap-2">
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                      <Shield className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{selectedManager.username}</p>
                                      <p className="text-xs text-muted-foreground">{selectedManager.email}</p>
                                      <div className="flex gap-1 mt-1">
                                        {selectedManager.roles?.slice(0, 3).map((role) => (
                                          <Badge key={role} variant="secondary" className="text-xs">
                                            {role}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedManager(null)}
                                    className="h-auto p-1"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Select Signers */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold">Select Signers</h2>
                          <p className="text-muted-foreground">
                            Choose team members who need to review and sign this document
                          </p>
                        </div>

                        <div className="space-y-6">
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
                                  className="h-auto p-1 text-xs"
                                >
                                  Clear All
                                </Button>
                              </div>
                              \
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
                      </motion.div>
                    )}

                    {/* Step 4: Review & Submit */}
                    {currentStep === 4 && (
                      <motion.div
                        key="step-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold">Review & Submit</h2>
                          <p className="text-muted-foreground">
                            Please review all details before creating the document
                          </p>
                        </div>

                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Document Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                                  <p className="text-sm">{formData.title}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">Deadline</Label>
                                  <p className="text-sm">
                                    {formData.deadline ? new Date(formData.deadline).toLocaleString() : "Not set"}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Link/Path</Label>
                                <p className="text-sm break-all">{formData.link}</p>
                              </div>
                              {formData.comment && (
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">Comments</Label>
                                  <p className="text-sm">{formData.comment}</p>
                                </div>
                              )}

                              <Separator />

                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Approver</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {selectedManager && (
                                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                      <Shield className="w-3 h-3 mr-1" />
                                      {selectedManager.username}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">
                                  Registered Signers ({selectedUsers.length})
                                </Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {selectedUsers.map((user) => (
                                    <Badge key={user._id} variant="secondary">
                                      {user.username}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-8 mt-8 border-t">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex gap-2">
                      {currentStep < steps.length - 1 ? (
                        <Button onClick={nextStep} className="flex items-center gap-2">
                          Next
                          <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Button>
                      ) : (
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Create Document
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
