// general api config
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `https://novares-sharepoint-backend.onrender.com`,
  timeout: 5000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);



// Enhanced API request function with retry mechanism
export const apiRequest = async (method, url, data = null, isFormData = false, queryParams = {}) => {

  // Build query string for GET requests
  const queryString = Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ""

  // Append query string to URL for GET requests
  const requestUrl = method.toUpperCase() === "GET" && queryString ? `${url}${queryString}` : url

 
    try {
      // Get token from localStorage
      const token = localStorage.getItem("accessToken")

      const config = {
        method,
        url: requestUrl,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
        },
        ...(method.toUpperCase() !== "GET" && data ? { data } : {}),
        ...(method.toUpperCase() === "GET" && Object.keys(queryParams).length > 0 ? { params: queryParams } : {}),
      }

      const response = await axiosInstance(config)
      return response.data
    } catch (error) {
      console.error("API request error:", error)
    throw error
    }
  }

export default axiosInstance
