"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Search,
  Trash2,
  Edit,
  MoreHorizontal,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  Info,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Import API functions
import { getAllUsers, getAdminUsers, createUser, deleteUser, getUserStats } from "../../apis/admin"
import { getRecentUsers } from "../../apis/userApi"

// Import the debounce hook
import { useDebounce } from "../../components/use-debounce"

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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Updated role categories - CONSISTENT WITH BACKEND
const roleCategories = {
  Management: [
    "Admin",
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
  Staff: [
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
    "Informatic Systems Staff",
  ],
  Other: ["Customer", "User"],
}

// All roles flattened
const allRoles = Object.values(roleCategories).flat()

export default function AdminDashboard() {
  // Separate state for all users and admin users
  const [allUsers, setAllUsers] = useState([])
  const [adminUsers, setAdminUsers] = useState([])

  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    managerUsers: 0,
    customerUsers: 0,
    recentlyAdded: 0,
  })

  const [loading, setLoading] = useState(true)
  const [adminLoading, setAdminLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState("")

  // Separate search terms for each tab
  const [allUsersSearchTerm, setAllUsersSearchTerm] = useState("")
  const [adminUsersSearchTerm, setAdminUsersSearchTerm] = useState("")

  const [roleFilter, setRoleFilter] = useState("all")

  // Separate pagination for each tab
  const [allUsersCurrentPage, setAllUsersCurrentPage] = useState(1)
  const [allUsersTotalPages, setAllUsersTotalPages] = useState(1)
  const [allUsersTotalCount, setAllUsersTotalCount] = useState(0)

  const [adminUsersCurrentPage, setAdminUsersCurrentPage] = useState(1)
  const [adminUsersTotalPages, setAdminUsersTotalPages] = useState(1)
  const [adminUsersTotalCount, setAdminUsersTotalCount] = useState(0)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("all-users")
  const [refreshing, setRefreshing] = useState(false)
  const [recentUsers, setRecentUsers] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Use debounced search terms
  const debouncedAllUsersSearchTerm = useDebounce(allUsersSearchTerm, 500)
  const debouncedAdminUsersSearchTerm = useDebounce(adminUsersSearchTerm, 500)

  // Password validation states
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [activeTooltip, setActiveTooltip] = useState(false)

  const [newUserData, setNewUserData] = useState({
    license: "",
    username: "",
    email: "",
    password: "",
    roles: ["User"],
  })

  const ITEMS_PER_PAGE = 10

  // Password validation checks
  const hasMinLength = newUserData.password.length >= 8
  const hasUppercase = /[A-Z]/.test(newUserData.password)
  const hasLowercase = /[a-z]/.test(newUserData.password)
  const hasNumber = /[0-9]/.test(newUserData.password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newUserData.password)

  // Calculate password strength
  useEffect(() => {
    if (newUserData.password.length === 0) {
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
  }, [newUserData.password, hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar])

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
    if (!newUserData.password) {
      return "Password is required"
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
    return null
  }

  // Fetch all users when component mounts, page changes, or search/filter changes
  useEffect(() => {
    if (activeTab === "all-users") {
      fetchAllUsers()
    }
  }, [allUsersCurrentPage, debouncedAllUsersSearchTerm, roleFilter, activeTab])

  // Fetch admin users when admin tab is active
  useEffect(() => {
    if (activeTab === "admin-users") {
      fetchAdminUsers()
    }
  }, [adminUsersCurrentPage, debouncedAdminUsersSearchTerm, activeTab])

  // Reset to page 1 when search or filter changes for all users
  useEffect(() => {
    if (allUsersCurrentPage !== 1) {
      setAllUsersCurrentPage(1)
    }
  }, [debouncedAllUsersSearchTerm, roleFilter])

  // Reset to page 1 when search changes for admin users
  useEffect(() => {
    if (adminUsersCurrentPage !== 1) {
      setAdminUsersCurrentPage(1)
    }
  }, [debouncedAdminUsersSearchTerm])

  // Fetch user stats and recent users
  useEffect(() => {
    fetchUserStats()
    fetchRecentUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      setIsSearching(debouncedAllUsersSearchTerm.length > 0)

      const response = await getAllUsers(allUsersCurrentPage, ITEMS_PER_PAGE, debouncedAllUsersSearchTerm, roleFilter)

      setAllUsers(response.users)
      setAllUsersTotalPages(response.pagination.totalPages)
      setAllUsersTotalCount(response.pagination.totalUsers)
      setError("")
    } catch (err) {
      console.error("Error fetching all users:", err)
      setError("Failed to load users. Please try again.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users.",
      })
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  const fetchAdminUsers = async () => {
    try {
      setAdminLoading(true)
      setIsSearching(debouncedAdminUsersSearchTerm.length > 0)

      const response = await getAdminUsers(adminUsersCurrentPage, ITEMS_PER_PAGE, debouncedAdminUsersSearchTerm)

      setAdminUsers(response.users)
      setAdminUsersTotalPages(response.pagination.totalPages)
      setAdminUsersTotalCount(response.pagination.totalUsers)
      setError("")
    } catch (err) {
      console.error("Error fetching admin users:", err)
      setError("Failed to load admin users. Please try again.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin users.",
      })
    } finally {
      setAdminLoading(false)
      setIsSearching(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true)
      const stats = await getUserStats()
      setUserStats({
        totalUsers: stats.totalUsers || 0,
        adminUsers: stats.adminUsers || 0,
        managerUsers: stats.managerUsers || 0,
        customerUsers: stats.customerUsers || 0,
        recentlyAdded: stats.recentlyAdded || 0,
      })
    } catch (err) {
      console.error("Error fetching user stats:", err)
      setUserStats({
        totalUsers: 0,
        adminUsers: 0,
        managerUsers: 0,
        customerUsers: 0,
        recentlyAdded: 0,
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchRecentUsers = async () => {
    try {
      const data = await getRecentUsers()
      setRecentUsers(data)
    } catch (err) {
      console.error("Error fetching recent users:", err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const promises = [fetchUserStats(), fetchRecentUsers()]

      if (activeTab === "all-users") {
        promises.push(fetchAllUsers())
      } else {
        promises.push(fetchAdminUsers())
      }

      await Promise.all(promises)

      toast({
        title: "Success",
        description: "User data refreshed successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh user data.",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const passwordError = validatePassword()
    if (passwordError) {
      toast({
        variant: "destructive",
        title: "Password Validation Error",
        description: passwordError,
      })
      setIsSubmitting(false)
      return
    }

    try {
      await createUser(newUserData)

      // Refresh both tabs and stats
      await Promise.all([fetchAllUsers(), fetchAdminUsers(), fetchUserStats()])

      setIsCreateModalOpen(false)
      setNewUserData({
        license: "",
        username: "",
        email: "",
        password: "",
        roles: ["User"],
      })
      setPasswordStrength(0)

      toast({
        title: "Success",
        description: "User created successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to create user.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (license) => {
    try {
      await deleteUser(license)

      // Refresh both tabs and stats
      await Promise.all([fetchAllUsers(), fetchAdminUsers(), fetchUserStats()])

      toast({
        title: "Success",
        description: "User deleted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to delete user.",
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewUserData({ ...newUserData, [name]: value })
  }

  const toggleRole = (role) => {
    setNewUserData((prevData) => ({
      ...prevData,
      roles: prevData.roles.includes(role) ? prevData.roles.filter((r) => r !== role) : [...prevData.roles, role],
    }))
  }

  const clearAllUsersSearch = () => {
    setAllUsersSearchTerm("")
    setRoleFilter("all")
  }

  const clearAdminUsersSearch = () => {
    setAdminUsersSearchTerm("")
  }

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value)
    setError("") // Clear any errors when switching tabs
  }

  // Get current search term based on active tab
  const getCurrentSearchTerm = () => {
    return activeTab === "all-users" ? allUsersSearchTerm : adminUsersSearchTerm
  }

  const getCurrentDebouncedSearchTerm = () => {
    return activeTab === "all-users" ? debouncedAllUsersSearchTerm : debouncedAdminUsersSearchTerm
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Render user table rows
  const renderUserRows = (users, isLoading) => {
    if (isLoading) {
      return [...Array(5)].map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-32 h-3" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="w-16 h-4" />
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
    }

    if (users.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            {getCurrentDebouncedSearchTerm() || (activeTab === "all-users" && roleFilter !== "all")
              ? "No users found matching your search criteria."
              : activeTab === "admin-users"
                ? "No admin users found."
                : "No users found."}
          </TableCell>
        </TableRow>
      )
    }

    return (
      <AnimatePresence>
        {users.map((user, index) => (
          <motion.tr
            key={user.license}
            custom={index}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={tableRowVariants}
            className="group"
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.image || "/placeholder.svg?height=32&width=32"} alt={user.username} />
                  <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </TableCell>
            <TableCell>{user.license}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {user.roles.slice(0, 2).map((role, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
                {user.roles.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{user.roles.length - 2}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm">{formatDate(user.createdAt)}</span>
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
                    <DropdownMenuItem asChild>
                      <Link to={`/admin/edit-user/${user.license}`} className="cursor-pointer">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${user.username}?`)) {
                          handleDelete(user.license)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </motion.tr>
        ))}
      </AnimatePresence>
    )
  }

  // Render pagination
  const renderPagination = (currentPage, totalPages, setCurrentPage, totalCount, isLoading) => {
    if (totalPages <= 1) return null

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
            />
          </PaginationItem>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
            const pageNum = i + 1
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => setCurrentPage(pageNum)}
                  isActive={currentPage === pageNum}
                  disabled={isLoading}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          })}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <PaginationItem>
                <span className="px-3 py-2 text-sm">...</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)} disabled={isLoading}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  // Render loading skeletons for initial load
  if (loading && allUsers.length === 0 && activeTab === "all-users") {
    return (
      <div className="container p-6 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-4">
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
        </div>

        <Skeleton className="w-full h-10 mb-6" />

        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-16" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="container p-6 mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col gap-6">
          {/* Header with title and create button */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Manage users, roles, and permissions</p>
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
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system. They will receive an email with login instructions.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleCreateUser} className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="e.g., johndoe"
                        value={newUserData.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="e.g., john.doe@example.com"
                        value={newUserData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
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
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={newUserData.password}
                          onChange={handleInputChange}
                          onFocus={() => setActiveTooltip(true)}
                          onBlur={() => setActiveTooltip(false)}
                          className="pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute transform -translate-y-1/2 right-3 top-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>

                      {/* Password strength indicator */}
                      {newUserData.password.length > 0 && (
                        <div className="mt-2">
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
                      {newUserData.password.length > 0 && (
                        <div className="mt-2 space-y-1">
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
                            <div className={`flex items-center ${hasSpecialChar ? "text-green-600" : "text-red-500"}`}>
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${hasSpecialChar ? "bg-green-500" : "bg-red-500"}`}
                              />
                              Special char
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Assign Roles</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                        {Object.entries(roleCategories).map(([category, roles]) => (
                          <div key={category} className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">{category}</p>
                            <div className="grid grid-cols-1 gap-1">
                              {roles.map((role) => (
                                <div key={role} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`role-${role}`}
                                    checked={newUserData.roles.includes(role)}
                                    onChange={() => toggleRole(role)}
                                    className="w-4 h-4 mr-2 border-gray-300 rounded text-primary focus:ring-primary"
                                  />
                                  <Label htmlFor={`role-${role}`} className="text-sm cursor-pointer">
                                    {role}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting || passwordStrength < 100}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create User"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 sm:grid-cols-4"
          >
            <motion.div variants={slideUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="w-16 h-8" /> : userStats.totalUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statsLoading ? (
                      <Skeleton className="w-24 h-3" />
                    ) : userStats.totalUsers > 0 ? (
                      `${userStats.recentlyAdded} recently added`
                    ) : (
                      "No users"
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="w-16 h-8" /> : userStats.adminUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statsLoading ? (
                      <Skeleton className="w-24 h-3" />
                    ) : userStats.totalUsers > 0 ? (
                      `${Math.round((userStats.adminUsers / userStats.totalUsers) * 100)}% of total users`
                    ) : (
                      "No users"
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Manager Users</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="w-16 h-8" /> : userStats.managerUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statsLoading ? (
                      <Skeleton className="w-24 h-3" />
                    ) : userStats.totalUsers > 0 ? (
                      `${Math.round((userStats.managerUsers / userStats.totalUsers) * 100)}% of total users`
                    ) : (
                      "No users"
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={slideUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Customer Users</CardTitle>
                  <Users className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="w-16 h-8" /> : userStats.customerUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statsLoading ? (
                      <Skeleton className="w-24 h-3" />
                    ) : userStats.totalUsers > 0 ? (
                      `${Math.round((userStats.customerUsers / userStats.totalUsers) * 100)}% of total users`
                    ) : (
                      "No users"
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Tabs and filters */}
          <Tabs defaultValue="all-users" value={activeTab} onValueChange={handleTabChange}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <TabsList>
                <TabsTrigger value="all-users">
                  All Users ({allUsersTotalCount})
                  {(debouncedAllUsersSearchTerm || roleFilter !== "all") && " - Filtered"}
                </TabsTrigger>
                <TabsTrigger value="admin-users">
                  Admins ({adminUsersTotalCount}){debouncedAdminUsersSearchTerm && " - Filtered"}
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={
                      activeTab === "all-users" ? "Search all users in database..." : "Search admin users..."
                    }
                    className="w-full pl-9 pr-10 sm:w-[250px] md:w-[300px]"
                    value={getCurrentSearchTerm()}
                    onChange={(e) => {
                      if (activeTab === "all-users") {
                        setAllUsersSearchTerm(e.target.value)
                      } else {
                        setAdminUsersSearchTerm(e.target.value)
                      }
                    }}
                  />
                  {(getCurrentSearchTerm() || isSearching) && (
                    <div className="absolute right-2.5 top-2.5">
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeTab === "all-users") {
                              setAllUsersSearchTerm("")
                            } else {
                              setAdminUsersSearchTerm("")
                            }
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {activeTab === "all-users" && (
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {allRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {((activeTab === "all-users" && (debouncedAllUsersSearchTerm || roleFilter !== "all")) ||
                  (activeTab === "admin-users" && debouncedAdminUsersSearchTerm)) && (
                  <Button
                    variant="outline"
                    onClick={activeTab === "all-users" ? clearAllUsersSearch : clearAdminUsersSearch}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}

                <Button variant="outline" className="bg-transparent" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Search/Filter status */}
            {((activeTab === "all-users" && (debouncedAllUsersSearchTerm || roleFilter !== "all")) ||
              (activeTab === "admin-users" && debouncedAdminUsersSearchTerm)) && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {activeTab === "all-users"
                    ? debouncedAllUsersSearchTerm && roleFilter !== "all"
                      ? `Showing results for "${debouncedAllUsersSearchTerm}" with role "${roleFilter}" - ${allUsersTotalCount} users found`
                      : debouncedAllUsersSearchTerm
                        ? `Showing search results for "${debouncedAllUsersSearchTerm}" - ${allUsersTotalCount} users found`
                        : `Showing users with role "${roleFilter}" - ${allUsersTotalCount} users found`
                    : `Showing admin search results for "${debouncedAdminUsersSearchTerm}" - ${adminUsersTotalCount} admins found`}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="all-users" className="mt-6">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{renderUserRows(allUsers, loading)}</TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {allUsers.length} of {allUsersTotalCount} users
                    {(debouncedAllUsersSearchTerm || roleFilter !== "all") && " (filtered)"}
                  </div>
                  {renderPagination(
                    allUsersCurrentPage,
                    allUsersTotalPages,
                    setAllUsersCurrentPage,
                    allUsersTotalCount,
                    loading,
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="admin-users" className="mt-6">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{renderUserRows(adminUsers, adminLoading)}</TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {adminUsers.length} of {adminUsersTotalCount} admin users
                    {debouncedAdminUsersSearchTerm && " (filtered)"}
                  </div>
                  {renderPagination(
                    adminUsersCurrentPage,
                    adminUsersTotalPages,
                    setAdminUsersCurrentPage,
                    adminUsersTotalCount,
                    adminLoading,
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  )
}
