"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema } from "@/lib/AuthValidation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { BadgeIcon as IdCard, User, Mail, Lock, Loader2, Info, Eye, EyeOff } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { register } from "@/lib/Auth"

export default function Register() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState("")
  const [passwordValue, setPasswordValue] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [activeTooltip, setActiveTooltip] = useState(false)

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      license: "",
      username: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
    mode: "onChange",
  })

  const onSubmit = async (data) => {
    setServerError("")
    try {
      console.log("Attempting to register user with data:", {
        license: data.license,
        username: data.username,
        email: data.email,
        password: "***" // Not logging actual password
      });
      
      // Call register function from AuthContext with proper arguments
      const result = await register(data.license, data.username, data.email, data.password)
      
      
        navigate("/login")
    } catch (error) {
      console.error("Registration failed:", error);
      setServerError(error.message || "Registration failed. Please try again.");
    }
  }

  // Password validation checks
  const hasMinLength = passwordValue.length >= 8
  const hasUppercase = /[A-Z]/.test(passwordValue)
  const hasLowercase = /[a-z]/.test(passwordValue)
  const hasNumber = /[0-9]/.test(passwordValue)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(passwordValue)

  // Calculate password strength
  useEffect(() => {
    if (passwordValue.length === 0) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    if (hasMinLength) strength += 20
    if (hasUppercase) strength += 20
    if (hasLowercase) strength += 20
    if (hasNumber) strength += 20
    if (hasSpecialChar) strength += 20

    setPasswordStrength(strength)
  }, [passwordValue, hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar])

  // Get strength color
  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500"
    if (passwordStrength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  // Get strength text
  const getStrengthText = () => {
    if (passwordStrength < 40) return "Weak"
    if (passwordStrength < 80) return "Medium"
    return "Strong"
  }

  return (
    <section className="flex items-center justify-center h-full min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="container p-4 md:p-12">
        <div className="flex items-center justify-center text-gray-900 dark:text-white">
          <div className="flex flex-wrap w-full max-w-4xl overflow-hidden bg-white shadow-xl rounded-2xl dark:bg-gray-700">
            {/* Left Column */}
            <div className="flex flex-col justify-center w-full p-6 md:p-8 lg:w-6/12">
              <CardHeader className="p-4 text-center">
                <img src="/novares-logo.webp" alt="Novares" className="w-48 mx-auto" />
                <CardTitle className="mt-4 text-2xl font-semibold text-blue-600">Create Your Account</CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert variant="destructive" className="mb-6 text-white bg-red-500">
                        <AlertDescription>{serverError}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {[
                      { name: "license", label: "License", icon: IdCard },
                      { name: "username", label: "Username", icon: User },
                      { name: "email", label: "Email", icon: Mail },
                    ].map((field) => (
                      <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name}
                        render={({ field: fieldProps }) => (
                          <FormItem>
                            <FormLabel className="text-blue-600">{field.label}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <field.icon className="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                                <Input
                                  {...fieldProps}
                                  className="py-2 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-sm text-red-500" />
                          </FormItem>
                        )}
                      />
                    ))}

                    {/* Password field with improved validation feedback */}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center">
                            <FormLabel className="text-blue-600">Password</FormLabel>
                            <TooltipProvider>
                              <Tooltip open={activeTooltip} onOpenChange={setActiveTooltip}>
                                <TooltipTrigger asChild>
                                  <Info
                                    className="w-4 h-4 ml-2 text-blue-500 cursor-pointer"
                                    onClick={() => setActiveTooltip(!activeTooltip)}
                                  />
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="w-64 p-3 space-y-2 bg-white border border-gray-200 rounded-lg shadow-lg"
                                >
                                  <p className="font-medium text-gray-800">Password requirements:</p>
                                  <ul className="pl-5 space-y-1 text-xs text-gray-600 list-disc">
                                    <li className={hasMinLength ? "text-green-600" : ""}>At least 8 characters</li>
                                    <li className={hasUppercase ? "text-green-600" : ""}>One uppercase letter (A-Z)</li>
                                    <li className={hasLowercase ? "text-green-600" : ""}>One lowercase letter (a-z)</li>
                                    <li className={hasNumber ? "text-green-600" : ""}>One number (0-9)</li>
                                    <li className={hasSpecialChar ? "text-green-600" : ""}>
                                      One special character (!@#$%^&*)
                                    </li>
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                className="py-2 pl-10 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter password"
                                onChange={(e) => {
                                  field.onChange(e)
                                  setPasswordValue(e.target.value)
                                }}
                                onFocus={() => setActiveTooltip(true)}
                                onBlur={() => setActiveTooltip(false)}
                              />
                              <button
                                type="button"
                                className="absolute transform -translate-y-1/2 right-3 top-1/2"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <Eye className="w-5 h-5 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-sm text-red-500" />

                          {/* Password strength indicator */}
                          {passwordValue.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600">Password strength:</span>
                                <span
                                  className={`text-xs font-medium ${
                                    passwordStrength < 40
                                      ? "text-red-500"
                                      : passwordStrength < 80
                                        ? "text-yellow-500"
                                        : "text-green-500"
                                  }`}
                                >
                                  {getStrengthText()}
                                </span>
                              </div>
                              <Progress
                                value={passwordStrength}
                                className="h-1.5 bg-gray-200"
                                indicatorClassName={getStrengthColor()}
                              />
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* Password Confirmation field */}
                    <FormField
                      control={form.control}
                      name="passwordConfirmation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-600">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                className="py-2 pl-10 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Confirm your password"
                              />
                              <button
                                type="button"
                                className="absolute transform -translate-y-1/2 right-3 top-1/2"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <Eye className="w-5 h-5 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-sm text-red-500" />
                        </FormItem>
                      )}
                    />

                    <motion.div
                      className="mt-6"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Button
                        type="submit"
                        className="w-full py-3 text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 hover:shadow-lg"
                        disabled={form.formState.isSubmitting}
                      >
                        {form.formState.isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>

                <p className="mt-6 text-center text-gray-700">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-blue-600 transition-colors hover:underline">
                    Sign in here
                  </Link>
                </p>
              </CardContent>
            </div>
            {/* Right Column */}
            <div
              className="items-center justify-center hidden w-6/12 p-12 text-white lg:flex"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8, #1e40af)",
                backgroundSize: "200% 200%",
                animation: "gradientAnimation 15s ease infinite",
              }}
            >
              <div className="max-w-md">
                <motion.h4
                  className="mb-6 text-2xl font-semibold"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Join our growing community
                </motion.h4>
                <motion.p
                  className="text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Create an account to access exclusive features and become part of the Novares ecosystem. Your journey
                  with us begins here.
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientAnimation {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
      `}</style>
    </section>
  )
}