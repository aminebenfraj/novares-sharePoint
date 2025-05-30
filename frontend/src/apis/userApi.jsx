import { apiRequest } from "./api"

const BASE_URL = "api/users" // ✅ Matches your backend route

// ✅ Get Current User Profile (Protected) with retry
export const getCurrentUser = () => {
  return apiRequest("GET", `${BASE_URL}/profile`)
}

// ✅ Update Current User Profile with validation
export const updateCurrentUser = (data) => {
  // Validate data before sending
  const validData = {}
  if (data.username) validData.username = data.username
  if (data.email) validData.email = data.email
  if (data.password) validData.password = data.password
  if (data.image) validData.image = data.image

  return apiRequest("PUT", `${BASE_URL}/update-profile`, validData)
}

// ✅ Update User Roles (Admin Only)
export const updateUserRoles = (license, roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return Promise.reject(new Error("Roles must be a non-empty array"))
  }

  return apiRequest("PUT", `${BASE_URL}/role/${license}`, { roles })
}

// ✅ Delete Current User (Self-Deletion) with confirmation
export const deleteCurrentUser = (confirmationPhrase) => {
  // Add a confirmation step to prevent accidental deletion
  if (confirmationPhrase !== "DELETE MY ACCOUNT") {
    return Promise.reject(new Error("Please type DELETE MY ACCOUNT to confirm"))
  }

  return apiRequest("DELETE", `${BASE_URL}/delete`)
}

// Get recent users with pagination support
export const getRecentUsers = (limit = 5) => {
  return apiRequest("GET", `${BASE_URL}/recent`, null, false, { limit })
}

// New function to handle password reset request
export const requestPasswordReset = (email) => {
  return apiRequest("POST", `api/auth/request-reset`, { email })
}

// New function to reset password with token
export const resetPassword = (token, newPassword) => {
  return apiRequest("POST", `api/auth/reset-password`, { token, password: newPassword })
}
