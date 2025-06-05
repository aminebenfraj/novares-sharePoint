const jwt = require("jsonwebtoken")
const User = require("../models/UserModel")

// Protect Routes: Verify Token & Attach User to Request (Optimized)
const protect = async (req, res, next) => {
  try {
    let token
    console.log("Authorization header:", req.headers.authorization);
    console.log("Cookies:", req.cookies);

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
      console.log("Token from Authorization header:", token);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token
      console.log("Token from cookies:", token);
    }

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({
        error: "Not authorized, no token",
        code: "NO_TOKEN",
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      console.log("Decoded JWT:", decoded);

      const user = await User.findOne({ license: decoded.license }).select("-password").lean()
      console.log("User from DB:", user);

      if (!user) {
        console.log("User not found for license:", decoded.license);
        return res.status(401).json({
          error: "User not found or deleted",
          code: "USER_NOT_FOUND",
        })
      }

      if (!user.roles) {
        console.log("User missing roles:", user);
        return res.status(401).json({
          error: "User roles not found",
          code: "ROLES_NOT_FOUND",
        })
      }

      req.user = user
      console.log("req.user set:", req.user);
      next()
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
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
    console.error("Auth middleware error:", error);
    res.status(500).json({
      error: "Server error during authentication",
      code: "AUTH_SERVER_ERROR",
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
