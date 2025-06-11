import { apiRequest } from "./api"
import { getAllUsers as getAdminUsers } from "./admin"

const BASE_URL = "api/sharepoints"

// Create a new SharePoint document
export const createSharePoint = (data) => {
  const { title, link, comment, deadline, usersToSign } = data

  // Validate required fields
  if (!title || !link || !deadline || !usersToSign || usersToSign.length === 0) {
    return Promise.reject(new Error("Missing required fields"))
  }

  return apiRequest("POST", BASE_URL, {
    title,
    link,
    comment,
    deadline,
    usersToSign,
  })
}

// Get all SharePoint documents with enhanced filtering and pagination
export const getAllSharePoints = (filters = {}) => {
  const queryParams = new URLSearchParams()

  if (filters.status) queryParams.append("status", filters.status)
  if (filters.createdBy) queryParams.append("createdBy", filters.createdBy)
  if (filters.assignedTo) queryParams.append("assignedTo", filters.assignedTo)
  if (filters.page) queryParams.append("page", filters.page)
  if (filters.limit) queryParams.append("limit", filters.limit)
  if (filters.sortBy) queryParams.append("sortBy", filters.sortBy)
  if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder)
  if (filters.search) queryParams.append("search", filters.search)

  const queryString = queryParams.toString()
  const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL

  return apiRequest("GET", url)
}

// Get SharePoint by ID
export const getSharePointById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Update SharePoint document
export const updateSharePoint = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete SharePoint document
export const deleteSharePoint = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

// Sign a SharePoint document
export const signSharePoint = (id, signatureNote = "") => {
  return apiRequest("POST", `${BASE_URL}/${id}/sign`, { signatureNote })
}

// Approve SharePoint document (Manager only)
export const approveSharePoint = (id, approved = true) => {
  return apiRequest("POST", `${BASE_URL}/${id}/approve`, { approved })
}

// Get SharePoints assigned to current user with enhanced filtering
export const getMyAssignedSharePoints = (filters = {}) => {
  const queryParams = new URLSearchParams()

  if (filters.status) queryParams.append("status", filters.status)
  if (filters.page) queryParams.append("page", filters.page)
  if (filters.limit) queryParams.append("limit", filters.limit)
  if (filters.sortBy) queryParams.append("sortBy", filters.sortBy)
  if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder)
  if (filters.search) queryParams.append("search", filters.search)

  const queryString = queryParams.toString()
  const url = queryString ? `${BASE_URL}/my-assigned?${queryString}` : `${BASE_URL}/my-assigned`

  return apiRequest("GET", url)
}

// Get SharePoints created by current user with enhanced filtering
export const getMyCreatedSharePoints = (filters = {}) => {
  const queryParams = new URLSearchParams()

  if (filters.status) queryParams.append("status", filters.status)
  if (filters.page) queryParams.append("page", filters.page)
  if (filters.limit) queryParams.append("limit", filters.limit)
  if (filters.sortBy) queryParams.append("sortBy", filters.sortBy)
  if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder)
  if (filters.search) queryParams.append("search", filters.search)

  const queryString = queryParams.toString()
  const url = queryString ? `${BASE_URL}/my-created?${queryString}` : `${BASE_URL}/my-created`

  return apiRequest("GET", url)
}

// Fallback function to get all users if role-based endpoint doesn't work
export const getAllUsersForSelection = (page = 1, pageSize = 100) => {
  return getAdminUsers(page, pageSize)
}

// Fixed API endpoint path
export const canUserSign = async (sharePointId, userId) => {
  try {
    const response = await apiRequest("GET", `${BASE_URL}/${sharePointId}/can-sign/${userId || ""}`)
    return response
  } catch (error) {
    console.error("Error checking sign permission:", error)
    throw error
  }
}

// Get SharePoint statistics
export const getSharePointStats = () => {
  return apiRequest("GET", `${BASE_URL}/stats`)
}

// Bulk operations
export const bulkUpdateSharePoints = (ids, updateData) => {
  return apiRequest("PUT", `${BASE_URL}/bulk-update`, { ids, updateData })
}

export const bulkDeleteSharePoints = (ids) => {
  return apiRequest("DELETE", `${BASE_URL}/bulk-delete`, { ids })
}

// Export SharePoints to CSV
export const exportSharePoints = (filters = {}) => {
  const queryParams = new URLSearchParams()
  Object.keys(filters).forEach((key) => {
    if (filters[key]) queryParams.append(key, filters[key])
  })

  const queryString = queryParams.toString()
  const url = queryString ? `${BASE_URL}/export?${queryString}` : `${BASE_URL}/export`

  return apiRequest("GET", url)
}
