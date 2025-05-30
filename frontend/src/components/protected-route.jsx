"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

// Enhanced ProtectedRoute component with role-based access control
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const {  loading, user } = useAuth()

  // If still loading auth state, show nothing or a loading spinner
  if (loading) {
    return <div>Loading...</div>
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If requiredRoles is provided, check if user has at least one of the required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = user.roles.some((role) =>
      requiredRoles.some((requiredRole) => requiredRole.toUpperCase() === role.toUpperCase()),
    )

    // If user doesn't have required role, redirect to unauthorized page or dashboard
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // If authenticated and has required role (if specified), render the children
  return children
}

export default ProtectedRoute
