const bcrypt = require("bcryptjs")
const User = require("../models/UserModel")

// List of allowed roles
const rolesEnum = [
  "Admin",
  "Manager",
  "Project Manager",
  "Business Manager",
  "Financial Leader",
  "Manufacturing Eng. Manager",
  "Manufacturing Eng. Leader",
  "Tooling Manager",
  "Automation Leader",
  "SAP Leader",
  "Methodes UAP1&3",
  "Methodes UAP2",
  "Maintenance Manager",
  "Maintenance Leader UAP2",
  "Purchasing Manager",
  "Logistic Manager",
  "Logistic Leader UAP1",
  "Logistic Leader UAP2",
  "Logistic Leader",
  "POE Administrator",
  "Material Administrator",
  "Warehouse Leader UAP1",
  "Warehouse Leader UAP2",
  "Prod. Plant Manager UAP1",
  "Prod. Plant Manager UAP2",
  "Quality Manager",
  "Quality Leader UAP1",
  "Quality Leader UAP2",
  "Quality Leader UAP3",
  "Laboratory Leader",
  "Customer",
  "User",
  "PRODUCCION",
  "LOGISTICA",
]

// Get Current User Information (Optimized)
exports.showUserInfo = async (req, res) => {
  try {
    // User is already attached to req by the auth middleware
    if (!req.user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      license: req.user.license,
      username: req.user.username,
      email: req.user.email,
      roles: req.user.roles,
      image: req.user.image,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    })
  } catch (error) {
    console.error("Error fetching user information:", error)
    res.status(500).json({ error: "Error fetching user information" })
  }
}

// Update User Roles (Optimized)
exports.updateUserRoles = async (req, res) => {
  const { roles } = req.body

  // Validate roles
  if (!Array.isArray(roles) || roles.some((role) => !rolesEnum.includes(role))) {
    return res.status(400).json({ error: "Invalid roles provided" })
  }

  try {
    // Find and update in one operation
    const user = await User.findOneAndUpdate(
      { license: req.params.license },
      { $set: { roles } },
      { new: true, runValidators: true },
    )

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Prevent Admin from removing their own "Admin" role
    if (user.license === req.user.license && !roles.includes("Admin")) {
      // Revert the change
      await User.findOneAndUpdate({ license: req.params.license }, { $addToSet: { roles: "Admin" } })
      return res.status(400).json({ error: "You cannot remove your own Admin role" })
    }

    res.json({ message: "User roles updated successfully", updatedRoles: user.roles })
  } catch (error) {
    console.error("Error updating user roles:", error)
    res.status(500).json({ error: "Error updating user roles" })
  }
}

// Update Current User Information (Optimized)
exports.updateCurrentUser = async (req, res) => {
  try {
    const { username, email, password, image } = req.body
    const updateData = {}

    // Only include fields that need to be updated
    if (username) updateData.username = username
    if (email) updateData.email = email
    if (image) updateData.image = image

    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    // Update in one operation
    const user = await User.findOneAndUpdate(
      { license: req.user.license },
      { $set: updateData },
      { new: true, runValidators: true },
    )

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      message: "User updated successfully",
      username: user.username,
      email: user.email,
      image: user.image,
    })
  } catch (error) {
    console.error("Error updating current user:", error)
    res.status(500).json({ error: "Error updating user information" })
  }
}

// Delete a User (Admin Only) - Optimized
exports.deleteUser = async (req, res) => {
  try {
    // Check if user is trying to delete themselves
    if (req.params.license === req.user.license) {
      return res.status(400).json({ error: "You cannot delete your own account" })
    }

    const result = await User.deleteOne({ license: req.params.license })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ error: "Error deleting user" })
  }
}

// Delete Current User Account (Optimized)
exports.deleteCurrentUser = async (req, res) => {
  try {
    const result = await User.deleteOne({ license: req.user.license })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ error: "Error deleting user" })
  }
}

// Get Customer By ID (Optimized)
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      roles: "Customer",
    }).select("-password")

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" })
    }

    res.json(customer)
  } catch (error) {
    console.error("Error fetching customer by ID:", error)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

// Get All Customers (Optimized)
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({
      roles: "Customer",
    })
      .select("_id username email roles")
      .lean()

    if (!customers.length) {
      return res.status(404).json({ error: "No customers found" })
    }

    res.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

// Get Recent Users (Optimized)
exports.getRecentUsers = async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("username email roles createdAt")
      .lean()

    res.json(recentUsers)
  } catch (error) {
    console.error("Error fetching recent users:", error)
    res.status(500).json({ error: "Error fetching recent users" })
  }
}
