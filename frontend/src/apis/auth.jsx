// authApi.jsx
import { apiRequest } from "./api";

// Base URL for auth endpoints
const BASE_URL = "api/auth";

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await apiRequest("POST", `${BASE_URL}/register`, userData);
    return response;
  } catch (error) {
    console.error("Register user error:", error);
    throw error.response?.data?.error || "Failed to register user";
  }
};

// Login user and store token
export const loginUser = async ({ license, password }) => {
  try {
    const response = await apiRequest("POST", `${BASE_URL}/login`, { license, password });
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem("accessToken", response.token);
    }
    return response;
  } catch (error) {
    console.error("Login user error:", error);
    throw error.response?.data?.error || "Failed to login";
  }
};

// Get current user (protected route)
export const getCurrentUser = async () => {
  try {
    const response = await apiRequest("GET", `${BASE_URL}/current-user`);
    if (!response?._id) {
      console.error("getCurrentUser: Response missing _id field", response);
      throw new Error("User profile missing ID");
    }
    return response;
  } catch (error) {
    console.error("Get current user error:", error);
    throw error.response?.data?.error || "Failed to fetch current user";
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    const response = await apiRequest("POST", `${BASE_URL}/logout`);
    // Clear token from localStorage
    localStorage.removeItem("accessToken");
    return response;
  } catch (error) {
    console.error("Logout user error:", error);
    // Clear token even if the request fails
    localStorage.removeItem("accessToken");
    throw error.response?.data?.error || "Failed to logout";
  }
};