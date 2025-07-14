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
      Financial_Leader: "Operations director",
      Manufacturing_Eng_Manager: "Plant manager",
      Manufacturing_Eng_Leader: "Engineering Manager",
      Methodes_UAP1_3: "Purchasing Manager",
      Methodes_UAP2: "Quality Manager",
      Maintenance_Manager: "Maintenance Manager",
      
      Prod_Plant_Manager_UAP1: "Maintenance Staff",
      Prod_Plant_Manager_UAP2: "Health & Safety Staff",
      Quality_Manager: "Quality Manager",
      Quality_Leader_UAP1: "Purchasing Staff",
      Quality_Leader_UAP2: "Logistics Staff",
      Quality_Leader_UAP3: "Quality Staff",
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
