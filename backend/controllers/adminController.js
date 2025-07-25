const bcrypt = require("bcryptjs")
const User = require("../models/UserModel")
const { v4: uuidv4 } = require("uuid")
const { rolesEnum, isValidRole, getManagementRoles } = require("../constants/roles")

function generateReference(prefix = "REF") {
  const uuid = uuidv4().split("-")[0]
  return `${prefix}-${uuid.toUpperCase()}`
}

/**
 * 🔹 Get User Statistics (Admin Only)
 */
exports.getUserStats = async (req, res) => {
  try {
    // Get total user count
    const totalUsers = await User.countDocuments()

    // Get admin users count
    const adminUsers = await User.countDocuments({ roles: "Admin" })

    // Get manager users count (users with any manager-related role)
    const managerRoles = getManagementRoles()

    const managerUsers = await User.countDocuments({
      roles: { $in: managerRoles },
    })

    // Get customer users count
    const customerUsers = await User.countDocuments({ roles: "Customer" })

    // Get recently added users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentlyAdded = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    })

    res.json({
      totalUsers,
      adminUsers,
      managerUsers,
      customerUsers,
      recentlyAdded,
    })
  } catch (error) {
    console.error("❌ Error fetching user stats:", error)
    res.status(500).json({ error: "Error fetching user statistics" })
  }
}

/**
 * 🔹 Get All Users (Admin Only) - WITH SEARCH
 */
exports.getAllUsers = async (req, res) => {
  try {
    // ✅ Get pagination and search parameters from query
    let { page = 1, size = 10, search = "", role = "" } = req.query

    // ✅ Convert page and size to numbers
    page = Number.parseInt(page)
    size = Number.parseInt(size)

    if (isNaN(page) || page < 1) page = 1
    if (isNaN(size) || size < 1) size = 10

    // ✅ Calculate how many users to skip
    const skip = (page - 1) * size

    // ✅ Build search query
    const searchQuery = {}

    // Add text search if provided
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i") // Case-insensitive search
      searchQuery.$or = [{ username: searchRegex }, { email: searchRegex }, { license: searchRegex }]
    }

    // Add role filter if provided and valid
    if (role && role !== "all" && role.trim() !== "" && isValidRole(role)) {
      searchQuery.roles = role
    }

    // ✅ Fetch users with search and pagination
    const users = await User.find(searchQuery)
      .select("-password")
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(size)
      .skip(skip)

    // ✅ Get total user count for pagination metadata (with search applied)
    const totalUsers = await User.countDocuments(searchQuery)

    res.json({
      users,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / size),
        pageSize: size,
        hasSearch: search && search.trim() !== "",
        searchTerm: search,
        roleFilter: role,
      },
    })
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    res.status(500).json({ error: "Error fetching users" })
  }
}

/**
 * 🔹 Get Admin Users Only (Admin Only) - NEW ENDPOINT
 */
exports.getAdminUsers = async (req, res) => {
  try {
    // ✅ Get pagination and search parameters from query
    let { page = 1, size = 10, search = "" } = req.query

    // ✅ Convert page and size to numbers
    page = Number.parseInt(page)
    size = Number.parseInt(size)

    if (isNaN(page) || page < 1) page = 1
    if (isNaN(size) || size < 1) size = 10

    // ✅ Calculate how many users to skip
    const skip = (page - 1) * size

    // ✅ Build search query - ALWAYS filter for Admin role
    const searchQuery = { roles: "Admin" }

    // Add text search if provided
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i") // Case-insensitive search
      searchQuery.$or = [{ username: searchRegex }, { email: searchRegex }, { license: searchRegex }]
    }

    // ✅ Fetch admin users with search and pagination
    const users = await User.find(searchQuery)
      .select("-password")
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(size)
      .skip(skip)

    // ✅ Get total admin user count for pagination metadata (with search applied)
    const totalUsers = await User.countDocuments(searchQuery)

    res.json({
      users,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / size),
        pageSize: size,
        hasSearch: search && search.trim() !== "",
        searchTerm: search,
        roleFilter: "Admin",
      },
    })
  } catch (error) {
    console.error("❌ Error fetching admin users:", error)
    res.status(500).json({ error: "Error fetching admin users" })
  }
}

exports.getUserByLicense = async (req, res) => {
  try {
    const user = await User.findOne({ license: req.params.license }).select("-password")
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({ error: "Error fetching user information" })
  }
}

exports.createUser = async (req, res) => {
  try {
    const { username, email, password, roles, image } = req.body

    if (!username || !email || !password || !roles) {
      return res.status(400).json({ error: "All fields are required" })
    }

    // Remove duplicates and validate roles
    const uniqueRoles = [...new Set(roles)]
    if (!Array.isArray(roles) || uniqueRoles.some((role) => !isValidRole(role))) {
      return res.status(400).json({
        error: "Invalid roles provided",
        validRoles: rolesEnum,
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = new User({
      license: generateReference(),
      username,
      email,
      password: hashedPassword,
      roles: uniqueRoles,
      image,
    })

    await newUser.save()
    res.status(201).json({ message: "User created successfully", user: newUser })
  } catch (error) {
    console.error("Error creating user:", error)
    res.status(500).json({ error: "Error creating user" })
  }
}

exports.adminUpdateUser = async (req, res) => {
  try {
    const { username, email, password, image } = req.body
    const user = await User.findOne({ license: req.params.license })

    if (!user) return res.status(404).json({ error: "User not found" })

    if (username) user.username = username
    if (email) user.email = email
    if (image) user.image = image

    if (password) {
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(password, salt)
    }

    await user.save()
    res.json({ message: "User updated successfully", user })
  } catch (error) {
    console.error("Error updating user:", error)
    res.status(500).json({ error: "Error updating user information" })
  }
}

exports.updateUserRoles = async (req, res) => {
  const { roles } = req.body

  // Remove duplicates and validate roles
  const uniqueRoles = [...new Set(roles)]
  if (!Array.isArray(roles) || uniqueRoles.some((role) => !isValidRole(role))) {
    return res.status(400).json({
      error: "Invalid roles provided",
      validRoles: rolesEnum,
    })
  }

  try {
    const user = await User.findOne({ license: req.params.license })
    if (!user) return res.status(404).json({ error: "User not found" })

    if (user.license === req.user.license && !uniqueRoles.includes("Admin")) {
      return res.status(400).json({ error: "You cannot remove your own Admin role" })
    }

    user.roles = uniqueRoles
    await user.save()

    res.json({ message: "User roles updated successfully", updatedRoles: user.roles })
  } catch (error) {
    console.error("Error updating user roles:", error)
    res.status(500).json({ error: "Error updating user roles" })
  }
}

exports.adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ license: req.params.license })
    if (!user) return res.status(404).json({ error: "User not found" })

    if (user.license === req.user.license) {
      return res.status(400).json({ error: "You cannot delete your own account" })
    }

    await User.deleteOne({ license: req.params.license })
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ error: "Error deleting user" })
  }
}
