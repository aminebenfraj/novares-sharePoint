const isAdmin = (req, res, next) => {
  if (req.user && req.user.roles.includes("Admin")) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admins only." });
  }
};

module.exports = isAdmin;
