"use client"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  Menu,
  X,
  Settings,
  User,
  LogOut,
  ChevronDown,
  PlusCircle,
  ShoppingCart,
  Package,
  Wrench,
  Atom,
  ClipboardCheck,
  BarChart3,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"

// Define module groups for navigation
const moduleGroups = [
  {
    id: "admin",
    label: "Administration",
    icon: Settings,
    modules: [
      { id: "admin", label: "User Management", path: "/admin", icon: User },
      { id: "settings", label: "Settings", path: "/settings", icon: Settings },
    ],
  },
]

// Define common actions for different modules
const moduleActions = {
  materials: [
    { label: "Create Material", path: "/materials/create", icon: PlusCircle },
    { label: "View Materials", path: "/materials", icon: Package },
  ],
  machines: [
    { label: "Create Machine", path: "/machines/create", icon: PlusCircle },
    { label: "View Machines", path: "/machines", icon: Wrench },
    { label: "Machine Dashboard", path: "/machine-dashboard", icon: BarChart3 },
  ],
  masspd: [
    { label: "Create Production", path: "/masspd/create", icon: PlusCircle },
    { label: "View Productions", path: "/masspd", icon: Atom },
  ],
  pedido: [
    { label: "Create Order", path: "/pedido/create", icon: PlusCircle },
    { label: "View Orders", path: "/pedido", icon: ShoppingCart },
  ],
  readiness: [
    { label: "Create Readiness", path: "/readiness/create", icon: PlusCircle },
    { label: "View Readiness", path: "/readiness", icon: ClipboardCheck },
  ],
  default: [
    { label: "Dashboard", path: "/", icon: Home },
    { label: "Materials", path: "/materials", icon: Package },
    { label: "Orders", path: "/pedido", icon: ShoppingCart },
  ],
}

export const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const { user, logout } = useAuth() || { user: { role: "user" } }

  return (
    <header className="z-30 w-full bg-white border-b shadow-sm">
      <div className="flex flex-col">
        {/* Main Navbar */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-800">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <Link to="/" className="flex items-center transition-opacity hover:opacity-80">
              <img src="/novares-logo.webp" alt="Novares" className="w-auto h-8" />
            </Link>

            <Separator orientation="vertical" className="hidden h-6 md:block" />
          </div>

          <div className="flex items-center gap-2">
            {/* Create new dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-white border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Create</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Create New</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/materials/create")}>
                    <Package className="w-4 h-4 mr-2" />
                    <span>Material</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/machines/create")}>
                    <Wrench className="w-4 h-4 mr-2" />
                    <span>Machine</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/pedido/create")}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    <span>Order</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/masspd/create")}>
                    <Atom className="w-4 h-4 mr-2" />
                    <span>Production</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/readiness/create")}>
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    <span>Readiness</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {user?.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin/create-user")}>
                      <User className="w-4 h-4 mr-2" />
                      <span>User</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

           

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <Avatar className="w-8 h-8 border border-slate-200 dark:border-zinc-700">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                    <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {user?.username ? user.username.substring(0, 2).toUpperCase() : "AD"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.username || "Admin User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || "admin@example.com"}</p>
                    {user?.role && (
                      <Badge variant="outline" className="mt-1 w-fit">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-rose-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Breadcrumbs navigation bar */}
      </div>
    </header>
  )
}

export default Navbar
