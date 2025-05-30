
import { getCurrentUser, updateCurrentUser, deleteCurrentUser } from "../../apis/userApi"
import { toast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { useNavigate } from "react-router-dom"
import { User, Mail, Lock, Upload, AlertTriangle } from "lucide-react"
import MainLayout from "@/components/MainLayout"

const SettingsPage = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    image: null,
  })
  const [errors, setErrors] = useState({})
  const [previewImage, setPreviewImage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
        setFormData({
          username: userData.username || "",
          email: userData.email || "",
          password: "",
          confirmPassword: "",
          image: userData.image || null,
        })
        if (userData.image) {
          setPreviewImage(userData.image)
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to load user data",
          description: "Please try again later.",
        })
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // For this example, we'll just use a FileReader to create a preview
      // In a real app, you might want to upload to a server or use a service
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
        setFormData((prev) => ({
          ...prev,
          image: reader.result,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (formData.username.trim() === "") {
      newErrors.username = "Username is required"
    }

    if (formData.email.trim() === "") {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)

    try {
      // Only send fields that have changed
      const updateData = {}
      if (formData.username !== user.username) updateData.username = formData.username
      if (formData.email !== user.email) updateData.email = formData.email
      if (formData.password) updateData.password = formData.password
      if (formData.image !== user.image) updateData.image = formData.image

      // Only make the API call if there are changes
      if (Object.keys(updateData).length > 0) {
        const result = await updateCurrentUser(updateData)

        // Update local user state with the new data
        setUser((prev) => ({
          ...prev,
          ...result,
        }))

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      } else {
        toast({
          title: "No changes made",
          description: "No changes were detected in your profile.",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: "Please try again later.",
      })
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteCurrentUser()

      // Clear local storage and redirect to login
      localStorage.removeItem("accessToken")

      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      })

      // Redirect to login page
      navigate("/login")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete account",
        description: "Please try again later.",
      })
      console.error(err)
    }
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-b-2 border-gray-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container max-w-4xl px-4 py-10 mx-auto"
      >
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="account">Account Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Update your personal information </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="w-24 h-24">
                        {previewImage ? (
                          <AvatarImage src={previewImage} alt={formData.username} />
                        ) : (
                          <AvatarFallback className="text-2xl">
                            {formData.username ? getInitials(formData.username) : "?"}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex items-center gap-2">
                        
                        <Input
                          id="picture"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Username
                        </Label>
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="Your username"
                        />
                        {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Your email"
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                      </div>
                    </div>

                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-current rounded-full animate-spin border-t-transparent"></div>
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Update your password and manage your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        New Password
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="New password"
                      />
                      {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                      />
                      {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  <Button onClick={handleSubmit} disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-current rounded-full animate-spin border-t-transparent"></div>
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove your data
                            from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate("/profile")}>
                View Profile
              </Button>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  )
}

export default SettingsPage
