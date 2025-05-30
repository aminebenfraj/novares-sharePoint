const jwt = require("jsonwebtoken")
const User = require("../models/UserModel")

// Protect Routes: Verify Token & Attach User to Request (Optimized)
const protect = async (req, res, next) => {
  try {
    let token

    // Check for token in Authorization header or cookies
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract token from header
      token = authHeader.split(" ")[1]
    } else if (req.cookies && req.cookies.token) {
      // Extract token from cookies
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({
        error: "Not authorized, no token",
        code: "NO_TOKEN",
      })
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from database - only select necessary fields
      const user = await User.findOne({ license: decoded.license }).select("-password").lean() // Use lean() for better performance

      if (!user) {
        return res.status(401).json({
          error: "User not found or deleted",
          code: "USER_NOT_FOUND",
        })
      }

      // Attach user to request
      req.user = user
      next()
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError)

      // Handle specific JWT errors with clear messages
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "Invalid token",
          code: "INVALID_TOKEN",
        })
      }

      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token expired, please login again",
          code: "TOKEN_EXPIRED",
        })
      }

      res.status(401).json({
        error: "Authentication failed",
        code: "AUTH_FAILED",
      })
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      error: "Server error during authentication",
      requestId: Date.now().toString(36),
    })
  }
}

// Admin Middleware (Optimized)
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    })
  }

  if (!req.user.roles.includes("Admin")) {
    return res.status(403).json({
      error: "Access denied - Admin privileges required",
      code: "ADMIN_REQUIRED",
    })
  }

  next()
}

module.exports = { protect, verifyAdmin }
