import { apiRequest } from "./api"

const BASE_URL = "api/admin"

// ✅ Get all users (Admin Only) - WITH SEARCH PARAMETERS
export const getAllUsers = (page = 1, pageSize = 10, search = "", role = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: pageSize.toString(),
  })

  if (search && search.trim() !== "") {
    params.append("search", search.trim())
  }

  if (role && role !== "all" && role.trim() !== "") {
    params.append("role", role)
  }

  return apiRequest("GET", `${BASE_URL}/all?${params.toString()}`)
}

// ✅ Get admin users only (Admin Only) - NEW FUNCTION
export const getAdminUsers = (page = 1, pageSize = 10, search = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: pageSize.toString(),
  })

  if (search && search.trim() !== "") {
    params.append("search", search.trim())
  }

  return apiRequest("GET", `${BASE_URL}/admins?${params.toString()}`)
}

// ✅ Get user statistics (Admin Only)
export const getUserStats = () => {
  return apiRequest("GET", `${BASE_URL}/stats`)
}

// ✅ Get a single user by license
export const getUserByLicense = (license) => {
  return apiRequest("GET", `${BASE_URL}/${license}`)
}

// ✅ Create a new user (Admin Only)
export const createUser = (userData) => {
  return apiRequest("POST", `${BASE_URL}/create`, userData)
}

// ✅ Update user profile (Admin Only)
export const adminUpdateUser = (license, userData) => {
  return apiRequest("PUT", `${BASE_URL}/update/${license}`, userData)
}

// ✅ Assign roles (Admin Only)
export const updateUserRoles = (license, roles) => {
  return apiRequest("PUT", `${BASE_URL}/role/${license}`, { roles })
}

// ✅ Delete a user (Admin Only)
export const deleteUser = (license) => {
  return apiRequest("DELETE", `${BASE_URL}/delete/${license}`)
}

// ✅ Update user password (Admin Only)
export const updateUserPassword = (license, password) => {
  return apiRequest("PUT", `${BASE_URL}/password/${license}`, { password })
}
