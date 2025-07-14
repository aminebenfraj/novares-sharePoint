import axios from "axios"

const API_URL = "https://novares-sharepoint-backend.onrender.comapi/auth"

// Get current user
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      throw new Error("No access token found")
    }

    const response = await axios.get(`${API_URL}/current-user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data
  } catch (error) {
    console.error("Error fetching current user:", error)
    throw error
  }
}

// Login user
export const login = async (license, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      license,
      password,
    })

    if (response.data.token) {
      localStorage.setItem("accessToken", response.data.token)
    }

    return response.data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

// Register user
export const register = async (license, username, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      license,
      username,
      email,
      password,
      roles: ["User"],
    })

    return response.data
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

// Logout user
export const logout = () => {
  localStorage.removeItem("accessToken")
}
