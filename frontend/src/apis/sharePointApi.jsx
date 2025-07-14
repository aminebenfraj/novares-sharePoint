import { apiRequest } from "./api"
import { getAllUsers as getAdminUsers } from "./admin"

const BASE_URL = "api/sharepoints"

// Create a new SharePoint document
export const createSharePoint = (data) => {
  const { title, link, comment, deadline, usersToSign, managersToApprove, externalEmails, requesterDepartment } = data

  // Validate required fields
  if (!title || !link || !deadline) {
    return Promise.reject(new Error("Title, link, and deadline are required"))
  }

  if (!requesterDepartment || requesterDepartment.trim() === "") {
    return Promise.reject(new Error("Requester department is required"))
  }

  if (!managersToApprove || managersToApprove.length === 0) {
    return Promise.reject(new Error("At least one manager must be selected for approval"))
  }

  if ((!usersToSign || usersToSign.length === 0) && (!externalEmails || externalEmails.length === 0)) {
    return Promise.reject(new Error("At least one signer must be selected or external email added"))
  }

  console.log("Creating SharePoint with data:", {
    title,
    link,
    comment,
    deadline,
    requesterDepartment,
    usersToSign: usersToSign?.length || 0,
    managersToApprove: managersToApprove?.length || 0,
    externalEmails: externalEmails?.length || 0,
  })

  return apiRequest("POST", BASE_URL, {
    title,
    link,
    comment,
    deadline,
    requesterDepartment,
    usersToSign: usersToSign || [],
    managersToApprove: managersToApprove || [],
    externalEmails: externalEmails || [],
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

// Enhanced: Sign a SharePoint document with optional comment
export const signSharePoint = (id, signatureNote = "") => {
  return apiRequest("POST", `${BASE_URL}/${id}/sign`, {
    signatureNote: signatureNote.trim(),
  })
}

// Enhanced: Approve SharePoint document (Manager only) with optional comment
export const approveSharePoint = (id, approved = true, approvalNote = "") => {
  return apiRequest("POST", `${BASE_URL}/${id}/approve`, {
    approved,
    approvalNote: approvalNote.trim(),
  })
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

// Get SharePoints needing approval from current user (Manager)
export const getMyApprovalSharePoints = (filters = {}) => {
  const queryParams = new URLSearchParams()

  if (filters.status) queryParams.append("status", filters.status)
  if (filters.page) queryParams.append("page", filters.page)
  if (filters.limit) queryParams.append("limit", filters.limit)
  if (filters.sortBy) queryParams.append("sortBy", filters.sortBy)
  if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder)
  if (filters.search) queryParams.append("search", filters.search)

  const queryString = queryParams.toString()
  const url = queryString ? `${BASE_URL}/my-approvals?${queryString}` : `${BASE_URL}/my-approvals`

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

// Enhanced: Disapprove a SharePoint document with required comment
export const disapproveSharePoint = (id, disapprovalNote) => {
  if (!disapprovalNote || !disapprovalNote.trim()) {
    return Promise.reject(new Error("Disapproval note is required"))
  }
  return apiRequest("POST", `${BASE_URL}/${id}/disapprove`, {
    disapprovalNote: disapprovalNote.trim(),
  })
}

// Enhanced: Relaunch a disapproved SharePoint document with optional comment
export const relaunchSharePoint = (id, relaunchComment = "") => {
  return apiRequest("POST", `${BASE_URL}/${id}/relaunch`, {
    relaunchComment: relaunchComment.trim(),
  })
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
