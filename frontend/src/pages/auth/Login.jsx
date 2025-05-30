"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

const Login = () => {
  const [license, setLicense] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || "/"

  useEffect(() => {
    // Redirect if already authenticated
    if (user) {
      navigate("/")
    }

    
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate input
      if (!license.trim()) {
        setError("License is required")
        setIsLoading(false)
        return
      }

      if (!password) {
        setError("Password is required")
        setIsLoading(false)
        return
      }

      const result = await login(license, password)
      
        // Successful login
        navigate("/")
    } catch (err) {
      console.error("Login error:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      navigate("/")
      setIsLoading(false)
    }
  }

  // Show a more helpful message after multiple failed attempts
  const getErrorMessage = () => {
    if (loginAttempts >= 3) {
      return (
        <>
          {error}
          <div className="mt-2 text-sm">
            <p>Having trouble logging in? Try these steps:</p>
            <ul className="pl-5 mt-1 list-disc">
              <li>Double-check your license and password</li>
              <li>Make sure caps lock is off</li>
              <li>Try clearing your browser cache</li>
              <li>Contact support if the issue persists</li>
            </ul>
          </div>
        </>
      )
    }
    return error
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900">
      <div className="w-full max-w-md p-4">
        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img src="/novares-logo.webp" alt="Novares" className="h-12" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your license and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="w-4 h-4 mr-2" />
                <AlertDescription>{getErrorMessage()}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license">License</Label>
                <Input
                  id="license"
                  type="text"
                  placeholder="Enter your license"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  required
                  disabled={isLoading}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Please wait
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center text-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-blue-600 hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Login
