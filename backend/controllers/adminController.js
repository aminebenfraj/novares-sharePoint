const bcrypt = require("bcryptjs");
const User = require("../models/UserModel");

// 🎯 List of allowed roles
const rolesEnum = [
  "Admin", "Manager", "Project Manager", "Business Manager",
  "Financial Leader", "Manufacturing Eng. Manager",
  "Manufacturing Eng. Leader", "Tooling Manager",
  "Automation Leader", "SAP Leader", "Methodes UAP1&3",
  "Methodes UAP2", "Maintenance Manager",
  "Maintenance Leader UAP2", "Purchasing Manager",
  "Logistic Manager", "Logistic Leader UAP1",
  "Logistic Leader UAP2", "Logistic Leader",
  "POE Administrator", "Material Administrator",
  "Warehouse Leader UAP1", "Warehouse Leader UAP2",
  "Prod. Plant Manager UAP1", "Prod. Plant Manager UAP2",
  "Quality Manager", "Quality Leader UAP1",
  "Quality Leader UAP2", "Quality Leader UAP3",
  "Laboratory Leader", "Customer", "User", "PRODUCCION",
  "LOGISTICA"
];

/**
 * 🔹 Get All Users (Admin Only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // ✅ Get pagination parameters from query
    let { page = 1, size = 10 } = req.query;

    // ✅ Convert page and size to numbers
    page = parseInt(page);
    size = parseInt(size);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(size) || size < 1) size = 10;

    // ✅ Calculate how many users to skip
    const skip = (page - 1) * size;

    // ✅ Fetch users with pagination
    const users = await User.find().select("-password").limit(size).skip(skip);

    // ✅ Get total user count for pagination metadata
    const totalUsers = await User.countDocuments();

    res.json({
      users,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / size),
        pageSize: size
      }
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
};


/**
 * 🔹 Get a Single User by License (Admin Only)
 */
exports.getUserByLicense = async (req, res) => {
  try {
    const user = await User.findOne({ license: req.params.license }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error fetching user information" });
  }
};

/**
 * 🔹 Admin: Create a New User
 */
exports.createUser = async (req, res) => {
  try {
    const { license, username, email, password, roles, image } = req.body;

    if (!license || !username || !email || !password || !roles) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!Array.isArray(roles) || roles.some(role => !rolesEnum.includes(role))) {
      return res.status(400).json({ error: "Invalid roles provided" });
    }

    const existingUser = await User.findOne({ license });
    if (existingUser) {
      return res.status(400).json({ error: "User with this license already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      license,
      username,
      email,
      password: hashedPassword,
      roles,
      image
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Error creating user" });
  }
};

/**
 * 🔹 Admin: Update Any User's Profile
 */
exports.adminUpdateUser = async (req, res) => {
  try {
    const { username, email, password, image } = req.body;
    const user = await User.findOne({ license: req.params.license });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (username) user.username = username;
    if (email) user.email = email;
    if (image) user.image = image;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Error updating user information" });
  }
};

/**
 * 🔹 Admin: Update User Roles
 */
exports.updateUserRoles = async (req, res) => {
  const { roles } = req.body;

  if (!Array.isArray(roles) || roles.some(role => !rolesEnum.includes(role))) {
    return res.status(400).json({ error: "Invalid roles provided" });
  }

  try {
    const user = await User.findOne({ license: req.params.license });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.license === req.user.license && !roles.includes("Admin")) {
      return res.status(400).json({ error: "You cannot remove your own Admin role" });
    }

    user.roles = roles;
    await user.save();

    res.json({ message: "User roles updated successfully", updatedRoles: user.roles });
  } catch (error) {
    console.error("Error updating user roles:", error);
    res.status(500).json({ error: "Error updating user roles" });
  }
};

/**
 * 🔹 Admin: Delete Any User
 */
exports.adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ license: req.params.license });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.license === req.user.license) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    await user.remove();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
};
