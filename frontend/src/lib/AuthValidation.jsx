import { z } from "zod"

// Enhanced password validation
const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((password) => /[A-Z]/.test(password), "Password must contain at least one uppercase letter")
  .refine((password) => /[a-z]/.test(password), "Password must contain at least one lowercase letter")
  .refine((password) => /[0-9]/.test(password), "Password must contain at least one number")
  .refine((password) => /[^A-Za-z0-9]/.test(password), "Password must contain at least one special character")

// ✅ Define Register Schema
export const registerSchema = z
  .object({
    license: z.string().min(1, "License is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: passwordValidation,
    passwordConfirmation: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  })

// ✅ Define Login Schema
export const loginSchema = z.object({
  license: z.string().min(1, "License is required"),
  password: passwordValidation,
})

