// Centralized role definitions to ensure consistency across the application
const roleCategories = {
  Management: [
    "Admin",
    "Manager",
    "Project Manager",
    "Operations director",
    "Plant manager",
    "Engineering Manager",
    "Business Manager",
    "Production Manager",
    "Controlling Manager",
    "Financial Manager",
    "Purchasing Manager",
    "Logistic Manager",
    "Quality Manager",
    "Human Resources Manager",
    "Maintenance Manager",
  ],
  Staff: [
    "Direction Assistant",
    "Engineering Staff",
    "Business Staff",
    "Production Staff",
    "Controlling Staff",
    "Financial Staff",
    "Purchasing Staff",
    "Logistics Staff",
    "Quality Staff",
    "Human Resources Staff",
    "Maintenance Staff",
    "Health & Safety Staff",
    "Informatic Systems Staff",
  ],
  Other: ["Customer", "User"],
}

// Flatten all roles into a single array (no duplicates)
const rolesEnum = Object.values(roleCategories).flat()

// Export both the categorized and flat versions
module.exports = {
  roleCategories,
  rolesEnum,

  // Helper functions
  getAllRoles: () => rolesEnum,
  getRolesByCategory: (category) => roleCategories[category] || [],
  isValidRole: (role) => rolesEnum.includes(role),
  getManagementRoles: () => roleCategories.Management,
  getStaffRoles: () => roleCategories.Staff,
  getOtherRoles: () => roleCategories.Other,
}
