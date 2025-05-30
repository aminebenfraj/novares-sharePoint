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

export default function EditUserRoles() {
  const { license } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    image: "",
    roles: [],
  })

  const [originalData, setOriginalData] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchRole, setSearchRole] = useState("")
  const [activeTab, setActiveTab] = useState("user-info")
  const [hasChanges, setHasChanges] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

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
      // Update user profile
      await adminUpdateUser(license, {
        username: formData.username,
        email: formData.email,
        image: formData.image,
      })

      // Update user roles
      await updateUserRoles(license, formData.roles)

      setSuccessMessage("User updated successfully!")
      setOriginalData({ ...formData })
      setHasChanges(false)

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
    if (hasChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        navigate("/admin")
      }
    } else {
      navigate("/admin")
    }
  }

  const resetForm = () => {
    setFormData({ ...originalData })
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

                      <motion.div variants={slideUp} className="space-y-2">
                        <Label htmlFor="image" className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          Profile Image URL
                        </Label>
                        <div className="flex max-w-md gap-2">
                          <Input
                            id="image"
                            name="image"
                            value={formData.image || ""}
                            onChange={handleChange}
                            placeholder="https://example.com/avatar.jpg"
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                                  disabled={!formData.image}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clear image URL</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-xs text-muted-foreground">Leave empty to use system default avatar</p>
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

                    {hasChanges && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Reset Changes
                      </Button>
                    )}

                    <Button type="submit" disabled={submitting || !hasChanges} className="gap-2">
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

