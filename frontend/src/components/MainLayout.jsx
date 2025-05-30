
import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import Navbar from "./NavBar"
import Sidebar from "./sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024)
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [location.pathname])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950">
      {/* Navbar at the top, full width */}
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      {/* Content area with sidebar and main content side by side */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar on the left */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main content area */}
        <main className="relative flex-1 p-4 overflow-auto">{children}</main>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
