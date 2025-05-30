
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role; // Assume role is stored in req.user (from JWT)
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to modify this field." });
    }
    next();
  };
};
