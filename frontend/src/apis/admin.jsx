import { apiRequest } from "./api";

const BASE_URL = "api/admin"; // ✅ Matches backend admin routes

// ✅ Get all users (Admin Only)
export const getAllUsers = (page=1,pageSize=10) => {
  return apiRequest("GET", `${BASE_URL}/all?page=${page}&size=${pageSize}`);
};

// ✅ Get a single user by license
export const getUserByLicense = (license) => {
  return apiRequest("GET", `${BASE_URL}/${license}`);
};

// ✅ Create a new user (Admin Only)
export const createUser = (userData) => {
  return apiRequest("POST", `${BASE_URL}/create`, userData);
};

// ✅ Update user profile (Admin Only)
export const adminUpdateUser = (license, userData) => {
  return apiRequest("PUT", `${BASE_URL}/update/${license}`, userData);
};

// ✅ Assign roles (Admin Only)
export const updateUserRoles = (license, roles) => {
  return apiRequest("PUT", `${BASE_URL}/role/${license}`, { roles });
};

// ✅ Delete a user (Admin Only)
export const deleteUser = (license) => {
  return apiRequest("DELETE", `${BASE_URL}/delete/${license}`);
};
