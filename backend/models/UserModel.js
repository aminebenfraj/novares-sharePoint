const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const rolesEnum = [
  "Admin",  // ✅ Full access: Can assign roles, CRUD everything.
  "Manager",  // ✅ Can assign roles but cannot perform full CRUD.
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
  "LOGISTICA" 
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
