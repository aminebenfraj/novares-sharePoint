/**
 * Middleware to check if user has specific role(s)
 * @param {string|string[]} roles - Role or array of roles that are allowed
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    // Ensure user exists and has roles
    if (!req.user || !req.user.roles) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" })
    }

    // Convert single role to array for consistent handling
    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    // Check if user has any of the allowed roles (case insensitive comparison)
    const hasPermission = req.user.roles.some((role) =>
      allowedRoles.some((allowedRole) => allowedRole.toUpperCase() === role.toUpperCase()),
    )

    if (!hasPermission) {
      return res.status(403).json({
        message: `Forbidden: This action requires one of these roles: ${allowedRoles.join(", ")}`,
      })
    }

    next()
  }
}

module.exports = { hasRole }
