import { apiRequest } from "./api"
import { getAllUsers as getAdminUsers } from "./admin"

const BASE_URL = "api/sharepoint"

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

// Get all SharePoint documents with filtering
export const getAllSharePoints = (filters = {}) => {
  const queryParams = new URLSearchParams()

  if (filters.status) queryParams.append("status", filters.status)
  if (filters.createdBy) queryParams.append("createdBy", filters.createdBy)
  if (filters.assignedTo) queryParams.append("assignedTo", filters.assignedTo)
  if (filters.page) queryParams.append("page", filters.page)
  if (filters.limit) queryParams.append("limit", filters.limit)

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

// Get users by roles for signer selection (original endpoint)

// Get all available roles from the backend
// export const getAvailableRoles = () => {
//   return apiRequest("GET", `${BASE_URL}/roles`)
// }

// Get users by a specific role


// Get SharePoints assigned to current user
export const getMyAssignedSharePoints = (filters = {}) => {
  const queryParams = new URLSearchParams()

  if (filters.status) queryParams.append("status", filters.status)
  if (filters.page) queryParams.append("page", filters.page)
  if (filters.limit) queryParams.append("limit", filters.limit)

  const queryString = queryParams.toString()
  const url = queryString ? `${BASE_URL}/my-assigned?${queryString}` : `${BASE_URL}/my-assigned`

  return apiRequest("GET", url)
}

// Get SharePoints created by current user
export const getMyCreatedSharePoints = (filters = {}) => {
  const queryParams = new URLSearchParams()

  if (filters.status) queryParams.append("status", filters.status)
  if (filters.page) queryParams.append("page", filters.page)
  if (filters.limit) queryParams.append("limit", filters.limit)

  const queryString = queryParams.toString()
  const url = queryString ? `${BASE_URL}/my-created?${queryString}` : `${BASE_URL}/my-created`

  return apiRequest("GET", url)
}

// Fallback function to get all users if role-based endpoint doesn't work
export const getAllUsersForSelection = (page = 1, pageSize = 100) => {
  return getAdminUsers(page, pageSize)
}