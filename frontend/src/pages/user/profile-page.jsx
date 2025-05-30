"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getCurrentUser } from "../../apis/userApi"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { CalendarDays, User, Mail, Key, Clock } from "lucide-react"
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
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-b-2 border-gray-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
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
        className="container max-w-4xl px-4 py-10 mx-auto"
      >
        <div className="flex flex-col gap-8 md:flex-row">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <Avatar className="w-32 h-32 mb-4">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.username} />
              ) : (
                <AvatarFallback className="text-2xl">{getInitials(user.username)}</AvatarFallback>
              )}
            </Avatar>
            <Button variant="outline" onClick={() => navigate("/settings")} className="w-full">
              Edit Profile
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex-1"
          >
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl">{user.username}</CardTitle>
                <CardDescription>User Profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">License</p>
                      <p className="font-medium">{user.license}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Roles</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {user.roles &&
                          user.roles.map((role, index) => (
                            <Badge key={index} variant="secondary">
                              {role}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Account Created</p>
                      <p className="font-medium">{user.createdAt ? formatDate(user.createdAt) : "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{user.updatedAt ? formatDate(user.updatedAt) : "N/A"}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Activity</CardTitle>
                      <CardDescription>Your recent system activity and permissions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="mb-2 text-lg font-medium">Role Permissions</h3>
                        <div className="grid gap-2">
                          {user.roles &&
                            user.roles.map((role, index) => (
                              <div key={index} className="p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-medium">
                                      {role}
                                    </Badge>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    View Permissions
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
