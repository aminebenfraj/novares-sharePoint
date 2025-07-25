const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const { rolesEnum } = require("../constants/roles")

const { Schema } = mongoose

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
      type: [String],
      enum: rolesEnum,
      required: true,
      default: ["User"],
      validate: {
        validator: (roles) => {
          // Ensure all roles are valid and no duplicates
          const uniqueRoles = [...new Set(roles)]
          return uniqueRoles.length === roles.length && uniqueRoles.every((role) => rolesEnum.includes(role))
        },
        message: "Invalid or duplicate roles provided",
      },
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("User", userSchema)
