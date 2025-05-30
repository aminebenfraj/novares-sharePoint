const User = require("../models/UserModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Generate JWT Token with improved error handling
const generateToken = (user) => {
  try {
    return jwt.sign(
      {
        license: user.license,
        roles: user.roles,
        // Add a unique identifier to prevent token reuse issues
        jti: require("crypto").randomBytes(16).toString("hex"),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      },
    )
  } catch (error) {
    console.error("Token generation error:", error)
    throw new Error("Failed to generate authentication token")
  }
}

// Register a New User with improved validation and error handling
exports.registerUser = async (req, res) => {
  try {
    const { license, username, email, password, roles, image } = req.body

    // Enhanced validation with specific error messages
    if (!license) return res.status(400).json({ error: "License is required" })
    if (!username) return res.status(400).json({ error: "Username is required" })
    if (!email) return res.status(400).json({ error: "Email is required" })
    if (!password) return res.status(400).json({ error: "Password is required" })

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" })
    }

    // Check if user already exists with more detailed error reporting
    try {
      const existingUser = await User.findOne({
        $or: [{ license }, { email }, { username }],
      })

      if (existingUser) {
        if (existingUser.license === license) {
          return res.status(400).json({ error: "User with this license already exists" })
        }
        if (existingUser.email === email) {
          return res.status(400).json({ error: "User with this email already exists" })
        }
        if (existingUser.username === username) {
          return res.status(400).json({ error: "Username is already taken" })
        }
      }
    } catch (dbError) {
      console.error("Database query error during registration:", dbError)
      return res.status(500).json({
        error: "Error checking existing users",
        details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
      })
    }

    // Hash password with improved security
    const salt = await bcrypt.genSalt(12) // Increased from 10 to 12 for better security
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = new User({
      license,
      username,
      email,
      password: hashedPassword,
      roles: roles || ["User"],
      image: image || null,
    })

    await user.save()

    res.status(201).json({
      message: "User registered successfully",
      user: {
        license: user.license,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    // Enhanced error handling with specific error types
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ error: validationErrors.join(", ") })
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({ error: `User with this ${field} already exists` })
    }

    // Generic server error with logging
    console.error("Unexpected registration error:", error)
    res.status(500).json({
      error: "Server error during registration",
      requestId: Date.now().toString(36), // Add a request ID for tracking in logs
    })
  }
}

// Login User - Completely rewritten for reliability
exports.loginUser = async (req, res) => {
  try {
    const { license, password } = req.body
    // Find user by license and select only necessary fields
    const user = await User.findOne({ license }).select("license username email roles image password")

    if (!user) {
      return res.status(400).json({ error: "Invalid license or password" })
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid license or password" })
    }
    // Generate token
    const token = jwt.sign({ license: user.license, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: "30d" })
    // Return user data without password
    const userData = {
      token,
    }
    res.json(userData)
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Server error" })

  }
}

// Get Current User - Simplified
exports.currentUser = async (req, res) => {
  try {
    // User is already attached to req by the auth middleware
    if (!req.user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Return user data without password
    res.json({
      license: req.user.license,
      username: req.user.username,
      email: req.user.email,
      roles: req.user.roles,
      image: req.user.image,
    })
  } catch (error) {
    console.error("Error fetching current user:", error)
    res.status(500).json({
      error: "Server error while fetching user data",
      requestId: Date.now().toString(36),
    })
  }
}

// Logout user - New function to handle proper logout
exports.logoutUser = (req, res) => {
  try {
    // Clear the auth cookie
    res.clearCookie("token")
    res.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({ error: "Error during logout" })
  }
}
