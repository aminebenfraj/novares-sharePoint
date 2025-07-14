const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const rolesEnum = [
  "Admin",  // ✅ Full access: Can assign roles, CRUD everything.
  "Manager",  // ✅ Can assign roles but cannot perform full CRUD.
  "Project Manager",
  "Business Manager",
  "Operations director",
  "Plant manager",
  "Engineering Manager",
  "Production Manager",
  "Controlling Manager",
  "Financial Manager",
  "Purchasing Manager",
  "Quality Manager",
  "Maintenance Manager",
  
  "Purchasing Manager",
  "Logistic Manager",
  "Human Resources Manager",
  "Maintenance Manager",
  "Direction Assistant",
  "Engineering Staff",
  "Business Staff",
  "Production Staff",
  "Controlling Staff",
  "Maintenance Staff",
  "Health & Safety Staff",
  "Quality Manager",
  "Purchasing Staff",
  "Logistics Staff",
  "Quality Staff",
  "Human Resources Staff",
  "Customer",
  "User", 
  "Informatic Systems Staff",
  "Financial Staff" 
];

const userSchema = new Schema(
  {
    license: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: [String], // ✅ Users can have multiple roles.
      enum: rolesEnum,
      required: true,
      default: ["User"], // ✅ Change default from "user" to "User"
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("User", userSchema);
