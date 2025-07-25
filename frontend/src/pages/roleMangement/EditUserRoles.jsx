"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  User,
  Mail,
  ImageIcon,
  Shield,
  Save,
  Loader2,
  CheckCircle,
  Search,
  X,
  AlertTriangle,
  Info,
  Lock,
  Eye,
  EyeOff,
  Key,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

// Import API functions
import { getUserByLicense, adminUpdateUser } from "../../apis/admin"
import { updateUserRoles } from "../../apis/userApi"

// Import MainLayout
import MainLayout from "../../components/MainLayout"

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

// Role categories for organization based on the backend roles
const roleCategories = {
  Management: ["Admin",
     "Manager", 
     "Project Manager", 
     "Operations director",
     "Plant manager",
     "Engineering Manager",
    "Business Manager",
    "Production Manager",
    "Controlling Manager",
    "Financial Manager",
    "Purchasing Manager",
    "Logistic Manager",
    "Quality Manager",
    "Human Resources Manager",
    "Maintenance Manager",
],
  Logistics: [
    "Direction Assistant",
    "Engineering Staff",
    "Business Staff",
    "Production Staff",
    "Controlling Staff",
    "Financial Staff",
    "Purchasing Staff",
    "Logistics Staff",
    "Quality Staff",
    "Human Resources Staff",
    "Maintenance Staff",
     "Health & Safety Staff", 
     "Informatic Systems Staff"
  ],
  Other: ["Customer", "User", ],
}

export default function EditUserRoles() {
  const { license } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    image: "",
    roles: [],
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  const [originalData, setOriginalData] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchRole, setSearchRole] = useState("")
  const [activeTab, setActiveTab] = useState("user-info")
  const [hasChanges, setHasChanges] = useState(false)
  const [hasPasswordChanges, setHasPasswordChanges] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Password validation states
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [activeTooltip, setActiveTooltip] = useState(false)

  // Password validation checks
  const hasMinLength = passwordData.newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(passwordData.newPassword)
  const hasLowercase = /[a-z]/.test(passwordData.newPassword)
  const hasNumber = /[0-9]/.test(passwordData.newPassword)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(passwordData.newPassword)
  const passwordsMatch =
    passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length > 0

  // Calculate password strength
  useEffect(() => {
    if (passwordData.newPassword.length === 0) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    if (hasMinLength) strength += 20
    if (hasUppercase) strength += 20
    if (hasLowercase) strength += 20
    if (hasNumber) strength += 20
    if (hasSpecialChar) strength += 20

    setPasswordStrength(strength)
  }, [passwordData.newPassword, hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar])

  // Check for password changes
  useEffect(() => {
    setHasPasswordChanges(passwordData.newPassword.length > 0 || passwordData.confirmPassword.length > 0)
  }, [passwordData])

  // Get strength color
  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500"
    if (passwordStrength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  // Get strength text
  const getStrengthText = () => {
    if (passwordStrength < 40) return "Weak"
    if (passwordStrength < 80) return "Medium"
    return "Strong"
  }

  // Validate password before submission
  const validatePassword = () => {
    if (!passwordData.newPassword && !passwordData.confirmPassword) {
      return null // No password change requested
    }

    if (!passwordData.newPassword) {
      return "New password is required"
    }
    if (!hasMinLength) {
      return "Password must be at least 8 characters long"
    }
    if (!hasUppercase) {
      return "Password must contain at least one uppercase letter"
    }
    if (!hasLowercase) {
      return "Password must contain at least one lowercase letter"
    }
    if (!hasNumber) {
      return "Password must contain at least one number"
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character"
    }
    if (!passwordsMatch) {
      return "Passwords do not match"
    }
    return null
  }

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)

        const data = await getUserByLicense(license)

        setFormData({
          username: data.username || "",
          email: data.email || "",
          image: data.image || "",
          roles: data.roles || [],
        })

        setOriginalData({
          username: data.username || "",
          email: data.email || "",
          image: data.image || "",
          roles: data.roles || [],
        })
      } catch (error) {
        console.error("Error fetching user:", error)
        setErrorMessage("Failed to load user data. Please try again.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user data.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [license])

  // Check for changes in form data
  useEffect(() => {
    if (loading) return

    const checkChanges = () => {
      if (formData.username !== originalData.username) return true
      if (formData.email !== originalData.email) return true
      if (formData.image !== originalData.image) return true

      if (formData.roles.length !== originalData.roles.length) return true

      for (const role of formData.roles) {
        if (!originalData.roles.includes(role)) return true
      }

      return false
    }

    setHasChanges(checkChanges())
  }, [formData, originalData, loading])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleRole = (role) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      // Validate password if changing
      if (hasPasswordChanges) {
        const passwordError = validatePassword()
        if (passwordError) {
          toast({
            variant: "destructive",
            title: "Password Validation Error",
            description: passwordError,
          })
          setSubmitting(false)
          return
        }
      }

      // Update user profile
      const updateData = {
        username: formData.username,
        email: formData.email,
        image: formData.image,
      }

      // Add password to update if changing
      if (hasPasswordChanges && passwordData.newPassword) {
        updateData.password = passwordData.newPassword
      }

      await adminUpdateUser(license, updateData)

      // Update user roles
      await updateUserRoles(license, formData.roles)

      setSuccessMessage("User updated successfully!")
      setOriginalData({ ...formData })
      setHasChanges(false)
      setPasswordData({ newPassword: "", confirmPassword: "" })
      setHasPasswordChanges(false)
      setPasswordStrength(0)

      toast({
        title: "Success",
        description: "User updated successfully!",
      })

      // Redirect after a delay
      setTimeout(() => {
        navigate("/admin")
      }, 2000)
    } catch (error) {
      console.error("Error updating user:", error)
      setErrorMessage(error.response?.data?.error || "Failed to update user. Please try again.")

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges || hasPasswordChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        navigate("/admin")
      }
    } else {
      navigate("/admin")
    }
  }

  const resetForm = () => {
    setFormData({ ...originalData })
    setPasswordData({ newPassword: "", confirmPassword: "" })
  }

  // Filter roles based on search term
  const getFilteredRoles = (category) => {
    return roleCategories[category].filter((role) => role.toLowerCase().includes(searchRole.toLowerCase()))
  }

  // Check if any roles in a category match the search
  const categoryHasMatch = (category) => {
    return getFilteredRoles(category).length > 0
  }

  if (loading) {
    return (
      <div className="container max-w-4xl p-6 mx-auto">
        <div className="flex items-center mb-6">
          <Skeleton className="w-10 h-10 mr-4" />
          <Skeleton className="h-8 w-[200px]" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="w-full h-10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="w-full h-10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="w-full h-10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-[100px] mr-2" />
            <Skeleton className="h-10 w-[100px]" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl p-6 mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleCancel} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
              <p className="text-sm text-muted-foreground">
                License ID: <span className="font-medium">{license}</span>
              </p>
            </div>
          </div>

          {/* Success and error messages */}
          {successMessage && (
            <Alert variant="default" className="text-green-800 border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Main content */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/10">
                  <AvatarImage src={formData.image || "/placeholder.svg?height=64&width=64"} alt={formData.username} />
                  <AvatarFallback className="text-lg">
                    {formData.username ? formData.username.substring(0, 2).toUpperCase() : "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{formData.username}</CardTitle>
                  <CardDescription>{formData.email}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <Tabs defaultValue="user-info" value={activeTab} onValueChange={setActiveTab}>
              <CardContent>
                <TabsList className="mb-6">
                  <TabsTrigger value="user-info" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    User Information
                  </TabsTrigger>
                  <TabsTrigger value="password" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Change Password
                  </TabsTrigger>
                  <TabsTrigger value="roles" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Roles & Permissions
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit}>
                  <TabsContent value="user-info" className="space-y-6">
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
                      <motion.div variants={slideUp} className="space-y-2">
                        <Label htmlFor="username" className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          Username
                        </Label>
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          className="max-w-md"
                        />
                      </motion.div>

                      <motion.div variants={slideUp} className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="max-w-md"
                        />
                      </motion.div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="password" className="space-y-6">
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
                      <Alert variant="default" className="border-blue-200 bg-blue-50">
                        <Info className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Leave password fields empty if you don't want to change the user's password.
                        </AlertDescription>
                      </Alert>

                      <motion.div variants={slideUp} className="space-y-2">
                        <div className="flex items-center">
                          <Label htmlFor="newPassword" className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            New Password
                          </Label>
                          <TooltipProvider>
                            <Tooltip open={activeTooltip} onOpenChange={setActiveTooltip}>
                              <TooltipTrigger asChild>
                                <Info
                                  className="w-4 h-4 ml-2 text-blue-500 cursor-pointer"
                                  onClick={() => setActiveTooltip(!activeTooltip)}
                                />
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="w-64 p-3 space-y-2 bg-white border border-gray-200 rounded-lg shadow-lg"
                              >
                                <p className="font-medium text-gray-800">Password requirements:</p>
                                <ul className="pl-5 space-y-1 text-xs text-gray-600 list-disc">
                                  <li className={hasMinLength ? "text-green-600" : ""}>At least 8 characters</li>
                                  <li className={hasUppercase ? "text-green-600" : ""}>One uppercase letter (A-Z)</li>
                                  <li className={hasLowercase ? "text-green-600" : ""}>One lowercase letter (a-z)</li>
                                  <li className={hasNumber ? "text-green-600" : ""}>One number (0-9)</li>
                                  <li className={hasSpecialChar ? "text-green-600" : ""}>
                                    One special character (!@#$%^&*)
                                  </li>
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="relative max-w-md">
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            onFocus={() => setActiveTooltip(true)}
                            onBlur={() => setActiveTooltip(false)}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute transform -translate-y-1/2 right-3 top-1/2"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>

                        {/* Password strength indicator */}
                        {passwordData.newPassword.length > 0 && (
                          <div className="max-w-md mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Password strength:</span>
                              <span
                                className={`text-xs font-medium ${
                                  passwordStrength < 40
                                    ? "text-red-500"
                                    : passwordStrength < 80
                                      ? "text-yellow-500"
                                      : "text-green-500"
                                }`}
                              >
                                {getStrengthText()}
                              </span>
                            </div>
                            <Progress
                              value={passwordStrength}
                              className="h-1.5 bg-gray-200"
                              indicatorClassName={getStrengthColor()}
                            />
                          </div>
                        )}

                        {/* Password validation feedback */}
                        {passwordData.newPassword.length > 0 && (
                          <div className="max-w-md mt-2 space-y-1">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className={`flex items-center ${hasMinLength ? "text-green-600" : "text-red-500"}`}>
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${hasMinLength ? "bg-green-500" : "bg-red-500"}`}
                                />
                                8+ characters
                              </div>
                              <div className={`flex items-center ${hasUppercase ? "text-green-600" : "text-red-500"}`}>
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${hasUppercase ? "bg-green-500" : "bg-red-500"}`}
                                />
                                Uppercase
                              </div>
                              <div className={`flex items-center ${hasLowercase ? "text-green-600" : "text-red-500"}`}>
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${hasLowercase ? "bg-green-500" : "bg-red-500"}`}
                                />
                                Lowercase
                              </div>
                              <div className={`flex items-center ${hasNumber ? "text-green-600" : "text-red-500"}`}>
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${hasNumber ? "bg-green-500" : "bg-red-500"}`}
                                />
                                Number
                              </div>
                              <div
                                className={`flex items-center ${hasSpecialChar ? "text-green-600" : "text-red-500"}`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${hasSpecialChar ? "bg-green-500" : "bg-red-500"}`}
                                />
                                Special char
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>

                      <motion.div variants={slideUp} className="space-y-2">
                        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                          Confirm New Password
                        </Label>
                        <div className="relative max-w-md">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute transform -translate-y-1/2 right-3 top-1/2"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>

                        {/* Password match indicator */}
                        {passwordData.confirmPassword.length > 0 && (
                          <div className="max-w-md">
                            <div
                              className={`flex items-center text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${passwordsMatch ? "bg-green-500" : "bg-red-500"}`}
                              />
                              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="roles" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-base font-medium">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          Assigned Roles
                        </Label>
                        <div className="relative w-[250px]">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Search roles..."
                            value={searchRole}
                            onChange={(e) => setSearchRole(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <Alert variant="default" className="border-blue-200 bg-blue-50">
                        <Info className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Select the roles you want to assign to this user. Users can have multiple roles.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {Object.entries(roleCategories).map(
                          ([category, roles]) =>
                            categoryHasMatch(category) && (
                              <motion.div key={category} variants={slideUp} className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">{category}</h3>
                                <div className="border rounded-md p-3 space-y-2 bg-background min-h-[100px]">
                                  {getFilteredRoles(category).map((role) => (
                                    <div key={role} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        id={`role-${role}`}
                                        checked={formData.roles.includes(role)}
                                        onChange={() => toggleRole(role)}
                                        className="w-4 h-4 mr-2 border-gray-300 rounded text-primary focus:ring-primary"
                                      />
                                      <Label htmlFor={`role-${role}`} className="flex-1 text-sm cursor-pointer">
                                        {role}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            ),
                        )}
                      </div>

                      <div className="mt-4">
                        <h3 className="mb-2 text-sm font-medium">Current Roles</h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.roles.length > 0 ? (
                            formData.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                {role}
                                <button
                                  type="button"
                                  onClick={() => toggleRole(role)}
                                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                  <span className="sr-only">Remove {role} role</span>
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No roles assigned</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <Separator className="my-6" />

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>

                    {(hasChanges || hasPasswordChanges) && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Reset Changes
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting || (!hasChanges && !hasPasswordChanges)}
                      className="gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
}
