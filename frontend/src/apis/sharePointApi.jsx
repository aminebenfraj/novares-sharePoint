import { apiRequest } from "./api"

const BASE_URL = "api/sharepoint"

// Get all SharePoint documents
export const getAllDocuments = (params = {}) => {
  const queryString = new URLSearchParams(params).toString()
  return apiRequest("GET", `${BASE_URL}${queryString ? `?${queryString}` : ""}`)
}

// Get a single document by ID
export const getDocumentById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new document
export const createDocument = (documentData) => {
  return apiRequest("POST", BASE_URL, documentData)
}

// Update a document
export const updateDocument = (id, documentData) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, documentData)
}

// Delete a document
export const deleteDocument = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

// Sign a document
export const signDocument = (id, signatureData) => {
  return apiRequest("POST", `${BASE_URL}/${id}/sign`, signatureData)
}

// Approve a document (Manager only)
export const approveDocument = (id) => {
  return apiRequest("POST", `${BASE_URL}/${id}/approve`)
}

// Add users to sign a document
export const addUsersToSign = (id, users) => {
  return apiRequest("POST", `${BASE_URL}/${id}/users`, { users })
}

// Remove a user from signing
export const removeUserToSign = (id, userId) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}/users/${userId}`)
}

// Update document status (Admin only)
export const updateDocumentStatus = (id, status) => {
  return apiRequest("PATCH", `${BASE_URL}/${id}/status`, { status })
}

// Get documents pending user's signature
export const getPendingSignatures = () => {
  return apiRequest("GET", `${BASE_URL}/pending-signature`)
}

// Get user's created documents
export const getMyDocuments = (params = {}) => {
  const queryString = new URLSearchParams(params).toString()
  return apiRequest("GET", `${BASE_URL}/my-documents${queryString ? `?${queryString}` : ""}`)
}

// Get document statistics (Admin only)
export const getStats = () => {
  return apiRequest("GET", `${BASE_URL}/stats`)
}

export const sharePointAPI = {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  signDocument,
  approveDocument,
  addUsersToSign,
  removeUserToSign,
  updateDocumentStatus,
  getPendingSignatures,
  getMyDocuments,
  getStats,
}
