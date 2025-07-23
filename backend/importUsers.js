require("dotenv").config();
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");
const path = require("path");
const User = require("./models/UserModel"); // Update path if different

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB Atlas");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

// Load Excel file
const workbook = XLSX.readFile(path.join(__dirname, "Processed_Novares_Users_With_License.xlsx"));
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

// Valid roles (from your UserModel.js)
const allowedRoles = [
  "Admin", "Manager", "Project Manager", "Business Manager", "Operations director",
  "Plant manager", "Engineering Manager", "Production Manager", "Controlling Manager",
  "Financial Manager", "Purchasing Manager", "Quality Manager", "Maintenance Manager",
  "Logistic Manager", "Human Resources Manager", "Direction Assistant",
  "Engineering Staff", "Business Staff", "Production Staff", "Controlling Staff",
  "Maintenance Staff", "Health & Safety Staff", "Purchasing Staff", "Logistics Staff",
  "Quality Staff", "Human Resources Staff", "Customer", "User",
  "Informatic Systems Staff", "Financial Staff"
];

(async () => {
  const users = [];

  for (const row of rawData) {
    const license = row["License"]?.toString().trim();
    const username = row["username"]?.toString().trim();
    const email = row["email"]?.toString().trim().toLowerCase();
    const rawPassword = row["password"]?.toString().trim() || "Novares123@";
    const image = row["image"]?.toString().trim() || null;

    let roles = [];
    if (row["Roles"]) {
      const parsedRoles = typeof row["Roles"] === "string"
        ? row["Roles"].split(",").map(r => r.trim())
        : (Array.isArray(row["Roles"]) ? row["Roles"].map(r => r.trim()) : []);
      roles = parsedRoles.filter(role => allowedRoles.includes(role));
    }

    if (!roles.length) roles = ["User"];
    if (!license || !username || !email) {
      console.warn("⚠️ Skipping incomplete user:", { license, username, email });
      continue;
    }

    try {
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        console.log(`🔁 Skipping existing user: ${email} (${username})`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      users.push({
        license,
        username,
        email,
        password: hashedPassword,
        roles,
        image
      });

    } catch (err) {
      console.error(`❌ Error checking user ${email}:`, err.message);
    }
  }

  if (users.length === 0) {
    console.log("⚠️ No new users to insert.");
    mongoose.disconnect();
    return;
  }

  User.insertMany(users)
    .then(() => {
      console.log(`✅ Successfully inserted ${users.length} users.`);
      mongoose.disconnect();
    })
    .catch((err) => {
      console.error("❌ Error inserting users:", err.message);
      mongoose.disconnect();
    });
})();
