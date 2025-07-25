"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getCurrentUser } from "../../apis/userApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { CalendarDays, User, Mail, Clock, Shield, Activity, Settings, ChevronRight, Eye, UserCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import MainLayout from "@/components/MainLayout"

const ProfilePage = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
      } catch (err) {
        setError("Failed to load profile data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  const getRoleColor = (role) => {
    const roleColors = {
      Admin: "bg-red-100 text-red-800 border-red-200",
      Manager: "bg-blue-100 text-blue-800 border-blue-200",
      User: "bg-gray-100 text-gray-800 border-gray-200",
      Customer: "bg-green-100 text-green-800 border-green-200",
    }

    // Check if role contains any of the key words
    for (const [key, color] of Object.entries(roleColors)) {
      if (role.includes(key)) return color
    }

    return "bg-purple-100 text-purple-800 border-purple-200"
  }

  const getRoleIcon = (role) => {
    if (role.includes("Admin")) return <Shield className="w-3 h-3" />
    if (role.includes("Manager")) return <UserCheck className="w-3 h-3" />
    return <User className="w-3 h-3" />
  }

  const getPermissionDescription = (role) => {
    const descriptions = {
      Admin: "Full system access with user management capabilities",
      Manager: "Department oversight and team management permissions",
      User: "Standard user access to core system features",
      Customer: "Customer portal access and support features",
    }

    for (const [key, desc] of Object.entries(descriptions)) {
      if (role.includes(key)) return desc
    }

    return "Specialized role with specific system permissions"
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-b-2 rounded-full border-primary animate-spin"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Card className="w-full max-w-md">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Activity className="w-5 h-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">{error}</p>
            </CardContent>
            <div className="p-6 pt-0">
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (!user) return null

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container max-w-6xl px-4 py-8 mx-auto"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account information and view your system activity</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="lg:col-span-1"
          >
            <Card className="h-fit">
              <CardHeader className="pb-4 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24 shadow-lg ring-4 ring-background">
                    {user.image ? (
                      <AvatarImage src={user.image || "/placeholder.svg"} alt={user.username} />
                    ) : (
                      <AvatarFallback className="text-2xl text-white bg-gradient-to-br from-blue-500 to-purple-600">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{user.username}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">License ID</p>
                        <p className="text-xs text-muted-foreground">{user.license}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Member since</p>
                        <p className="text-xs text-muted-foreground">
                          {user.createdAt ? formatRelativeTime(user.createdAt) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Last updated</p>
                        <p className="text-xs text-muted-foreground">
                          {user.updatedAt ? formatRelativeTime(user.updatedAt) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <Button onClick={() => navigate("/settings")} className="w-full" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity & Permissions Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6 lg:col-span-2"
          >
            {/* User Activity Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle>User Activity</CardTitle>
                    <CardDescription>Your recent system activity and permissions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Account Status */}
                  <div className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-green-800">Account Active</p>
                        <p className="text-sm text-green-600">All systems operational</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-800 bg-green-100 border-green-300">
                      Online
                    </Badge>
                  </div>

                  {/* Role Permissions */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <Shield className="w-5 h-5 text-primary" />
                        Role Permissions
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {user.roles?.length || 0} {user.roles?.length === 1 ? "Role" : "Roles"}
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      {user.roles &&
                        user.roles.map((role, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.3 }}
                            className="p-4 transition-all duration-200 border rounded-lg group bg-card hover:shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${getRoleColor(role)}`}>{getRoleIcon(role)}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={`font-medium ${getRoleColor(role)}`}>
                                      {role}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{getPermissionDescription(role)}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="transition-opacity opacity-0 group-hover:opacity-100"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                      <Clock className="w-5 h-5 text-primary" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Profile accessed</p>
                          <p className="text-xs text-muted-foreground">Just now</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Account updated</p>
                          <p className="text-xs text-muted-foreground">
                            {user.updatedAt ? formatDate(user.updatedAt) : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Account created</p>
                          <p className="text-xs text-muted-foreground">
                            {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </MainLayout>
  )
}

export default ProfilePage
