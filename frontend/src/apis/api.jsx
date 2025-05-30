import axios from "axios";

export const apiRequest = async (
  method,
  url,
  data = null,
  isFormData = false
) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found");
    }

    const config = {
      method,
      url: `http://localhost:5000/${url}`,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
    };

    // Only attach data if method allows a body
    if (data && !["GET", "DELETE"].includes(method.toUpperCase())) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};
