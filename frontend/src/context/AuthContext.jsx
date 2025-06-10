"use client"

import { getCurrentUser, login } from "@/lib/Auth"
import { createContext, useState, useEffect, useContext } from "react"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const initAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      console.log("AuthContext - Current user from API:", currentUser)
      setUser(currentUser)
      return currentUser
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      initAuth()
    } else {
      setLoading(false)
    }

    const handleStorageChange = (event) => {
      if (event.key === "accessToken") {
        if (event.newValue === null) {
          setUser(null)
          window.location.reload()
        } else {
          initAuth()
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const loginUser = async (email, password) => {
    try {
      await login(email, password)
      await initAuth()
    } catch (error) {
      console.error("Error logging in:", error)
      throw error
    }
  }

  const logoutUser = () => {
    localStorage.removeItem("accessToken")
    setUser(null)
  }

  // Add role checking functions
  const hasRole = (role) => {
    if (!user || !user.roles) return false
    return user.roles.includes(role)
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    if (!user || !user.roles) return false
    return roles.some((role) => user.roles.includes(role))
  }

  // Check if user is admin
  const isAdmin = () => {
    return hasRole("admin") || hasRole("Admin")
  }

  // Check if user is a manager (can approve documents)
  const isManager = () => {
    const managerRoles = ["Admin", "Manager", "Project Manager", "Business Manager"]
    return hasAnyRole(managerRoles)
  }

  // Check if user can edit a specific checkin field
  const canEditCheckinField = (fieldId) => {
    if (isAdmin()) return true

    // Map from field ID to role name
    const roleMapping = {
      Project_Manager: "Project Manager",
      Business_Manager: "Business Manager",
      Financial_Leader: "Financial Leader",
      Manufacturing_Eng_Manager: "Manufacturing Eng. Manager",
      Manufacturing_Eng_Leader: "Manufacturing Eng. Leader",
      Methodes_UAP1_3: "Methodes UAP1&3",
      Methodes_UAP2: "Methodes UAP2",
      Maintenance_Manager: "Maintenance Manager",
      Maintenance_Leader_UAP2: "Maintenance Leader UAP2",
      Prod_Plant_Manager_UAP1: "Prod. Plant Manager UAP1",
      Prod_Plant_Manager_UAP2: "Prod. Plant Manager UAP2",
      Quality_Manager: "Quality Manager",
      Quality_Leader_UAP1: "Quality Leader UAP1",
      Quality_Leader_UAP2: "Quality Leader UAP2",
      Quality_Leader_UAP3: "Quality Leader UAP3",
    }

    const roleName = roleMapping[fieldId]
    return hasRole(roleName)
  }

  const value = {
    user,
    login: loginUser,
    logout: logoutUser,
    setUser,
    loading,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager, // Added manager check
    canEditCheckinField,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
