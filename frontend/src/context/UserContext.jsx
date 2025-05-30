"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { getCurrentUser } from "../apis/userApi"

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser()
      setUser(response.user)
    } catch (error) {
      console.error("Error fetching current user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const isManager = () => {
    return user?.roles?.includes("Manager") || user?.roles?.includes("Admin")
  }

  const isAdmin = () => {
    return user?.roles?.includes("Admin")
  }

  const canApproveDocument = (document) => {
    return isManager() && document.createdBy._id !== user._id
  }

  const canSignDocument = (document) => {
    if (!document.managerApproved) return false
    return document.usersToSign?.some((userSign) => userSign.user._id === user._id && !userSign.hasSigned)
  }

  const canEditDocument = (document) => {
    return document.createdBy._id === user._id || isAdmin()
  }

  const value = {
    user,
    loading,
    isManager,
    isAdmin,
    canApproveDocument,
    canSignDocument,
    canEditDocument,
    refreshUser: fetchCurrentUser,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
