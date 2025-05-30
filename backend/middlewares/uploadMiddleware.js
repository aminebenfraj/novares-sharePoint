const multer = require("multer");
const path = require("path");

// ✅ Define Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// ✅ File Upload Middleware
const upload = multer({ storage });

module.exports = upload;
